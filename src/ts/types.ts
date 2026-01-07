/**
 * Type definitions for Kyrie syntax highlighter
 */

/**
 * Deep type information for parsed values
 */
export interface DeepType {
  constructorName?: string;
  description?: string;
  isArray?: boolean;
  isWeakMap?: boolean;
  isWeakSet?: boolean;
  isMap?: boolean;
  isSet?: boolean;
  isDate?: boolean;
  isRegExp?: boolean;
  isError?: boolean;
  referenceId?: number;
  isCircularReference?: boolean;
}

/**
 * Abstract Syntax Tree node for parsed values
 */
export interface ASTNode {
  basic_type: string;
  deep_type: DeepType;
  value?: unknown;
  properties?: Record<string, ASTNode>;
  elements?: ASTNode[];
}

/**
 * Container delimiters for different AST node types
 */
export interface ContainerDelimiters {
  start?: string;
  separator?: string;
  delimiter?: string;
  end?: string;
}

/**
 * Container configuration for different node types
 */
export interface ContainerConfig {
  array?: ContainerDelimiters;
  object?: ContainerDelimiters;
  map?: ContainerDelimiters;
  set?: ContainerDelimiters;
  weakmap?: ContainerDelimiters;
  weakset?: ContainerDelimiters;
  date?: ContainerDelimiters;
  regexp?: ContainerDelimiters;
  error?: ContainerDelimiters;
  function?: ContainerDelimiters;
}

/**
 * Color palette for syntax highlighting
 * Maps AST node types to hex color codes
 */
export interface ColorPalette {
  text: string;
  null: string;
  undefined: string;
  boolean: string;
  number: string;
  string: string;
  symbol: string;
  function: string;
  object: string;
  array: string;
  map: string;
  set: string;
  weakmap: string;
  weakset: string;
  date: string;
  regexp: string;
  error: string;
  circularReference: string;
  propertyKey: string;
  punctuation: string;
}

/**
 * Output mode for syntax highlighting
 * - ansi: ANSI escape codes for terminal output (default)
 * - html: HTML with inline styles
 * - chrome-console: Chrome DevTools console formatting
 * - logger: Logging-friendly format
 */
export type OutputMode = 'ansi' | 'html' | 'chrome-console' | 'logger';

/**
 * Line unfolding mode for output formatting
 * - oneliner: All content on a single line
 * - expanded: Full indentation and spacing
 */
export type LineUnfolding = 'oneliner' | 'expanded';

/**
 * Options for JSON highlighting
 */
export interface Options {
  palette?: ColorPalette;
  containers?: ContainerConfig;
  maxWidth?: number | false | undefined;
  outputMode?: OutputMode;
  lineUnfolding?: LineUnfolding;
  indent?: number | string;
}

/**
 * Paint policy for different output formats
 * Defines how to wrap content with colors and handle newlines
 */
export interface PaintPolicy {
  wrap: (color: string, content: string) => string;
  newline: string;
}

/**
 * Paint function signature
 * Takes an AST node and optional highlighting options, returns a painted string
 */
export type PaintFunction = (node: ASTNode, options?: Options) => string;
