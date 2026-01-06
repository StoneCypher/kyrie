/**
 * Tests for CLI functionality
 */

import { describe, test, expect, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { getPalette, validateOutputMode, processInput, allPalettes } from '../cli.js';
import type { CLIOptions } from '../cli.js';

// CLI path
const cliPath = join(__dirname, '../../../dist/cli.cjs');

// Helper to run CLI and capture output
function runCLI(args: string[] = [], input?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    // Remove VITEST env var so CLI actually runs
    const env = { ...process.env };
    delete env['VITEST'];
    delete env['NODE_ENV'];

    const child = spawn('node', [cliPath, ...args], { env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (input !== undefined) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

describe.skipIf(!existsSync(cliPath))('CLI', () => {
  const testFilePath = join(__dirname, 'test-cli-temp.json');

  afterEach(() => {
    // Clean up test files
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath);
    }
  });

  describe('Basic functionality', () => {
    test('should highlight JSON from stdin with default palette', async () => {
      const input = '{"name": "Alice", "age": 25, "active": true}';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('name');
      expect(result.stdout).toContain('Alice');
      expect(result.stdout).toContain('25');
      expect(result.stderr).toBe('');
    });

    test('should highlight JSON from file', async () => {
      const testData = '{"name": "Bob", "count": 42}';
      writeFileSync(testFilePath, testData);

      const result = await runCLI([testFilePath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('name');
      expect(result.stdout).toContain('Bob');
      expect(result.stderr).toBe('');
    });

    test('should highlight array from stdin', async () => {
      const input = '[1, 2, 3, "hello", true, null]';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('hello');
      expect(result.stderr).toBe('');
    });

    test('should handle empty input', async () => {
      const result = await runCLI([], '{}');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });
  });

  describe('Palette option', () => {
    test('should use specified palette (forest)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--palette', 'forest'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should use specified palette with short flag (-p)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['-p', 'bold'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should error on unknown palette', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--palette', 'nonexistent'], input);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown palette: nonexistent');
      expect(result.stderr).toContain('Available palettes:');
    });

    test('should work with nature palettes', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--palette', 'forest'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should work with accessibility palettes', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--palette', 'protanopia'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });
  });

  describe('Theme option', () => {
    test('should use light theme by default', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should use dark theme when specified', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--theme', 'dark'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should use dark theme with short flag (-t)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['-t', 'dark'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should default to light theme for invalid theme value', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--theme', 'invalid'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should combine palette and theme options', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--palette', 'forest', '--theme', 'dark'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });
  });

  describe('Max width option', () => {
    test('should accept numeric max-width', async () => {
      const input = '{"name": "Alice", "email": "alice@example.com", "age": 25}';
      const result = await runCLI(['--max-width', '40'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should accept max-width with short flag (-w)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['-w', '60'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should accept "false" to disable max-width', async () => {
      const input = '{"name": "Alice", "email": "alice@example.com"}';
      const result = await runCLI(['--max-width', 'false'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should error on invalid max-width value', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--max-width', 'invalid'], input);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid max-width value');
    });
  });

  describe('Output mode option', () => {
    test('should accept ansi output mode (default)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });

    test('should accept ansi output mode explicitly', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--output-mode', 'ansi'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should accept html output mode', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--output-mode', 'html'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should accept chrome-console output mode', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--output-mode', 'chrome-console'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should accept logger output mode', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--output-mode', 'logger'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should accept output mode with short flag (-o)', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['-o', 'html'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should error on invalid output mode', async () => {
      const input = '{"test": "value"}';
      const result = await runCLI(['--output-mode', 'invalid'], input);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid output mode: invalid');
      expect(result.stderr).toContain('Valid modes:');
    });

    test('should combine output mode with other options', async () => {
      const input = '{"name": "Alice", "age": 25}';
      const result = await runCLI([
        '--palette', 'forest',
        '--theme', 'dark',
        '--output-mode', 'html',
        '--max-width', '80'
      ], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });
  });

  describe('Error handling', () => {
    test('should error on non-existent file', async () => {
      const result = await runCLI(['nonexistent-file.json']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error reading file');
    });

    test('should error on invalid JSON', async () => {
      const input = '{invalid json}';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error highlighting input');
    });

    test('should handle file read errors gracefully', async () => {
      const result = await runCLI(['/invalid/path/file.json']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBeTruthy();
    });
  });

  describe('Combined options', () => {
    test('should handle all options together', async () => {
      const input = '{"name": "Alice", "items": [1, 2, 3]}';
      const result = await runCLI([
        '--palette', 'bold',
        '--theme', 'dark',
        '--max-width', '80'
      ], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stderr).toBe('');
    });

    test('should handle file input with options', async () => {
      const testData = '{"users": ["Alice", "Bob"], "count": 2}';
      writeFileSync(testFilePath, testData);

      const result = await runCLI([
        testFilePath,
        '-p', 'pastel',
        '-t', 'light',
        '-w', '100'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('users');
      expect(result.stderr).toBe('');
    });
  });

  describe('Complex data structures', () => {
    test('should handle nested objects', async () => {
      const input = '{"user": {"name": "Alice", "address": {"city": "NYC"}}}';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('user');
      expect(result.stdout).toContain('address');
      expect(result.stdout).toContain('NYC');
    });

    test('should handle arrays of objects', async () => {
      const input = '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('Alice');
      expect(result.stdout).toContain('Bob');
    });

    test('should handle mixed type arrays', async () => {
      const input = '[1, "string", true, null, {"key": "value"}]';
      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('string');
      expect(result.stdout).toContain('key');
    });

    test('should handle deeply nested structures', async () => {
      const input = '{"a": {"b": {"c": {"d": {"e": "deep"}}}}}';
      const result = await runCLI(['--palette', 'forest'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('deep');
    });
  });

  describe('Various palettes', () => {
    const palettesToTest = ['default', 'pastel', 'bold', 'forest', 'hacker', 'rainbow'];

    palettesToTest.forEach(palette => {
      test(`should work with ${palette} palette`, async () => {
        const input = '{"test": "value", "number": 42}';
        const result = await runCLI(['--palette', palette], input);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBeTruthy();
        expect(result.stderr).toBe('');
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle typical API response format', async () => {
      const input = JSON.stringify({
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' }
          ],
          total: 2
        }
      });

      const result = await runCLI([], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('success');
      expect(result.stdout).toContain('Alice');
    });

    test('should handle package.json-like structure', async () => {
      const input = JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'package-a': '^1.0.0',
          'package-b': '~2.3.4'
        },
        scripts: {
          test: 'vitest',
          build: 'tsc'
        }
      });

      const result = await runCLI(['--palette', 'bold'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout).toContain('test-package');
    });

    test('should handle large nested configuration', async () => {
      const input = JSON.stringify({
        settings: {
          theme: 'dark',
          editor: {
            fontSize: 14,
            tabSize: 2,
            wordWrap: true
          },
          colors: {
            primary: '#007ACC',
            secondary: '#6C757D'
          }
        }
      });

      const result = await runCLI(['-p', 'pastel', '-t', 'dark'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
    });
  });
});

describe('CLI Unit Tests', () => {
  describe('getPalette', () => {
    test('should return palette for valid palette name and light theme', () => {
      const result = getPalette('default', 'light');

      expect(result.success).toBe(true);
      expect(result.palette).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('should return palette for valid palette name and dark theme', () => {
      const result = getPalette('default', 'dark');

      expect(result.success).toBe(true);
      expect(result.palette).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('should return error for invalid palette name', () => {
      const result = getPalette('nonexistent', 'light');

      expect(result.success).toBe(false);
      expect(result.palette).toBeUndefined();
      expect(result.error).toContain('Unknown palette: nonexistent');
      expect(result.error).toContain('Available palettes:');
    });

    test('should work with nature palettes', () => {
      const result = getPalette('forest', 'light');

      expect(result.success).toBe(true);
      expect(result.palette).toBeDefined();
    });

    test('should work with accessibility palettes', () => {
      const result = getPalette('protanopia', 'dark');

      expect(result.success).toBe(true);
      expect(result.palette).toBeDefined();
    });

    test('should default to light theme for non-dark values', () => {
      const result1 = getPalette('default', 'light');
      const result2 = getPalette('default', 'invalid');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Both should use light theme
    });
  });

  describe('validateOutputMode', () => {
    test('should accept valid output mode: ansi', () => {
      const result = validateOutputMode('ansi');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept valid output mode: html', () => {
      const result = validateOutputMode('html');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept valid output mode: chrome-console', () => {
      const result = validateOutputMode('chrome-console');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept valid output mode: logger', () => {
      const result = validateOutputMode('logger');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid output mode', () => {
      const result = validateOutputMode('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid output mode: invalid');
      expect(result.error).toContain('Valid modes:');
    });

    test('should reject empty string', () => {
      const result = validateOutputMode('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('processInput', () => {
    test('should successfully process valid JSON with default options', () => {
      const input = '{"name": "Alice", "age": 25}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output).toContain('name');
      expect(result.error).toBeUndefined();
    });

    test('should process with different palette', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'forest',
        theme: 'dark',
        outputMode: 'ansi'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    test('should process with html output mode', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'html'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    test('should process with maxWidth option', () => {
      const input = '{"name": "Alice", "email": "alice@example.com"}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi',
        maxWidth: 40
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    test('should process with maxWidth set to false', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi',
        maxWidth: false
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    test('should return error for invalid palette', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'nonexistent',
        theme: 'light',
        outputMode: 'ansi'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown palette: nonexistent');
      expect(result.output).toBeUndefined();
    });

    test('should return error for invalid output mode', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'invalid'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid output mode: invalid');
      expect(result.output).toBeUndefined();
    });

    test('should return error for invalid JSON', () => {
      const input = '{invalid json}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error highlighting input');
      expect(result.output).toBeUndefined();
    });

    test('should process array input', () => {
      const input = '[1, 2, 3, "hello", true, null]';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi'
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output).toContain('hello');
    });

    test('should process with all options combined', () => {
      const input = '{"name": "Alice", "items": [1, 2, 3]}';
      const options: CLIOptions = {
        palette: 'bold',
        theme: 'dark',
        outputMode: 'html',
        maxWidth: 80
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });

  describe('allPalettes', () => {
    test('should export allPalettes constant', () => {
      expect(allPalettes).toBeDefined();
      expect(typeof allPalettes).toBe('object');
    });

    test('should contain default palette', () => {
      expect(allPalettes).toHaveProperty('default');
    });

    test('should contain nature palettes', () => {
      expect(allPalettes).toHaveProperty('forest');
      expect(allPalettes).toHaveProperty('garden');
    });

    test('should contain accessibility palettes', () => {
      expect(allPalettes).toHaveProperty('protanopia');
      expect(allPalettes).toHaveProperty('deuteranopia');
    });
  });
});
