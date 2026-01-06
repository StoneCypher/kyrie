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
 * Options for JSON highlighting
 */
export interface HighlightOptions {
    palette?: ColorPalette;
    containers?: ContainerConfig;
}
/**
 * Color palette for syntax highlighting
 * Maps AST node types to hex color codes
 */
export interface ColorPalette {
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
 * Default color palette with modern pastel colors
 */
export declare const defaultPalette: ColorPalette;
/**
 * Forest color palette with earth tones and natural greens
 */
export declare const forestPalette: ColorPalette;
/**
 * Bold color palette with vibrant, saturated colors
 */
export declare const boldPalette: ColorPalette;
/**
 * Dusk color palette with dark colors near black
 */
export declare const duskPalette: ColorPalette;
/**
 * Default container configuration
 */
export declare const defaultContainers: ContainerConfig;
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
export declare function highlight(json: string, _options?: HighlightOptions): string;
/**
 * Default highlight options
 */
export declare const defaultHighlightOptions: HighlightOptions;
/**
 * Paints an AST node with colors and formatting
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {HighlightOptions} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint(ast); // Uses defaults
 * console.log(painted);
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { palette: forestPalette }; // containers will use default
 * const painted = paint(ast, options);
 * console.log(painted);
 * ```
 */
export declare function paint(node: ASTNode, options?: HighlightOptions): string;
/**
 * Parses a JavaScript or JSON value string into an Abstract Syntax Tree
 *
 * @param {unknown} input - The string to parse (should be a string)
 * @returns {ASTNode} The AST representation of the parsed value
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John", "age": 30}');
 * console.log(ast.basic_type); // "object"
 * console.log(ast.deep_type.isArray); // false
 * ```
 */
export declare function parse_string(input: unknown): ASTNode;
/**
 * Parses a JavaScript or JSON value into an Abstract Syntax Tree
 *
 * @param {unknown} input - The value to parse
 * @returns {ASTNode} The AST representation of the parsed value
 *
 * @example
 * ```typescript
 * const obj = {name: "John", age: 30};
 * const ast = parse_value(obj);
 * console.log(ast.basic_type); // "object"
 * console.log(ast.properties.name.value); // "John"
 * ```
 */
export declare function parse_value(input: unknown): ASTNode;
//# sourceMappingURL=index.d.ts.map