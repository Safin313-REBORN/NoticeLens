/**
 * NoticeLens CLI Benchmark Runner
 * Runs the scientifically defensible technical benchmarking suite and displays formatted empirical metrics.
 */

const { execSync } = require('child_process');

console.log('================================================================');
console.log('       NoticeLens Technical Benchmarking Runner                 ');
console.log('       Measuring Genuine CER, WER, Extraction P/R/F1, Grounding ');
console.log('       Pilot Corpus: N = 6 Documents (Bangladeshi Formats)      ');
console.log('================================================================\n');

try {
  const output = execSync('npx vitest run src/test/benchmark/benchmarkRunner.test.ts', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  console.log(output);
  console.log('✅ Real image-based OCR and information extraction benchmark executed successfully.\n');
} catch (error) {
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}
