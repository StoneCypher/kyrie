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

  return buildAST(value);
}
