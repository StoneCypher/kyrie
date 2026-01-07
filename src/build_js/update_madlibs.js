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

// Get build timestamp
const built = new Date().getTime();
const built_text = new Date(built).toLocaleString();

// Get git hash
let gh_hash = 'unknown';
try {
  const gitHash = execSync('git rev-parse HEAD', {
    cwd: projectRoot,
    encoding: 'utf8'
  }).trim();
  gh_hash = gitHash.substring(0, 7);
} catch (error) {
  console.warn(chalk.hex(WARN_COLOR)('Warning: Could not determine git hash'));
}

// Count palettes from palettes.ts
console.log(chalk.hex(OUTPUT_COLOR)('Counting palettes...'));
const palettesPath = join(projectRoot, 'src', 'ts', 'palettes', 'palettes.ts');
const palettesContent = readFileSync(palettesPath, 'utf8');

// Parse the palettes object to count themes
// Look for the pattern: themeName: { with exactly 2 spaces indentation (palette theme level)
const paletteMatches = palettesContent.match(/^  (\w+):\s*\{/gm);
const paletteCount = paletteMatches ? paletteMatches.length : 0;
const paletteVariants = paletteCount * 2;

console.log(chalk.hex(OUTPUT_COLOR)(`Found ${paletteCount} palettes (${paletteVariants} variants with light/dark)`));

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
  // Looking for line like: "Tests  378 passed (378)" which shows total test count
  // Strip ANSI codes for easier parsing
  const cleanOutput = testOutput.replace(/\x1b\[[0-9;]*m/g, '');
  const testCountMatch = cleanOutput.match(/Tests\s+(\d+)\s+passed.*?\((\d+)\)/);
  if (testCountMatch) {
    testcasecount = testCountMatch[2]; // Use the number in parentheses (total count)
    console.log(chalk.hex(OUTPUT_COLOR)(`Test count: ${testcasecount}`));
  } else {
    console.warn(chalk.hex(WARN_COLOR)('Warning: Could not parse test count from output'));
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
updatedContent = updatedContent.replace(/\{\{palettes\}\}/g, paletteCount);
updatedContent = updatedContent.replace(/\{\{palettevariants\}\}/g, paletteVariants);
updatedContent = updatedContent.replace(/\{\{built\}\}/g, built);
updatedContent = updatedContent.replace(/\{\{built_text\}\}/g, built_text);
updatedContent = updatedContent.replace(/\{\{gh_hash\}\}/g, gh_hash);

// Write back to README.md
writeFileSync(readmePath, updatedContent, 'utf8');

console.log(chalk.hex(OUTPUT_COLOR)(`Updated README.md: Replaced {{version}} with ${version}, {{coverage}} with ${coverage}%, {{testcasecount}} with ${testcasecount}, {{palettes}} with ${paletteCount}, {{palettevariants}} with ${paletteVariants}, {{built}} with ${built}, {{built_text}} with ${built_text}, {{gh_hash}} with ${gh_hash}`));
