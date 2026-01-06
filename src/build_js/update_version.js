import { readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Define paths
const readmePath = join(projectRoot, 'README.md');
const baseReadmePath = join(projectRoot, 'base_README.md');

// Delete existing README.md if it exists
if (existsSync(readmePath)) {
  unlinkSync(readmePath);
  console.log('Deleted existing README.md');
}

// Copy base_README.md to README.md
copyFileSync(baseReadmePath, readmePath);
console.log('Copied base_README.md to README.md');

// Read the new README.md
const readmeContent = readFileSync(readmePath, 'utf8');

// Replace all occurrences of {{version}} with the actual version
const updatedContent = readmeContent.replace(/\{\{version\}\}/g, version);

// Write back to README.md
writeFileSync(readmePath, updatedContent, 'utf8');

console.log(`Updated README.md: Replaced {{version}} with ${version}`);
