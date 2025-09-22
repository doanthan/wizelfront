#!/usr/bin/env node

/**
 * Fix Flow Revenue Corruption Script
 *
 * This script identifies and fixes corrupt conversion_value data in the flow_statistics table.
 * The corruption appears as extremely high values (e.g., 3.5 billion) that distort analytics.
 *
 * Usage:
 *   node scripts/fix-flow-revenue-corruption.js --analyze
 *   node scripts/fix-flow-revenue-corruption.js --fix --klaviyo-id=XqkVGb
 *   node scripts/fix-flow-revenue-corruption.js --fix --all --confirm
 *
 * Modes:
 *   --analyze: Analyze corruption without making changes
 *   --fix: Fix corrupt data (requires --confirm for safety)
 *   --klaviyo-id: Specific Klaviyo account to fix
 *   --all: Fix all accounts
 *   --date-range: Specific date range (e.g., 2025-09-01,2025-09-30)
 *   --confirm: Required for actual fixes
 *   --dry-run: Show what would be fixed without doing it
 */

const { getClickHouseClient } = require('../lib/clickhouse');

// Configuration
const CORRUPTION_THRESHOLD = 1000000; // Values above $1M are considered corrupt
const REASONABLE_MAX_REVENUE = 50000; // Max reasonable revenue per flow message
const DEFAULT_AOV = 50; // Default average order value for corrections

