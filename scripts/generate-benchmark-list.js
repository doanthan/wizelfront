/**
 * Generate Benchmark Reference List
 *
 * Creates a markdown document with all benchmarks, their ObjectIds, and vertical keys
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function generateBenchmarkList() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const benchmarks = await mongoose.connection.db.collection('benchmarks')
      .find({ is_active: true })
      .project({ _id: 1, vertical: 1, display_name: 1, category: 1 })
      .sort({ category: 1, display_name: 1 })
      .toArray();

    let markdown = '# 📊 Industry Benchmark Reference List\n\n';
    markdown += `**Total Benchmarks**: ${benchmarks.length}\n`;
    markdown += `**Last Updated**: ${new Date().toISOString().split('T')[0]}\n\n`;
    markdown += '---\n\n';

    // Group by category
    const byCategory = {};
    benchmarks.forEach(b => {
      const cat = b.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(b);
    });

    // Generate markdown grouped by category
    Object.keys(byCategory).sort().forEach(category => {
      markdown += `## ${category.toUpperCase()} (${byCategory[category].length} verticals)\n\n`;

      byCategory[category].forEach(b => {
        markdown += `### ${b.display_name}\n`;
        markdown += `- **ObjectId**: \`${b._id}\`\n`;
        markdown += `- **Vertical Key**: \`${b.vertical}\`\n`;
        markdown += `- **Category**: \`${b.category}\`\n\n`;
      });
    });

    // Add CSV format section
    markdown += '\n---\n\n# CSV Format\n\n';
    markdown += '```csv\n';
    markdown += 'Category,Display Name,Vertical Key,ObjectId\n';
    benchmarks.forEach(b => {
      markdown += `${b.category},"${b.display_name}",${b.vertical},${b._id}\n`;
    });
    markdown += '```\n';

    // Save markdown file
    const outputPath = path.join(__dirname, '..', 'BENCHMARK_REFERENCE_LIST.md');
    fs.writeFileSync(outputPath, markdown);

    console.log(`✅ Generated benchmark reference list: ${outputPath}`);
    console.log(`📊 Total benchmarks: ${benchmarks.length}\n`);

    // Also create a JSON file for programmatic use
    const jsonOutput = {
      total: benchmarks.length,
      updated: new Date().toISOString(),
      categories: byCategory,
      flat: benchmarks.map(b => ({
        objectId: b._id.toString(),
        vertical: b.vertical,
        displayName: b.display_name,
        category: b.category
      }))
    };

    const jsonPath = path.join(__dirname, '..', 'benchmark-reference.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));

    console.log(`✅ Generated JSON reference: ${jsonPath}\n`);

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateBenchmarkList();
