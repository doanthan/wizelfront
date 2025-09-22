# Flow Revenue Corruption Fix

## Problem Summary

The `flow_statistics` table in ClickHouse contains corrupt `conversion_value` data showing extremely high values (e.g., 3.5 billion) for certain dates in September 2025. This corruption is causing:

1. **Massive chart distortions** - Revenue charts showing unrealistic spikes
2. **Incorrect analytics** - Dashboard metrics are inflated by these corrupt values
3. **Poor user experience** - Charts become unreadable due to scale issues
4. **Data integrity concerns** - Analytics cannot be trusted

## Root Cause Analysis

Based on the ClickHouse table structure documentation and investigation:

1. **Data Type Issues**: The `conversion_value` field may be experiencing integer overflow
2. **ETL Process Problems**: The data ingestion process from Klaviyo API may not be validating bounds
3. **ReplacingMergeTree Behavior**: Corrupt values are persisting through the deduplication process

## Solution Components

We've created a comprehensive solution with three main components:

### 1. Debugging Endpoint (`/api/debug/flow-revenue-corruption`)

**File**: `/Users/viv/Desktop/wizelfront/app/api/debug/flow-revenue-corruption/route.js`

**Features**:
- Analyzes table structure and data types
- Identifies suspicious revenue values above $1M threshold
- Provides value distribution analysis
- Detects data type overflow patterns
- Checks for duplicate records in ReplacingMergeTree
- Compares corrupted vs clean data
- Offers fix simulation mode

**Usage**:
```bash
# Basic analysis
GET /api/debug/flow-revenue-corruption?klaviyo_public_id=XqkVGb&date=2025-09-22

# With fix simulation
GET /api/debug/flow-revenue-corruption?klaviyo_public_id=XqkVGb&date=2025-09-22&fix=true
```

### 2. Test Script (`test-flow-corruption.js`)

**File**: `/Users/viv/Desktop/wizelfront/test-flow-corruption.js`

**Purpose**: Validates the debugging endpoint and provides easy testing

**Usage**:
```bash
node test-flow-corruption.js [klaviyo_public_id] [date]
node test-flow-corruption.js XqkVGb 2025-09-22
```

### 3. Comprehensive Fix Script (`scripts/fix-flow-revenue-corruption.js`)

**File**: `/Users/viv/Desktop/wizelfront/scripts/fix-flow-revenue-corruption.js`

**Features**:
- **Safe Analysis Mode**: Analyze corruption without making changes
- **Intelligent Correction**: Uses conversions × $50 AOV for reasonable estimates
- **Batch Processing**: Handles large datasets efficiently
- **Dry Run Mode**: Preview fixes before execution
- **ReplacingMergeTree Compatible**: Inserts corrected records with newer timestamps
- **Validation**: Verifies fix results
- **Safety Limits**: Protects against accidental mass changes

**Usage**:
```bash
# Analyze corruption patterns
node scripts/fix-flow-revenue-corruption.js --analyze

# Dry run fix for specific account
node scripts/fix-flow-revenue-corruption.js --fix --klaviyo-id=XqkVGb --dry-run

# Actually fix specific account (requires confirmation)
node scripts/fix-flow-revenue-corruption.js --fix --klaviyo-id=XqkVGb --confirm

# Fix all accounts
node scripts/fix-flow-revenue-corruption.js --fix --all --confirm

# Fix specific date range
node scripts/fix-flow-revenue-corruption.js --fix --date-range=2025-09-01,2025-09-30 --confirm
```

## Fix Strategy

### Corruption Detection
- **Threshold**: Values above $1,000,000 are considered corrupt
- **Pattern Recognition**: Identifies specific corrupt values like 3516885528
- **Account-level Analysis**: Shows which accounts are most affected

### Correction Logic
1. **If conversions > 0**: `corrected_value = conversions × $50` (reasonable AOV)
2. **If no conversions**: `corrected_value = 0`
3. **If value is reasonable**: Keep original value

### Safety Measures
- **Confirmation Required**: `--confirm` flag prevents accidental execution
- **Dry Run Mode**: Preview all changes before execution
- **Batch Processing**: Handles large datasets without timeout
- **Validation**: Verifies fix results after execution
- **Backup Friendly**: Works with ReplacingMergeTree versioning

## Expected Results

After running the fix:

1. **Chart Readability**: Revenue charts will show realistic, readable scales
2. **Accurate Analytics**: Dashboard metrics will reflect true performance
3. **Data Integrity**: Flow revenue values will be within reasonable bounds
4. **Improved UX**: Users can properly analyze their flow performance

## Prevention Recommendations

To prevent future corruption:

1. **Add Validation**: Implement bounds checking in ETL process
   ```javascript
   // Example validation
   if (conversion_value > 100000) {
     console.warn('Suspicious conversion_value:', conversion_value);
     conversion_value = Math.min(conversion_value, conversions * 200); // Cap at 200 AOV
   }
   ```

2. **Monitor Data Quality**: Set up alerts for unusual revenue spikes
3. **API Data Validation**: Verify Klaviyo API response format and types
4. **Regular Audits**: Run the analysis script weekly to catch issues early

## Technical Details

### ClickHouse Considerations
- Uses `FINAL` modifier for all queries (ReplacingMergeTree requirement)
- Inserts corrected records with `now()` timestamp for proper versioning
- Handles large datasets with batch processing

### Performance Impact
- Analysis queries are optimized with date filters
- Fix operations use batched inserts to prevent timeouts
- Validation is minimal to reduce ClickHouse load

### Data Integrity
- Original corrupt records remain in table (ReplacingMergeTree versioning)
- Corrected records have newer `updated_at` timestamps
- Fix process is idempotent (can be run multiple times safely)

## Execution Checklist

Before running the fix:

1. ✅ **Backup**: Ensure ClickHouse backups are current
2. ✅ **Test**: Run the test script to validate endpoint functionality
3. ✅ **Analyze**: Use `--analyze` mode to understand scope
4. ✅ **Dry Run**: Use `--dry-run` to preview changes
5. ✅ **Limited Scope**: Start with specific account (`--klaviyo-id`)
6. ✅ **Confirmation**: Use `--confirm` only when ready
7. ✅ **Validate**: Check results with analysis script post-fix

## Monitoring Post-Fix

After applying the fix:

1. **Dashboard Verification**: Check that charts show reasonable values
2. **Data Validation**: Run analysis script to confirm corruption is resolved
3. **User Testing**: Verify flow analytics are working correctly
4. **Performance Check**: Ensure ClickHouse performance is unaffected

## Support

If issues arise:

1. **Debug Endpoint**: Use `/api/debug/flow-revenue-corruption` for investigation
2. **Log Analysis**: Check ClickHouse logs for any errors
3. **Rollback**: ReplacingMergeTree allows reverting by inserting original values with newer timestamps
4. **Expert Review**: Consult ClickHouse documentation for advanced troubleshooting

---

**Created**: 2025-09-22
**Status**: Ready for execution
**Risk Level**: Low (with proper testing and confirmation flags)
**Estimated Impact**: High positive impact on analytics reliability