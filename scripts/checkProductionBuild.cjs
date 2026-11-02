/**
 * NoticeLens Production Build Verification Check
 * Scans generated dist/assets/*.js bundles to ensure:
 * 1. Zero debug globals are exposed in production.
 * 2. Zero test-only offline verification bypasses (e.g. skipProvenanceCheck, testOnlyMarkOfflineVerified, createMockTrainedData) exist in production assets.
 * 3. Zero production verifier code accepts injected traineddata binary arguments.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_DEBUG_GLOBALS = [
  '__noticelens_mark_offline_verified__',
  '__noticelens_is_offline_verified__',
  '__noticelens_terminate_worker__',
  '__noticelens_is_worker_active__',
  '__noticelens_ocr_diagnostics',
  '__noticelens_check_cache_status__',
];

const FORBIDDEN_TEST_BYPASS_IDENTIFIERS = [
  'skipProvenanceCheck',
  'testOnlyMarkOfflineVerified',
  'isTestingExplicitBinary',
  'createMockTrainedData',
  'MarkOfflineVerifiedOptions',
];

const distDir = path.resolve(__dirname, '..', 'dist', 'assets');

if (!fs.existsSync(distDir)) {
  console.error(`[checkProductionBuild]: ERROR - dist/assets directory not found at ${distDir}. Run "npm run build" first.`);
  process.exit(1);
}

const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));

if (files.length === 0) {
  console.error('[checkProductionBuild]: ERROR - No JavaScript assets found in dist/assets.');
  process.exit(1);
}

console.log(`[checkProductionBuild]: Scanning ${files.length} production bundle(s) for forbidden debug globals and test bypasses...`);

const violations = [];

for (const file of files) {
  const filePath = path.join(distDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  for (const forbidden of FORBIDDEN_DEBUG_GLOBALS) {
    if (content.includes(forbidden)) {
      violations.push({ file, type: 'forbidden_debug_global', identifier: forbidden });
    }
  }

  for (const bypass of FORBIDDEN_TEST_BYPASS_IDENTIFIERS) {
    if (content.includes(bypass)) {
      violations.push({ file, type: 'forbidden_test_bypass', identifier: bypass });
    }
  }
}

if (violations.length > 0) {
  console.error('\n🚨 [checkProductionBuild]: SECURITY AUDIT FAILED!');
  console.error('Forbidden debug globals or test-only verification bypasses were detected in production bundle(s):');
  for (const v of violations) {
    console.error(`  - In "${v.file}" (${v.type}): contains "${v.identifier}"`);
  }
  process.exit(1);
}

console.log('✅ [checkProductionBuild]: PASS - Zero forbidden debug globals or test-only bypasses detected in production bundle.');
console.log(`   Scanned files: ${files.join(', ')}`);
console.log(`   Checked globals: ${FORBIDDEN_DEBUG_GLOBALS.join(', ')}`);
console.log(`   Checked bypasses: ${FORBIDDEN_TEST_BYPASS_IDENTIFIERS.join(', ')}`);
process.exit(0);
