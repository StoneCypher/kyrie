# kyrie

Kyrie is a formatting colorizer for Javascript, Typescript, and JSON.

## Installation

```bash
npm install kyrie
```

## Usage

### Highlighting JSON

The main function is `highlight()`, which takes a JSON string and returns a highlighted version.

```typescript
import { highlight } from 'kyrie';

const json = '{"name": "John", "age": 30}';
const highlighted = highlight(json);
console.log(highlighted);
```

### API

#### `highlight(json: string, options?: HighlightOptions): string`

Highlights a JSON string with color codes.

**Parameters:**
- `json` (string): The JSON string to highlight
- `options` (HighlightOptions, optional): Configuration options for highlighting

**Returns:**
- string: The highlighted JSON string

**Example:**

```typescript
import { highlight, type HighlightOptions } from 'kyrie';

const json = '{"name": "Alice", "age": 25, "active": true}';
const options: HighlightOptions = {};
const result = highlight(json, options);
```

### HighlightOptions

An interface for configuring the highlight function. Options will be added as features are implemented.

```typescript
interface HighlightOptions {
  // Options will be defined as features are added
}
```

### Painting AST Nodes

The `paint()` function renders AST nodes with colors and formatting using Chalk for terminal output.

#### `paint(node: ASTNode, options?: HighlightOptions): string`

Converts an AST node into a colorized string representation.

**Parameters:**
- `node` (ASTNode): The AST node to paint
- `options` (HighlightOptions, optional): Configuration with palette and container settings. Defaults are used for any missing values.

**Returns:**
- string: The colorized string representation with ANSI escape codes

**Example: Using defaults**

```typescript
import { parse_string, paint } from 'kyrie';

const ast = parse_string('{"name": "Alice", "age": 25}');
const colored = paint(ast); // Uses default palette and containers
console.log(colored); // Outputs colorized JSON to terminal
```

**Example: With full options**

```typescript
import { parse_string, paint, defaultPalette, defaultContainers } from 'kyrie';

const ast = parse_string('{"name": "Alice", "age": 25}');
const options = {
  palette: defaultPalette,
  containers: defaultContainers
};
const colored = paint(ast, options);
console.log(colored); // Outputs colorized JSON to terminal
```

**Example: Partial options (merged with defaults)**

```typescript
import { parse_string, paint, forestPalette } from 'kyrie';

const ast = parse_string('[1, 2, 3]');
// Only specify palette, containers will use defaults
const colored = paint(ast, { palette: forestPalette });
console.log(colored);
```

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

## Development

### Running Tests

```bash
npm test
```

## License

MIT
