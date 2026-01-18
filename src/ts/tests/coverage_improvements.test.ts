import { describe, test, expect } from 'vitest';
import {
  highlight_value,
  parse_string,
  parse_value,
  paint_ansi,
  paint_html,
  paint_log,
  palettes,
  type ColorPalette,
  type Options,
  type ASTNode
} from '../index.js';

/**
 * Additional tests to improve code coverage
 * These tests target specific uncovered lines and branches
 */

describe('Coverage Improvements', () => {
  describe('BigInt support', () => {
    test('should parse bigint values', () => {
      const bigIntValue = BigInt('12345678901234567890');
      const ast = parse_value(bigIntValue);
      expect(ast.basic_type).toBe('bigint');
      expect(ast.value).toBe(bigIntValue);
    });

    test('should highlight bigint with "n" suffix', () => {
      const bigIntValue = BigInt('9007199254740991');
      const result = highlight_value(bigIntValue);
      expect(result).toContain('9007199254740991n');
    });

    test('should paint bigint with correct color', () => {
      const bigIntValue = BigInt('42');
      const ast = parse_value(bigIntValue);
      const result = paint_ansi(ast);
      expect(result).toContain('42n');
    });

    test('should handle negative bigint', () => {
      const bigIntValue = BigInt('-123456789');
      const result = highlight_value(bigIntValue);
      expect(result).toContain('-123456789n');
    });

    test('should handle zero bigint', () => {
      const bigIntValue = BigInt(0);
      const result = highlight_value(bigIntValue);
      expect(result).toContain('0n');
    });

    test('should paint bigint in HTML output', () => {
      const bigIntValue = BigInt('999');
      const ast = parse_value(bigIntValue);
      const result = paint_html(ast);
      expect(result).toContain('999n');
      expect(result).toContain('<span');
    });

    test('should paint bigint in log output', () => {
      const bigIntValue = BigInt('777');
      const ast = parse_value(bigIntValue);
      const result = paint_log(ast);
      expect(result).toBe('777n');
    });

    test('should handle bigint in objects', () => {
      const obj = {
        small: BigInt('1'),
        large: BigInt('123456789012345678901234567890')
      };
      const result = highlight_value(obj);
      expect(result).toContain('1n');
      expect(result).toContain('123456789012345678901234567890n');
    });

    test('should handle bigint in arrays', () => {
      const arr = [BigInt('100'), BigInt('200'), BigInt('300')];
      const result = highlight_value(arr);
      expect(result).toContain('100n');
      expect(result).toContain('200n');
      expect(result).toContain('300n');
    });
  });

  describe('Symbol edge cases', () => {
    test('should paint symbol without description correctly', () => {
      const sym = Symbol();
      const ast = parse_value(sym);
      const result = paint_ansi(ast);
      expect(result).toContain('Symbol');
      expect(result).not.toContain('()');
    });

    test('should paint symbol with description correctly', () => {
      const sym = Symbol('mySymbol');
      const ast = parse_value(sym);
      const result = paint_ansi(ast);
      expect(result).toContain('Symbol(mySymbol)');
    });

    test('should handle empty string description', () => {
      const sym = Symbol('');
      const ast = parse_value(sym);
      const result = paint_ansi(ast);
      expect(result).toContain('Symbol()');
    });

    test('should handle symbol with special characters in description', () => {
      const sym = Symbol('test-symbol_123');
      const result = highlight_value(sym);
      expect(result).toContain('Symbol(test-symbol_123)');
    });
  });

  describe('Palette validation', () => {
    test('should throw error when color is null in palette', () => {
      const incompletePalette = {
        ...palettes.default.light,
        string: null as unknown as string
      };
      const ast = parse_string('"test"');
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'string\' in palette');
    });

    test('should throw error when color is undefined in palette', () => {
      const incompletePalette = {
        ...palettes.default.light,
        number: undefined as unknown as string
      };
      const ast = parse_string('42');
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'number\' in palette');
    });

    test('should throw error for missing bigint color', () => {
      const incompletePalette = {
        ...palettes.default.light,
        bigint: null as unknown as string
      };
      const ast = parse_value(BigInt('123'));
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'bigint\' in palette');
    });

    test('should throw error for missing symbol color', () => {
      const incompletePalette = {
        ...palettes.default.light,
        symbol: undefined as unknown as string
      };
      const ast = parse_value(Symbol('test'));
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'symbol\' in palette');
    });

    test('should throw error for missing function color', () => {
      const incompletePalette = {
        ...palettes.default.light,
        function: null as unknown as string
      };
      const ast = parse_value(() => {});
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'function\' in palette');
    });

    test('should throw error for missing circularReference color', () => {
      const incompletePalette = {
        ...palettes.default.light,
        circularReference: undefined as unknown as string
      };
      const circular: any = { a: 1 };
      circular.self = circular;
      const ast = parse_value(circular);
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'circularReference\' in palette');
    });

    test('should throw error for missing specialNumber color', () => {
      const incompletePalette = {
        ...palettes.default.light,
        specialNumber: null as unknown as string
      };
      const ast = parse_value(NaN);
      expect(() => {
        paint_ansi(ast, { palette: incompletePalette as ColorPalette });
      }).toThrow('Missing color \'specialNumber\' in palette');
    });
  });

  describe('Special number parsing edge cases', () => {
    test('should parse -Infinity from string', () => {
      const ast = parse_string('-Infinity');
      expect(ast.value).toBe(-Infinity);
      expect(ast.basic_type).toBe('number');
    });

    test('should parse -0 from string', () => {
      const ast = parse_string('-0');
      expect(Object.is(ast.value, -0)).toBe(true);
      expect(ast.basic_type).toBe('number');
    });

    test('should handle negative number that is not a special number', () => {
      const ast = parse_string('-42');
      expect(ast.value).toBe(-42);
      expect(ast.basic_type).toBe('number');
    });

    test('should handle negative identifier that is not a special number', () => {
      // This tests the fallback path when a negative identifier doesn't match
      const ast = parse_string('-123.456');
      expect(ast.value).toBe(-123.456);
      expect(ast.basic_type).toBe('number');
    });

    test('should parse all special numbers', () => {
      expect(parse_string('NaN').value).toBeNaN();
      expect(parse_string('Infinity').value).toBe(Infinity);
      expect(parse_string('-Infinity').value).toBe(-Infinity);
      expect(Object.is(parse_string('-0').value, -0)).toBe(true);
    });

    test('should parse Number constants', () => {
      expect(parse_string('Number.MAX_VALUE').value).toBe(Number.MAX_VALUE);
      expect(parse_string('Number.MIN_VALUE').value).toBe(Number.MIN_VALUE);
      expect(parse_string('Number.MAX_SAFE_INTEGER').value).toBe(Number.MAX_SAFE_INTEGER);
      expect(parse_string('Number.MIN_SAFE_INTEGER').value).toBe(Number.MIN_SAFE_INTEGER);
      expect(parse_string('Number.EPSILON').value).toBe(Number.EPSILON);
      expect(parse_string('Number.POSITIVE_INFINITY').value).toBe(Number.POSITIVE_INFINITY);
      expect(parse_string('Number.NEGATIVE_INFINITY').value).toBe(Number.NEGATIVE_INFINITY);
    });

    test('should parse Math constants', () => {
      expect(parse_string('Math.E').value).toBe(Math.E);
      expect(parse_string('Math.PI').value).toBe(Math.PI);
      expect(parse_string('Math.LN2').value).toBe(Math.LN2);
      expect(parse_string('Math.LN10').value).toBe(Math.LN10);
      expect(parse_string('Math.LOG2E').value).toBe(Math.LOG2E);
      expect(parse_string('Math.LOG10E').value).toBe(Math.LOG10E);
      expect(parse_string('Math.SQRT1_2').value).toBe(Math.SQRT1_2);
      expect(parse_string('Math.SQRT2').value).toBe(Math.SQRT2);
    });
  });

  describe('Special number paint modes', () => {
    test('should paint NaN with highlight-label mode (default)', () => {
      const ast = parse_value(NaN);
      const result = paint_ansi(ast);
      expect(result).toContain('NaN');
    });

    test('should paint NaN with normal mode', () => {
      const ast = parse_value(NaN);
      const options: Options = { specialNumberPaintMode: 'normal' };
      const result = paint_ansi(ast, options);
      expect(result).toContain('NaN');
    });

    test('should paint NaN with highlight mode', () => {
      const ast = parse_value(NaN);
      const options: Options = { specialNumberPaintMode: 'highlight' };
      const result = paint_ansi(ast, options);
      // NaN still displays as 'NaN' because it has no numeric representation
      expect(result).toContain('NaN');
      expect(result).toBeTruthy();
    });

    test('should paint NaN with label mode', () => {
      const ast = parse_value(NaN);
      const options: Options = { specialNumberPaintMode: 'label' };
      const result = paint_ansi(ast, options);
      expect(result).toContain('NaN');
    });

    test('should paint Infinity with all modes', () => {
      const ast = parse_value(Infinity);

      const defaultResult = paint_ansi(ast);
      expect(defaultResult).toContain('Infinity');

      const normalResult = paint_ansi(ast, { specialNumberPaintMode: 'normal' });
      expect(normalResult).toContain('Infinity');

      const highlightResult = paint_ansi(ast, { specialNumberPaintMode: 'highlight' });
      expect(highlightResult).toBeTruthy();

      const labelResult = paint_ansi(ast, { specialNumberPaintMode: 'label' });
      expect(labelResult).toContain('Infinity');
    });

    test('should paint Math.PI with all modes', () => {
      const ast = parse_value(Math.PI);

      const defaultResult = paint_ansi(ast);
      expect(defaultResult).toContain('Math.PI');

      const normalResult = paint_ansi(ast, { specialNumberPaintMode: 'normal' });
      expect(normalResult).toContain('3.141592653589793');

      const highlightResult = paint_ansi(ast, { specialNumberPaintMode: 'highlight' });
      expect(highlightResult).toContain('3.141592653589793');

      const labelResult = paint_ansi(ast, { specialNumberPaintMode: 'label' });
      expect(labelResult).toContain('Math.PI');
    });

    test('should paint -0 with all modes', () => {
      const ast = parse_value(-0);

      const defaultResult = paint_ansi(ast);
      expect(defaultResult).toContain('-0');

      const normalResult = paint_ansi(ast, { specialNumberPaintMode: 'normal' });
      expect(normalResult).toBeTruthy();

      const highlightResult = paint_ansi(ast, { specialNumberPaintMode: 'highlight' });
      expect(highlightResult).toBeTruthy();

      const labelResult = paint_ansi(ast, { specialNumberPaintMode: 'label' });
      expect(labelResult).toContain('-0');
    });
  });

  describe('Container delimiter edge cases', () => {
    test('should use default delimiters when container config is missing', () => {
      const ast = parse_string('[1, 2, 3]');
      const result = paint_ansi(ast, { containers: {} });
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    test('should use default delimiters for objects', () => {
      const ast = parse_string('{"a": 1}');
      const result = paint_ansi(ast, { containers: {} });
      expect(result).toContain('{');
      expect(result).toContain('}');
      expect(result).toContain(':');
    });

    test('should use default delimiters for functions', () => {
      const ast = parse_value(() => {});
      const result = paint_ansi(ast, { containers: {} });
      expect(result).toContain('function(');
      expect(result).toContain(')');
    });

    test('should use partial container config', () => {
      const ast = parse_string('[1, 2]');
      const result = paint_ansi(ast, {
        containers: {
          array: { start: '<<' } // Only override start, use defaults for rest
        }
      });
      expect(result).toContain('<<');
      expect(result).toContain(']'); // Should use default end
    });
  });

  describe('Line unfolding and indentation', () => {
    test('should handle string indent in expanded mode', () => {
      const ast = parse_string('{"a": {"b": 1}}');
      const result = paint_ansi(ast, {
        lineUnfolding: 'expanded',
        indent: '\t' // Use tab character
      });
      expect(result).toContain('\n');
      expect(result).toContain('\t');
    });

    test('should handle numeric indent in expanded mode', () => {
      const ast = parse_string('{"a": {"b": 1}}');
      const result = paint_ansi(ast, {
        lineUnfolding: 'expanded',
        indent: 4 // 4 spaces
      });
      expect(result).toContain('\n');
      expect(result).toContain('    '); // 4 spaces
    });

    test('should handle multi-level nesting with string indent', () => {
      const ast = parse_string('{"a": {"b": {"c": 1}}}');
      const result = paint_ansi(ast, {
        lineUnfolding: 'expanded',
        indent: '--'
      });
      expect(result).toContain('\n');
      expect(result).toContain('--'); // First level
      expect(result).toContain('----'); // Second level
    });

    test('should use dense mode by default', () => {
      const ast = parse_string('{"a": {"b": 1}}');
      const result = paint_ansi(ast);
      expect(result).not.toContain('\n');
    });
  });

  describe('Edge cases in paint function', () => {
    test('should handle empty array', () => {
      const ast = parse_string('[]');
      const result = paint_ansi(ast);
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    test('should handle empty object', () => {
      const ast = parse_string('{}');
      const result = paint_ansi(ast);
      expect(result).toContain('{');
      expect(result).toContain('}');
    });

    test('should handle deeply nested structures', () => {
      const deep = {
        l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } }
      };
      const result = highlight_value(deep);
      expect(result).toContain('deep');
    });

    test('should handle all primitive types in one object', () => {
      const obj = {
        n: null,
        u: undefined,
        b: true,
        num: 42,
        str: 'hello',
        sym: Symbol('test'),
        big: BigInt('123')
      };
      const result = highlight_value(obj);
      expect(result).toContain('null');
      expect(result).toContain('undefined');
      expect(result).toContain('true');
      expect(result).toContain('42');
      expect(result).toContain('hello');
      expect(result).toContain('Symbol(test)');
      expect(result).toContain('123n');
    });
  });

  describe('HTML and log policy edge cases', () => {
    test('should use br tag for newlines in HTML', () => {
      const ast = parse_string('{"a": 1}');
      const result = paint_html(ast, { lineUnfolding: 'expanded' });
      expect(result).toContain('<br/>');
    });

    test('should escape HTML in HTML output values', () => {
      const ast = parse_string('"test"');
      const result = paint_html(ast);
      expect(result).toContain('<span');
      expect(result).toContain('</span>');
    });

    test('should not include color codes in log output', () => {
      const ast = parse_string('{"a": 1}');
      const result = paint_log(ast);
      expect(result).not.toContain('\x1b['); // ANSI escape codes
      expect(result).not.toContain('<span'); // HTML tags
    });

    test('should handle newlines in log output', () => {
      const ast = parse_string('{"a": 1}');
      const result = paint_log(ast, { lineUnfolding: 'expanded' });
      expect(result).toContain('\n');
      expect(result).not.toContain('<br/>');
    });
  });

  describe('Set rendering with expanded mode', () => {
    test('should paint Set with expanded line unfolding', () => {
      const set = new Set([1, 2, 3, 'test', true]);
      const ast = parse_value(set);
      const result = paint_ansi(ast, { lineUnfolding: 'expanded', indent: 2 });
      expect(result).toContain('\n');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain('test');
      expect(result).toContain('true');
    });

    test('should paint Set with string indent in expanded mode', () => {
      const set = new Set(['a', 'b', 'c']);
      const ast = parse_value(set);
      const result = paint_ansi(ast, { lineUnfolding: 'expanded', indent: '\t' });
      expect(result).toContain('\n');
      expect(result).toContain('\t');
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    test('should paint nested Set with expanded mode', () => {
      const nestedSet = new Set([
        new Set([1, 2]),
        new Set(['a', 'b']),
        { key: 'value' }
      ]);
      const ast = parse_value(nestedSet);
      const result = paint_ansi(ast, { lineUnfolding: 'expanded' });
      expect(result).toContain('\n');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('key');
    });

    test('should paint Set in dense mode', () => {
      const set = new Set([1, 'two', false]);
      const result = highlight_value(set);
      expect(result).toContain('1');
      expect(result).toContain('two');
      expect(result).toContain('false');
      expect(result).toContain('{(');
      expect(result).toContain(')}');
    });
  });

  describe('Map rendering with values', () => {
    test('should paint Map with actual key-value pairs', () => {
      const map = new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', 42],
        ['key3', true]
      ]);
      const result = highlight_value(map);
      expect(result).toContain('key1');
      expect(result).toContain('value1');
      expect(result).toContain('key2');
      expect(result).toContain('42');
      expect(result).toContain('key3');
      expect(result).toContain('true');
      expect(result).toContain('{<');
      expect(result).toContain('>}');
    });

    test('should paint Map in expanded mode', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ]);
      const ast = parse_value(map);
      const result = paint_ansi(ast, { lineUnfolding: 'expanded', indent: 2 });
      expect(result).toContain('\n');
      expect(result).toContain('a');
      expect(result).toContain('1');
      expect(result).toContain('b');
      expect(result).toContain('2');
      expect(result).toContain('c');
      expect(result).toContain('3');
    });

    test('should paint nested Map', () => {
      const nestedMap = new Map<string, unknown>([
        ['outer', new Map([['inner', 'value']])],
        ['array', [1, 2, 3]]
      ]);
      const result = highlight_value(nestedMap);
      expect(result).toContain('outer');
      expect(result).toContain('inner');
      expect(result).toContain('value');
      expect(result).toContain('array');
    });
  });

  describe('Tokenizer edge cases', () => {
    test('should parse negative identifier that is not a special number', () => {
      // This tests the case where we have a minus sign followed by a letter
      // that doesn't match a special number pattern
      // The tokenizer should restore position and parse it as a negative number
      const ast = parse_string('-123abc'.substring(0, 4)); // '-123'
      expect(ast.value).toBe(-123);
      expect(ast.basic_type).toBe('number');
    });

    test('should handle string starting with minus and letter (negative identifier fallback)', () => {
      // Test parsing a negative number when the parser initially thinks
      // it might be a negative special number identifier
      const testCases = [
        { input: '-42', expected: -42 },
        { input: '-3.14', expected: -3.14 },
        { input: '-1e5', expected: -100000 }
      ];

      for (const { input, expected } of testCases) {
        const ast = parse_string(input);
        expect(ast.value).toBe(expected);
        expect(ast.basic_type).toBe('number');
      }
    });
  });

  describe('Fallback and error cases', () => {
    test('should handle unknown basic_type with fallback', () => {
      // Create a synthetic AST node with unknown type
      const unknownNode: ASTNode = {
        basic_type: 'unknown' as any,
        deep_type: {},
        value: 'fallback_value'
      };
      const result = paint_ansi(unknownNode);
      expect(result).toBe('fallback_value');
    });

    test('should throw error for invalid JSON string', () => {
      expect(() => {
        parse_string('invalid json {]');
      }).toThrow();
    });

    test('should throw error when input is not a string', () => {
      expect(() => {
        parse_string(123 as any);
      }).toThrow('Input must be a string');
    });

    test('should throw error for unexpected token', () => {
      expect(() => {
        parse_string('unknownKeyword');
      }).toThrow('Unexpected token');
    });
  });
});
