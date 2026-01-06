import { Chalk } from 'chalk';
// Create a chalk instance with forced color support (level 3 = 16m colors)
const chalkInstance = new Chalk({ level: 3 });
/**
 * Default color palette with modern pastel colors
 */
export const defaultPalette = {
    null: '#B8C5D0',
    undefined: '#D0C5E3',
    boolean: '#A8D8EA',
    number: '#FFB5A7',
    string: '#C1E1C1',
    symbol: '#E0BBE4',
    function: '#FFF4A3',
    object: '#FFD7BE',
    array: '#BEE1E6',
    map: '#FFD1DC',
    set: '#D4F1F4',
    weakmap: '#F4C2C2',
    weakset: '#C5FAD5',
    date: '#FFCBA4',
    regexp: '#E8D5E8',
    error: '#FFABAB',
    circularReference: '#FFE5B4',
    propertyKey: '#C9E4E7',
    punctuation: '#A0A0A0'
};
/**
 * Forest color palette with earth tones and natural greens
 */
export const forestPalette = {
    null: '#4A5859',
    undefined: '#5C4742',
    boolean: '#2C5F6F',
    number: '#C76D3F',
    string: '#5F7A61',
    symbol: '#6B4E71',
    function: '#6B6F3A',
    object: '#7B5E47',
    array: '#3D5941',
    map: '#3B6064',
    set: '#7A8A6E',
    weakmap: '#8B5E5E',
    weakset: '#4F7C6B',
    date: '#A67C52',
    regexp: '#7D5A6A',
    error: '#A13D3D',
    circularReference: '#9E6240',
    propertyKey: '#547C82',
    punctuation: '#6B6F6B'
};
/**
 * Bold color palette with vibrant, saturated colors
 */
export const boldPalette = {
    null: '#8B8B8B',
    undefined: '#9B59B6',
    boolean: '#3498DB',
    number: '#FF6B35',
    string: '#2ECC71',
    symbol: '#E91E63',
    function: '#F39C12',
    object: '#FF5733',
    array: '#00BCD4',
    map: '#FF1493',
    set: '#00FFFF',
    weakmap: '#DC143C',
    weakset: '#00FA9A',
    date: '#FF8C00',
    regexp: '#8B00FF',
    error: '#FF0000',
    circularReference: '#FFD700',
    propertyKey: '#1E90FF',
    punctuation: '#404040'
};
/**
 * Dusk color palette with dark colors near black
 */
export const duskPalette = {
    null: '#2C2C2C',
    undefined: '#2B1B2B',
    boolean: '#1A2332',
    number: '#3D2520',
    string: '#1F2B1F',
    symbol: '#2F2536',
    function: '#33301A',
    object: '#342820',
    array: '#1E2C2E',
    map: '#3A2228',
    set: '#1F3032',
    weakmap: '#332424',
    weakset: '#20302A',
    date: '#342A1C',
    regexp: '#2D2530',
    error: '#3D1F1F',
    circularReference: '#3D3420',
    propertyKey: '#232D30',
    punctuation: '#1A1A1A'
};
/**
 * Default container configuration
 */
export const defaultContainers = {
    array: {
        start: '[',
        delimiter: ',',
        end: ']'
    },
    object: {
        start: '{',
        separator: ':',
        delimiter: ',',
        end: '}'
    },
    map: {
        start: '{<',
        separator: ':',
        delimiter: ',',
        end: '>}'
    },
    set: {
        start: '{(',
        delimiter: ',',
        end: ')}'
    },
    weakmap: {
        start: '(<',
        separator: ':',
        delimiter: ',',
        end: '>)'
    },
    weakset: {
        start: '((',
        delimiter: ',',
        end: '))'
    },
    date: {
        start: 'Date(',
        end: ')'
    },
    regexp: {
        start: '/',
        end: '/'
    },
    error: {
        start: 'Error(',
        end: ')'
    },
    function: {
        start: 'function(',
        end: ')'
    }
};
/**
 * Comprehensive test data containing all AST node types
 * Each container includes members of every non-container type
 * Top-level containers include all other container types
 */
