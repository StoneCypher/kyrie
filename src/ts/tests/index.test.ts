import { highlight, type HighlightOptions, parse_string, type ASTNode } from '../index';

describe('highlight', () => {
  test('should return the input string unchanged for now', () => {
    const json = '{"name": "John", "age": 30}';
    expect(highlight(json)).toBe(json);
  });

  test('should handle empty string', () => {
    expect(highlight('')).toBe('');
  });

  test('should handle simple JSON object', () => {
    const json = '{"key": "value"}';
    expect(highlight(json)).toBe(json);
  });

  test('should handle JSON array', () => {
    const json = '[1, 2, 3]';
    expect(highlight(json)).toBe(json);
  });

  test('should accept optional options parameter', () => {
    const json = '{"test": true}';
    const options: HighlightOptions = {};
    expect(highlight(json, options)).toBe(json);
  });

  test('should work without options parameter', () => {
    const json = '{"test": false}';
    expect(highlight(json)).toBe(json);
  });
});

describe('parse_string', () => {
  test('should parse null', () => {
    const ast = parse_string('null');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('null');
    expect(ast.value).toBe(null);
  });

  test('should parse undefined', () => {
    const ast = parse_string('undefined');
    expect(ast.basic_type).toBe('undefined');
    expect(ast.value).toBe(undefined);
  });

  test('should parse boolean true', () => {
    const ast = parse_string('true');
    expect(ast.basic_type).toBe('boolean');
    expect(ast.value).toBe(true);
  });

  test('should parse boolean false', () => {
    const ast = parse_string('false');
    expect(ast.basic_type).toBe('boolean');
    expect(ast.value).toBe(false);
  });

  test('should parse number', () => {
    const ast = parse_string('42');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(42);
  });

  test('should parse negative number', () => {
    const ast = parse_string('-123.45');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(-123.45);
  });

  test('should parse number with scientific notation', () => {
    const ast = parse_string('1.5e10');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(1.5e10);
  });

  test('should parse number with scientific notation and plus', () => {
    const ast = parse_string('2e+5');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(2e+5);
  });

  test('should parse number with scientific notation and minus', () => {
    const ast = parse_string('3.14E-2');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(3.14E-2);
  });

  test('should parse string with double quotes', () => {
    const ast = parse_string('"hello world"');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello world');
  });

  test('should parse string with single quotes', () => {
    const ast = parse_string("'hello world'");
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello world');
  });

  test('should parse string with escape sequences', () => {
    const ast = parse_string('"hello\\nworld"');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello\nworld');
  });

  test('should parse string with tab escape', () => {
    const ast = parse_string('"hello\\tworld"');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello\tworld');
  });

  test('should parse string with carriage return escape', () => {
    const ast = parse_string('"hello\\rworld"');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello\rworld');
  });

  test('should parse string with backslash escape', () => {
    const ast = parse_string('"hello\\\\world"');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello\\world');
  });

  test('should parse string with quote escapes', () => {
    const ast = parse_string('"She said \\"hello\\""');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('She said "hello"');
  });

  test('should parse string with single quote escape', () => {
    const ast = parse_string("'It\\'s working'");
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe("It's working");
  });

  test('should parse empty array', () => {
    const ast = parse_string('[]');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.deep_type.constructorName).toBe('Array');
    expect(ast.elements).toEqual([]);
  });

  test('should parse array with numbers', () => {
    const ast = parse_string('[1, 2, 3]');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(3);
    expect(ast.elements![0]!.value).toBe(1);
    expect(ast.elements![1]!.value).toBe(2);
    expect(ast.elements![2]!.value).toBe(3);
  });

  test('should parse array with mixed types', () => {
    const ast = parse_string('[1, "hello", true, null]');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(4);
    expect(ast.elements![0]!.basic_type).toBe('number');
    expect(ast.elements![1]!.basic_type).toBe('string');
    expect(ast.elements![2]!.basic_type).toBe('boolean');
    expect(ast.elements![3]!.basic_type).toBe('object');
  });

  test('should parse empty object', () => {
    const ast = parse_string('{}');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBeUndefined();
    expect(ast.properties).toEqual({});
  });

  test('should parse object with properties', () => {
    const ast = parse_string('{"name": "John", "age": 30}');
    expect(ast.basic_type).toBe('object');
    expect(ast.properties).toBeDefined();
    expect(ast.properties!['name']!.value).toBe('John');
    expect(ast.properties!['age']!.value).toBe(30);
  });

  test('should parse object with unquoted keys', () => {
    const ast = parse_string('{name: "John", age: 30}');
    expect(ast.basic_type).toBe('object');
    expect(ast.properties!['name']!.value).toBe('John');
    expect(ast.properties!['age']!.value).toBe(30);
  });

  test('should parse nested objects', () => {
    const ast = parse_string('{"person": {"name": "John", "age": 30}}');
    expect(ast.basic_type).toBe('object');
    expect(ast.properties!['person']!.basic_type).toBe('object');
    expect(ast.properties!['person']!.properties!['name']!.value).toBe('John');
  });

  test('should parse nested arrays', () => {
    const ast = parse_string('[[1, 2], [3, 4]]');
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(2);
    expect(ast.elements![0]!.deep_type.isArray).toBe(true);
    expect(ast.elements![0]!.elements![0]!.value).toBe(1);
  });

  test('should assign reference IDs to objects', () => {
    const ast = parse_string('{"a": {}, "b": {}}');
    expect(ast.deep_type.referenceId).toBe(0);
    expect(ast.properties!['a']!.deep_type.referenceId).toBe(1);
    expect(ast.properties!['b']!.deep_type.referenceId).toBe(2);
  });

  test('should throw error for non-string input', () => {
    expect(() => parse_string(123)).toThrow('Input must be a string');
  });

  test('should throw error for unexpected token', () => {
    expect(() => parse_string('invalid')).toThrow('Unexpected token: invalid');
  });

  test('should throw error for unknown keyword', () => {
    expect(() => parse_string('unknown')).toThrow('Unexpected token: unknown');
  });

  test('should handle whitespace', () => {
    const ast = parse_string('  {  "name"  :  "John"  }  ');
    expect(ast.basic_type).toBe('object');
    expect(ast.properties!['name']!.value).toBe('John');
  });

  test('should parse empty strings', () => {
    const ast = parse_string('""');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('');
  });

  test('should parse object with single-quoted keys', () => {
    const ast = parse_string("{'key': 'value'}");
    expect(ast.basic_type).toBe('object');
    expect(ast.properties!['key']!.value).toBe('value');
  });

  test('should parse deeply nested structures', () => {
    const ast = parse_string('{"a": {"b": {"c": {"d": "deep"}}}}');
    expect(ast.properties!['a']!.properties!['b']!.properties!['c']!.properties!['d']!.value).toBe('deep');
  });

  test('should parse array with nested objects', () => {
    const ast = parse_string('[{"a": 1}, {"b": 2}]');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements![0]!.properties!['a']!.value).toBe(1);
    expect(ast.elements![1]!.properties!['b']!.value).toBe(2);
  });

  test('should parse object with multiple data types', () => {
    const ast = parse_string('{"str": "text", "num": 42, "bool": true, "nil": null, "arr": [1,2,3]}');
    expect(ast.properties!['str']!.basic_type).toBe('string');
    expect(ast.properties!['num']!.basic_type).toBe('number');
    expect(ast.properties!['bool']!.basic_type).toBe('boolean');
    expect(ast.properties!['nil']!.basic_type).toBe('object');
    expect(ast.properties!['arr']!.deep_type.isArray).toBe(true);
  });

  test('should handle decimal numbers', () => {
    const ast = parse_string('0.123');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(0.123);
  });

  test('should parse number zero', () => {
    const ast = parse_string('0');
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(0);
  });
});
