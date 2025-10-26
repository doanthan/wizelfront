import { NextResponse } from "next/server";
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

    // Get date range from query params (default to last 30 days)
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultEnd = now;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : defaultStart;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : defaultEnd;

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    // Use store directly - it's already fetched by middleware
    const klaviyoPublicId = store.klaviyo_integration?.public_id;
    if (!klaviyoPublicId) {
      return NextResponse.json({ error: 'Klaviyo not connected' }, { status: 404 });
    }

    // Get ClickHouse client (uses connection pooling)
    const clickhouse = getClickHouseClient();

    console.log('[Segments Report] ClickHouse Debug:', {
      storePublicId: store.public_id,
      klaviyoPublicId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    // Query segment statistics from ClickHouse
    const segmentStatsQuery = `
      SELECT
        segment_id,
        segment_name,
        date,
        total_members,
        new_members,
        removed_members,
        daily_change,
        conversion_value
      FROM segment_statistics_latest
      WHERE klaviyo_public_id = {klaviyoId:String}
        AND date >= {startDate:String}
        AND date <= {endDate:String}
      ORDER BY date DESC, total_members DESC
    `;

    const currentResult = await clickhouse.query({
      query: segmentStatsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const currentData = await currentResult.json();
    console.log('[Segments Report] Current period segments:', currentData.length);

    // Query previous period for comparison
    const previousResult = await clickhouse.query({
      query: segmentStatsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const previousData = await previousResult.json();
    console.log('[Segments Report] Previous period segments:', previousData.length);

    // Aggregate segments by segment_id
    const segmentsMap = {};
    const dailyDataMap = {}; // For time series

    currentData.forEach(row => {
      const segmentKey = row.segment_id;

      if (!segmentsMap[segmentKey]) {
        segmentsMap[segmentKey] = {
          segment_id: row.segment_id,
          segment_name: row.segment_name,
          current_members: 0,
          total_new_members: 0,
          total_removed_members: 0,
          total_revenue: 0,
          dates: []
        };
      }

      // Track latest member count (most recent date)
      if (!segmentsMap[segmentKey].current_members || row.date > segmentsMap[segmentKey].latest_date) {
        segmentsMap[segmentKey].current_members = row.total_members;
        segmentsMap[segmentKey].latest_date = row.date;
      }

      segmentsMap[segmentKey].total_new_members += parseInt(row.new_members || 0);
      segmentsMap[segmentKey].total_removed_members += parseInt(row.removed_members || 0);
      segmentsMap[segmentKey].total_revenue += parseFloat(row.conversion_value || 0);

      // Store daily data for time series
      if (!dailyDataMap[row.date]) {
        dailyDataMap[row.date] = { date: row.date };
      }
      dailyDataMap[row.date][row.segment_name] = parseInt(row.total_members || 0);
    });

    // Calculate previous period stats
    const previousSegmentsMap = {};
    previousData.forEach(row => {
      const segmentKey = row.segment_id;
      if (!previousSegmentsMap[segmentKey]) {
        previousSegmentsMap[segmentKey] = {
          members: 0,
          revenue: 0
        };
      }
      if (!previousSegmentsMap[segmentKey].members || row.date > previousSegmentsMap[segmentKey].latest_date) {
        previousSegmentsMap[segmentKey].members = row.total_members;
        previousSegmentsMap[segmentKey].latest_date = row.date;
      }
      previousSegmentsMap[segmentKey].revenue += parseFloat(row.conversion_value || 0);
    });

    // Build segments array with comparisons
    const segments = Object.values(segmentsMap).map(segment => {
      const prevSegment = previousSegmentsMap[segment.segment_id] || { members: 0, revenue: 0 };

      // Calculate growth
      const growth = prevSegment.members > 0
        ? ((segment.current_members - prevSegment.members) / prevSegment.members) * 100
        : 0;

      return {
        segment_id: segment.segment_id,
        segment_name: segment.segment_name,
        current_members: segment.current_members,
        growth: growth,
        new_members: segment.total_new_members,
        removed_members: segment.total_removed_members,
        revenue: segment.total_revenue,
        previous_members: prevSegment.members
      };
    });

    // Sort by current members (descending)
    segments.sort((a, b) => b.current_members - a.current_members);

    // Calculate summary metrics
    const totalMembers = segments.reduce((sum, s) => sum + s.current_members, 0);
    const totalRevenue = segments.reduce((sum, s) => sum + s.revenue, 0);
    const previousTotalMembers = segments.reduce((sum, s) => sum + s.previous_members, 0);
    const growingSegments = segments.filter(s => s.growth > 0).length;

    const summary = {
      total_segments: segments.length,
      total_members: totalMembers,
      avg_segment_size: segments.length > 0 ? Math.round(totalMembers / segments.length) : 0,
      total_revenue: totalRevenue,
      growing_segments: growingSegments,
      declining_segments: segments.filter(s => s.growth < 0).length,
      stable_segments: segments.filter(s => s.growth === 0).length
    };

    const previousSummary = {
      total_segments: Object.keys(previousSegmentsMap).length,
      total_members: previousTotalMembers
    };

    // Prepare daily time series data
    const performanceOverTime = Object.values(dailyDataMap).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    return NextResponse.json({
      summary,
      previousPeriod: previousSummary,
      segments,
      performanceOverTime,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Error fetching segments data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments data', details: error.message },
      { status: 500 }
    );
  }
});
