import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const klaviyoPublicId = url.searchParams.get('klaviyo_public_id');
    const targetDate = url.searchParams.get('date') || '2025-09-22'; // Default to suspect date
    const fix = url.searchParams.get('fix') === 'true';

    const debug = {
      timestamp: new Date().toISOString(),
      klaviyo_public_id: klaviyoPublicId,
      target_date: targetDate,
      fix_mode: fix,
      tests: []
    };

    const client = getClickHouseClient();

    // Test 1: Table Structure Analysis
    try {
      const result = await client.query({
        query: `
          SELECT
            name,
            type,
            default_kind,
            default_expression
          FROM system.columns
          WHERE database = currentDatabase()
            AND table = 'flow_statistics'
            AND name IN ('conversion_value', 'updated_at', 'date', 'klaviyo_public_id', 'flow_id', 'flow_message_id')
          ORDER BY position
        `,
        format: 'JSONEachRow'
      });
      const columns = await result.json();

      debug.tests.push({
        name: "Flow Statistics Table Structure",
        success: true,
        data: { columns }
      });
    } catch (error) {
      debug.tests.push({
        name: "Flow Statistics Table Structure",
        success: false,
        error: error.message
      });
    }

    // Test 2: Check for Suspicious Revenue Values
    try {
      const result = await client.query({
        query: `
          SELECT
            date,
            flow_id,
            flow_name,
            flow_message_id,
            flow_message_name,
            conversion_value,
            conversions,
            recipients,
            updated_at,
            CASE
              WHEN conversion_value > 1000000 THEN 'SUSPICIOUS_HIGH'
              WHEN conversion_value < 0 THEN 'NEGATIVE'
              WHEN conversion_value = 0 THEN 'ZERO'
              ELSE 'NORMAL'
            END as value_category
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date >= {start_date:Date}
            AND date <= {end_date:Date}
            AND conversion_value > 100000  -- Focus on suspiciously high values
          ORDER BY conversion_value DESC, date DESC
          LIMIT 50
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          start_date: '2025-09-01',
          end_date: '2025-09-30'
        },
        format: 'JSONEachRow'
      });
      const suspiciousData = await result.json();

      debug.tests.push({
        name: "Suspicious Revenue Values",
        success: true,
        data: {
          count: suspiciousData.length,
          max_value: suspiciousData[0]?.conversion_value || 0,
          suspicious_records: suspiciousData.slice(0, 10) // Show top 10
        }
      });
    } catch (error) {
      debug.tests.push({
        name: "Suspicious Revenue Values",
        success: false,
        error: error.message
      });
    }

    // Test 3: Value Distribution Analysis
    try {
      const result = await client.query({
        query: `
          SELECT
            date,
            count(*) as record_count,
            min(conversion_value) as min_value,
            max(conversion_value) as max_value,
            avg(conversion_value) as avg_value,
            median(conversion_value) as median_value,
            sum(conversion_value) as total_value,
            quantile(0.95)(conversion_value) as p95_value,
            quantile(0.99)(conversion_value) as p99_value,
            countIf(conversion_value > 1000000) as extreme_high_count,
            countIf(conversion_value > 100000) as high_count,
            countIf(conversion_value < 0) as negative_count
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date >= {start_date:Date}
            AND date <= {end_date:Date}
          GROUP BY date
          ORDER BY date DESC
          LIMIT 30
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          start_date: '2025-09-01',
          end_date: '2025-09-30'
        },
        format: 'JSONEachRow'
      });
      const distribution = await result.json();

      debug.tests.push({
        name: "Revenue Value Distribution",
        success: true,
        data: { daily_distribution: distribution }
      });
    } catch (error) {
      debug.tests.push({
        name: "Revenue Value Distribution",
        success: false,
        error: error.message
      });
    }

    // Test 4: Check for Data Type Issues and Overflow Patterns
    try {
      const result = await client.query({
        query: `
          SELECT
            toTypeName(conversion_value) as conversion_value_type,
            toTypeName(conversions) as conversions_type,
            toTypeName(recipients) as recipients_type,
            count(*) as record_count,
            countIf(conversion_value = 3516885528) as exact_corrupt_count,
            countIf(conversion_value LIKE '%3516885528%') as similar_corrupt_count,
            countIf(conversion_value > 2147483647) as int32_overflow_count, -- 2^31 - 1
            countIf(conversion_value > 4294967295) as uint32_overflow_count, -- 2^32 - 1
            min(conversion_value) as min_value,
            max(conversion_value) as max_value
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date >= {start_date:Date}
            AND date <= {end_date:Date}
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          start_date: '2025-09-01',
          end_date: '2025-09-30'
        },
        format: 'JSONEachRow'
      });
      const typeAnalysis = await result.json();

      debug.tests.push({
        name: "Data Type and Overflow Analysis",
        success: true,
        data: typeAnalysis[0] || {}
      });
    } catch (error) {
      debug.tests.push({
        name: "Data Type and Overflow Analysis",
        success: false,
        error: error.message
      });
    }

    // Test 5: Check for Duplicate Records (ReplacingMergeTree validation)
    try {
      const result = await client.query({
        query: `
          WITH duplicates AS (
            SELECT
              date,
              flow_id,
              flow_message_id,
              count(*) as version_count,
              min(updated_at) as first_updated,
              max(updated_at) as last_updated,
              max(conversion_value) as latest_value,
              groupArray(conversion_value) as all_values
            FROM flow_statistics  -- Without FINAL to see all versions
            WHERE klaviyo_public_id = {klaviyo_public_id:String}
              AND date = {target_date:Date}
            GROUP BY date, flow_id, flow_message_id
            HAVING version_count > 1
          )
          SELECT
            *,
            arrayDistinct(all_values) as unique_values,
            length(arrayDistinct(all_values)) as unique_value_count
          FROM duplicates
          ORDER BY version_count DESC, latest_value DESC
          LIMIT 20
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          target_date: targetDate
        },
        format: 'JSONEachRow'
      });
      const duplicates = await result.json();

      debug.tests.push({
        name: "Duplicate Records Analysis",
        success: true,
        data: {
          duplicate_count: duplicates.length,
          duplicates: duplicates
        }
      });
    } catch (error) {
      debug.tests.push({
        name: "Duplicate Records Analysis",
        success: false,
        error: error.message
      });
    }

    // Test 6: Corrupted vs Clean Data Comparison
    try {
      const result = await client.query({
        query: `
          SELECT
            'corrupted' as data_type,
            count(*) as count,
            avg(conversion_value) as avg_value,
            sum(conversion_value) as total_value
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date = {target_date:Date}
            AND conversion_value > 1000000

          UNION ALL

          SELECT
            'clean' as data_type,
            count(*) as count,
            avg(conversion_value) as avg_value,
            sum(conversion_value) as total_value
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date = {target_date:Date}
            AND conversion_value <= 1000000
            AND conversion_value >= 0
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          target_date: targetDate
        },
        format: 'JSONEachRow'
      });
      const comparison = await result.json();

      debug.tests.push({
        name: "Corrupted vs Clean Data Comparison",
        success: true,
        data: { comparison }
      });
    } catch (error) {
      debug.tests.push({
        name: "Corrupted vs Clean Data Comparison",
        success: false,
        error: error.message
      });
    }

    // Test 7: Historical Data Validation
    try {
      const result = await client.query({
        query: `
          SELECT
            date,
            count(*) as total_records,
            countIf(conversion_value > 1000000) as corrupted_count,
            countIf(conversion_value <= 1000000 AND conversion_value >= 0) as clean_count,
            max(conversion_value) as max_value,
            avg(conversion_value) as avg_value,
            sum(conversion_value) as daily_total
          FROM flow_statistics
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date >= {start_date:Date}
            AND date <= {end_date:Date}
          GROUP BY date
          ORDER BY date DESC
          LIMIT 30
        `,
        query_params: {
          klaviyo_public_id: klaviyoPublicId || 'test',
          start_date: '2025-09-01',
          end_date: '2025-09-30'
        },
        format: 'JSONEachRow'
      });
      const historical = await result.json();

      debug.tests.push({
        name: "Historical Data Validation",
        success: true,
        data: {
          daily_stats: historical,
          corruption_summary: {
            total_days: historical.length,
            corrupted_days: historical.filter(d => d.corrupted_count > 0).length,
            max_corruption: Math.max(...historical.map(d => d.corrupted_count))
          }
        }
      });
    } catch (error) {
      debug.tests.push({
        name: "Historical Data Validation",
        success: false,
        error: error.message
      });
    }

    // Test 8: Fix Mode - Data Correction Analysis
    if (fix) {
      try {
        // First, identify what needs to be fixed
        const identifyResult = await client.query({
          query: `
            SELECT
              date,
              flow_id,
              flow_message_id,
              conversion_value as original_value,
              conversions,
              recipients,
              -- Calculate reasonable value based on conversions and typical AOV
              CASE
                WHEN conversions > 0 AND conversion_value > 1000000 THEN conversions * 50  -- Assume $50 AOV
                WHEN conversion_value > 1000000 THEN 0  -- Set to 0 if no conversions
                ELSE conversion_value  -- Keep original if reasonable
              END as corrected_value,
              updated_at
            FROM flow_statistics
            WHERE klaviyo_public_id = {klaviyo_public_id:String}
              AND date >= {start_date:Date}
              AND date <= {end_date:Date}
              AND conversion_value > 1000000  -- Only corrupted records
            ORDER BY date DESC, conversion_value DESC
            LIMIT 100
          `,
          query_params: {
            klaviyo_public_id: klaviyoPublicId || 'test',
            start_date: '2025-09-01',
            end_date: '2025-09-30'
          },
          format: 'JSONEachRow'
        });
        const toFix = await identifyResult.json();

        debug.tests.push({
          name: "Fix Analysis (Read-Only)",
          success: true,
          data: {
            records_to_fix: toFix.length,
            total_corrupted_value: toFix.reduce((sum, r) => sum + r.original_value, 0),
            total_corrected_value: toFix.reduce((sum, r) => sum + r.corrected_value, 0),
            sample_fixes: toFix.slice(0, 10),
            note: "This is analysis only. Actual fixes would require UPDATE statements."
          }
        });
      } catch (error) {
        debug.tests.push({
          name: "Fix Analysis (Read-Only)",
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      debug,
      summary: {
        total_tests: debug.tests.length,
        passed_tests: debug.tests.filter(t => t.success).length,
        failed_tests: debug.tests.filter(t => !t.success).length,
        recommendations: [
          "Check the Klaviyo API data source for conversion_value field",
          "Verify data type mappings in ETL process",
          "Consider adding data validation before inserting to ClickHouse",
          "Implement reasonable bounds checking (e.g., max revenue per flow message)",
          "Add monitoring alerts for suspicious revenue spikes"
        ]
      }
    });

  } catch (error) {
    console.error('Flow revenue corruption debug error:', error);
    return NextResponse.json({
      error: "Flow revenue corruption debug failed",
      details: error.message
    }, { status: 500 });
  }
}

// POST endpoint for actual data fixes (if needed)
export async function POST(request) {
  try {
    const { klaviyo_public_id, date_range, fix_strategy = 'conservative' } = await request.json();

    if (!klaviyo_public_id) {
      return NextResponse.json({
        error: "klaviyo_public_id is required for fix operations"
      }, { status: 400 });
    }

    const client = getClickHouseClient();
    const results = {
      timestamp: new Date().toISOString(),
      fix_strategy,
      operations: []
    };

    // Note: In a ReplacingMergeTree table, we would typically insert corrected records
    // with newer updated_at timestamps rather than UPDATE existing records

    // For safety, this is just a simulation of what the fix would do
    const simulateResult = await client.query({
      query: `
        SELECT
          'SIMULATION' as operation_type,
          count(*) as records_affected,
          sum(conversion_value) as original_total,
          sum(CASE
            WHEN conversions > 0 AND conversion_value > 1000000 THEN conversions * 50
            WHEN conversion_value > 1000000 THEN 0
            ELSE conversion_value
          END) as corrected_total
        FROM flow_statistics FINAL
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date >= {start_date:Date}
          AND date <= {end_date:Date}
          AND conversion_value > 1000000
      `,
      query_params: {
        klaviyo_public_id,
        start_date: date_range?.start || '2025-09-01',
        end_date: date_range?.end || '2025-09-30'
      },
      format: 'JSONEachRow'
    });

    const simulation = await simulateResult.json();
    results.operations.push({
      name: "Fix Simulation",
      success: true,
      data: simulation[0] || {},
      note: "This is a simulation. Actual fixes would require careful data validation and backup procedures."
    });

    return NextResponse.json({
      success: true,
      results,
      warning: "This endpoint provides simulation only. Actual data fixes should be performed with proper backup and validation procedures."
    });

  } catch (error) {
    console.error('Flow revenue fix error:', error);
    return NextResponse.json({
      error: "Flow revenue fix failed",
      details: error.message
    }, { status: 500 });
  }
}