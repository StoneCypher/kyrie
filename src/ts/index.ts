/**
 * Options for JSON highlighting
 */
export interface HighlightOptions {
  // Options will be defined as features are added
}

/**
 * Highlights JSON string with color codes
 *
 * @param {string} json - The JSON string to highlight
 * @param {HighlightOptions} [options] - Optional configuration for highlighting
 * @returns {string} The highlighted JSON string
 *
 * @example
 * ```typescript
 * const json = '{"name": "John", "age": 30}';
 * const highlighted = highlight(json);
 * console.log(highlighted);
 * ```
 */
export function highlight(json: string, _options?: HighlightOptions): string {
  return json;
}
