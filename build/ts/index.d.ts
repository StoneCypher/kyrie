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
    maxWidth?: number | false | undefined;
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
import { palettes } from './palettes.js';
import { colorRangePalettes } from './color_range_palettes.js';
import { protanopiaPalettes } from './protanopia_palettes.js';
import { deuteranopiaPalettes } from './deuteranopia_palettes.js';
import { tritanopiaPalettes } from './tritanopia_palettes.js';
import { monochromacyPalettes } from './monochromacy_palettes.js';
import { deuteranomalyPalettes } from './deuteranomaly_palettes.js';
import { protanomalyPalettes } from './protanomaly_palettes.js';
import { tritanomalyPalettes } from './tritanomaly_palettes.js';
import { achromatopsiaPalettes } from './achromatopsia_palettes.js';
export { palettes, colorRangePalettes, protanopiaPalettes, deuteranopiaPalettes, tritanopiaPalettes, monochromacyPalettes, deuteranomalyPalettes, protanomalyPalettes, tritanomalyPalettes, achromatopsiaPalettes };
/**
 * Default container configuration
 */
export declare const defaultContainers: ContainerConfig;
/**
 * Comprehensive test data containing all AST node types
 * Each container includes members of every non-container type
 * Top-level containers include all other container types
 */
export declare const testdata: {
    null: null;
    undefined: undefined;
    boolean_true: boolean;
    boolean_false: boolean;
    number_integer: number;
    number_negative: number;
    number_float: number;
    number_scientific: number;
    number_zero: number;
    string: string;
    string_empty: string;
    string_escaped: string;
    symbol_with_description: symbol;
    symbol_without_description: symbol;
    function: () => number;
    array_all_primitives: unknown[];
    array_with_holes: number[];
    object_all_primitives: {
        null: null;
        undefined: undefined;
        boolean_true: boolean;
        boolean_false: boolean;
        number: number;
        negative: number;
        float: number;
        string: string;
        symbol: symbol;
    };
    map_all_primitives: Map<string, unknown>;
    set_all_primitives: Set<unknown>;
    date: Date;
    regexp_with_flags: RegExp;
    regexp_simple: RegExp;
    error: Error;
    weakmap: WeakMap<WeakKey, any>;
    weakset: WeakSet<WeakKey>;
    array_all_containers: unknown[];
    object_all_containers: {
        array: number[];
        object: {
            x: number;
            y: number;
            z: number;
        };
        map: Map<string, string>;
        set: Set<string>;
        date: Date;
        regexp: RegExp;
        error: Error;
    };
    map_all_containers: Map<string, unknown>;
    set_all_containers: Set<unknown>;
    deeply_nested: {
        level1: {
            level2: {
                level3: {
                    array: (number | (number | number[])[])[];
                    map: Map<string, {
                        nested: string;
                    }>;
                };
            };
        };
    };
    circular: any;
};
/**
 * Highlights a JavaScript value with colors
 *
 * @param {unknown} value - The value to highlight
 * @param {HighlightOptions} [options] - Optional configuration for highlighting
 * @returns {string} The highlighted string with ANSI color codes
 *
 * @example
 * ```typescript
 * const obj = {name: "John", age: 30};
 * const highlighted = highlight_value(obj);
 * console.log(highlighted); // Outputs colorized representation
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * const highlighted = highlight_value(arr, { palette: forestPalette });
 * console.log(highlighted);
 * ```
 */
export declare function highlight_value(value: unknown, options?: HighlightOptions): string;
/**
 * Highlights a JSON or JavaScript string with colors
 *
 * @param {string} str - The string to highlight (JSON or JavaScript literal)
 * @param {HighlightOptions} [options] - Optional configuration for highlighting
 * @returns {string} The highlighted string with ANSI color codes
 *
 * @example
 * ```typescript
 * const json = '{"name": "John", "age": 30}';
 * const highlighted = highlight_string(json);
 * console.log(highlighted); // Outputs colorized representation
 * ```
 *
 * @example
 * ```typescript
 * const arr = '[1, 2, 3, "hello", true]';
 * const highlighted = highlight_string(arr, { palette: boldPalette });
 * console.log(highlighted);
 * ```
 */
export declare function highlight_string(str: string, options?: HighlightOptions): string;
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