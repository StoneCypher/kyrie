import {
  highlight_value,
  highlight_string,
  type HighlightOptions,
  parse_string,
  parse_value,
  type ASTNode,
  palettes,
  paint,
  defaultContainers,
  defaultHighlightOptions,
  type ContainerConfig,
  testdata
} from '../index.js';

describe('ASTNode', () => {
  test('should have correct structure for primitive', () => {
    const ast = parse_string('42');
    const node: ASTNode = ast;
    expect(node.basic_type).toBe('number');
    expect(node.deep_type).toBeDefined();
    expect(node.value).toBe(42);
  });

  test('should have correct structure for object', () => {
    const ast = parse_string('{"key": "value"}');
    const node: ASTNode = ast;
    expect(node.basic_type).toBe('object');
    expect(node.deep_type).toBeDefined();
    expect(node.properties).toBeDefined();
    expect(node.properties!['key']).toBeDefined();
  });

  test('should have correct structure for array', () => {
    const ast = parse_string('[1, 2, 3]');
    const node: ASTNode = ast;
    expect(node.basic_type).toBe('object');
    expect(node.deep_type.isArray).toBe(true);
    expect(node.elements).toBeDefined();
    expect(node.elements!.length).toBe(3);
  });

  test('should be assignable from parse_string', () => {
    const node: ASTNode = parse_string('null');
    expect(node).toBeDefined();
  });

  test('should be assignable from parse_value', () => {
    const node: ASTNode = parse_value({test: 'value'});
    expect(node).toBeDefined();
  });
});

describe('HighlightOptions', () => {
  test('defaultHighlightOptions should have palette', () => {
    expect(defaultHighlightOptions.palette).toBeDefined();
    expect(defaultHighlightOptions.palette).toBe(palettes.default.light);
  });

  test('defaultHighlightOptions should have containers', () => {
    expect(defaultHighlightOptions.containers).toBeDefined();
    expect(defaultHighlightOptions.containers).toBe(defaultContainers);
  });

  test('should be assignable type', () => {
    const options: HighlightOptions = {
      palette: palettes.forest.light,
      containers: defaultContainers
    };
    expect(options).toBeDefined();
  });

  test('should allow partial options', () => {
    const paletteOnly: HighlightOptions = { palette: palettes.bold.dark };
    const containersOnly: HighlightOptions = { containers: defaultContainers };
    const empty: HighlightOptions = {};
    expect(paletteOnly).toBeDefined();
    expect(containersOnly).toBeDefined();
    expect(empty).toBeDefined();
  });
});

