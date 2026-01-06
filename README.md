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
