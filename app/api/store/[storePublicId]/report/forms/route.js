import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import { getClickHouseClient } from '@/lib/clickhouse';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check analytics permissions
    if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date required' }, { status: 400 });
    }

    // Use store directly - it's already fetched by middleware
    const klaviyoPublicId = store.klaviyo_integration?.public_id;
    if (!klaviyoPublicId) {
      return NextResponse.json({ error: 'Klaviyo not connected' }, { status: 404 });
    }

    // Initialize ClickHouse client
    const clickhouse = getClickHouseClient();

    // Query form statistics
    const formStatsQuery = `
      SELECT
        date,
        form_id,
        form_name,
        SUM(viewed_form) as viewed_form,
        SUM(viewed_form_uniques) as viewed_form_uniques,
        SUM(submits) as submits,
        SUM(submits_unique) as submits_unique,
        AVG(submit_rate) as avg_submit_rate,
        SUM(closed_form) as closed_form,
        SUM(closed_form_uniques) as closed_form_uniques,
        SUM(conversion_value) as conversion_value
      FROM form_statistics_latest
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND date >= '${startDate.split('T')[0]}'
        AND date <= '${endDate.split('T')[0]}'
      GROUP BY date, form_id, form_name
      ORDER BY date ASC
    `;

    const formStatsResult = await clickhouse.query({
      query: formStatsQuery,
      format: 'JSONEachRow',
    });

    const formStats = await formStatsResult.json();

    // Aggregate by form
    const formAggregates = formStats.reduce((acc, row) => {
      const formKey = row.form_id;
      if (!acc[formKey]) {
        acc[formKey] = {
          form_id: row.form_id,
          form_name: row.form_name,
          viewed_form: 0,
          viewed_form_uniques: 0,
          submits: 0,
          submits_unique: 0,
          closed_form: 0,
          closed_form_uniques: 0,
          conversion_value: 0,
          days: []
        };
      }
      acc[formKey].viewed_form += parseInt(row.viewed_form);
      acc[formKey].viewed_form_uniques += parseInt(row.viewed_form_uniques);
      acc[formKey].submits += parseInt(row.submits);
      acc[formKey].submits_unique += parseInt(row.submits_unique);
      acc[formKey].closed_form += parseInt(row.closed_form);
      acc[formKey].closed_form_uniques += parseInt(row.closed_form_uniques);
      acc[formKey].conversion_value += parseFloat(row.conversion_value);
      acc[formKey].days.push({
        date: row.date,
        viewed_form: parseInt(row.viewed_form),
        viewed_form_uniques: parseInt(row.viewed_form_uniques),
        submits: parseInt(row.submits),
        submits_unique: parseInt(row.submits_unique),
        submit_rate: parseFloat(row.avg_submit_rate)
      });
      return acc;
    }, {});

    // Calculate metrics for each form
    const forms = Object.values(formAggregates).map(form => ({
      ...form,
      submit_rate: form.viewed_form > 0 ? (form.submits / form.viewed_form) * 100 : 0,
      close_rate: form.viewed_form > 0 ? (form.closed_form / form.viewed_form) * 100 : 0,
      avg_conversion_value: form.submits > 0 ? form.conversion_value / form.submits : 0
    }));

    // Calculate summary metrics
    const summary = {
      total_forms: forms.length,
      total_views: forms.reduce((sum, f) => sum + f.viewed_form, 0),
      total_unique_views: forms.reduce((sum, f) => sum + f.viewed_form_uniques, 0),
      total_submits: forms.reduce((sum, f) => sum + f.submits, 0),
      total_unique_submits: forms.reduce((sum, f) => sum + f.submits_unique, 0),
      total_closed: forms.reduce((sum, f) => sum + f.closed_form, 0),
      total_unique_closed: forms.reduce((sum, f) => sum + f.closed_form_uniques, 0),
      total_revenue: forms.reduce((sum, f) => sum + f.conversion_value, 0),
      avg_submit_rate: forms.length > 0
        ? forms.reduce((sum, f) => sum + f.submit_rate, 0) / forms.length
        : 0,
      avg_close_rate: forms.length > 0
        ? forms.reduce((sum, f) => sum + f.close_rate, 0) / forms.length
        : 0
    };

    // Prepare daily time series
    const dailyData = {};
    formStats.forEach(row => {
      if (!dailyData[row.date]) {
        dailyData[row.date] = {
          date: row.date,
          viewed_form: 0,
          viewed_form_uniques: 0,
          submits: 0,
          submits_unique: 0,
          closed_form: 0,
          submit_rate: 0
        };
      }
      dailyData[row.date].viewed_form += parseInt(row.viewed_form);
      dailyData[row.date].viewed_form_uniques += parseInt(row.viewed_form_uniques);
      dailyData[row.date].submits += parseInt(row.submits);
      dailyData[row.date].submits_unique += parseInt(row.submits_unique);
      dailyData[row.date].closed_form += parseInt(row.closed_form);
    });

    // Calculate daily submit rates
    const performanceOverTime = Object.values(dailyData).map(day => ({
      ...day,
      submit_rate: day.viewed_form > 0 ? (day.submits / day.viewed_form) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json({
      summary,
      forms,
      performanceOverTime
    });

  } catch (error) {
    console.error('Error fetching forms data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});