export const testdata = {
    // Primitive types
    null: null,
    undefined: undefined,
    boolean_true: true,
    boolean_false: false,
    number_integer: 42,
    number_negative: -17,
    number_float: 3.14159,
    number_scientific: 1.23e10,
    number_zero: 0,
    string: "hello world",
    string_empty: "",
    string_escaped: "line1\nline2\ttab",
    symbol_with_description: Symbol('test'),
    symbol_without_description: Symbol(),
    function: function testFunc() { return 42; },
    // Simple array with all non-container types
    array_all_primitives: [
        null,
        undefined,
        true,
        false,
        42,
        -17,
        3.14,
        "string",
        Symbol('array-symbol')
    ],
    // Array with holes (sparse array)
    array_with_holes: (() => {
        const arr = [1, 2, 3, 4, 5];
        delete arr[1];
        delete arr[3];
        return arr; // [1, empty, 3, empty, 5]
    })(),
    // Object with all non-container types
    object_all_primitives: {
        null: null,
        undefined: undefined,
        boolean_true: true,
        boolean_false: false,
        number: 123,
        negative: -456,
        float: 7.89,
        string: "object value",
        symbol: Symbol('object-symbol')
    },
    // Map with all non-container types
    map_all_primitives: new Map([
        ['null', null],
        ['undefined', undefined],
        ['boolean', true],
        ['number', 999],
        ['string', 'map value'],
        ['symbol', Symbol('map-symbol')]
    ]),
    // Set with all non-container types
    set_all_primitives: new Set([
        null,
        undefined,
        true,
        false,
        42,
        "set string"
    ]),
    // Date
    date: new Date('2024-01-01T00:00:00.000Z'),
    // RegExp
    regexp_with_flags: /pattern/gi,
    regexp_simple: /test/,
    // Error
    error: new Error('test error message'),
    // WeakMap (can only have object keys)
    weakmap: (() => {
        const wm = new WeakMap();
        const key1 = {};
        const key2 = {};
        wm.set(key1, 'value1');
        wm.set(key2, 'value2');
        return wm;
    })(),
    // WeakSet (can only have object values)
    weakset: (() => {
        const ws = new WeakSet();
        const obj1 = {};
        const obj2 = {};
        ws.add(obj1);
        ws.add(obj2);
        return ws;
    })(),
    // Array containing all container types (nested containers)
    array_all_containers: [
        // Array
        [1, 2, 3],
        // Object
        { a: 1, b: 2, c: 3 },
        // Map
        new Map([['key1', 'value1'], ['key2', 'value2']]),
        // Set
        new Set([10, 20, 30]),
        // Date
        new Date('2024-06-15'),
        // RegExp
        /nested/i,
        // Error
        new Error('nested in array')
    ],
    // Object containing all container types
    object_all_containers: {
        array: [100, 200, 300],
        object: { x: 1, y: 2, z: 3 },
        map: new Map([['m1', 'v1'], ['m2', 'v2']]),
        set: new Set(['a', 'b', 'c']),
        date: new Date('2024-12-25'),
        regexp: /object-nested/g,
        error: new Error('nested in object')
    },
    // Map containing all container types
    map_all_containers: new Map([
        ['array', [7, 8, 9]],
        ['object', { p: 1, q: 2 }],
        ['map', new Map([['inner-key', 'inner-value']])],
        ['set', new Set([true, false])],
        ['date', new Date('2024-03-14')],
        ['regexp', /map-nested/],
        ['error', new Error('nested in map')]
    ]),
    // Set containing all container types
    set_all_containers: new Set([
        // Array
        [11, 12, 13],
        // Object
        { name: 'set-obj', value: 42 },
        // Map
        new Map([['set-map-key', 'set-map-value']]),
        // Set (nested set)
        new Set([1, 2]),
        // Date
        new Date('2024-07-04'),
        // RegExp
        /set-nested/,
        // Error
        new Error('nested in set')
    ]),
    // Deeply nested structure
    deeply_nested: {
        level1: {
            level2: {
                level3: {
                    array: [1, 2, [3, 4, [5, 6]]],
                    map: new Map([
                        ['key', { nested: 'value' }]
                    ])
                }
            }
        }
    },
    // Circular reference example (will be detected by parse_value)
    circular: (() => {
        const obj = {
            name: 'circular',
            value: 123
        };
        obj.self = obj;
        return obj;
    })()
};
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
export function highlight(json, _options) {
    return json;
}
/**
 * Default highlight options
 */
