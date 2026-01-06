import { Chalk } from 'chalk';

// Create a chalk instance with forced color support (level 3 = 16m colors)
const chalkInstance = new Chalk({ level: 3 });

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
export const defaultPalette: ColorPalette = {
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
export const forestPalette: ColorPalette = {
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
export const boldPalette: ColorPalette = {
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
export const duskPalette: ColorPalette = {
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
export const defaultContainers: ContainerConfig = {
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

/**
 * Default highlight options
 */
export const defaultHighlightOptions: HighlightOptions = {
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
export function paint(node: ASTNode, options?: HighlightOptions): string {
  // Merge provided options with defaults
  const palette = options?.palette ?? defaultHighlightOptions.palette!;
  const containers = options?.containers ?? defaultHighlightOptions.containers!;

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
    const config = containers.function ?? defaultContainers.function!;
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
      const config = containers.array ?? defaultContainers.array!;
      const start = config.start ?? '[';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? ']';

      const elements = node.elements.map(el => paint(el, options));
      const joined = elements.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');

      return chalkInstance.hex(palette.array)(start) + joined + chalkInstance.hex(palette.array)(end);
    }

    // Handle Maps
    if (node.deep_type.isMap && node.properties) {
      const config = containers.map ?? defaultContainers.map!;
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
      const config = containers.set ?? defaultContainers.set!;
      const start = config.start ?? '{(';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? ')}';

      const values = Object.values(node.properties).map(val => paint(val, options));
      const joined = values.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');

      return chalkInstance.hex(palette.set)(start) + joined + chalkInstance.hex(palette.set)(end);
    }

    // Handle WeakMaps
    if (node.deep_type.isWeakMap) {
      const config = containers.weakmap ?? defaultContainers.weakmap!;
      const start = config.start ?? '(<';
      const end = config.end ?? '>)';
      return chalkInstance.hex(palette.weakmap)(start + end);
    }

    // Handle WeakSets
    if (node.deep_type.isWeakSet) {
      const config = containers.weakset ?? defaultContainers.weakset!;
      const start = config.start ?? '((';
      const end = config.end ?? '))';
      return chalkInstance.hex(palette.weakset)(start + end);
    }

    // Handle Dates
    if (node.deep_type.isDate) {
      const config = containers.date ?? defaultContainers.date!;
      const start = config.start ?? 'Date(';
      const end = config.end ?? ')';
      return chalkInstance.hex(palette.date)(start + String(node.value) + end);
    }

    // Handle RegExp
    if (node.deep_type.isRegExp) {
      const config = containers.regexp ?? defaultContainers.regexp!;
      const start = config.start ?? '/';
      const end = config.end ?? '/';
      return chalkInstance.hex(palette.regexp)(start + String(node.value) + end);
    }

    // Handle Errors
    if (node.deep_type.isError) {
      const config = containers.error ?? defaultContainers.error!;
      const start = config.start ?? 'Error(';
      const end = config.end ?? ')';
      return chalkInstance.hex(palette.error)(start + String(node.value) + end);
    }

    // Handle regular objects
    if (node.properties) {
      const config = containers.object ?? defaultContainers.object!;
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
  private input: string;
  private position: number;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position]!)) {
      this.position++;
    }
  }

  private peek(): string | undefined {
    return this.input[this.position];
  }

  private consume(): string {
    const char = this.input[this.position];
    this.position++;
    return char!;
  }

  private consumeString(): string {
    const quote = this.consume(); // consume opening quote
    let result = '';

    while (this.position < this.input.length) {
      const char = this.peek();

      if (char === '\\') {
        this.consume(); // consume backslash
        const escaped = this.consume();
        // Handle escape sequences
        switch (escaped) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case '\\': result += '\\'; break;
          case '"': result += '"'; break;
          case "'": result += "'"; break;
          default: result += escaped;
        }
      } else if (char === quote) {
        this.consume(); // consume closing quote
        break;
      } else {
        result += this.consume();
      }
    }

    return result;
  }

  private consumeNumber(): number {
    let numStr = '';

    if (this.peek() === '-') {
      numStr += this.consume();
    }

    while (this.position < this.input.length && /[0-9.]/.test(this.peek()!)) {
      numStr += this.consume();
    }

    // Handle scientific notation
    if (this.peek() === 'e' || this.peek() === 'E') {
      numStr += this.consume();
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.consume();
      }
      while (this.position < this.input.length && /[0-9]/.test(this.peek()!)) {
        numStr += this.consume();
      }
    }

    return parseFloat(numStr);
  }

  private consumeIdentifier(): string {
    let result = '';

    while (this.position < this.input.length && /[a-zA-Z_]/.test(this.peek()!)) {
      result += this.consume();
    }

    return result;
  }

  public parseValue(): unknown {
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

  private parseObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    this.consume(); // consume '{'

    this.skipWhitespace();

    while (this.peek() !== '}') {
      this.skipWhitespace();

      // Parse key
      let key: string;
      if (this.peek() === '"' || this.peek() === "'") {
        key = this.consumeString();
      } else {
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

  private parseArray(): unknown[] {
    const arr: unknown[] = [];
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
function createASTBuilder(): (val: unknown) => ASTNode {
  // Track objects to detect cycles
  const objectMap = new WeakMap<object, number>();
  let referenceCounter = 0;

  function buildAST(val: unknown): ASTNode {
    const basicType = typeof val;
    const deepType: DeepType = {};

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
      const symbolDesc = (val as symbol).description;
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
      if (objectMap.has(val as object)) {
        const existingRefId = objectMap.get(val as object);
        const circularDeepType: DeepType = { isCircularReference: true };
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
      objectMap.set(val as object, refId);
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
      const constructor = (val as object).constructor;
      if (constructor) {
        deepType.constructorName = constructor.name;

        if (constructor.name === 'WeakMap') deepType.isWeakMap = true;
        if (constructor.name === 'WeakSet') deepType.isWeakSet = true;
        if (constructor.name === 'Map') deepType.isMap = true;
        if (constructor.name === 'Set') deepType.isSet = true;
        if (constructor.name === 'Date') deepType.isDate = true;
        if (constructor.name === 'RegExp') deepType.isRegExp = true;
        if (constructor.name === 'Error' || val instanceof Error) deepType.isError = true;
      }

      // Parse object properties
      const properties: Record<string, ASTNode> = {};
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          properties[key] = buildAST((val as Record<string, unknown>)[key]);
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
export function parse_string(input: unknown): ASTNode {
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
export function parse_value(input: unknown): ASTNode {
  const buildAST = createASTBuilder();
  return buildAST(input);
}
