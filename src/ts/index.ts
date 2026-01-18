import { Chalk } from 'chalk';
import type {
  DeepType,
  ASTNode,
  ContainerDelimiters,
  ContainerConfig,
  ColorPalette,
  OutputMode,
  LineUnfolding,
  Options,
  PaintPolicy,
  PaintFunction,
  SpecialNumber,
  SpecialNumberKind,
  SpecialNumberPaintMode
} from './types.js';

// Re-export types
export type {
  DeepType,
  ASTNode,
  ContainerDelimiters,
  ContainerConfig,
  ColorPalette,
  OutputMode,
  LineUnfolding,
  Options,
  PaintPolicy,
  PaintFunction,
  SpecialNumber,
  SpecialNumberKind,
  SpecialNumberPaintMode
};

// Create a chalk instance with forced color support (level 3 = 16m colors)
const chalkInstance = new Chalk({ level: 3 });

import { palettes } from './palettes/palettes.js';
import { naturePalettes } from './palettes/nature_palettes.js';
import { protanopiaPalettes } from './palettes/protanopia_palettes.js';
import { deuteranopiaPalettes } from './palettes/deuteranopia_palettes.js';
import { tritanopiaPalettes } from './palettes/tritanopia_palettes.js';
import { monochromacyPalettes } from './palettes/monochromacy_palettes.js';
import { deuteranomalyPalettes } from './palettes/deuteranomaly_palettes.js';
import { protanomalyPalettes } from './palettes/protanomaly_palettes.js';
import { tritanomalyPalettes } from './palettes/tritanomaly_palettes.js';
import { achromatopsiaPalettes } from './palettes/achromatopsia_palettes.js';
import { redsColorRangePalettes } from './palettes/reds_color_range_palettes.js';
import { orangesColorRangePalettes } from './palettes/oranges_color_range_palettes.js';
import { yellowsColorRangePalettes } from './palettes/yellows_color_range_palettes.js';
import { greensColorRangePalettes } from './palettes/greens_color_range_palettes.js';
import { bluesColorRangePalettes } from './palettes/blues_color_range_palettes.js';
import { purplesColorRangePalettes } from './palettes/purples_color_range_palettes.js';
import { brownsColorRangePalettes } from './palettes/browns_color_range_palettes.js';
import { greysColorRangePalettes } from './palettes/greys_color_range_palettes.js';
import { charcoalsColorRangePalettes } from './palettes/charcoals_color_range_palettes.js';
import { cyansColorRangePalettes } from './palettes/cyans_color_range_palettes.js';
import { magentasColorRangePalettes } from './palettes/magentas_color_range_palettes.js';
import { lightGraysColorRangePalettes } from './palettes/light_grays_color_range_palettes.js';

export {
  palettes,
  naturePalettes,
  protanopiaPalettes,
  deuteranopiaPalettes,
  tritanopiaPalettes,
  monochromacyPalettes,
  deuteranomalyPalettes,
  protanomalyPalettes,
  tritanomalyPalettes,
  achromatopsiaPalettes,
  redsColorRangePalettes,
  orangesColorRangePalettes,
  yellowsColorRangePalettes,
  greensColorRangePalettes,
  bluesColorRangePalettes,
  purplesColorRangePalettes,
  brownsColorRangePalettes,
  greysColorRangePalettes,
  charcoalsColorRangePalettes,
  cyansColorRangePalettes,
  magentasColorRangePalettes,
  lightGraysColorRangePalettes
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

export const specialNumbers: SpecialNumber[] = [
  { value: NaN, label: 'NaN', kind: 'fundamental' },
  { value: Infinity, label: 'Infinity', kind: 'fundamental' },
  { value: -Infinity, label: '-Infinity', kind: 'fundamental' },
  { value: -0, label: '-0', kind: 'fundamental' },

  { value: Number.MAX_VALUE, label: 'Number.MAX_VALUE', kind: 'constant' },
  { value: Number.MIN_VALUE, label: 'Number.MIN_VALUE', kind: 'constant' },
  { value: Number.MAX_SAFE_INTEGER, label: 'Number.MAX_SAFE_INTEGER', kind: 'constant' },
  { value: Number.MIN_SAFE_INTEGER, label: 'Number.MIN_SAFE_INTEGER', kind: 'constant' },
  { value: Number.EPSILON, label: 'Number.EPSILON', kind: 'constant' },
  { value: Number.POSITIVE_INFINITY, label: 'Number.POSITIVE_INFINITY', kind: 'constant' },
  { value: Number.NEGATIVE_INFINITY, label: 'Number.NEGATIVE_INFINITY', kind: 'constant' },
  
  { value: Math.E, label: 'Math.E', kind: 'constant' },
  { value: Math.LN2, label: 'Math.LN2', kind: 'constant' },
  { value: Math.LN10, label: 'Math.LN10', kind: 'constant' },
  { value: Math.LOG2E, label: 'Math.LOG2E', kind: 'constant' },
  { value: Math.LOG10E, label: 'Math.LOG10E', kind: 'constant' },
  { value: Math.PI, label: 'Math.PI', kind: 'constant' },
  { value: Math.SQRT1_2, label: 'Math.SQRT1_2', kind: 'constant' },
  { value: Math.SQRT2, label: 'Math.SQRT2', kind: 'constant' }
];

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
  // Coverage excluded: function body is test data, not executed production code
  /* c8 ignore next */
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
  ] as unknown[],

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
  map_all_primitives: new Map<string, unknown>([
    ['null', null],
    ['undefined', undefined],
    ['boolean', true],
    ['number', 999],
    ['string', 'map value'],
    ['symbol', Symbol('map-symbol')]
  ]),

  // Set with all non-container types
  set_all_primitives: new Set<unknown>([
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
  ] as unknown[],

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
  map_all_containers: new Map<string, unknown>([
    ['array', [7, 8, 9]],
    ['object', { p: 1, q: 2 }],
    ['map', new Map([['inner-key', 'inner-value']])],
    ['set', new Set([true, false])],
    ['date', new Date('2024-03-14')],
    ['regexp', /map-nested/],
    ['error', new Error('nested in map')]
  ]),

  // Set containing all container types
  set_all_containers: new Set<unknown>([
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
    const obj: any = {
      name: 'circular',
      value: 123
    };
    obj.self = obj;
    return obj;
  })()
};

/**
 * Highlights a JavaScript value with colors
 *
 * @param {unknown} value - The value to highlight
 * @param {Options} [options] - Optional configuration for highlighting
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
export function highlight_value(value: unknown, options?: Options): string {
  const ast = parse_value(value);
  return paint_ansi(ast, options);
}

/**
 * Highlights a JSON or JavaScript string with colors
 *
 * @param {string} str - The string to highlight (JSON or JavaScript literal)
 * @param {Options} [options] - Optional configuration for highlighting
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
export function highlight_string(str: string, options?: Options): string {
  const ast = parse_string(str);
  return paint_ansi(ast, options);
}

/**
 * Default highlight options
 */
export const defaultOptions: Options = {
  palette: palettes.default.light,
  containers: defaultContainers,
  maxWidth: undefined,
  lineUnfolding: 'dense',
  indent: 2,
  specialNumberPaintMode: 'highlight-label'
};

/**
 * ANSI paint policy using Chalk for terminal color output
 * Provides color wrapping using ANSI escape codes and standard newline handling
 *
 * @example
 * ```typescript
 * const colorized = ansi_policy.wrap('#FF5733', 'Hello World');
 * console.log(colorized); // Outputs 'Hello World' in color
 * ```
 */
export const ansi_policy: PaintPolicy = {
  wrap: (color: string, content: string): string => {
    return chalkInstance.hex(color)(content);
  },
  newline: '\n'
};

/**
 * HTML paint policy for web browser output
 * Wraps content in span tags with inline CSS color styling and uses <br/> for newlines
 *
 * @example
 * ```typescript
 * const html = html_policy.wrap('#FF5733', 'Hello World');
 * console.log(html); // Outputs '<span style="color: #FF5733">Hello World</span>'
 * ```
 */
export const html_policy: PaintPolicy = {
  wrap: (color: string, content: string): string => {
    return `<span style="color: ${color}">${content}</span>`;
  },
  newline: '<br/>'
};

/**
 * Log paint policy for plain text output
 * Ignores all color information and returns unformatted text
 * Useful for logging, file output, or environments without color support
 *
 * @example
 * ```typescript
 * const plain = log_policy.wrap('#FF5733', 'Hello World');
 * console.log(plain); // Outputs 'Hello World' (no formatting)
 * ```
 */
export const log_policy: PaintPolicy = {
  wrap: (_color: string, content: string): string => {
    return content;
  },
  newline: '\n'
};

/**
 * Helper function to safely get a color from a palette with validation
 * Throws a clear error if the color is missing
 */
function getPaletteColor(palette: ColorPalette, colorKey: keyof ColorPalette): string {
  const color = palette[colorKey];
  if (color === undefined || color === null) {
    throw new Error(`Missing color '${colorKey}' in palette. The palette must define all required colors.`);
  }
  return color;
}

/**
 * Checks if a number value is a special number and returns the corresponding SpecialNumber entry
 *
 * @param {number} value - The number value to check
 * @returns {SpecialNumber | undefined} The SpecialNumber entry if the value is special, undefined otherwise
 */
function getSpecialNumber(value: number): SpecialNumber | undefined {
  // Check for NaN
  if (Number.isNaN(value)) {
    return specialNumbers.find(sn => sn.label === 'NaN');
  }

  // Check for -0
  if (Object.is(value, -0)) {
    return specialNumbers.find(sn => sn.label === '-0');
  }

  // Check for exact match with special number values
  return specialNumbers.find(sn => sn.value === value);
}

/**
 * Paints an AST node with colors and formatting using a specified paint policy
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {PaintPolicy} policy - The paint policy to use for color formatting
 * @param {Options} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint(ast, ansi_policy); // Uses defaults
 * console.log(painted);
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { palette: forestPalette }; // containers will use default
 * const painted = paint(ast, ansi_policy, options);
 * console.log(painted);
 * ```
 */
export function paint(node: ASTNode, policy: PaintPolicy, options?: Options, depth: number = 0): string {
  // Merge provided options with defaults
  const palette = options?.palette ?? defaultOptions.palette!;
  const containers = options?.containers ?? defaultOptions.containers!;
  const lineUnfolding = options?.lineUnfolding ?? defaultOptions.lineUnfolding!;
  const specialNumberPaintMode = options?.specialNumberPaintMode ?? defaultOptions.specialNumberPaintMode!;

  // Calculate line formatting based on lineUnfolding mode
  let line_change: string;
  let line_indent: string;
  let next_indent: string;

  if (lineUnfolding === 'dense') {
    line_change = '';
    line_indent = '';
    next_indent = '';
  } else { // expanded
    line_change = policy.newline;
    const indent = options?.indent ?? defaultOptions.indent!;

    if (typeof indent === 'number') {
      line_indent = ' '.repeat(depth * indent);
      next_indent = ' '.repeat((depth + 1) * indent);
    } else {
      // indent is a string
      line_indent = indent.repeat(depth);
      next_indent = indent.repeat(depth + 1);
    }
  }

  // Handle null
  if (node.value === null) {
    return policy.wrap(getPaletteColor(palette, 'null'), 'null');
  }

  // Handle primitives
  if (node.basic_type === 'undefined') {
    return policy.wrap(getPaletteColor(palette, 'undefined'), 'undefined');
  }

  if (node.basic_type === 'boolean') {
    return policy.wrap(getPaletteColor(palette, 'boolean'), String(node.value));
  }

  if (node.basic_type === 'number') {
    const specialNum = getSpecialNumber(node.value as number);
    if (specialNum) {
      // This is a special number - render based on specialNumberPaintMode
      const useSpecialColor = specialNumberPaintMode === 'highlight' || specialNumberPaintMode === 'highlight-label';
      const useLabel = specialNumberPaintMode === 'label' || specialNumberPaintMode === 'highlight-label';

      const color = useSpecialColor ? getPaletteColor(palette, 'specialNumber') : getPaletteColor(palette, 'number');
      const content = useLabel ? specialNum.label : String(node.value);

      return policy.wrap(color, content);
    }
    // Regular number
    return policy.wrap(getPaletteColor(palette, 'number'), String(node.value));
  }

  if (node.basic_type === 'bigint') {
    return policy.wrap(getPaletteColor(palette, 'bigint'), String(node.value) + 'n');
  }

  if (node.basic_type === 'string') {
    return policy.wrap(getPaletteColor(palette, 'string'), '"' + String(node.value) + '"');
  }

  if (node.basic_type === 'symbol') {
    const desc = node.deep_type.description !== undefined ? `(${node.deep_type.description})` : '';
    return policy.wrap(getPaletteColor(palette, 'symbol'), `Symbol${desc}`);
  }

  if (node.basic_type === 'function') {
    const config = containers.function ?? defaultContainers.function!;
    const start = config.start ?? 'function(';
    const end = config.end ?? ')';
    return policy.wrap(getPaletteColor(palette, 'function'), start + end);
  }

  // Handle circular references
  if (node.deep_type.isCircularReference) {
    const refId = node.deep_type.referenceId !== undefined ? `#${node.deep_type.referenceId}` : '';
    return policy.wrap(getPaletteColor(palette, 'circularReference'), `[Circular${refId}]`);
  }

  // Handle containers
  if (node.basic_type === 'object') {
    // Handle arrays
    if (node.deep_type.isArray && node.elements) {
      const config = containers.array ?? defaultContainers.array!;
      const start = config.start ?? '[';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? ']';

      const elements = node.elements.map(el =>
        line_change + next_indent + paint(el, policy, options, depth + 1)
      );
      const joined = elements.join(policy.wrap(getPaletteColor(palette, 'punctuation'), delimiter));

      return policy.wrap(getPaletteColor(palette, 'array'), start) +
             joined +
             line_change + line_indent +
             policy.wrap(getPaletteColor(palette, 'array'), end);
    }

    // Handle Maps
    if (node.deep_type.isMap && node.properties) {
      const config = containers.map ?? defaultContainers.map!;
      const start = config.start ?? '{<';
      const separator = config.separator ?? ':';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? '>}';

      const entries = Object.entries(node.properties).map(([key, val]) => {
        const paintedKey = policy.wrap(getPaletteColor(palette, 'propertyKey'), key);
        const paintedSep = policy.wrap(getPaletteColor(palette, 'punctuation'), separator);
        const paintedVal = paint(val, policy, options, depth + 1);
        return line_change + next_indent + paintedKey + paintedSep + ' ' + paintedVal;
      });
      const joined = entries.join(policy.wrap(getPaletteColor(palette, 'punctuation'), delimiter));

      return policy.wrap(getPaletteColor(palette, 'map'), start) +
             joined +
             line_change + line_indent +
             policy.wrap(getPaletteColor(palette, 'map'), end);
    }

    // Handle Sets
    if (node.deep_type.isSet && node.properties) {
      const config = containers.set ?? defaultContainers.set!;
      const start = config.start ?? '{(';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? ')}';

      const values = Object.values(node.properties).map(val =>
        line_change + next_indent + paint(val, policy, options, depth + 1)
      );
      const joined = values.join(policy.wrap(getPaletteColor(palette, 'punctuation'), delimiter));

      return policy.wrap(getPaletteColor(palette, 'set'), start) +
             joined +
             line_change + line_indent +
             policy.wrap(getPaletteColor(palette, 'set'), end);
    }

    // Handle WeakMaps
    if (node.deep_type.isWeakMap) {
      const config = containers.weakmap ?? defaultContainers.weakmap!;
      const start = config.start ?? '(<';
      const end = config.end ?? '>)';
      return policy.wrap(getPaletteColor(palette, 'weakmap'), start + end);
    }

    // Handle WeakSets
    if (node.deep_type.isWeakSet) {
      const config = containers.weakset ?? defaultContainers.weakset!;
      const start = config.start ?? '((';
      const end = config.end ?? '))';
      return policy.wrap(getPaletteColor(palette, 'weakset'), start + end);
    }

    // Handle Dates
    if (node.deep_type.isDate) {
      const config = containers.date ?? defaultContainers.date!;
      const start = config.start ?? 'Date(';
      const end = config.end ?? ')';
      return policy.wrap(getPaletteColor(palette, 'date'), start + String(node.value) + end);
    }

    // Handle RegExp
    if (node.deep_type.isRegExp) {
      const config = containers.regexp ?? defaultContainers.regexp!;
      const start = config.start ?? '/';
      const end = config.end ?? '/';
      return policy.wrap(getPaletteColor(palette, 'regexp'), start + String(node.value) + end);
    }

    // Handle Errors
    if (node.deep_type.isError) {
      const config = containers.error ?? defaultContainers.error!;
      const start = config.start ?? 'Error(';
      const end = config.end ?? ')';
      return policy.wrap(getPaletteColor(palette, 'error'), start + String(node.value) + end);
    }

    // Handle regular objects
    if (node.properties) {
      const config = containers.object ?? defaultContainers.object!;
      const start = config.start ?? '{';
      const separator = config.separator ?? ':';
      const delimiter = config.delimiter ?? ',';
      const end = config.end ?? '}';

      const entries = Object.entries(node.properties).map(([key, val]) => {
        const paintedKey = policy.wrap(getPaletteColor(palette, 'propertyKey'), key);
        const paintedSep = policy.wrap(getPaletteColor(palette, 'punctuation'), separator);
        const paintedVal = paint(val, policy, options, depth + 1);
        return line_change + next_indent + paintedKey + paintedSep + ' ' + paintedVal;
      });
      const joined = entries.join(policy.wrap(getPaletteColor(palette, 'punctuation'), delimiter));

      return policy.wrap(getPaletteColor(palette, 'object'), start) +
             joined +
             line_change + line_indent +
             policy.wrap(getPaletteColor(palette, 'object'), end);
    }
  }

  // Fallback
  return String(node.value);
}

/**
 * Paints an AST node with colors and formatting using ANSI escape codes
 * Convenience wrapper around paint() that uses the ansi_policy
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {Options} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node with ANSI color codes
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint_ansi(ast); // Uses ANSI policy with defaults
 * console.log(painted);
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { palette: forestPalette };
 * const painted = paint_ansi(ast, options);
 * console.log(painted);
 * ```
 */
export const paint_ansi: PaintFunction = (node: ASTNode, options?: Options): string => {
  return paint(node, ansi_policy, options);
};

/**
 * Paints an AST node with colors and formatting using HTML span tags
 * Convenience wrapper around paint() that uses the html_policy
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {Options} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node with HTML span tags and inline CSS
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint_html(ast); // Uses HTML policy with defaults
 * document.body.innerHTML = painted;
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { palette: forestPalette };
 * const painted = paint_html(ast, options);
 * document.body.innerHTML = '<pre>' + painted + '</pre>';
 * ```
 */
export const paint_html: PaintFunction = (node: ASTNode, options?: Options): string => {
  return paint(node, html_policy, options);
};

/**
 * Paints an AST node as plain text without color formatting
 * Convenience wrapper around paint() that uses the log_policy
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {Options} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node without any color formatting
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint_log(ast); // Uses log policy with defaults
 * console.log(painted); // Plain text output: {name: "John"}
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { containers: customContainers };
 * const painted = paint_log(ast, options);
 * fs.writeFileSync('output.txt', painted); // Save plain text to file
 * ```
 */
export const paint_log: PaintFunction = (node: ASTNode, options?: Options): string => {
  return paint(node, log_policy, options);
};

/**
 * Converts a JavaScript value to HTML with inline CSS color styling
 * Convenience function that parses the value and paints it as HTML
 *
 * @param {unknown} value - The value to convert to HTML
 * @param {Options} [options] - Optional configuration for highlighting
 * @returns {string} HTML string with span tags and inline CSS styles
 *
 * @example
 * ```typescript
 * const data = { name: "Alice", age: 30 };
 * const html = html_from_value(data);
 * document.body.innerHTML = html;
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * const html = html_from_value(arr, { palette: palettes.bold.dark });
 * console.log(html); // Outputs HTML with inline styles
 * ```
 */
export function html_from_value(value: unknown, options?: Options): string {
  const ast = parse_value(value);
  return paint_html(ast, options);
}

/**
 * Converts a JSON or JavaScript string to HTML with inline CSS color styling
 * Convenience function that parses the string and paints it as HTML
 *
 * @param {string} str - The string to convert to HTML (JSON or JavaScript literal)
 * @param {Options} [options] - Optional configuration for highlighting
 * @returns {string} HTML string with span tags and inline CSS styles
 *
 * @example
 * ```typescript
 * const json = '{"name": "Alice", "age": 30}';
 * const html = html_from_string(json);
 * document.body.innerHTML = html;
 * ```
 *
 * @example
 * ```typescript
 * const arr = '[1, 2, 3, "hello", true]';
 * const html = html_from_string(arr, { palette: palettes.bold.dark });
 * console.log(html); // Outputs HTML with inline styles
 * ```
 */
export function html_from_string(str: string, options?: Options): string {
  const ast = parse_string(str);
  return paint_html(ast, options);
}

/**
 * Converts a JavaScript value to ANSI-colored terminal output
 * Convenience function that parses the value and paints it with ANSI codes
 *
 * @param {unknown} value - The value to convert to ANSI output
 * @param {Options} [options] - Optional configuration for highlighting
 * @returns {string} String with ANSI color codes for terminal display
 *
 * @example
 * ```typescript
 * const data = { name: "Alice", age: 30 };
 * const ansi = ansi_from_value(data);
 * console.log(ansi); // Outputs colorized in terminal
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * const ansi = ansi_from_value(arr, { palette: palettes.bold.dark });
 * console.log(ansi); // Outputs with ANSI color codes
 * ```
 */
export function ansi_from_value(value: unknown, options?: Options): string {
  const ast = parse_value(value);
  return paint_ansi(ast, options);
}

/**
 * Converts a JSON or JavaScript string to ANSI-colored terminal output
 * Convenience function that parses the string and paints it with ANSI codes
 *
 * @param {string} str - The string to convert to ANSI output (JSON or JavaScript literal)
 * @param {Options} [options] - Optional configuration for highlighting
 * @returns {string} String with ANSI color codes for terminal display
 *
 * @example
 * ```typescript
 * const json = '{"name": "Alice", "age": 30}';
 * const ansi = ansi_from_string(json);
 * console.log(ansi); // Outputs colorized in terminal
 * ```
 *
 * @example
 * ```typescript
 * const arr = '[1, 2, 3, "hello", true]';
 * const ansi = ansi_from_string(arr, { palette: palettes.bold.dark });
 * console.log(ansi); // Outputs with ANSI color codes
 * ```
 */
export function ansi_from_string(str: string, options?: Options): string {
  const ast = parse_string(str);
  return paint_ansi(ast, options);
}

/**
 * Converts a JavaScript value to plain text without color formatting
 * Convenience function that parses the value and outputs as plain text
 *
 * @param {unknown} value - The value to convert to plain text
 * @param {Options} [options] - Optional configuration for formatting
 * @returns {string} Plain text string without any color formatting
 *
 * @example
 * ```typescript
 * const data = { name: "Alice", age: 30 };
 * const text = log_from_value(data);
 * console.log(text); // Outputs plain text: {name: "Alice", age: 30}
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * const text = log_from_value(arr);
 * fs.writeFileSync('output.txt', text); // Save to file
 * ```
 */