export const defaultHighlightOptions = {
    palette: defaultPalette,
    containers: defaultContainers
};
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
export function paint(node, options) {
    // Merge provided options with defaults
    const palette = options?.palette ?? defaultHighlightOptions.palette;
    const containers = options?.containers ?? defaultHighlightOptions.containers;
    // Handle null
    if (node.value === null) {
        return chalkInstance.hex(palette.null)('null');
    }
    // Handle primitives
    if (node.basic_type === 'undefined') {
        return chalkInstance.hex(palette.undefined)('undefined');
    }
    if (node.basic_type === 'boolean') {
        return chalkInstance.hex(palette.boolean)(String(node.value));
    }
    if (node.basic_type === 'number') {
        return chalkInstance.hex(palette.number)(String(node.value));
    }
    if (node.basic_type === 'string') {
        return chalkInstance.hex(palette.string)('"' + String(node.value) + '"');
    }
    if (node.basic_type === 'symbol') {
        const desc = node.deep_type.description !== undefined ? `(${node.deep_type.description})` : '';
        return chalkInstance.hex(palette.symbol)(`Symbol${desc}`);
    }
    if (node.basic_type === 'function') {
        const config = containers.function ?? defaultContainers.function;
        const start = config.start ?? 'function(';
        const end = config.end ?? ')';
        return chalkInstance.hex(palette.function)(start + end);
    }
    // Handle circular references
    if (node.deep_type.isCircularReference) {
        const refId = node.deep_type.referenceId !== undefined ? `#${node.deep_type.referenceId}` : '';
        return chalkInstance.hex(palette.circularReference)(`[Circular${refId}]`);
    }
    // Handle containers
    if (node.basic_type === 'object') {
        // Handle arrays
        if (node.deep_type.isArray && node.elements) {
            const config = containers.array ?? defaultContainers.array;
            const start = config.start ?? '[';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? ']';
            const elements = node.elements.map(el => paint(el, options));
            const joined = elements.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.array)(start) + joined + chalkInstance.hex(palette.array)(end);
        }
        // Handle Maps
        if (node.deep_type.isMap && node.properties) {
            const config = containers.map ?? defaultContainers.map;
            const start = config.start ?? '{<';
            const separator = config.separator ?? ':';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? '>}';
            const entries = Object.entries(node.properties).map(([key, val]) => {
                const paintedKey = chalkInstance.hex(palette.propertyKey)(key);
                const paintedSep = chalkInstance.hex(palette.punctuation)(separator);
                const paintedVal = paint(val, options);
                return paintedKey + paintedSep + ' ' + paintedVal;
            });
            const joined = entries.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.map)(start) + joined + chalkInstance.hex(palette.map)(end);
        }
        // Handle Sets
        if (node.deep_type.isSet && node.properties) {
            const config = containers.set ?? defaultContainers.set;
            const start = config.start ?? '{(';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? ')}';
            const values = Object.values(node.properties).map(val => paint(val, options));
            const joined = values.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.set)(start) + joined + chalkInstance.hex(palette.set)(end);
        }
        // Handle WeakMaps
        if (node.deep_type.isWeakMap) {
            const config = containers.weakmap ?? defaultContainers.weakmap;
            const start = config.start ?? '(<';
            const end = config.end ?? '>)';
            return chalkInstance.hex(palette.weakmap)(start + end);
        }
        // Handle WeakSets
        if (node.deep_type.isWeakSet) {
            const config = containers.weakset ?? defaultContainers.weakset;
            const start = config.start ?? '((';
            const end = config.end ?? '))';
            return chalkInstance.hex(palette.weakset)(start + end);
        }
        // Handle Dates
        if (node.deep_type.isDate) {
            const config = containers.date ?? defaultContainers.date;
            const start = config.start ?? 'Date(';
            const end = config.end ?? ')';
            return chalkInstance.hex(palette.date)(start + String(node.value) + end);
        }
        // Handle RegExp
        if (node.deep_type.isRegExp) {
            const config = containers.regexp ?? defaultContainers.regexp;
            const start = config.start ?? '/';
            const end = config.end ?? '/';
            return chalkInstance.hex(palette.regexp)(start + String(node.value) + end);
        }
        // Handle Errors
        if (node.deep_type.isError) {
            const config = containers.error ?? defaultContainers.error;
            const start = config.start ?? 'Error(';
            const end = config.end ?? ')';
            return chalkInstance.hex(palette.error)(start + String(node.value) + end);
        }
        // Handle regular objects
        if (node.properties) {
            const config = containers.object ?? defaultContainers.object;
            const start = config.start ?? '{';
            const separator = config.separator ?? ':';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? '}';
            const entries = Object.entries(node.properties).map(([key, val]) => {
                const paintedKey = chalkInstance.hex(palette.propertyKey)(key);
                const paintedSep = chalkInstance.hex(palette.punctuation)(separator);
                const paintedVal = paint(val, options);
                return paintedKey + paintedSep + ' ' + paintedVal;
            });
            const joined = entries.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.object)(start) + joined + chalkInstance.hex(palette.object)(end);
        }
    }
    // Fallback
    return String(node.value);
}
/**
 * Tokenizer for JSON/JavaScript values
 */