class FlowRevenueCorruptionFixer {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      klaviyoPublicId: options.klaviyoPublicId,
      dateRange: options.dateRange,
      ...options
    };
    this.client = null;
    this.stats = {
      totalRecordsAnalyzed: 0,
      corruptRecordsFound: 0,
      recordsFixed: 0,
      totalCorruptValue: 0,
      totalCorrectedValue: 0,
      errorCount: 0
    };
  }

  async initialize() {
    try {
      this.client = getClickHouseClient();
      console.log('✅ ClickHouse client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ClickHouse client:', error.message);
      throw error;
    }
  }

  async analyzeCorruption() {
    console.log('🔍 Analyzing flow revenue corruption...');
    console.log('=====================================');

    try {
      // Get overall corruption statistics
      const overallQuery = `
        SELECT
          count(*) as total_records,
          countIf(conversion_value > ${CORRUPTION_THRESHOLD}) as corrupt_records,
          minIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as min_corrupt_value,
          maxIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as max_corrupt_value,
          avgIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as avg_corrupt_value,
          sumIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as total_corrupt_value,
          countDistinct(klaviyo_public_id) as affected_accounts,
          min(date) as earliest_date,
          max(date) as latest_date
        FROM flow_statistics FINAL
        ${this.buildWhereClause()}
      `;

      const result = await this.client.query({
        query: overallQuery,
        format: 'JSONEachRow'
      });

      const stats = (await result.json())[0];

      console.log('📊 Overall Corruption Statistics:');
      console.log(`   Total records: ${stats.total_records?.toLocaleString()}`);
      console.log(`   Corrupt records: ${stats.corrupt_records?.toLocaleString()}`);
      console.log(`   Corruption rate: ${stats.total_records > 0 ? (stats.corrupt_records / stats.total_records * 100).toFixed(2) : 0}%`);
      console.log(`   Affected accounts: ${stats.affected_accounts}`);
      console.log(`   Date range: ${stats.earliest_date} to ${stats.latest_date}`);
      console.log(`   Max corrupt value: $${stats.max_corrupt_value?.toLocaleString()}`);
      console.log(`   Total corrupt value: $${stats.total_corrupt_value?.toLocaleString()}`);
      console.log('');

      // Get corruption by account
      const accountQuery = `
        SELECT
          klaviyo_public_id,
          count(*) as total_records,
          countIf(conversion_value > ${CORRUPTION_THRESHOLD}) as corrupt_records,
          maxIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as max_corrupt_value,
          sumIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as total_corrupt_value
        FROM flow_statistics FINAL
        ${this.buildWhereClause()}
        GROUP BY klaviyo_public_id
        HAVING corrupt_records > 0
        ORDER BY corrupt_records DESC
        LIMIT 20
      `;

      const accountResult = await this.client.query({
        query: accountQuery,
        format: 'JSONEachRow'
      });

      const accountStats = await accountResult.json();

      console.log('🏢 Corruption by Account (Top 20):');
      accountStats.forEach((account, i) => {
        const rate = (account.corrupt_records / account.total_records * 100).toFixed(1);
        console.log(`   ${i + 1}. ${account.klaviyo_public_id}: ${account.corrupt_records}/${account.total_records} (${rate}%) - Max: $${account.max_corrupt_value?.toLocaleString()}`);
      });
      console.log('');

      // Get corruption by date
      const dateQuery = `
        SELECT
          date,
          count(*) as total_records,
          countIf(conversion_value > ${CORRUPTION_THRESHOLD}) as corrupt_records,
          maxIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as max_corrupt_value,
          countDistinct(klaviyo_public_id) as affected_accounts
        FROM flow_statistics FINAL
        ${this.buildWhereClause()}
        GROUP BY date
        HAVING corrupt_records > 0
        ORDER BY date DESC
        LIMIT 30
      `;

      const dateResult = await this.client.query({
        query: dateQuery,
        format: 'JSONEachRow'
      });

      const dateStats = await dateResult.json();

      console.log('📅 Corruption by Date (Last 30 affected days):');
      dateStats.forEach((day, i) => {
        const rate = (day.corrupt_records / day.total_records * 100).toFixed(1);
        console.log(`   ${day.date}: ${day.corrupt_records}/${day.total_records} (${rate}%) across ${day.affected_accounts} accounts`);
      });
      console.log('');

      this.stats.totalRecordsAnalyzed = stats.total_records;
      this.stats.corruptRecordsFound = stats.corrupt_records;
      this.stats.totalCorruptValue = stats.total_corrupt_value;

      return stats;

    } catch (error) {
      console.error('❌ Error analyzing corruption:', error.message);
      throw error;
    }
  }

  async fixCorruption() {
    if (!this.options.confirm && !this.options.dryRun) {
      console.log('⚠️  Use --confirm flag to actually execute fixes or --dry-run to simulate');
      return;
    }

    console.log(`🔧 ${this.options.dryRun ? 'Simulating' : 'Executing'} corruption fixes...`);
    console.log('===============================================');

    try {
      // Get records that need fixing
      const corruptRecordsQuery = `
        SELECT
          date,
          klaviyo_public_id,
          flow_id,
          flow_message_id,
          flow_name,
          flow_message_name,
          conversion_value as original_value,
          conversions,
          recipients,
          updated_at,
          -- Calculate corrected value based on conversions and reasonable AOV
          CASE
            WHEN conversions > 0 AND conversion_value > ${CORRUPTION_THRESHOLD} THEN conversions * ${DEFAULT_AOV}
            WHEN conversion_value > ${CORRUPTION_THRESHOLD} THEN 0
            ELSE conversion_value
          END as corrected_value
        FROM flow_statistics FINAL
        ${this.buildWhereClause()}
          AND conversion_value > ${CORRUPTION_THRESHOLD}
        ORDER BY date DESC, conversion_value DESC
        LIMIT 10000  -- Safety limit
      `;

      const result = await this.client.query({
        query: corruptRecordsQuery,
        format: 'JSONEachRow'
      });

      const corruptRecords = await result.json();

      console.log(`📋 Found ${corruptRecords.length} corrupt records to fix`);

      if (corruptRecords.length === 0) {
        console.log('✅ No corrupt records found!');
        return;
      }

      // Show sample of what will be fixed
      console.log('📝 Sample of fixes (first 10):');
      corruptRecords.slice(0, 10).forEach((record, i) => {
        const savings = record.original_value - record.corrected_value;
        console.log(`   ${i + 1}. ${record.date} - ${record.flow_name || 'Unknown Flow'}`);
        console.log(`      Original: $${record.original_value?.toLocaleString()} → Corrected: $${record.corrected_value?.toLocaleString()}`);
        console.log(`      Conversions: ${record.conversions}, Recipients: ${record.recipients}`);
        console.log(`      Savings: $${savings?.toLocaleString()}`);
        console.log('');
      });

      if (this.options.dryRun) {
        const totalSavings = corruptRecords.reduce((sum, r) => sum + (r.original_value - r.corrected_value), 0);
        console.log(`💰 Total potential savings: $${totalSavings?.toLocaleString()}`);
        console.log('   This was a dry run - no changes were made.');
        return;
      }

      // For ReplacingMergeTree, we insert corrected records with newer updated_at
      console.log('🔄 Inserting corrected records...');

      const insertPromises = [];
      const batchSize = 100;

      for (let i = 0; i < corruptRecords.length; i += batchSize) {
        const batch = corruptRecords.slice(i, i + batchSize);

        const insertQuery = `
          INSERT INTO flow_statistics (
            date, klaviyo_public_id, flow_id, flow_message_id, flow_name, flow_message_name,
            conversion_value, conversions, recipients, updated_at
          ) VALUES
        `;

        const values = batch.map(record =>
          `('${record.date}', '${record.klaviyo_public_id}', '${record.flow_id}', '${record.flow_message_id}', ` +
          `'${record.flow_name?.replace(/'/g, "''")}', '${record.flow_message_name?.replace(/'/g, "''")}', ` +
          `${record.corrected_value}, ${record.conversions}, ${record.recipients}, now())`
        ).join(',\n');

        const fullQuery = insertQuery + values;

        insertPromises.push(
          this.client.query({ query: fullQuery })
            .then(() => {
              console.log(`   ✅ Fixed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(corruptRecords.length / batchSize)}`);
              this.stats.recordsFixed += batch.length;
            })
            .catch(error => {
              console.error(`   ❌ Failed batch ${Math.floor(i / batchSize) + 1}:`, error.message);
              this.stats.errorCount++;
            })
        );
      }

      await Promise.all(insertPromises);

      console.log('✅ Corruption fix completed!');
      console.log(`   Records fixed: ${this.stats.recordsFixed}`);
      console.log(`   Errors: ${this.stats.errorCount}`);

      // Calculate savings
      this.stats.totalCorrectedValue = corruptRecords.reduce((sum, r) => sum + r.corrected_value, 0);
      const totalSavings = this.stats.totalCorruptValue - this.stats.totalCorrectedValue;
      console.log(`   Total savings: $${totalSavings?.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Error fixing corruption:', error.message);
      throw error;
    }
  }

  buildWhereClause() {
    const conditions = [];

    if (this.options.klaviyoPublicId) {
      conditions.push(`klaviyo_public_id = '${this.options.klaviyoPublicId}'`);
    }

    if (this.options.dateRange) {
      const [startDate, endDate] = this.options.dateRange.split(',');
      conditions.push(`date >= '${startDate}'`);
      conditions.push(`date <= '${endDate}'`);
    } else {
      // Default to last 60 days to limit scope
      conditions.push(`date >= today() - INTERVAL 60 DAY`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  async validateFix() {
    console.log('🔍 Validating fix results...');

    try {
      const validationQuery = `
        SELECT
          count(*) as total_records,
          countIf(conversion_value > ${CORRUPTION_THRESHOLD}) as remaining_corrupt,
          maxIf(conversion_value, conversion_value > ${CORRUPTION_THRESHOLD}) as max_remaining_corrupt,
          sumIf(conversion_value, conversion_value <= ${CORRUPTION_THRESHOLD}) as clean_total_value
        FROM flow_statistics FINAL
        ${this.buildWhereClause()}
      `;

      const result = await this.client.query({
        query: validationQuery,
        format: 'JSONEachRow'
      });

      const validation = (await result.json())[0];

      console.log('📊 Post-fix validation:');
      console.log(`   Total records: ${validation.total_records?.toLocaleString()}`);
      console.log(`   Remaining corrupt records: ${validation.remaining_corrupt}`);
      console.log(`   Max remaining corrupt value: $${validation.max_remaining_corrupt?.toLocaleString()}`);
      console.log(`   Clean total value: $${validation.clean_total_value?.toLocaleString()}`);

      if (validation.remaining_corrupt === 0) {
        console.log('✅ All corruption successfully fixed!');
      } else {
        console.log(`⚠️  ${validation.remaining_corrupt} corrupt records still remain`);
      }

    } catch (error) {
      console.error('❌ Error validating fix:', error.message);
    }
  }

  printSummary() {
    console.log('');
    console.log('📈 Final Summary');
    console.log('================');
    console.log(`Total records analyzed: ${this.stats.totalRecordsAnalyzed?.toLocaleString()}`);
    console.log(`Corrupt records found: ${this.stats.corruptRecordsFound?.toLocaleString()}`);
    console.log(`Records fixed: ${this.stats.recordsFixed?.toLocaleString()}`);
    console.log(`Total corrupt value: $${this.stats.totalCorruptValue?.toLocaleString()}`);
    console.log(`Total corrected value: $${this.stats.totalCorrectedValue?.toLocaleString()}`);
    console.log(`Total savings: $${(this.stats.totalCorruptValue - this.stats.totalCorrectedValue)?.toLocaleString()}`);
    console.log(`Errors encountered: ${this.stats.errorCount}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    analyze: args.includes('--analyze'),
    fix: args.includes('--fix'),
    dryRun: args.includes('--dry-run'),
    confirm: args.includes('--confirm'),
    all: args.includes('--all'),
    verbose: args.includes('--verbose')
  };

  // Parse klaviyo-id option
  const klaviyoIdArg = args.find(arg => arg.startsWith('--klaviyo-id='));
  if (klaviyoIdArg) {
    options.klaviyoPublicId = klaviyoIdArg.split('=')[1];
  }

  // Parse date-range option
  const dateRangeArg = args.find(arg => arg.startsWith('--date-range='));
  if (dateRangeArg) {
    options.dateRange = dateRangeArg.split('=')[1];
  }

  if (!options.analyze && !options.fix) {
    console.log('Usage: node scripts/fix-flow-revenue-corruption.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --analyze                    Analyze corruption without making changes');
    console.log('  --fix                        Fix corrupt data');
    console.log('  --klaviyo-id=ID             Fix specific Klaviyo account');
    console.log('  --all                        Fix all accounts');
    console.log('  --date-range=start,end       Fix specific date range (YYYY-MM-DD,YYYY-MM-DD)');
    console.log('  --dry-run                    Show what would be fixed without doing it');
    console.log('  --confirm                    Required for actual fixes');
    console.log('  --verbose                    Show detailed output');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/fix-flow-revenue-corruption.js --analyze');
    console.log('  node scripts/fix-flow-revenue-corruption.js --fix --klaviyo-id=XqkVGb --dry-run');
    console.log('  node scripts/fix-flow-revenue-corruption.js --fix --all --confirm');
    return;
  }

  try {
    const fixer = new FlowRevenueCorruptionFixer(options);
    await fixer.initialize();

    if (options.analyze) {
      await fixer.analyzeCorruption();
    }

    if (options.fix) {
      await fixer.fixCorruption();
      if (options.confirm && !options.dryRun) {
        await fixer.validateFix();
      }
    }

    fixer.printSummary();

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    if (options.verbose) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FlowRevenueCorruptionFixer };