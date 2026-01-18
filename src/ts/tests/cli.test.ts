/**
 * Tests for CLI functionality
 */

import { describe, test, expect, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { getPalette, validateOutputMode, validateLineUnfolding, processInput, allPalettes, parseMaxWidth, parseIndent, parseKyrieDefault } from '../cli.js';
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

    test('should handle palette without requested theme variant', () => {
      // Create a mock palette with only one variant by manipulating the palette object
      const originalDefault = (allPalettes as any).default;

      // Temporarily replace with incomplete palette
      const incompletePalette = { light: originalDefault.light };
      (allPalettes as any).testIncomplete = incompletePalette;

      const result = getPalette('testIncomplete', 'dark');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have a dark variant');

      // Clean up
      delete (allPalettes as any).testIncomplete;
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

  describe('validateLineUnfolding', () => {
    test('should accept valid line unfolding mode: dense', () => {
      const result = validateLineUnfolding('dense');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept valid line unfolding mode: expanded', () => {
      const result = validateLineUnfolding('expanded');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid line unfolding mode', () => {
      const result = validateLineUnfolding('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid line unfolding mode: invalid');
      expect(result.error).toContain('Valid modes:');
    });

    test('should reject empty string', () => {
      const result = validateLineUnfolding('');

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
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'html',
        lineUnfolding: 'dense',
        indent: 2
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
        maxWidth: 40,
        lineUnfolding: 'dense',
        indent: 2
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
        maxWidth: false,
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'invalid',
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
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
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
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
        maxWidth: 80,
        lineUnfolding: 'dense',
        indent: 2
      };

      const result = processInput(input, options);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    test('should process with different line unfolding modes', () => {
      const input = '{"test": "value"}';

      const options1: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi',
        lineUnfolding: 'dense',
        indent: 2
      };
      const result1 = processInput(input, options1);
      expect(result1.success).toBe(true);

      const options2: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi',
        lineUnfolding: 'expanded',
        indent: 2
      };
      const result2 = processInput(input, options2);
      expect(result2.success).toBe(true);
    });

    test('should return error for invalid line unfolding mode', () => {
      const input = '{"test": "value"}';
      const options: CLIOptions = {
        palette: 'default',
        theme: 'light',
        outputMode: 'ansi',
        lineUnfolding: 'invalid',
        indent: 2
      };

      const result = processInput(input, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid line unfolding mode: invalid');
      expect(result.output).toBeUndefined();
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

  describe('parseMaxWidth', () => {
    test('should parse numeric string to number', () => {
      expect(parseMaxWidth('80')).toBe(80);
      expect(parseMaxWidth('100')).toBe(100);
      expect(parseMaxWidth('0')).toBe(0);
    });

    test('should parse "false" string to false boolean', () => {
      expect(parseMaxWidth('false')).toBe(false);
    });

    test('should throw error for invalid non-numeric strings', () => {
      expect(() => parseMaxWidth('invalid')).toThrow('Invalid max-width value: invalid');
      expect(() => parseMaxWidth('abc')).toThrow('Expected a number or "false"');
    });

    test('should throw error for empty string', () => {
      expect(() => parseMaxWidth('')).toThrow('Invalid max-width value');
    });

    test('should parse negative numbers', () => {
      expect(parseMaxWidth('-10')).toBe(-10);
    });

    test('should parse decimal numbers as integers', () => {
      expect(parseMaxWidth('80.5')).toBe(80);
      expect(parseMaxWidth('99.9')).toBe(99);
    });

    test('should handle strings with leading/trailing spaces', () => {
      expect(parseMaxWidth(' 80 ')).toBe(80); // parseInt handles leading/trailing spaces
      expect(parseMaxWidth('  100  ')).toBe(100);
    });

    test('should handle very large numbers', () => {
      expect(parseMaxWidth('999999')).toBe(999999);
    });
  });

  describe('parseIndent', () => {
    test('should parse numeric string to number', () => {
      expect(parseIndent('2')).toBe(2);
      expect(parseIndent('4')).toBe(4);
      expect(parseIndent('0')).toBe(0);
    });

    test('should return string for non-numeric values', () => {
      expect(parseIndent('\t')).toBe('\t');
      expect(parseIndent('  ')).toBe('  ');
      expect(parseIndent('    ')).toBe('    ');
    });

    test('should parse negative numbers as numbers', () => {
      expect(parseIndent('-2')).toBe(-2);
    });

    test('should parse decimal numbers as integers', () => {
      expect(parseIndent('2.5')).toBe(2);
      expect(parseIndent('4.9')).toBe(4);
    });

    test('should handle mixed strings as strings', () => {
      const result = parseIndent('abc');
      expect(typeof result).toBe('string');
      expect(result).toBe('abc');
    });

    test('should handle empty string as string', () => {
      const result = parseIndent('');
      expect(typeof result).toBe('string');
      expect(result).toBe('');
    });

    test('should handle strings with leading numbers', () => {
      expect(parseIndent('2spaces')).toBe(2); // parseInt stops at first non-digit
    });
  });

  describe('parseKyrieDefault', () => {
    test('should return null for undefined input', () => {
      const result = parseKyrieDefault(undefined);
      expect(result).toBeNull();
    });

    test('should return null for empty string', () => {
      const result = parseKyrieDefault('');
      expect(result).toBeNull();
    });

    test('should return null for whitespace-only string', () => {
      const result = parseKyrieDefault('   ');
      expect(result).toBeNull();
    });

    test('should parse simple palette name', () => {
      const result = parseKyrieDefault('forest');
      expect(result).toEqual({
        isPaletteName: true,
        paletteName: 'forest'
      });
    });

    test('should parse palette name with whitespace', () => {
      const result = parseKyrieDefault('  bold  ');
      expect(result).toEqual({
        isPaletteName: true,
        paletteName: 'bold'
      });
    });

    test('should parse single key-value pair', () => {
      const result = parseKyrieDefault('palette=forest');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'forest'
        }
      });
    });

    test('should parse multiple key-value pairs', () => {
      const result = parseKyrieDefault('palette=forest, theme=dark, indent=4');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'forest',
          theme: 'dark',
          indent: 4
        }
      });
    });

    test('should handle key-value pairs with extra whitespace', () => {
      const result = parseKyrieDefault('  palette = forest ,  theme = dark  ');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'forest',
          theme: 'dark'
        }
      });
    });

    test('should parse maxWidth as number', () => {
      const result = parseKyrieDefault('maxWidth=80');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          maxWidth: 80
        }
      });
    });

    test('should parse maxWidth as false', () => {
      const result = parseKyrieDefault('maxWidth=false');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          maxWidth: false
        }
      });
    });

    test('should parse outputMode', () => {
      const result = parseKyrieDefault('outputMode=html');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          outputMode: 'html'
        }
      });
    });

    test('should parse lineUnfolding', () => {
      const result = parseKyrieDefault('lineUnfolding=expanded');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          lineUnfolding: 'expanded'
        }
      });
    });

    test('should parse indent as number', () => {
      const result = parseKyrieDefault('indent=4');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          indent: 4
        }
      });
    });

    test('should parse indent as string', () => {
      const result = parseKyrieDefault('indent=\\t');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          indent: '\\t'
        }
      });
    });

    test('should parse all options together', () => {
      const result = parseKyrieDefault('palette=forest, theme=dark, maxWidth=80, outputMode=html, lineUnfolding=expanded, indent=4');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'forest',
          theme: 'dark',
          maxWidth: 80,
          outputMode: 'html',
          lineUnfolding: 'expanded',
          indent: 4
        }
      });
    });

    test('should skip invalid key-value pairs with missing key', () => {
      const result = parseKyrieDefault('=forest, theme=dark');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          theme: 'dark'
        }
      });
    });

    test('should skip invalid key-value pairs with missing value', () => {
      const result = parseKyrieDefault('palette=, theme=dark');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          theme: 'dark'
        }
      });
    });

    test('should ignore unknown keys', () => {
      const result = parseKyrieDefault('palette=forest, unknownKey=value, theme=dark');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'forest',
          theme: 'dark'
        }
      });
    });

    test('should handle value with equals sign', () => {
      const result = parseKyrieDefault('palette=my=custom=palette');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          palette: 'my=custom=palette'
        }
      });
    });

    test('should handle maxWidth with invalid numeric value', () => {
      const result = parseKyrieDefault('maxWidth=invalid, theme=dark');
      expect(result).toEqual({
        isPaletteName: false,
        config: {
          theme: 'dark'
        }
      });
    });

    test('should parse real-world example 1', () => {
      const result = parseKyrieDefault('forest');
      expect(result?.isPaletteName).toBe(true);
      expect(result?.paletteName).toBe('forest');
    });

    test('should parse real-world example 2', () => {
      const result = parseKyrieDefault('palette=forest, theme=dark');
      expect(result?.isPaletteName).toBe(false);
      expect(result?.config?.palette).toBe('forest');
      expect(result?.config?.theme).toBe('dark');
    });

    test('should parse real-world example 3', () => {
      const result = parseKyrieDefault('palette=bold, theme=dark, lineUnfolding=expanded, indent=2');
      expect(result?.isPaletteName).toBe(false);
      expect(result?.config).toEqual({
        palette: 'bold',
        theme: 'dark',
        lineUnfolding: 'expanded',
        indent: 2
      });
    });

    describe('Palette color overrides', () => {
      test('should parse single palette color with hex value', () => {
        const result = parseKyrieDefault('number=#FF0000');
        expect(result).toEqual({
          isPaletteName: false,
          config: {
            paletteColors: {
              number: '#FF0000'
            }
          }
        });
      });

      test('should parse multiple palette colors', () => {
        const result = parseKyrieDefault('number=#FF0000, string=#00FF00, boolean=#0000FF');
        expect(result).toEqual({
          isPaletteName: false,
          config: {
            paletteColors: {
              number: '#FF0000',
              string: '#00FF00',
              boolean: '#0000FF'
            }
          }
        });
      });

      test('should parse palette name with color overrides', () => {
        const result = parseKyrieDefault('palette=forest, number=#FF0000, string=#00FF00');
        expect(result).toEqual({
          isPaletteName: false,
          config: {
            palette: 'forest',
            paletteColors: {
              number: '#FF0000',
              string: '#00FF00'
            }
          }
        });
      });

      test('should parse all configuration options with palette colors', () => {
        const result = parseKyrieDefault('palette=forest, theme=dark, number=#FF0000, string=#00FF00, indent=4');
        expect(result).toEqual({
          isPaletteName: false,
          config: {
            palette: 'forest',
            theme: 'dark',
            indent: 4,
            paletteColors: {
              number: '#FF0000',
              string: '#00FF00'
            }
          }
        });
      });

      test('should parse all valid AST node type colors', () => {
        const result = parseKyrieDefault(
          'null=#111111, undefined=#222222, boolean=#333333, number=#444444, bigint=#555555, ' +
          'specialNumber=#666666, string=#777777, symbol=#888888, function=#999999, object=#AAAAAA, ' +
          'array=#BBBBBB, map=#CCCCCC, set=#DDDDDD, weakmap=#EEEEEE, weakset=#FFFFFF, ' +
          'date=#000001, regexp=#000002, error=#000003, circularReference=#000004, ' +
          'propertyKey=#000005, punctuation=#000006, indentGuide=#000007, text=#000008'
        );

        expect(result?.isPaletteName).toBe(false);
        expect(result?.config?.paletteColors).toEqual({
          null: '#111111',
          undefined: '#222222',
          boolean: '#333333',
          number: '#444444',
          bigint: '#555555',
          specialNumber: '#666666',
          string: '#777777',
          symbol: '#888888',
          function: '#999999',
          object: '#AAAAAA',
          array: '#BBBBBB',
          map: '#CCCCCC',
          set: '#DDDDDD',
          weakmap: '#EEEEEE',
          weakset: '#FFFFFF',
          date: '#000001',
          regexp: '#000002',
          error: '#000003',
          circularReference: '#000004',
          propertyKey: '#000005',
          punctuation: '#000006',
          indentGuide: '#000007',
          text: '#000008'
        });
      });

      test('should parse color with 3-digit hex code', () => {
        const result = parseKyrieDefault('number=#F00');
        expect(result?.config?.paletteColors?.number).toBe('#F00');
      });

      test('should parse color with 6-digit hex code', () => {
        const result = parseKyrieDefault('number=#FF0000');
        expect(result?.config?.paletteColors?.number).toBe('#FF0000');
      });

      test('should parse color with 8-digit hex code (with alpha)', () => {
        const result = parseKyrieDefault('number=#FF0000FF');
        expect(result?.config?.paletteColors?.number).toBe('#FF0000FF');
      });

      test('should parse CSS color names', () => {
        const result = parseKyrieDefault('number=red, string=blue, boolean=green');
        expect(result?.config?.paletteColors).toEqual({
          number: 'red',
          string: 'blue',
          boolean: 'green'
        });
      });

      test('should ignore palette color with invalid value (not starting with # or letter)', () => {
        const result = parseKyrieDefault('number=123456, string=#00FF00');
        expect(result?.config?.paletteColors).toEqual({
          string: '#00FF00'
        });
        expect(result?.config?.paletteColors?.number).toBeUndefined();
      });

      test('should handle whitespace around palette color values', () => {
        const result = parseKyrieDefault('  number = #FF0000  ,  string = #00FF00  ');
        expect(result?.config?.paletteColors).toEqual({
          number: '#FF0000',
          string: '#00FF00'
        });
      });

      test('should combine palette colors with other options', () => {
        const result = parseKyrieDefault('palette=bold, number=#FF0000, theme=dark, string=#00FF00, lineUnfolding=expanded');
        expect(result?.config).toEqual({
          palette: 'bold',
          theme: 'dark',
          lineUnfolding: 'expanded',
          paletteColors: {
            number: '#FF0000',
            string: '#00FF00'
          }
        });
      });

      test('should parse real-world example with palette overrides', () => {
        const result = parseKyrieDefault('palette=forest, theme=dark, number=#FFD700, string=#90EE90, error=#FF6B6B');
        expect(result?.isPaletteName).toBe(false);
        expect(result?.config?.palette).toBe('forest');
        expect(result?.config?.theme).toBe('dark');
        expect(result?.config?.paletteColors).toEqual({
          number: '#FFD700',
          string: '#90EE90',
          error: '#FF6B6B'
        });
      });

      test('should parse only palette colors without base palette', () => {
        const result = parseKyrieDefault('number=#FF0000, string=#00FF00, theme=dark');
        expect(result?.config).toEqual({
          theme: 'dark',
          paletteColors: {
            number: '#FF0000',
            string: '#00FF00'
          }
        });
        expect(result?.config?.palette).toBeUndefined();
      });

      test('should handle case-sensitive palette color keys', () => {
        const result = parseKyrieDefault('Number=#FF0000, string=#00FF00');
        expect(result?.config?.paletteColors?.string).toBe('#00FF00');
        expect(result?.config?.paletteColors).not.toHaveProperty('Number');
        expect(result?.config?.paletteColors).not.toHaveProperty('number');
      });
    });
  });
});
