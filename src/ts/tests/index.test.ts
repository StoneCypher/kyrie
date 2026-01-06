import { highlight, type HighlightOptions } from '../index.ts';

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