class Tokenizer {
    input;
    position;
    constructor(input) {
        this.input = input;
        this.position = 0;
    }
    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }
    peek() {
        return this.input[this.position];
    }
    consume() {
        const char = this.input[this.position];
        this.position++;
        return char;
    }
    consumeString() {
        const quote = this.consume(); // consume opening quote
        let result = '';
        while (this.position < this.input.length) {
            const char = this.peek();
            if (char === '\\') {
                this.consume(); // consume backslash
                const escaped = this.consume();
                // Handle escape sequences
                switch (escaped) {
                    case 'n':
                        result += '\n';
                        break;
                    case 't':
                        result += '\t';
                        break;
                    case 'r':
                        result += '\r';
                        break;
                    case '\\':
                        result += '\\';
                        break;
                    case '"':
                        result += '"';
                        break;
                    case "'":
                        result += "'";
                        break;
                    default: result += escaped;
                }
            }
            else if (char === quote) {
                this.consume(); // consume closing quote
                break;
            }
            else {
                result += this.consume();
            }
        }
        return result;
    }
    consumeNumber() {
        let numStr = '';
        if (this.peek() === '-') {
            numStr += this.consume();
        }
        while (this.position < this.input.length && /[0-9.]/.test(this.peek())) {
            numStr += this.consume();
        }
        // Handle scientific notation
        if (this.peek() === 'e' || this.peek() === 'E') {
            numStr += this.consume();
            if (this.peek() === '+' || this.peek() === '-') {
                numStr += this.consume();
            }
            while (this.position < this.input.length && /[0-9]/.test(this.peek())) {
                numStr += this.consume();
            }
        }
        return parseFloat(numStr);
    }
    consumeIdentifier() {
        let result = '';
        while (this.position < this.input.length && /[a-zA-Z_]/.test(this.peek())) {
            result += this.consume();
        }
        return result;
    }
    parseValue() {
        this.skipWhitespace();
        const char = this.peek();
        if (char === undefined) {
            return undefined;
        }
        // String
        if (char === '"' || char === "'") {
            return this.consumeString();
        }
        // Number
        if (char === '-' || /[0-9]/.test(char)) {
            return this.consumeNumber();
        }
        // Object
        if (char === '{') {
            return this.parseObject();
        }
        // Array
        if (char === '[') {
            return this.parseArray();
        }
        // Keywords
        const identifier = this.consumeIdentifier();
        if (identifier === 'null') {
            return null;
        }
        if (identifier === 'undefined') {
            return undefined;
        }
        if (identifier === 'true') {
            return true;
        }
        if (identifier === 'false') {
            return false;
        }
        throw new Error(`Unexpected token: ${identifier}`);
    }
    parseObject() {
        const obj = {};
        this.consume(); // consume '{'
        this.skipWhitespace();
        while (this.peek() !== '}') {
            this.skipWhitespace();
            // Parse key
            let key;
            if (this.peek() === '"' || this.peek() === "'") {
                key = this.consumeString();
            }
            else {
                key = this.consumeIdentifier();
            }
            this.skipWhitespace();
            // Consume ':'
            if (this.peek() === ':') {
                this.consume();
            }
            this.skipWhitespace();
            // Parse value
            const value = this.parseValue();
            obj[key] = value;
            this.skipWhitespace();
            // Check for comma
            if (this.peek() === ',') {
                this.consume();
            }
            this.skipWhitespace();
        }
        this.consume(); // consume '}'
        return obj;
    }
    parseArray() {
        const arr = [];
        this.consume(); // consume '['
        this.skipWhitespace();
        while (this.peek() !== ']') {
            this.skipWhitespace();
            const value = this.parseValue();
            arr.push(value);
            this.skipWhitespace();
            // Check for comma
            if (this.peek() === ',') {
                this.consume();
            }
            this.skipWhitespace();
        }
        this.consume(); // consume ']'
        return arr;
    }
}
/**
 * Creates an AST builder with cycle detection
 */
