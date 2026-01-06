import { readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

// Output color for console messages
const OUTPUT_COLOR = '#dddd55';
const WARN_COLOR = '#ee6666';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Navigate to project root (two levels up from src/build_js)
const projectRoot = join(__dirname, '..', '..');

// Read package.json
const packageJsonPath = join(projectRoot, 'package.json');
const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonContent);

// Get version
const version = packageJson.version;

// Run tests and get coverage
console.log(chalk.hex(OUTPUT_COLOR)('Running tests to get coverage...'));
let coverage = 'N/A';
let testcasecount = 'N/A';
try {
  const testOutput = execSync('npm run just_test', {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  // Parse coverage from output
  // Looking for line like: "All files |   96.89 |    79.73 |    92.3 |   97.09 |"
  const coverageMatch = testOutput.match(/All files\s+\|\s+([\d.]+)/);
  if (coverageMatch) {
    coverage = coverageMatch[1];
    console.log(chalk.hex(OUTPUT_COLOR)(`Test coverage: ${coverage}%`));
  }

  // Parse test count from output
  // Looking for line like: "✓ src/ts/tests/index.test.ts (184 tests)" (may have ANSI codes)
  // This captures total tests regardless of pass/fail/skip status
  // Strip ANSI codes for easier parsing
  const cleanOutput = testOutput.replace(/\x1b\[[0-9;]*m/g, '');
  const testCountMatch = cleanOutput.match(/\((\d+)\s+tests?\)/);
  if (testCountMatch) {
    testcasecount = testCountMatch[1];
    console.log(chalk.hex(OUTPUT_COLOR)(`Test count: ${testcasecount}`));
  }
} catch (error) {
  console.warn(chalk.hex(WARN_COLOR)('Warning: Could not determine test coverage or test count'));
}

// Define paths
const readmePath = join(projectRoot, 'README.md');
const baseReadmePath = join(projectRoot, 'base_README.md');

// Delete existing README.md if it exists
if (existsSync(readmePath)) {
  unlinkSync(readmePath);
  console.log(chalk.hex(OUTPUT_COLOR)('Deleted existing README.md'));
}

// Copy base_README.md to README.md
copyFileSync(baseReadmePath, readmePath);
console.log(chalk.hex(OUTPUT_COLOR)('Copied base_README.md to README.md'));

// Read the new README.md
const readmeContent = readFileSync(readmePath, 'utf8');

// Replace all placeholders
let updatedContent = readmeContent.replace(/\{\{version\}\}/g, version);
updatedContent = updatedContent.replace(/\{\{coverage\}\}/g, coverage);
updatedContent = updatedContent.replace(/\{\{testcasecount\}\}/g, testcasecount);

// Write back to README.md
writeFileSync(readmePath, updatedContent, 'utf8');

console.log(chalk.hex(OUTPUT_COLOR)(`Updated README.md: Replaced {{version}} with ${version}, {{coverage}} with ${coverage}%, {{testcasecount}} with ${testcasecount}`));
