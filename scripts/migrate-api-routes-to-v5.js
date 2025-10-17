/**
 * Auth.js v5 Migration Script
 *
 * This script automatically updates all API routes from NextAuth v4 to v5
 * - Replaces getServerSession with auth()
 * - Updates import statements
 * - Removes authOptions parameter
 *
 * Usage: node scripts/migrate-api-routes-to-v5.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Migration patterns
const migrations = [
  {
    name: 'Update import from next-auth/next',
    pattern: /import\s+{\s*getServerSession\s*}\s+from\s+["']next-auth\/next["'];?\s*\n/g,
    replacement: '',
    description: 'Remove getServerSession import from next-auth/next'
  },
  {
    name: 'Update import authOptions',
    pattern: /import\s+{\s*authOptions\s*}\s+from\s+["']@\/lib\/auth["'];?\s*\n/g,
    replacement: '',
    description: 'Remove authOptions import'
  },
  {
    name: 'Add new auth import',
    pattern: /(import\s+{\s*NextResponse\s*}\s+from\s+["']next\/server["'];?\s*\n)/,
    replacement: '$1import { auth } from "@/lib/auth";\n',
    description: 'Add auth import from @/lib/auth',
    condition: (content) => !content.includes('import { auth }') && !content.includes("import { auth } from")
  },
  {
    name: 'Replace getServerSession call with auth()',
    pattern: /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);?/g,
    replacement: 'const session = await auth();',
    description: 'Replace getServerSession(authOptions) with auth()'
  },
  {
    name: 'Replace getServerSession without await',
    pattern: /getServerSession\(authOptions\)/g,
    replacement: 'auth()',
    description: 'Replace remaining getServerSession(authOptions) calls'
  }
];

/**
 * Check if file should be migrated
 */
function shouldMigrateFile(filePath, content) {
  // Skip if already migrated
  if (content.includes('import { auth } from "@/lib/auth"') &&
      !content.includes('getServerSession')) {
    return false;
  }

  // Only migrate if it uses getServerSession
  return content.includes('getServerSession');
}

/**
 * Apply migrations to a file
 */
function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Skip if already migrated or no changes needed
    if (!shouldMigrateFile(filePath, content)) {
      return { migrated: false, reason: 'Already migrated or no getServerSession found' };
    }

    // Apply each migration pattern
    let appliedMigrations = [];
    for (const migration of migrations) {
      // Check condition if provided
      if (migration.condition && !migration.condition(content)) {
        continue;
      }

      const before = content;
      content = content.replace(migration.pattern, migration.replacement);

      if (before !== content) {
        appliedMigrations.push(migration.name);
      }
    }

    // If no changes, skip
    if (content === originalContent) {
      return { migrated: false, reason: 'No changes needed' };
    }

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');

    return {
      migrated: true,
      appliedMigrations,
      before: originalContent.split('\n').length,
      after: content.split('\n').length
    };

  } catch (error) {
    return { migrated: false, error: error.message };
  }
}

/**
 * Recursively find all .js files in a directory
 */
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        findJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.includes('[...nextauth]')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Main migration function
 */
async function runMigration() {
  log('\n🚀 Starting Auth.js v5 API Route Migration\n', colors.bright + colors.blue);

  // Find all API route files
  const apiDir = path.resolve(__dirname, '..', 'app', 'api');
  const apiFiles = findJsFiles(apiDir);

  log(`Found ${apiFiles.length} API route files\n`, colors.blue);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const results = [];

  // Migrate each file
  for (const filePath of apiFiles) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
    process.stdout.write(`Migrating: ${relativePath}... `);

    const result = migrateFile(filePath);

    if (result.migrated) {
      log('✅ MIGRATED', colors.green);
      migratedCount++;
      results.push({ file: relativePath, status: 'migrated', ...result });
    } else if (result.error) {
      log(`❌ ERROR: ${result.error}`, colors.red);
      errorCount++;
      results.push({ file: relativePath, status: 'error', error: result.error });
    } else {
      log(`⏭️  SKIPPED (${result.reason})`, colors.yellow);
      skippedCount++;
    }
  }

  // Print summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 Migration Summary', colors.bright + colors.blue);
  log('='.repeat(60), colors.blue);
  log(`Total files processed: ${apiFiles.length}`, colors.bright);
  log(`✅ Successfully migrated: ${migratedCount}`, colors.green);
  log(`⏭️  Skipped: ${skippedCount}`, colors.yellow);
  log(`❌ Errors: ${errorCount}`, colors.red);
  log('='.repeat(60) + '\n', colors.blue);

  // Print detailed results for migrated files
  if (migratedCount > 0) {
    log('📝 Migrated Files:', colors.bright + colors.green);
    results
      .filter(r => r.status === 'migrated')
      .forEach(r => {
        log(`  • ${r.file}`, colors.green);
        r.appliedMigrations.forEach(m => log(`    - ${m}`, colors.blue));
      });
    log('');
  }

  // Print errors if any
  if (errorCount > 0) {
    log('⚠️  Files with errors:', colors.bright + colors.red);
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        log(`  • ${r.file}: ${r.error}`, colors.red);
      });
    log('');
  }

  log('✨ Migration complete!', colors.bright + colors.green);
  log('\nNext steps:', colors.bright);
  log('1. Run: npm install next-auth@beta', colors.blue);
  log('2. Review the changes in your API routes', colors.blue);
  log('3. Test your authentication flows', colors.blue);
  log('4. Check the migration guide: /docs/auth-v5-migration.md\n', colors.blue);
}

// Run migration
runMigration().catch(error => {
  log(`\n❌ Migration failed: ${error.message}`, colors.red);
  process.exit(1);
});
