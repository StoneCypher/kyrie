/**
 * Tests for CLI functionality
 */
import { describe, test, expect, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
// CLI path
const cliPath = join(__dirname, '../../../dist/cli.cjs');
// Helper to run CLI and capture output
function runCLI(args = [], input) {
    return new Promise((resolve) => {
        const child = spawn('node', [cliPath, ...args]);
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
//# sourceMappingURL=cli.test.js.map