describe('highlight_value', () => {
  test('should return colorized output for object', () => {
    const value = { name: 'John', age: 30 };
    const result = highlight_value(value);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('name');
    expect(result).toContain('John');
    expect(result).toContain('age');
    expect(result).toContain('30');
  });

  test('should handle empty string', () => {
    const result = highlight_value('');
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
  });

  test('should handle simple object', () => {
    const value = { key: 'value' };
    const result = highlight_value(value);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('key');
    expect(result).toContain('value');
  });

  test('should handle array', () => {
    const value = [1, 2, 3];
    const result = highlight_value(value);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  test('should accept optional options parameter', () => {
    const value = { test: true };
    const options: HighlightOptions = { palette: palettes.forest.light };
    const result = highlight_value(value, options);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('test');
    expect(result).toContain('true');
  });

  test('should work without options parameter', () => {
    const value = { test: false };
    const result = highlight_value(value);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('test');
    expect(result).toContain('false');
  });
});

describe('highlight_string', () => {
  test('should return colorized output for JSON object', () => {
    const json = '{"name": "John", "age": 30}';
    const result = highlight_string(json);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('name');
    expect(result).toContain('John');
    expect(result).toContain('age');
    expect(result).toContain('30');
  });

  test('should handle empty string', () => {
    const result = highlight_string('""');
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
  });

  test('should handle simple JSON object', () => {
    const json = '{"key": "value"}';
    const result = highlight_string(json);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('key');
    expect(result).toContain('value');
  });

  test('should handle JSON array', () => {
    const json = '[1, 2, 3]';
    const result = highlight_string(json);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  test('should accept optional options parameter', () => {
    const json = '{"test": true}';
    const options: HighlightOptions = { palette: palettes.bold.dark };
    const result = highlight_string(json, options);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('test');
    expect(result).toContain('true');
  });

  test('should work without options parameter', () => {
    const json = '{"test": false}';
    const result = highlight_string(json);
    expect(result).toContain('\x1b['); // Contains ANSI escape codes
    expect(result).toContain('test');
    expect(result).toContain('false');
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

describe('parse_value', () => {
  test('should parse null', () => {
    const ast = parse_value(null);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('null');
    expect(ast.value).toBe(null);
  });

  test('should parse undefined', () => {
    const ast = parse_value(undefined);
    expect(ast.basic_type).toBe('undefined');
    expect(ast.value).toBe(undefined);
  });

  test('should parse boolean true', () => {
    const ast = parse_value(true);
    expect(ast.basic_type).toBe('boolean');
    expect(ast.value).toBe(true);
  });

  test('should parse boolean false', () => {
    const ast = parse_value(false);
    expect(ast.basic_type).toBe('boolean');
    expect(ast.value).toBe(false);
  });

  test('should parse number', () => {
    const ast = parse_value(42);
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(42);
  });

  test('should parse negative number', () => {
    const ast = parse_value(-123.45);
    expect(ast.basic_type).toBe('number');
    expect(ast.value).toBe(-123.45);
  });

  test('should parse string', () => {
    const ast = parse_value('hello world');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('hello world');
  });

  test('should parse empty string', () => {
    const ast = parse_value('');
    expect(ast.basic_type).toBe('string');
    expect(ast.value).toBe('');
  });

  test('should parse empty array', () => {
    const ast = parse_value([]);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.deep_type.constructorName).toBe('Array');
    expect(ast.elements).toEqual([]);
  });

  test('should parse array with numbers', () => {
    const ast = parse_value([1, 2, 3]);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(3);
    expect(ast.elements![0]!.value).toBe(1);
    expect(ast.elements![1]!.value).toBe(2);
    expect(ast.elements![2]!.value).toBe(3);
  });

  test('should parse array with mixed types', () => {
    const ast = parse_value([1, 'hello', true, null]);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(4);
    expect(ast.elements![0]!.basic_type).toBe('number');
    expect(ast.elements![1]!.basic_type).toBe('string');
    expect(ast.elements![2]!.basic_type).toBe('boolean');
    expect(ast.elements![3]!.basic_type).toBe('object');
  });

  test('should parse empty object', () => {
    const ast = parse_value({});
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBeUndefined();
    expect(ast.properties).toEqual({});
  });

  test('should parse object with properties', () => {
    const ast = parse_value({name: 'John', age: 30});
    expect(ast.basic_type).toBe('object');
    expect(ast.properties).toBeDefined();
    expect(ast.properties!['name']!.value).toBe('John');
    expect(ast.properties!['age']!.value).toBe(30);
  });

  test('should parse nested objects', () => {
    const ast = parse_value({person: {name: 'John', age: 30}});
    expect(ast.basic_type).toBe('object');
    expect(ast.properties!['person']!.basic_type).toBe('object');
    expect(ast.properties!['person']!.properties!['name']!.value).toBe('John');
  });

  test('should parse nested arrays', () => {
    const ast = parse_value([[1, 2], [3, 4]]);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.isArray).toBe(true);
    expect(ast.elements).toHaveLength(2);
    expect(ast.elements![0]!.deep_type.isArray).toBe(true);
    expect(ast.elements![0]!.elements![0]!.value).toBe(1);
  });

  test('should assign reference IDs to objects', () => {
    const ast = parse_value({a: {}, b: {}});
    expect(ast.deep_type.referenceId).toBe(0);
    expect(ast.properties!['a']!.deep_type.referenceId).toBe(1);
    expect(ast.properties!['b']!.deep_type.referenceId).toBe(2);
  });

  test('should detect circular references', () => {
    const obj: Record<string, unknown> = {a: 1};
    obj['self'] = obj;
    const ast = parse_value(obj);
    expect(ast.deep_type.referenceId).toBe(0);
    expect(ast.properties!['a']!.value).toBe(1);
    expect(ast.properties!['self']!.deep_type.isCircularReference).toBe(true);
    expect(ast.properties!['self']!.deep_type.referenceId).toBe(0);
  });

  test('should handle symbols', () => {
    const sym = Symbol('test');
    const ast = parse_value(sym);
    expect(ast.basic_type).toBe('symbol');
    expect(ast.deep_type.description).toBe('test');
  });

  test('should handle symbols without description', () => {
    const sym = Symbol();
    const ast = parse_value(sym);
    expect(ast.basic_type).toBe('symbol');
    expect(ast.deep_type.description).toBeUndefined();
  });

  test('should identify Date objects', () => {
    const date = new Date('2024-01-01');
    const ast = parse_value(date);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('Date');
    expect(ast.deep_type.isDate).toBe(true);
  });

  test('should identify RegExp objects', () => {
    const regex = /test/gi;
    const ast = parse_value(regex);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('RegExp');
    expect(ast.deep_type.isRegExp).toBe(true);
  });

  test('should identify Map objects', () => {
    const map = new Map([['key', 'value']]);
    const ast = parse_value(map);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('Map');
    expect(ast.deep_type.isMap).toBe(true);
  });

  test('should identify Set objects', () => {
    const set = new Set([1, 2, 3]);
    const ast = parse_value(set);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('Set');
    expect(ast.deep_type.isSet).toBe(true);
  });

  test('should identify Error objects', () => {
    const error = new Error('test error');
    const ast = parse_value(error);
    expect(ast.basic_type).toBe('object');
    expect(ast.deep_type.constructorName).toBe('Error');
    expect(ast.deep_type.isError).toBe(true);
  });

  test('should handle functions', () => {
    const fn = function test() { return 42; };
    const ast = parse_value(fn);
    expect(ast.basic_type).toBe('function');
  });

  test('should match parse_string output for equivalent values', () => {
    const obj = {name: 'John', age: 30, active: true};
    const stringAst = parse_string('{"name": "John", "age": 30, "active": true}');
    const valueAst = parse_value(obj);

    expect(valueAst.basic_type).toBe(stringAst.basic_type);
    expect(valueAst.deep_type.isArray).toBe(stringAst.deep_type.isArray);
    expect(valueAst.properties!['name']!.value).toBe(stringAst.properties!['name']!.value);
    expect(valueAst.properties!['age']!.value).toBe(stringAst.properties!['age']!.value);
    expect(valueAst.properties!['active']!.value).toBe(stringAst.properties!['active']!.value);
  });
});

describe('parse_string and parse_value equivalence', () => {
  test('equivalence: null', () => {
    const fromString = parse_string('null');
    const fromValue = parse_value(null);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.constructorName).toBe(fromString.deep_type.constructorName);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: undefined', () => {
    const fromString = parse_string('undefined');
    const fromValue = parse_value(undefined);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: boolean true', () => {
    const fromString = parse_string('true');
    const fromValue = parse_value(true);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: boolean false', () => {
    const fromString = parse_string('false');
    const fromValue = parse_value(false);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: positive integer', () => {
    const fromString = parse_string('42');
    const fromValue = parse_value(42);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: negative number', () => {
    const fromString = parse_string('-123.45');
    const fromValue = parse_value(-123.45);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: zero', () => {
    const fromString = parse_string('0');
    const fromValue = parse_value(0);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: decimal number', () => {
    const fromString = parse_string('3.14159');
    const fromValue = parse_value(3.14159);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: string', () => {
    const fromString = parse_string('"hello world"');
    const fromValue = parse_value('hello world');

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: empty string', () => {
    const fromString = parse_string('""');
    const fromValue = parse_value('');

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: string with newline', () => {
    const fromString = parse_string('"hello\\nworld"');
    const fromValue = parse_value('hello\nworld');

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.value).toBe(fromString.value);
  });

  test('equivalence: empty array', () => {
    const fromString = parse_string('[]');
    const fromValue = parse_value([]);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(fromValue.deep_type.constructorName).toBe(fromString.deep_type.constructorName);
    expect(fromValue.elements).toHaveLength(0);
    expect(fromString.elements).toHaveLength(0);
  });

  test('equivalence: array of numbers', () => {
    const fromString = parse_string('[1, 2, 3]');
    const fromValue = parse_value([1, 2, 3]);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(fromValue.elements).toHaveLength(3);
    expect(fromValue.elements![0]!.value).toBe(fromString.elements![0]!.value);
    expect(fromValue.elements![1]!.value).toBe(fromString.elements![1]!.value);
    expect(fromValue.elements![2]!.value).toBe(fromString.elements![2]!.value);
  });

  test('equivalence: array of mixed types', () => {
    const fromString = parse_string('[1, "hello", true, null]');
    const fromValue = parse_value([1, 'hello', true, null]);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(fromValue.elements).toHaveLength(4);
    expect(fromValue.elements![0]!.basic_type).toBe(fromString.elements![0]!.basic_type);
    expect(fromValue.elements![0]!.value).toBe(fromString.elements![0]!.value);
    expect(fromValue.elements![1]!.basic_type).toBe(fromString.elements![1]!.basic_type);
    expect(fromValue.elements![1]!.value).toBe(fromString.elements![1]!.value);
    expect(fromValue.elements![2]!.basic_type).toBe(fromString.elements![2]!.basic_type);
    expect(fromValue.elements![2]!.value).toBe(fromString.elements![2]!.value);
    expect(fromValue.elements![3]!.basic_type).toBe(fromString.elements![3]!.basic_type);
  });

  test('equivalence: empty object', () => {
    const fromString = parse_string('{}');
    const fromValue = parse_value({});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(Object.keys(fromValue.properties!)).toHaveLength(0);
    expect(Object.keys(fromString.properties!)).toHaveLength(0);
  });

  test('equivalence: simple object', () => {
    const fromString = parse_string('{"name": "Alice", "age": 25}');
    const fromValue = parse_value({name: 'Alice', age: 25});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['name']!.basic_type).toBe(fromString.properties!['name']!.basic_type);
    expect(fromValue.properties!['name']!.value).toBe(fromString.properties!['name']!.value);
    expect(fromValue.properties!['age']!.basic_type).toBe(fromString.properties!['age']!.basic_type);
    expect(fromValue.properties!['age']!.value).toBe(fromString.properties!['age']!.value);
  });

  test('equivalence: object with multiple types', () => {
    const fromString = parse_string('{"str": "text", "num": 42, "bool": true, "nil": null}');
    const fromValue = parse_value({str: 'text', num: 42, bool: true, nil: null});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['str']!.value).toBe(fromString.properties!['str']!.value);
    expect(fromValue.properties!['num']!.value).toBe(fromString.properties!['num']!.value);
    expect(fromValue.properties!['bool']!.value).toBe(fromString.properties!['bool']!.value);
    expect(fromValue.properties!['nil']!.basic_type).toBe(fromString.properties!['nil']!.basic_type);
  });

  test('equivalence: nested object', () => {
    const fromString = parse_string('{"person": {"name": "Bob", "age": 30}}');
    const fromValue = parse_value({person: {name: 'Bob', age: 30}});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['person']!.basic_type).toBe(fromString.properties!['person']!.basic_type);
    expect(fromValue.properties!['person']!.properties!['name']!.value).toBe(
      fromString.properties!['person']!.properties!['name']!.value
    );
    expect(fromValue.properties!['person']!.properties!['age']!.value).toBe(
      fromString.properties!['person']!.properties!['age']!.value
    );
  });

  test('equivalence: nested arrays', () => {
    const fromString = parse_string('[[1, 2], [3, 4]]');
    const fromValue = parse_value([[1, 2], [3, 4]]);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(fromValue.elements![0]!.deep_type.isArray).toBe(fromString.elements![0]!.deep_type.isArray);
    expect(fromValue.elements![0]!.elements![0]!.value).toBe(fromString.elements![0]!.elements![0]!.value);
    expect(fromValue.elements![0]!.elements![1]!.value).toBe(fromString.elements![0]!.elements![1]!.value);
    expect(fromValue.elements![1]!.elements![0]!.value).toBe(fromString.elements![1]!.elements![0]!.value);
    expect(fromValue.elements![1]!.elements![1]!.value).toBe(fromString.elements![1]!.elements![1]!.value);
  });

  test('equivalence: array of objects', () => {
    const fromString = parse_string('[{"a": 1}, {"b": 2}]');
    const fromValue = parse_value([{a: 1}, {b: 2}]);

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.deep_type.isArray).toBe(fromString.deep_type.isArray);
    expect(fromValue.elements![0]!.properties!['a']!.value).toBe(fromString.elements![0]!.properties!['a']!.value);
    expect(fromValue.elements![1]!.properties!['b']!.value).toBe(fromString.elements![1]!.properties!['b']!.value);
  });

  test('equivalence: object with array property', () => {
    const fromString = parse_string('{"items": [1, 2, 3]}');
    const fromValue = parse_value({items: [1, 2, 3]});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['items']!.deep_type.isArray).toBe(fromString.properties!['items']!.deep_type.isArray);
    expect(fromValue.properties!['items']!.elements![0]!.value).toBe(fromString.properties!['items']!.elements![0]!.value);
    expect(fromValue.properties!['items']!.elements![1]!.value).toBe(fromString.properties!['items']!.elements![1]!.value);
    expect(fromValue.properties!['items']!.elements![2]!.value).toBe(fromString.properties!['items']!.elements![2]!.value);
  });

  test('equivalence: deeply nested structure', () => {
    const fromString = parse_string('{"a": {"b": {"c": {"d": "deep"}}}}');
    const fromValue = parse_value({a: {b: {c: {d: 'deep'}}}});

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(
      fromValue.properties!['a']!.properties!['b']!.properties!['c']!.properties!['d']!.value
    ).toBe(
      fromString.properties!['a']!.properties!['b']!.properties!['c']!.properties!['d']!.value
    );
  });

  test('equivalence: complex nested structure', () => {
    const fromString = parse_string('{"users": [{"name": "Alice", "scores": [95, 87, 92]}, {"name": "Bob", "scores": [88, 91, 85]}]}');
    const fromValue = parse_value({
      users: [
        {name: 'Alice', scores: [95, 87, 92]},
        {name: 'Bob', scores: [88, 91, 85]}
      ]
    });

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['users']!.deep_type.isArray).toBe(fromString.properties!['users']!.deep_type.isArray);

    // First user
    const valueUser0 = fromValue.properties!['users']!.elements![0]!;
    const stringUser0 = fromString.properties!['users']!.elements![0]!;
    expect(valueUser0.properties!['name']!.value).toBe(stringUser0.properties!['name']!.value);
    expect(valueUser0.properties!['scores']!.elements![0]!.value).toBe(stringUser0.properties!['scores']!.elements![0]!.value);
    expect(valueUser0.properties!['scores']!.elements![1]!.value).toBe(stringUser0.properties!['scores']!.elements![1]!.value);
    expect(valueUser0.properties!['scores']!.elements![2]!.value).toBe(stringUser0.properties!['scores']!.elements![2]!.value);

    // Second user
    const valueUser1 = fromValue.properties!['users']!.elements![1]!;
    const stringUser1 = fromString.properties!['users']!.elements![1]!;
    expect(valueUser1.properties!['name']!.value).toBe(stringUser1.properties!['name']!.value);
    expect(valueUser1.properties!['scores']!.elements![0]!.value).toBe(stringUser1.properties!['scores']!.elements![0]!.value);
    expect(valueUser1.properties!['scores']!.elements![1]!.value).toBe(stringUser1.properties!['scores']!.elements![1]!.value);
    expect(valueUser1.properties!['scores']!.elements![2]!.value).toBe(stringUser1.properties!['scores']!.elements![2]!.value);
  });

  test('equivalence: reference IDs are assigned consistently', () => {
    const fromString = parse_string('{"a": {}, "b": {}, "c": []}');
    const fromValue = parse_value({a: {}, b: {}, c: []});

    // Both should assign reference IDs to objects
    expect(fromValue.deep_type.referenceId).toBeDefined();
    expect(fromString.deep_type.referenceId).toBeDefined();
    expect(fromValue.properties!['a']!.deep_type.referenceId).toBeDefined();
    expect(fromString.properties!['a']!.deep_type.referenceId).toBeDefined();
    expect(fromValue.properties!['b']!.deep_type.referenceId).toBeDefined();
    expect(fromString.properties!['b']!.deep_type.referenceId).toBeDefined();
    expect(fromValue.properties!['c']!.deep_type.referenceId).toBeDefined();
    expect(fromString.properties!['c']!.deep_type.referenceId).toBeDefined();
  });

  test('equivalence: array constructor name', () => {
    const fromString = parse_string('[1, 2, 3]');
    const fromValue = parse_value([1, 2, 3]);

    expect(fromValue.deep_type.constructorName).toBe(fromString.deep_type.constructorName);
    expect(fromValue.deep_type.constructorName).toBe('Array');
  });

  test('equivalence: object constructor name', () => {
    const fromString = parse_string('{"key": "value"}');
    const fromValue = parse_value({key: 'value'});

    expect(fromValue.deep_type.constructorName).toBe(fromString.deep_type.constructorName);
    expect(fromValue.deep_type.constructorName).toBe('Object');
  });

  test('equivalence: mixed object with all JSON types', () => {
    const fromString = parse_string('{"string": "text", "number": 123, "float": 45.67, "true": true, "false": false, "null": null, "array": [1, 2], "object": {"nested": "value"}}');
    const fromValue = parse_value({
      string: 'text',
      number: 123,
      float: 45.67,
      true: true,
      false: false,
      null: null,
      array: [1, 2],
      object: {nested: 'value'}
    });

    expect(fromValue.basic_type).toBe(fromString.basic_type);
    expect(fromValue.properties!['string']!.value).toBe(fromString.properties!['string']!.value);
    expect(fromValue.properties!['number']!.value).toBe(fromString.properties!['number']!.value);
    expect(fromValue.properties!['float']!.value).toBe(fromString.properties!['float']!.value);
    expect(fromValue.properties!['true']!.value).toBe(fromString.properties!['true']!.value);
    expect(fromValue.properties!['false']!.value).toBe(fromString.properties!['false']!.value);
    expect(fromValue.properties!['null']!.basic_type).toBe(fromString.properties!['null']!.basic_type);
    expect(fromValue.properties!['array']!.deep_type.isArray).toBe(fromString.properties!['array']!.deep_type.isArray);
    expect(fromValue.properties!['object']!.properties!['nested']!.value).toBe(
      fromString.properties!['object']!.properties!['nested']!.value
    );
  });
});

