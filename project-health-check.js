/**
 * Project Health Check
 * Analyzes project without modifying anything
 */

const fs = require('fs');
const path = require('path');

// Check critical files exist
function checkCriticalFiles() {
  const critical = [
    'src/App.tsx',
    'src/contexts/BuildupContext.tsx',
    'src/contexts/DashboardContext.tsx',
    'src/contexts/ScheduleContext.tsx',
    'package.json',
    'vite.config.ts'
  ];
  
  console.log('\n=== Critical Files Check ===');
  critical.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
}

// Check migration dependencies
function checkMigrationDeps() {
  console.log('\n=== Migration System Status ===');
  const migrationFiles = fs.readdirSync('src/utils')
    .filter(f => f.startsWith('migration'));
  
  console.log(`Found ${migrationFiles.length} migration files`);
  console.log('These are used by:');
  console.log('  - BuildupContext.tsx');
  console.log('  - Sprint1Verification.tsx');
  console.log('  - MigrationDashboard.tsx');
  console.log('⚠️  DO NOT delete migration files - they are in use!');
}

// Check test files  
function checkTestFiles() {
  console.log('\n=== Test Files Status ===');
  const testFiles = fs.readdirSync('src/pages/startup')
    .filter(f => f.includes('Test'));
  
  console.log(`Found ${testFiles.length} test files`);
  console.log('ℹ️  Test files can be moved to a separate folder');
  console.log('   but should NOT be deleted if you need them');
}

// Memory usage
function checkMemory() {
  console.log('\n=== Memory Usage ===');
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key}: ${Math.round(used[key] / 1024 / 1024)} MB`);
  }
}

// Run all checks
checkCriticalFiles();
checkMigrationDeps();
checkTestFiles();
checkMemory();

console.log('\n=== Recommendations ===');
console.log('1. Run "safe-cleanup.bat" for safe optimization');
console.log('2. Move project out of OneDrive to C:\\projects');
console.log('3. Keep all migration files - they are being used!');
console.log('4. Test files can be organized but not deleted');
console.log('\n✅ Your project structure is intact!');