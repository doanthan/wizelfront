/**
 * Intelligent Benchmark Merge Script
 *
 * Merges benchmarks from 3 sources and expands subcategories:
 * - benchmarks_claude.json (Klaviyo e-commerce data)
 * - benchmarks_claude2.json (MailerLite service/B2B data)
 * - benchmarks_gem.json (Gemini comprehensive data - PRIMARY)
 *
 * Strategy:
 * 1. Use Gem data as primary source (most complete)
 * 2. Merge insights from all sources
 * 3. Expand subcategories into separate top-level verticals
 * 4. Deduplicate and validate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all 3 benchmark files
const claudePath = path.join(__dirname, '..', 'benchmarks_claude.json');
const claude2Path = path.join(__dirname, '..', 'benchmarks_claude2.json');
const gemPath = path.join(__dirname, '..', 'benchmarks_gem.json');

console.log('📊 Loading benchmark data files...\n');

const claudeData = JSON.parse(fs.readFileSync(claudePath, 'utf-8'));
const claude2Data = JSON.parse(fs.readFileSync(claude2Path, 'utf-8'));
const gemData = JSON.parse(fs.readFileSync(gemPath, 'utf-8'));

console.log(`✅ Loaded ${claudeData.length} benchmarks from benchmarks_claude.json`);
console.log(`✅ Loaded ${claude2Data.length} benchmarks from benchmarks_claude2.json`);
console.log(`✅ Loaded ${gemData.length} benchmarks from benchmarks_gem.json\n`);

// Helper: Normalize vertical name to snake_case
function normalizeVertical(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')  // Remove parentheses
    .replace(/\s+and\s+/g, '_')  // "and" becomes _
    .replace(/\s+/g, '_')  // spaces become _
    .replace(/,/g, '')  // remove commas
    .replace(/_+/g, '_')  // collapse multiple underscores
    .replace(/^_|_$/g, '');  // trim underscores
}

// Helper: Map category from vertical name
function getCategoryFromVertical(vertical, displayName) {
  const v = vertical.toLowerCase();
  const d = displayName.toLowerCase();

  if (v.includes('ecommerce') || v.includes('apparel') || v.includes('automotive') ||
      v.includes('electronics') || v.includes('food') || v.includes('jewelry') ||
      v.includes('home') || v.includes('hardware') || v.includes('health_beauty') ||
      v.includes('mass_merchant') || v.includes('office') || v.includes('specialty') ||
      v.includes('sporting') || v.includes('toys')) {
    return 'ecommerce';
  }

  if (v.includes('agency') || v.includes('consulting') || v.includes('marketing')) {
    return 'b2b';
  }

  if (v.includes('finance') || v.includes('banking') || v.includes('insurance')) {
    return 'finance';
  }

  if (v.includes('education') || d.includes('education')) {
    return 'education';
  }

  if (v.includes('nonprofit') || d.includes('non-profit')) {
    return 'nonprofit';
  }

  if (v.includes('politics') || v.includes('government')) {
    return 'government';
  }

  if (v.includes('real_estate') || v.includes('construction')) {
    return 'real_estate';
  }

  if (v.includes('restaurant') || d.includes('restaurant')) {
    return 'hospitality';
  }

  if (v.includes('saas') || v.includes('software')) {
    return 'b2b';
  }

  if (v.includes('telecom')) {
    return 'services';
  }

  if (v.includes('travel')) {
    return 'hospitality';
  }

  if (v.includes('wellness') || v.includes('fitness') || d.includes('wellness')) {
    return 'health_wellness';
  }

  if (v.includes('events') || v.includes('entertainment')) {
    return 'hospitality';
  }

  return 'other';
}

// Helper: Merge insights from multiple sources
function mergeInsights(...insightArrays) {
  const allInsights = [];
  const seen = new Set();

  insightArrays.forEach(insights => {
    if (Array.isArray(insights)) {
      insights.forEach(insight => {
        if (insight && !seen.has(insight.toLowerCase())) {
          allInsights.push(insight);
          seen.add(insight.toLowerCase());
        }
      });
    }
  });

  return allInsights;
}

// Helper: Expand subcategories into separate verticals
function expandSubcategories(benchmark) {
  const expanded = [];

  // If no subcategories, just return the main vertical
  if (!benchmark.subcategories) {
    return [benchmark];
  }

  // Check if subcategories is an array (list of subcategory names)
  if (Array.isArray(benchmark.subcategories)) {
    if (benchmark.subcategories.length === 0) {
      return [benchmark];
    }

    // Expand array of subcategory names
    benchmark.subcategories.forEach(subName => {
      const parentPrefix = benchmark.vertical.split('_')[0];  // e.g., "ecommerce" from "ecommerce_health_beauty"
      const subVertical = `${parentPrefix}_${normalizeVertical(subName)}`;

      expanded.push({
        ...benchmark,
        vertical: subVertical,
        display_name: subName,
        subcategories: undefined  // Remove subcategories field
      });
    });

    return expanded;
  }

  // Check if subcategories is an object (with subcategory data)
  if (typeof benchmark.subcategories === 'object') {
    const subKeys = Object.keys(benchmark.subcategories);

    if (subKeys.length === 0) {
      return [benchmark];
    }

    // Claude2 format with subcategory data
    subKeys.forEach(subKey => {
      const subData = benchmark.subcategories[subKey];
      const subVertical = `${benchmark.vertical.split('_')[0]}_${normalizeVertical(subKey)}`;
      const subDisplayName = subKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      expanded.push({
        ...benchmark,
        vertical: subVertical,
        display_name: subDisplayName,
        // Inherit parent campaigns but override with sub-specific data if available
        campaigns: {
          ...benchmark.campaigns,
          ...(subData.openRate && { openRate: { median: subData.openRate, top10: null } }),
          ...(subData.clickRate && { clickRate: { median: subData.clickRate, top10: null } }),
          ...(subData.ctor && { ctor: { median: subData.ctor, top10: null } }),
          ...(subData.unsubscribeRate && { unsubscribeRate: { median: subData.unsubscribeRate } })
        },
        subcategories: undefined  // Remove subcategories field
      });
    });

    return expanded;
  }

  // Fallback: return as-is
  return [benchmark];
}

console.log('🔄 Processing and merging benchmarks...\n');

// Start with Gem data as the primary source (most complete)
const mergedBenchmarks = [];
const processedVerticals = new Set();

// Process Gem benchmarks (most comprehensive)
gemData.forEach(gemBench => {
  const normalized = normalizeVertical(gemBench.vertical);

  // Find matching benchmarks in Claude sources
  const claudeMatch = claudeData.find(c =>
    normalizeVertical(c.vertical) === normalized ||
    normalizeVertical(c.display_name) === normalized
  );

  const claude2Match = claude2Data.find(c =>
    normalizeVertical(c.vertical) === normalized ||
    normalizeVertical(c.display_name) === normalized
  );

  // Merge insights
  const mergedInsights = mergeInsights(
    gemBench.insights,
    claudeMatch?.insights,
    claude2Match?.insights
  );

  // Create merged benchmark
  const merged = {
    vertical: normalized,
    display_name: gemBench.vertical,  // Use human-readable from Gem
    category: getCategoryFromVertical(normalized, gemBench.vertical),
    year: gemBench.year || 2025,
    version: gemBench.version || '2025-Q1',
    campaigns: gemBench.campaigns || {},
    flows: gemBench.flows || {},
    sms: gemBench.sms || {},
    segmentedCampaigns: gemBench.segmentedCampaigns,
    insights: mergedInsights,
    data_source: gemBench.data_source || 'Gemini Analysis',
    sample_size: gemBench.sample_size,
    is_active: true,
    created_at: gemBench.created_at || new Date().toISOString(),
    updated_at: gemBench.updated_at || new Date().toISOString()
  };

  // Check for subcategories in Gem extra_verticals
  if (gemBench.extra_verticals && Array.isArray(gemBench.extra_verticals)) {
    gemBench.extra_verticals.forEach(extra => {
      const subVertical = `${normalized}_${normalizeVertical(extra.sub_vertical)}`;
      mergedBenchmarks.push({
        ...merged,
        vertical: subVertical,
        display_name: extra.sub_vertical,
        campaigns: extra.campaigns || merged.campaigns,
        flows: extra.flows || {},
        insights: [...mergedInsights, ...(extra.insights || [])]
      });
      processedVerticals.add(subVertical);
    });
  }

  mergedBenchmarks.push(merged);
  processedVerticals.add(normalized);
});

console.log(`✅ Processed ${mergedBenchmarks.length} benchmarks from Gem data\n`);

// Add any Claude/Claude2 benchmarks not in Gem
console.log('🔄 Checking for additional benchmarks in Claude data...\n');

[...claudeData, ...claude2Data].forEach(benchmark => {
  const normalized = normalizeVertical(benchmark.vertical);

  if (!processedVerticals.has(normalized)) {
    // Expand subcategories if present
    const expanded = expandSubcategories(benchmark);

    expanded.forEach(exp => {
      const expNormalized = normalizeVertical(exp.vertical);
      if (!processedVerticals.has(expNormalized)) {
        mergedBenchmarks.push({
          vertical: expNormalized,
          display_name: exp.display_name,
          category: getCategoryFromVertical(expNormalized, exp.display_name),
          year: exp.year || 2025,
          version: exp.version || '2025-Q1',
          campaigns: exp.campaigns || {},
          flows: exp.flows || {},
          sms: exp.sms || {},
          segmentedCampaigns: exp.segmentedCampaigns,
          insights: exp.insights || [],
          data_source: exp.data_source,
          sample_size: exp.sample_size,
          is_active: true,
          created_at: exp.created_at || new Date().toISOString(),
          updated_at: exp.updated_at || new Date().toISOString()
        });
        processedVerticals.add(expNormalized);
      }
    });
  }
});

console.log(`✅ Total merged benchmarks: ${mergedBenchmarks.length}\n`);

// Validate and report
console.log('📊 Benchmark Summary by Category:\n');

const byCategory = {};
mergedBenchmarks.forEach(b => {
  const cat = b.category || 'other';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(b.vertical);
});

Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ${cat}: ${byCategory[cat].length} verticals`);
});

console.log(`\n📝 Total verticals: ${mergedBenchmarks.length}\n`);

// Save merged output
const outputPath = path.join(__dirname, 'benchmarks-merged.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedBenchmarks, null, 2));

console.log(`✅ Merged benchmarks saved to: ${outputPath}\n`);
console.log('🎉 Merge complete! Ready for import.\n');

// Print vertical list for reference
console.log('📋 Vertical List:\n');
mergedBenchmarks
  .sort((a, b) => a.vertical.localeCompare(b.vertical))
  .forEach(b => {
    console.log(`  ${b.vertical.padEnd(40)} → ${b.display_name} (${b.category})`);
  });