describe('paint', () => {
  const options: HighlightOptions = {
    palette: palettes.default.light,
    containers: defaultContainers
  };

  describe('primitives', () => {
    test('should paint null', () => {
      const ast = parse_string('null');
      const result = paint(ast, options);
      expect(result).toContain('null');
    });

    test('should paint undefined', () => {
      const ast = parse_string('undefined');
      const result = paint(ast, options);
      expect(result).toContain('undefined');
    });

    test('should paint boolean true', () => {
      const ast = parse_string('true');
      const result = paint(ast, options);
      expect(result).toContain('true');
    });

    test('should paint boolean false', () => {
      const ast = parse_string('false');
      const result = paint(ast, options);
      expect(result).toContain('false');
    });

    test('should paint number', () => {
      const ast = parse_string('42');
      const result = paint(ast, options);
      expect(result).toContain('42');
    });

    test('should paint string', () => {
      const ast = parse_string('"hello"');
      const result = paint(ast, options);
      expect(result).toContain('hello');
      expect(result).toContain('"');
    });

    test('should paint symbol', () => {
      const sym = Symbol('test');
      const ast = parse_value(sym);
      const result = paint(ast, options);
      expect(result).toContain('Symbol');
      expect(result).toContain('test');
    });
  });

  describe('arrays', () => {
    test('should paint empty array', () => {
      const ast = parse_string('[]');
      const result = paint(ast, options);
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    test('should paint array with numbers', () => {
      const ast = parse_string('[1, 2, 3]');
      const result = paint(ast, options);
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain(',');
    });

    test('should paint array with mixed types', () => {
      const ast = parse_string('[1, "text", true]');
      const result = paint(ast, options);
      expect(result).toContain('1');
      expect(result).toContain('text');
      expect(result).toContain('true');
    });
  });

  describe('objects', () => {
    test('should paint empty object', () => {
      const ast = parse_string('{}');
      const result = paint(ast, options);
      expect(result).toContain('{');
      expect(result).toContain('}');
    });

    test('should paint simple object', () => {
      const ast = parse_string('{"name": "John"}');
      const result = paint(ast, options);
      expect(result).toContain('{');
      expect(result).toContain('}');
      expect(result).toContain('name');
      expect(result).toContain('John');
      expect(result).toContain(':');
    });

    test('should paint object with multiple properties', () => {
      const ast = parse_string('{"name": "Alice", "age": 25}');
      const result = paint(ast, options);
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('age');
      expect(result).toContain('25');
      expect(result).toContain(',');
    });

    test('should paint nested object', () => {
      const ast = parse_string('{"user": {"name": "Bob"}}');
      const result = paint(ast, options);
      expect(result).toContain('user');
      expect(result).toContain('name');
      expect(result).toContain('Bob');
    });
  });

  describe('special containers', () => {
    test('should paint Map', () => {
      const map = new Map([['key', 'value']]);
      const ast = parse_value(map);
      const result = paint(ast, options);
      expect(result).toContain('{<');
      expect(result).toContain('>}');
      // Note: Map entries are not enumerable, so the AST will be empty
    });

    test('should paint Set', () => {
      const set = new Set([1, 2, 3]);
      const ast = parse_value(set);
      const result = paint(ast, options);
      expect(result).toContain('{(');
      expect(result).toContain(')}');
    });

    test('should paint WeakMap', () => {
      const weakmap = new WeakMap();
      const ast = parse_value(weakmap);
      const result = paint(ast, options);
      expect(result).toContain('(<');
      expect(result).toContain('>)');
    });

    test('should paint WeakSet', () => {
      const weakset = new WeakSet();
      const ast = parse_value(weakset);
      const result = paint(ast, options);
      expect(result).toContain('((');
      expect(result).toContain('))');
    });

    test('should paint Date', () => {
      const date = new Date('2024-01-01');
      const ast = parse_value(date);
      const result = paint(ast, options);
      expect(result).toContain('Date(');
      expect(result).toContain(')');
    });

    test('should paint RegExp', () => {
      const regexp = /test/;
      const ast = parse_value(regexp);
      const result = paint(ast, options);
      expect(result).toContain('/');
    });

    test('should paint Error', () => {
      const error = new Error('test error');
      const ast = parse_value(error);
      const result = paint(ast, options);
      expect(result).toContain('Error(');
      expect(result).toContain(')');
    });

    test('should paint function', () => {
      const fn = () => {};
      const ast = parse_value(fn);
      const result = paint(ast, options);
      expect(result).toContain('function(');
      expect(result).toContain(')');
    });
  });

  describe('circular references', () => {
    test('should paint circular reference', () => {
      const circular: any = {a: 1};
      circular.self = circular;
      const ast = parse_value(circular);
      const result = paint(ast, options);
      expect(result).toContain('[Circular');
    });
  });

  describe('default options', () => {
    test('should work without options parameter', () => {
      const ast = parse_string('42');
      const result = paint(ast);
      expect(result).toContain('42');
    });

    test('should use defaults when options is undefined', () => {
      const ast = parse_string('{"key": "value"}');
      const result = paint(ast, undefined);
      expect(result).toContain('key');
      expect(result).toContain('value');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });

    test('should use defaults for missing palette', () => {
      const ast = parse_string('[1, 2]');
      const result = paint(ast, { containers: defaultContainers });
      expect(result).toContain('[');
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    test('should use defaults for missing containers', () => {
      const ast = parse_string('[1, 2]');
      const result = paint(ast, { palette: palettes.default.light });
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain(',');
    });

    test('should merge partial options with defaults', () => {
      const ast = parse_string('[1, 2]');
      const result = paint(ast, { palette: palettes.forest.light });
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('1');
      expect(result).toContain('2');
    });
  });

  describe('custom options', () => {
    test('should use custom palette', () => {
      const customOptions: HighlightOptions = {
        palette: palettes.forest.dark,
        containers: defaultContainers
      };
      const ast = parse_string('42');
      const result = paint(ast, customOptions);
      expect(result).toContain('42');
    });

    test('should use custom containers', () => {
      const customContainers: ContainerConfig = {
        array: {
          start: '<<',
          delimiter: '|',
          end: '>>'
        }
      };
      const customOptions: HighlightOptions = {
        palette: palettes.default.light,
        containers: customContainers
      };
      const ast = parse_string('[1, 2]');
      const result = paint(ast, customOptions);
      expect(result).toContain('<<');
      expect(result).toContain('>>');
      expect(result).toContain('|');
    });
  });

  describe('complex structures', () => {
    test('should paint nested array in object', () => {
      const ast = parse_string('{"items": [1, 2, 3]}');
      const result = paint(ast, options);
      expect(result).toContain('items');
      expect(result).toContain('[');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    test('should paint object with all types', () => {
      const ast = parse_string('{"str": "text", "num": 42, "bool": true, "nil": null}');
      const result = paint(ast, options);
      expect(result).toContain('str');
      expect(result).toContain('text');
      expect(result).toContain('num');
      expect(result).toContain('42');
      expect(result).toContain('bool');
      expect(result).toContain('true');
      expect(result).toContain('nil');
      expect(result).toContain('null');
    });
  });
});

describe('testdata', () => {
  test('should be defined and exported', () => {
    expect(testdata).toBeDefined();
    expect(typeof testdata).toBe('object');
  });

  describe('primitives', () => {
    test('should contain null', () => {
      expect(testdata.null).toBe(null);
    });

    test('should contain undefined', () => {
      expect(testdata.undefined).toBe(undefined);
    });

    test('should contain booleans', () => {
      expect(testdata.boolean_true).toBe(true);
      expect(testdata.boolean_false).toBe(false);
    });

    test('should contain various numbers', () => {
      expect(testdata.number_integer).toBe(42);
      expect(testdata.number_negative).toBe(-17);
      expect(testdata.number_float).toBe(3.14159);
      expect(testdata.number_scientific).toBe(1.23e10);
      expect(testdata.number_zero).toBe(0);
    });

    test('should contain strings', () => {
      expect(testdata.string).toBe('hello world');
      expect(testdata.string_empty).toBe('');
      expect(testdata.string_escaped).toBe('line1\nline2\ttab');
    });

    test('should contain symbols', () => {
      expect(typeof testdata.symbol_with_description).toBe('symbol');
      expect(testdata.symbol_with_description.description).toBe('test');
      expect(typeof testdata.symbol_without_description).toBe('symbol');
    });

    test('should contain function', () => {
      expect(typeof testdata.function).toBe('function');
    });
  });

  describe('simple containers with primitives', () => {
    test('array_all_primitives should contain all primitive types', () => {
      expect(Array.isArray(testdata.array_all_primitives)).toBe(true);
      expect(testdata.array_all_primitives).toContain(null);
      expect(testdata.array_all_primitives).toContain(undefined);
      expect(testdata.array_all_primitives).toContain(true);
      expect(testdata.array_all_primitives).toContain(false);
      expect(testdata.array_all_primitives).toContain(42);
    });

    test('array_with_holes should be a sparse array', () => {
      expect(Array.isArray(testdata.array_with_holes)).toBe(true);
      expect(testdata.array_with_holes.length).toBe(5);
      expect(testdata.array_with_holes[0]).toBe(1);
      expect(testdata.array_with_holes[2]).toBe(3);
      expect(testdata.array_with_holes[4]).toBe(5);
      // Holes at indices 1 and 3
      expect(1 in testdata.array_with_holes).toBe(false);
      expect(3 in testdata.array_with_holes).toBe(false);
    });

    test('object_all_primitives should contain all primitive types', () => {
      expect(testdata.object_all_primitives.null).toBe(null);
      expect(testdata.object_all_primitives.undefined).toBe(undefined);
      expect(testdata.object_all_primitives.boolean_true).toBe(true);
      expect(testdata.object_all_primitives.boolean_false).toBe(false);
      expect(testdata.object_all_primitives.number).toBe(123);
    });

    test('map_all_primitives should contain all primitive types', () => {
      expect(testdata.map_all_primitives instanceof Map).toBe(true);
      expect(testdata.map_all_primitives.get('null')).toBe(null);
      expect(testdata.map_all_primitives.get('undefined')).toBe(undefined);
      expect(testdata.map_all_primitives.get('boolean')).toBe(true);
      expect(testdata.map_all_primitives.get('number')).toBe(999);
    });

    test('set_all_primitives should contain primitive types', () => {
      expect(testdata.set_all_primitives instanceof Set).toBe(true);
      expect(testdata.set_all_primitives.has(null)).toBe(true);
      expect(testdata.set_all_primitives.has(undefined)).toBe(true);
      expect(testdata.set_all_primitives.has(true)).toBe(true);
      expect(testdata.set_all_primitives.has(42)).toBe(true);
    });
  });

  describe('special types', () => {
    test('should contain Date', () => {
      expect(testdata.date instanceof Date).toBe(true);
    });

    test('should contain RegExp instances', () => {
      expect(testdata.regexp_with_flags instanceof RegExp).toBe(true);
      expect(testdata.regexp_simple instanceof RegExp).toBe(true);
    });

    test('should contain Error', () => {
      expect(testdata.error instanceof Error).toBe(true);
      expect(testdata.error.message).toBe('test error message');
    });

    test('should contain WeakMap', () => {
      expect(testdata.weakmap instanceof WeakMap).toBe(true);
    });

    test('should contain WeakSet', () => {
      expect(testdata.weakset instanceof WeakSet).toBe(true);
    });
  });

  describe('nested containers', () => {
    test('array_all_containers should contain all container types', () => {
      expect(Array.isArray(testdata.array_all_containers)).toBe(true);
      expect(testdata.array_all_containers.length).toBe(7);
      expect(Array.isArray(testdata.array_all_containers[0])).toBe(true);
      expect(typeof testdata.array_all_containers[1]).toBe('object');
      expect(testdata.array_all_containers[2] instanceof Map).toBe(true);
      expect(testdata.array_all_containers[3] instanceof Set).toBe(true);
      expect(testdata.array_all_containers[4] instanceof Date).toBe(true);
      expect(testdata.array_all_containers[5] instanceof RegExp).toBe(true);
      expect(testdata.array_all_containers[6] instanceof Error).toBe(true);
    });

    test('object_all_containers should contain all container types', () => {
      expect(Array.isArray(testdata.object_all_containers.array)).toBe(true);
      expect(typeof testdata.object_all_containers.object).toBe('object');
      expect(testdata.object_all_containers.map instanceof Map).toBe(true);
      expect(testdata.object_all_containers.set instanceof Set).toBe(true);
      expect(testdata.object_all_containers.date instanceof Date).toBe(true);
      expect(testdata.object_all_containers.regexp instanceof RegExp).toBe(true);
      expect(testdata.object_all_containers.error instanceof Error).toBe(true);
    });

    test('map_all_containers should contain all container types', () => {
      expect(testdata.map_all_containers instanceof Map).toBe(true);
      expect(Array.isArray(testdata.map_all_containers.get('array'))).toBe(true);
      expect(typeof testdata.map_all_containers.get('object')).toBe('object');
      expect(testdata.map_all_containers.get('map') instanceof Map).toBe(true);
      expect(testdata.map_all_containers.get('set') instanceof Set).toBe(true);
      expect(testdata.map_all_containers.get('date') instanceof Date).toBe(true);
      expect(testdata.map_all_containers.get('regexp') instanceof RegExp).toBe(true);
      expect(testdata.map_all_containers.get('error') instanceof Error).toBe(true);
    });

    test('set_all_containers should contain all container types', () => {
      expect(testdata.set_all_containers instanceof Set).toBe(true);
      expect(testdata.set_all_containers.size).toBe(7);
      // Verify each type exists (Sets don't have indexed access)
      const setArray = Array.from(testdata.set_all_containers);
      expect(setArray.some(item => Array.isArray(item))).toBe(true);
      expect(setArray.some(item => item instanceof Map)).toBe(true);
      expect(setArray.some(item => item instanceof Set)).toBe(true);
      expect(setArray.some(item => item instanceof Date)).toBe(true);
      expect(setArray.some(item => item instanceof RegExp)).toBe(true);
      expect(setArray.some(item => item instanceof Error)).toBe(true);
    });
  });

  describe('circular reference', () => {
    test('circular should contain self-reference', () => {
      expect(testdata.circular).toBeDefined();
      expect(testdata.circular.name).toBe('circular');
      expect(testdata.circular.value).toBe(123);
      expect(testdata.circular.self).toBe(testdata.circular);
    });
  });

  describe('deeply nested', () => {
    test('should have deeply nested structure', () => {
      expect(testdata.deeply_nested.level1).toBeDefined();
      expect(testdata.deeply_nested.level1.level2).toBeDefined();
      expect(testdata.deeply_nested.level1.level2.level3).toBeDefined();
      expect(Array.isArray(testdata.deeply_nested.level1.level2.level3.array)).toBe(true);
      expect(testdata.deeply_nested.level1.level2.level3.map instanceof Map).toBe(true);
    });
  });

  describe('parsing testdata', () => {
    test('should be able to parse testdata with parse_value', () => {
      const ast = parse_value(testdata);
      expect(ast).toBeDefined();
      expect(ast.basic_type).toBe('object');
      expect(ast.properties).toBeDefined();
    });

    test('should detect circular reference in testdata.circular', () => {
      const ast = parse_value(testdata.circular);
      expect(ast.properties!['self']!.deep_type.isCircularReference).toBe(true);
    });

    test('should be able to paint testdata', () => {
      const ast = parse_value(testdata.array_all_primitives);
      const result = paint(ast);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