function createASTBuilder() {
    // Track objects to detect cycles
    const objectMap = new WeakMap();
    let referenceCounter = 0;
    function buildAST(val) {
        const basicType = typeof val;
        const deepType = {};
        // Handle null specially
        if (val === null) {
            return {
                basic_type: 'object',
                deep_type: { constructorName: 'null' },
                value: null
            };
        }
        // Handle primitives
        if (basicType === 'string' || basicType === 'number' || basicType === 'boolean' || basicType === 'undefined') {
            return {
                basic_type: basicType,
                deep_type: {},
                value: val
            };
        }
        // Handle symbols
        if (basicType === 'symbol') {
            const symbolDesc = val.description;
            if (symbolDesc !== undefined) {
                deepType.description = symbolDesc;
            }
            return {
                basic_type: basicType,
                deep_type: deepType,
                value: val
            };
        }
        // Handle objects (including arrays, dates, etc.)
        if (basicType === 'object' && val !== null) {
            // Check for circular reference
            if (objectMap.has(val)) {
                const existingRefId = objectMap.get(val);
                const circularDeepType = { isCircularReference: true };
                if (existingRefId !== undefined) {
                    circularDeepType.referenceId = existingRefId;
                }
                return {
                    basic_type: basicType,
                    deep_type: circularDeepType
                };
            }
            // Assign reference ID
            const refId = referenceCounter++;
            objectMap.set(val, refId);
            deepType.referenceId = refId;
            // Determine specific object type
            if (Array.isArray(val)) {
                deepType.isArray = true;
                deepType.constructorName = 'Array';
                return {
                    basic_type: basicType,
                    deep_type: deepType,
                    elements: val.map(buildAST)
                };
            }
            // Check for other built-in types
            const constructor = val.constructor;
            if (constructor) {
                deepType.constructorName = constructor.name;
                if (constructor.name === 'WeakMap')
                    deepType.isWeakMap = true;
                if (constructor.name === 'WeakSet')
                    deepType.isWeakSet = true;
                if (constructor.name === 'Map')
                    deepType.isMap = true;
                if (constructor.name === 'Set')
                    deepType.isSet = true;
                if (constructor.name === 'Date')
                    deepType.isDate = true;
                if (constructor.name === 'RegExp')
                    deepType.isRegExp = true;
                if (constructor.name === 'Error' || val instanceof Error)
                    deepType.isError = true;
            }
            // Parse object properties
            const properties = {};
            for (const key in val) {
                if (Object.prototype.hasOwnProperty.call(val, key)) {
                    properties[key] = buildAST(val[key]);
                }
            }
            return {
                basic_type: basicType,
                deep_type: deepType,
                properties
            };
        }
        // Fallback for functions and other types
        return {
            basic_type: basicType,
            deep_type: {},
            value: val
        };
    }
    return buildAST;
}
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
export function parse_string(input) {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    const tokenizer = new Tokenizer(input);
    const value = tokenizer.parseValue();
    const buildAST = createASTBuilder();
    return buildAST(value);
}
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
export function parse_value(input) {
    const buildAST = createASTBuilder();
    return buildAST(input);
}
//# sourceMappingURL=index.js.map