// Quick test to check flow_statistics table structure
const { getClickHouseClient } = require('./lib/clickhouse');

async function checkFlowTableStructure() {
  try {
    const client = getClickHouseClient();

    console.log('Checking flow_statistics table structure...');

    const result = await client.query({
      query: `
        SELECT
          name,
          type
        FROM system.columns
        WHERE database = currentDatabase()
          AND table = 'flow_statistics'
        ORDER BY position
      `,
      format: 'JSONEachRow'
    });

    const columns = await result.json();

    console.log('\nflow_statistics table columns:');
    console.log('================================');
    columns.forEach(col => {
      console.log(`${col.name} (${col.type})`);
    });

    console.log(`\nTotal columns: ${columns.length}`);

    // Check for specific columns that are causing the error
    const problemColumns = ['open_rate', 'click_rate', 'conversion_rate', 'bounce_rate', 'unsubscribe_rate'];
    const existingColumns = columns.map(c => c.name);

    console.log('\nColumn availability check:');
    console.log('==========================');
    problemColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    console.log('\nSuggested columns for query:');
    console.log('============================');
    const safeColumns = [
      'date', 'klaviyo_public_id', 'flow_id', 'flow_name', 'send_channel',
      'recipients', 'delivered', 'opens', 'opens_unique', 'clicks', 'clicks_unique',
      'conversions', 'conversion_uniques', 'conversion_value', 'bounced',
      'unsubscribes', 'unsubscribe_uniques'
    ].filter(col => existingColumns.includes(col));

    console.log(safeColumns.join(', '));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFlowTableStructure();