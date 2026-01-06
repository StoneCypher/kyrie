# kyrie 0.13.0

Kyrie is a formatting colorizer for JavaScript, TypeScript, and JSON with customizable color palettes and container delimiters.

## Features

- 🌈 **16 million colors**: Uses Chalk with 24-bit RGB color support
- 🎨 **Four built-in color palettes**: Pastel (default), Forest, Bold, and Dusk themes
- 🔧 **Fully customizable**: Create custom palettes and container delimiters
- 📦 **AST-based parsing**: Parse JSON strings or JavaScript values into detailed AST
- 🔄 **Circular reference detection**: Safely handles circular object references
- 🎯 **Type-aware**: Distinguishes between arrays, objects, Maps, Sets, Dates, RegExp, Errors, and more
- 💪 **TypeScript support**: Fully typed with strict TypeScript configuration
- ⚡ **One dependency** - Chalk, for terminal colors
- ✅ **Strong testing**: Has 96.89% test coverage from 184 test cases

## Installation

```bash
npm install kyrie
```

## Quick Start

```typescript
import { parse_string, paint } from 'kyrie';

// Parse JSON string to AST
const ast = parse_string('{"name": "Alice", "age": 25}');

// Paint with colors (uses default pastel palette)
const colored = paint(ast);
console.log(colored); // Outputs colorized JSON to terminal
```

## Usage

### Colorizing JSON and JavaScript

The `paint()` function is the main way to colorize parsed values. It works with both `parse_string()` (for JSON/JavaScript strings) and `parse_value()` (for JavaScript values).

```typescript
import { parse_string, parse_value, paint, forestPalette } from 'kyrie';

// From JSON string
const ast1 = parse_string('{"name": "John", "age": 30}');
console.log(paint(ast1));

// From JavaScript value
const ast2 = parse_value({ name: 'John', age: 30 });
console.log(paint(ast2, { palette: forestPalette }));
```

### Highlighting JavaScript Values

The `highlight_value()` function provides a convenient way to directly colorize any JavaScript value without manually calling `parse_value()` and `paint()`. It combines both steps into a single function call.

```typescript
import { highlight_value } from 'kyrie';

const data = { name: 'John', age: 30 };
const highlighted = highlight_value(data);
console.log(highlighted); // Outputs colorized object
```

### API

#### `highlight_value(value: unknown, options?: HighlightOptions): string`

Colorizes any JavaScript value by parsing it to an AST and painting it with colors.

**Parameters:**
- `value` (unknown): The JavaScript value to highlight (any type)
- `options` (HighlightOptions, optional): Configuration options with palette and container settings

**Returns:**
- string: The colorized string with ANSI escape codes

**Example:**

```typescript
import { highlight_value, type HighlightOptions, forestPalette } from 'kyrie';

const data = { name: 'Alice', age: 25, active: true };
const result = highlight_value(data);
console.log(result); // Uses default pastel palette

// With custom palette
const forestResult = highlight_value(data, { palette: forestPalette });
console.log(forestResult); // Uses forest palette
```

#### `highlight_string(str: string, options?: HighlightOptions): string`

Colorizes a JSON or JavaScript string by parsing it to an AST and painting it with colors.

**Parameters:**
- `str` (string): The JSON or JavaScript string to highlight
- `options` (HighlightOptions, optional): Configuration options with palette and container settings

**Returns:**
- string: The colorized string with ANSI escape codes

**Example:**

```typescript
import { highlight_string, type HighlightOptions, boldPalette } from 'kyrie';

const json = '{"name": "Alice", "age": 25, "active": true}';
const result = highlight_string(json);
console.log(result); // Uses default pastel palette

// With custom palette
const boldResult = highlight_string(json, { palette: boldPalette });
console.log(boldResult); // Uses bold palette

// Works with arrays too
const array = '[1, 2, 3, "hello", true]';
console.log(highlight_string(array));
```

### HighlightOptions

Configuration interface for highlighting and painting functions.

```typescript
interface HighlightOptions {
  palette?: ColorPalette;      // Color scheme to use
  containers?: ContainerConfig; // Container delimiter configuration
}
```

**Available exports:**
- `defaultHighlightOptions` - Pre-configured with defaultPalette and defaultContainers
- `defaultPalette`, `forestPalette`, `boldPalette`, `duskPalette` - Built-in color schemes
- `defaultContainers` - Default container delimiters

### Painting AST Nodes

The `paint()` function renders AST nodes with colors and formatting using Chalk. It converts parsed AST nodes into colorized strings with ANSI escape codes for terminal display. Colors are always generated regardless of environment (forced color support at 16 million color level).

#### `paint(node: ASTNode, options?: HighlightOptions): string`

Converts an AST node into a colorized string representation.

**Parameters:**
- `node` (ASTNode): The AST node to paint
- `options` (HighlightOptions, optional): Configuration with palette and container settings. Defaults are used for any missing values.

**Returns:**
- string: The colorized string representation with ANSI escape codes (24-bit RGB colors)

**Example: Basic usage (using defaults)**

```typescript
import { parse_string, paint } from 'kyrie';

const ast = parse_string('{"name": "Alice", "age": 25}');
const colored = paint(ast);
console.log(colored);
// Outputs: {"name": "Alice", "age": 25} with colors
```

**Example: Using different palettes**

```typescript
import { parse_string, paint, forestPalette, boldPalette, duskPalette } from 'kyrie';

const ast = parse_string('[1, 2, 3, "hello", true, null]');

// Forest theme
console.log(paint(ast, { palette: forestPalette }));

// Bold vibrant colors
console.log(paint(ast, { palette: boldPalette }));

// Dark theme (near-black colors)
console.log(paint(ast, { palette: duskPalette }));
```

**Example: Custom containers with default palette**

```typescript
import { parse_string, paint, type ContainerConfig } from 'kyrie';

const customContainers: ContainerConfig = {
  array: { start: '<<', delimiter: '|', end: '>>' },
  object: { start: 'obj{', separator: ' => ', delimiter: '; ', end: '}' }
};

const ast = parse_string('{"items": [1, 2, 3]}');
const colored = paint(ast, { containers: customContainers });
console.log(colored);
// Outputs: obj{items => <<1| 2| 3>>} with colors
```

**Example: Painting JavaScript values directly**

```typescript
import { parse_value, paint } from 'kyrie';

// Parse and paint any JavaScript value
const obj = { users: ['Alice', 'Bob'], count: 2 };
const ast = parse_value(obj);
const colored = paint(ast);
console.log(colored);
```

**Note:** The paint function uses Chalk with forced color support (level 3 - 16 million colors). This ensures ANSI color codes are always generated in the output, regardless of the environment. When displayed in a color-supporting terminal, you'll see the fully colorized output.

### Container Configuration

Kyrie allows customization of how different data structures are delimited when painted.

#### `ContainerDelimiters` Interface

```typescript
interface ContainerDelimiters {
  start?: string;      // Opening delimiter
  separator?: string;  // Key-value separator (for objects/maps)
  delimiter?: string;  // Element delimiter (comma for arrays)
  end?: string;        // Closing delimiter
}
```

#### `defaultContainers` Configuration

```typescript
export const defaultContainers: ContainerConfig = {
  array: { start: '[', delimiter: ',', end: ']' },
  object: { start: '{', separator: ':', delimiter: ',', end: '}' },
  map: { start: '{<', separator: ':', delimiter: ',', end: '>}' },
  set: { start: '{(', delimiter: ',', end: ')}' },
  weakmap: { start: '(<', separator: ':', delimiter: ',', end: '>)' },
  weakset: { start: '((', delimiter: ',', end: '))' },
  date: { start: 'Date(', end: ')' },
  regexp: { start: '/', end: '/' },
  error: { start: 'Error(', end: ')' },
  function: { start: 'function(', end: ')' }
};
```

**Example: Custom container delimiters**

```typescript
import { parse_string, paint, defaultPalette, type ContainerConfig } from 'kyrie';

const customContainers: ContainerConfig = {
  array: {
    start: '<<',
    delimiter: '|',
    end: '>>'
  },
  object: {
    start: 'obj{',
    separator: ' => ',
    delimiter: '; ',
    end: '}'
  }
};

const ast = parse_string('[1, 2, 3]');
const options = {
  palette: defaultPalette,
  containers: customContainers
};
const result = paint(ast, options);
console.log(result); // Outputs: <<1| 2| 3>>
```

### Color Palettes

Kyrie provides a `ColorPalette` interface and several built-in color schemes for syntax highlighting.

#### `ColorPalette` Interface

```typescript
interface ColorPalette {
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
```

#### Built-in Palettes

Kyrie includes four pre-configured color palettes:

**`defaultPalette`** - Modern pastel colors with soft, light tones
```typescript
import { defaultPalette } from 'kyrie';
console.log(defaultPalette.string); // '#C1E1C1'
```

**`forestPalette`** - Earth tones and natural greens
```typescript
import { forestPalette } from 'kyrie';
console.log(forestPalette.string); // '#5F7A61'
```

**`boldPalette`** - Vibrant, saturated colors
```typescript
import { boldPalette } from 'kyrie';
console.log(boldPalette.string); // '#2ECC71'
```

**`duskPalette`** - Dark colors near black for dark themes
```typescript
import { duskPalette } from 'kyrie';
console.log(duskPalette.string); // '#1F2B1F'
```

**Example: Creating a custom palette**

```typescript
import { type ColorPalette } from 'kyrie';

const myPalette: ColorPalette = {
  null: '#808080',
  undefined: '#A0A0A0',
  boolean: '#4A90E2',
  number: '#F39C12',
  string: '#27AE60',
  symbol: '#9B59B6',
  function: '#E67E22',
  object: '#E74C3C',
  array: '#3498DB',
  map: '#1ABC9C',
  set: '#16A085',
  weakmap: '#D35400',
  weakset: '#C0392B',
  date: '#F1C40F',
  regexp: '#8E44AD',
  error: '#E74C3C',
  circularReference: '#95A5A6',
  propertyKey: '#2C3E50',
  punctuation: '#7F8C8D'
};
```

### Parsing JSON/JavaScript to AST

The `parse_string()` function parses a JSON or JavaScript value string into an Abstract Syntax Tree (AST) with detailed type information.

```typescript
import { parse_string } from 'kyrie';

const ast = parse_string('{"name": "John", "age": 30}');
console.log(ast.basic_type); // "object"
console.log(ast.deep_type.constructorName); // "Object"
console.log(ast.properties.name.value); // "John"
```

#### `parse_string(input: unknown): ASTNode`

Parses a JavaScript or JSON value string into an AST. Does not use JSON.parse, allowing for future extensions to handle non-JSON JavaScript types.

**Parameters:**
- `input` (unknown): The string to parse (must be a string type)

**Returns:**
- ASTNode: An AST representation with type information

**Features:**
- **Type tracking**: Each node has `basic_type` (from `typeof`) and `deep_type` (detailed type info)
- **Cycle detection**: Uses WeakMap to track and identify circular references
- **Reference IDs**: Each object is assigned a unique reference ID for tracking
- **Rich type info**: Identifies arrays, Maps, Sets, WeakMaps, WeakSets, Dates, RegExp, Errors, and more

**Example:**

```typescript
import { parse_string, type ASTNode } from 'kyrie';

// Parse primitives
const num = parse_string('42');
console.log(num.basic_type); // "number"
console.log(num.value); // 42

// Parse arrays
const arr = parse_string('[1, 2, 3]');
console.log(arr.basic_type); // "object"
console.log(arr.deep_type.isArray); // true
console.log(arr.elements[0].value); // 1

// Parse objects
const obj = parse_string('{"name": "Alice", "age": 25}');
console.log(obj.properties.name.value); // "Alice"
console.log(obj.deep_type.referenceId); // 0

// Parse nested structures
const nested = parse_string('{"users": [{"name": "John"}]}');
console.log(nested.properties.users.deep_type.isArray); // true
```

#### `parse_value(input: unknown): ASTNode`

Parses JavaScript values directly into an AST. Accepts any JavaScript value and returns the same AST structure that `parse_string` would produce for an equivalent string representation.

**Parameters:**
- `input` (unknown): The value to parse (any JavaScript type)

**Returns:**
- ASTNode: An AST representation with type information

**Features:**
- **Direct value parsing**: Works with actual JavaScript values, not just strings
- **All types supported**: Handles primitives, objects, arrays, symbols, functions, and more
- **Type tracking**: Each node has `basic_type` (from `typeof`) and `deep_type` (detailed type info)
- **Cycle detection**: Uses WeakMap to track and identify circular references
- **Reference IDs**: Each object is assigned a unique reference ID for tracking
- **Rich type info**: Identifies arrays, Maps, Sets, WeakMaps, WeakSets, Dates, RegExp, Errors, and more
- **Consistent output**: Produces the same AST structure as `parse_string` for equivalent values

**Example:**

```typescript
import { parse_value, type ASTNode } from 'kyrie';

// Parse primitives
const num = parse_value(42);
console.log(num.basic_type); // "number"
console.log(num.value); // 42

// Parse arrays
const arr = parse_value([1, 2, 3]);
console.log(arr.basic_type); // "object"
console.log(arr.deep_type.isArray); // true
console.log(arr.elements[0].value); // 1

// Parse objects
const obj = parse_value({name: 'Alice', age: 25});
console.log(obj.properties.name.value); // "Alice"
console.log(obj.deep_type.referenceId); // 0

// Parse special types
const sym = Symbol('test');
const symAst = parse_value(sym);
console.log(symAst.basic_type); // "symbol"
console.log(symAst.deep_type.description); // "test"

// Detect circular references
const circular: any = {a: 1};
circular.self = circular;
const circAst = parse_value(circular);
console.log(circAst.properties.self.deep_type.isCircularReference); // true

// Works with Date, RegExp, Map, Set, etc.
const date = parse_value(new Date('2024-01-01'));
console.log(date.deep_type.isDate); // true
```

**Comparison with parse_string:**

```typescript
// These produce equivalent AST structures:
const fromString = parse_string('{"name": "John", "age": 30}');
const fromValue = parse_value({name: 'John', age: 30});

console.log(fromString.basic_type === fromValue.basic_type); // true
console.log(fromString.properties.name.value === fromValue.properties.name.value); // true
```

### AST Structure

#### ASTNode

```typescript
interface ASTNode {
  basic_type: string;           // Result of typeof operator
  deep_type: DeepType;          // Detailed type information
  value?: unknown;              // For primitives
  properties?: Record<string, ASTNode>;  // For objects
  elements?: ASTNode[];         // For arrays
}
```

#### DeepType

```typescript
interface DeepType {
  constructorName?: string;     // Constructor name (e.g., "Object", "Array")
  description?: string;         // For symbols
  isArray?: boolean;            // True for arrays
  isWeakMap?: boolean;          // True for WeakMaps
  isWeakSet?: boolean;          // True for WeakSets
  isMap?: boolean;              // True for Maps
  isSet?: boolean;              // True for Sets
  isDate?: boolean;             // True for Dates
  isRegExp?: boolean;           // True for RegExp
  isError?: boolean;            // True for Errors
  referenceId?: number;         // Unique ID for this object
  isCircularReference?: boolean; // True if this is a circular reference
}
```

## Test Data

Kyrie exports a comprehensive `testdata` object containing examples of every AST node type. This is useful for testing, demonstrations, and understanding the library's capabilities.

### `testdata` Export

The `testdata` object includes:

**Primitives:**
- `null`, `undefined`
- Booleans: `boolean_true`, `boolean_false`
- Numbers: `number_integer`, `number_negative`, `number_float`, `number_scientific`, `number_zero`
- Strings: `string`, `string_empty`, `string_escaped`
- Symbols: `symbol_with_description`, `symbol_without_description`
- Function: `function`

**Simple Containers with All Primitives:**
- `array_all_primitives` - Array containing all non-container types
- `array_with_holes` - Sparse array with missing indices
- `object_all_primitives` - Object with all non-container types as properties
- `map_all_primitives` - Map with all non-container types
- `set_all_primitives` - Set with primitive values

**Special Types:**
- `date` - Date instance
- `regexp_with_flags`, `regexp_simple` - RegExp instances
- `error` - Error instance
- `weakmap` - WeakMap instance
- `weakset` - WeakSet instance

**Nested Containers:**
- `array_all_containers` - Array containing all container types
- `object_all_containers` - Object containing all container types
- `map_all_containers` - Map containing all container types
- `set_all_containers` - Set containing all container types

**Special Cases:**
- `deeply_nested` - Multi-level nested structure
- `circular` - Object with circular self-reference

**Example Usage:**

```typescript
import { testdata, parse_value, paint } from 'kyrie';

// Parse and paint any testdata item
const ast = parse_value(testdata.array_all_primitives);
console.log(paint(ast));

// Test with nested containers
const nestedAst = parse_value(testdata.object_all_containers);
console.log(paint(nestedAst, { palette: forestPalette }));

// Verify circular reference detection
const circularAst = parse_value(testdata.circular);
console.log(circularAst.properties.self.deep_type.isCircularReference); // true
```

## Development

### Running Tests

```bash
npm test
```

## License

MIT