export function log_from_value(value: unknown, options?: Options): string {
  const ast = parse_value(value);
  return paint_log(ast, options);
}

/**
 * Converts a JSON or JavaScript string to plain text without color formatting
 * Convenience function that parses the string and outputs as plain text
 *
 * @param {string} str - The string to convert to plain text (JSON or JavaScript literal)
 * @param {Options} [options] - Optional configuration for formatting
 * @returns {string} Plain text string without any color formatting
 *
 * @example
 * ```typescript
 * const json = '{"name": "Alice", "age": 30}';
 * const text = log_from_string(json);
 * console.log(text); // Outputs plain text: {name: "Alice", age: 30}
 * ```
 *
 * @example
 * ```typescript
 * const arr = '[1, 2, 3, "hello", true]';
 * const text = log_from_string(arr);
 * fs.writeFileSync('output.txt', text); // Save to file
 * ```
 */
export function log_from_string(str: string, options?: Options): string {
  const ast = parse_string(str);
  return paint_log(ast, options);
}

/**
 * Console logs a JavaScript value with ANSI colors
 * Convenience function that parses the value, paints it with ANSI codes, and outputs to console
 *
 * @param {unknown} value - The value to log to console
 * @param {Options} [options] - Optional configuration for highlighting
 * @returns {void}
 *
 * @example
 * ```typescript
 * const data = { name: "Alice", age: 30 };
 * log(data); // Outputs colorized object to console
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * log(arr, { palette: palettes.bold.dark }); // Outputs with bold dark palette
 * ```
 */
export function log(value: unknown, options?: Options): void {
  console.log(ansi_from_value(value, options));
}

/**
 * Tokenizer for JSON/JavaScript values
 */
/**
 * Helper function to get special number value from label
 * Returns the numeric value if the label matches a special number, otherwise undefined
 */
function getSpecialNumberValue(label: string): number | undefined {
  const specialNum = specialNumbers.find(sn => sn.label === label);
  return specialNum?.value;
}

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

    while (this.position < this.input.length && /[a-zA-Z_0-9.]/.test(this.peek()!)) {
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

    // Number or negative special number (like -Infinity, -0)
    if (char === '-') {
      // Peek ahead to check if it's a special number identifier
      const savedPosition = this.position;
      this.consume(); // consume '-'
      this.skipWhitespace();

      const nextChar = this.peek();
      if (nextChar && /[a-zA-Z]/.test(nextChar)) {
        // Could be -Infinity or other negative special number
        const identifier = this.consumeIdentifier();
        const fullLabel = '-' + identifier;

        // Check if it's a special number
        const specialValue = getSpecialNumberValue(fullLabel);
        if (specialValue !== undefined) {
          return specialValue;
        }

        // Not a special number, restore position and parse as regular number
        this.position = savedPosition;
      } else {
        // Regular negative number, restore position
        this.position = savedPosition;
      }

      return this.consumeNumber();
    }

    if (/[0-9]/.test(char)) {
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

    // Keywords and special numbers
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

    // Check if it's a special number
    const specialValue = getSpecialNumberValue(identifier);
    if (specialValue !== undefined) {
      return specialValue;
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

      // Handle Map - convert entries to properties
      if (deepType.isMap) {
        let index = 0;
        for (const [key, value] of (val as Map<unknown, unknown>).entries()) {
          properties[String(key)] = buildAST(value);
          index++;
        }
      }
      // Handle Set - convert values to indexed properties
      else if (deepType.isSet) {
        let index = 0;
        for (const value of (val as Set<unknown>).values()) {
          properties[String(index)] = buildAST(value);
          index++;
        }
      }
      // Handle regular objects
      else {
        for (const key in val) {
          if (Object.prototype.hasOwnProperty.call(val, key)) {
            properties[key] = buildAST((val as Record<string, unknown>)[key]);
          }
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
