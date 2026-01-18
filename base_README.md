# kyrie v{{version}}

> Version {{version}} was built on {{built_text}} `{{built}}` from hash `{{gh_hash}}`.

Most new users are here to find one of these things:

* [`log`](https://stonecypher.github.io/kyrie/docs/functions/log.html), which directly logs a colorized Javascript value to the console;
* [`ansi_from_value`](https://stonecypher.github.io/kyrie/docs/functions/ansi_from_value.html), which colorizes a Javascript value;
* [`ansi_from_string`](https://stonecypher.github.io/kyrie/docs/functions/ansi_from_string.html), which colorizes a string containing a Javascript value;
* the envvar [`kyrie_default`](https://stonecypher.github.io/kyrie/docs/#environment-variable), which locally sets kyrie behavior when not otherwise instructed; or
* the [`live previewer`](https://stonecypher.github.io/kyrie/previewer.html), to help find a color palette they like quickly.

<br/>

Kyrie is your one stop formatting and colorizing shop for Javascript, Typescript, and JSON, to go to your terminal, your HTML, your developer's console, and your logs.

Kyrie is a formatting colorizer for JavaScript, TypeScript, and JSON with customizable color palettes and container delimiters.

<br/>

Turn this: 

`##TODO IMAGE`

Into this: 

`##TODO IMAGE`

Or this:

`##TODO IMAGE`

Or a million other things.

<br/>

Useful getting started links:

* **[📚 Tutorial](https://stonecypher.github.io/kyrie/tutorial.md)** 
* **[📖 API Documentation](https://stonecypher.github.io/kyrie/docs/)**
* **[🖥️ Live previewer](https://stonecypher.github.io/kyrie/previewer.html)**

## Features

- 🌈 **16 million colors**: Uses Chalk with 24-bit RGB color support
- 🎨 **{{palettes}} built-in color palettes**: {{palettes}} themes, each with a light and dark variant, for {{palettevariants}} total themes
    - 🎨 **Vision accessability palettes**: Palettes for protanopia, deuteranopia, tritanopia, monochromacy, deuteranomaly, protanomaly, tritanomaly, achromatopsia (if you have these, please tell me how to improve these in an issue)
    - Bright, subtle, pastel, and vivid variants, each with a light and dark variant
- 🔧 **Fully customizable**: Create custom palettes and container delimiters
- 📦 **AST-based parsing**: Parse JSON strings or JavaScript values into detailed AST
- 🔄 **Circular reference detection**: Safely handles circular object references
- 🎯 **Type-aware**: Distinguishes between arrays, objects, Maps, Sets, Dates, RegExp, Errors, and more
- 💪 **TypeScript support**: Fully typed with strict TypeScript configuration
- ⚡ **One dependency** - Chalk, for terminal colors (a second, Commander, for the CLI only)
- ✅ **Strong testing**: Has {{coverage}}% test coverage from {{testcasecount}} test cases

## Installation

```bash
npm install kyrie
```

## Quick Start

```typescript
import { parse_string, paint_ansi } from 'kyrie';

// Parse JSON string to AST
const ast = parse_string('{"name": "Alice", "age": 25}');

// Paint with colors (uses default pastel palette)
const colored = paint_ansi(ast);
console.log(colored); // Outputs colorized JSON to terminal
```

## CLI Usage

Kyrie includes a command-line interface for highlighting JSON and JavaScript files.

```bash
# Highlight a file
kyrie myfile.json

# Read from stdin
echo '{"name": "John", "age": 30}' | kyrie

# Use a specific palette
kyrie --palette forest myfile.json

# Use dark theme variant
kyrie --theme dark --palette bold myfile.json

# Set maximum output width
kyrie --max-width 80 myfile.json

# Disable width limiting
kyrie --max-width false myfile.json
```

**CLI Options:**
- `-p, --palette <name>` - Color palette to use (default: "default")
- `-t, --theme <variant>` - Theme variant: "light" or "dark" (default: "light")
- `-w, --max-width <width>` - Maximum width for output (number or "false" to disable)
- `-o, --output-mode <mode>` - Output mode: ansi, html, chrome-console, or logger (default: "ansi")
- `-l, --line-unfolding <mode>` - Line unfolding mode: dense or expanded (default: "dense")
- `-i, --indent <value>` - Indentation (number or string) (default: 2)
- `-V, --version` - Output version number
- `-h, --help` - Display help information

### Environment Variable: `kyrie_default`

The `kyrie_default` environment variable allows you to configure default CLI behavior without passing command-line options. This is particularly useful for setting persistent preferences across all kyrie invocations.

**Usage:**

There are two ways to use `kyrie_default`:

1. **As a palette name** (simple string without `=`):
   ```bash
   export kyrie_default="forest"
   kyrie myfile.json  # Will use forest palette
   ```

2. **As configuration options** (comma-separated key=value pairs):
   ```bash
   export kyrie_default="palette=forest, theme=dark, indent=4"
   kyrie myfile.json  # Will use forest palette with dark theme and 4-space indent
   ```

**Supported configuration keys:**
- `palette` - Color palette name (e.g., "forest", "bold", "pastel")
- `theme` - Theme variant: "light" or "dark"
- `maxWidth` - Maximum output width (number or "false")
- `outputMode` - Output mode: "ansi", "html", "chrome-console", or "logger"
- `lineUnfolding` - Line unfolding mode: "dense" or "expanded"
- `indent` - Indentation value (number or string like "\\t")
- **AST node type colors** - Override specific colors for any AST node type (see below)

**Examples:**

```bash
# Set a default palette
export kyrie_default="forest"
kyrie data.json

# Configure multiple options
export kyrie_default="palette=bold, theme=dark, lineUnfolding=expanded, indent=2"
kyrie data.json

# Set maximum width
export kyrie_default="palette=pastel, maxWidth=80"
kyrie data.json

# Disable maximum width
export kyrie_default="maxWidth=false"
kyrie data.json
```

#### Palette Color Overrides

You can override specific colors for individual AST node types by specifying them in the `kyrie_default` environment variable. This allows you to customize colors without creating a full custom palette.

**Available AST node types:**
- `text`, `null`, `undefined`, `boolean`, `number`, `bigint`, `specialNumber`
- `string`, `symbol`, `function`, `object`, `array`, `map`, `set`
- `weakmap`, `weakset`, `date`, `regexp`, `error`, `circularReference`
- `propertyKey`, `punctuation`, `indentGuide`

**Color value formats:**
- Hex colors: `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (e.g., `#F00`, `#FF0000`, `#FF0000FF`)
- CSS color names: `red`, `blue`, `green`, etc.

**Examples:**

```bash
# Override specific colors with a base palette
export kyrie_default="palette=forest, number=#FFD700, string=#90EE90"
kyrie data.json

# Override multiple colors
export kyrie_default="palette=bold, theme=dark, number=#FFD700, string=#90EE90, error=#FF6B6B"
kyrie data.json

# Override colors without a base palette (uses default palette with overrides)
export kyrie_default="number=#FF0000, string=#00FF00, boolean=#0000FF"
kyrie data.json

# Use CSS color names
export kyrie_default="palette=pastel, number=gold, string=lightgreen, error=crimson"
kyrie data.json

# Combine with all options
export kyrie_default="palette=forest, theme=dark, number=#FFD700, lineUnfolding=expanded, indent=2"
kyrie data.json
```

**Note:**
- Command-line options will override environment variable settings
- Palette color overrides are applied on top of the selected palette (or default palette if none specified)
- The environment variable configuration is parsed and logged at startup

## Usage

### Colorizing JSON and JavaScript

The `paint_ansi()` function is the main way to colorize parsed values. It works with both `parse_string()` (for JSON/JavaScript strings) and `parse_value()` (for JavaScript values).

```typescript
import { parse_string, parse_value, paint_ansi, forestPalette } from 'kyrie';

// From JSON string
const ast1 = parse_string('{"name": "John", "age": 30}');
console.log(paint_ansi(ast1));

// From JavaScript value
const ast2 = parse_value({ name: 'John', age: 30 });
console.log(paint_ansi(ast2, { palette: forestPalette }));
```

### Highlighting JavaScript Values

The `highlight_value()` function provides a convenient way to directly colorize any JavaScript value without manually calling `parse_value()` and `paint_ansi()`. It combines both steps into a single function call.

```typescript
import { highlight_value } from 'kyrie';

const data = { name: 'John', age: 30 };
const highlighted = highlight_value(data);
console.log(highlighted); // Outputs colorized object
```

### API

#### `highlight_value(value: unknown, options?: Options): string`

Colorizes any JavaScript value by parsing it to an AST and painting it with colors.

**Parameters:**
- `value` (unknown): The JavaScript value to highlight (any type)
- `options` (Options, optional): Configuration options with palette and container settings

**Returns:**
- string: The colorized string with ANSI escape codes

**Example:**

```typescript
import { highlight_value, type Options, forestPalette } from 'kyrie';

const data = { name: 'Alice', age: 25, active: true };
const result = highlight_value(data);
console.log(result); // Uses default pastel palette

// With custom palette
const forestResult = highlight_value(data, { palette: forestPalette });
console.log(forestResult); // Uses forest palette
```

#### `highlight_string(str: string, options?: Options): string`

Colorizes a JSON or JavaScript string by parsing it to an AST and painting it with colors.

**Parameters:**
- `str` (string): The JSON or JavaScript string to highlight
- `options` (Options, optional): Configuration options with palette and container settings

**Returns:**
- string: The colorized string with ANSI escape codes

**Example:**

```typescript
import { highlight_string, type Options, boldPalette } from 'kyrie';

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

#### `log(value: unknown, options?: Options): void`

Console logs a JavaScript value with ANSI colors. Convenience function that combines `ansi_from_value()` with `console.log()` for quick debugging and output.

**Parameters:**
- `value` (unknown): The JavaScript value to log to console (any type)
- `options` (Options, optional): Configuration options with palette and container settings

**Returns:**
- void (outputs directly to console)

**Example:**

```typescript
import { log, palettes } from 'kyrie';

const data = { name: 'Alice', age: 25, active: true };
log(data); // Outputs colorized object to console

// With custom palette
log(data, { palette: palettes.bold.dark });

// Works with any value type
log([1, 2, 3, "hello", true]);
log("simple string");
log({ nested: { objects: [1, 2, 3] } });
```

### Options

Configuration interface for highlighting and painting functions.

```typescript
interface Options {
  palette?: ColorPalette;           // Color scheme to use
  containers?: ContainerConfig;     // Container delimiter configuration
  maxWidth?: number | false | undefined; // Maximum output width (characters)
}
```

**Properties:**
- `palette` - Color scheme to use for syntax highlighting
- `containers` - Container delimiter configuration for formatting
- `maxWidth` - Maximum width for output in characters
  - `number` - Specific maximum width (e.g., `80` for 80 characters)
  - `false` - Explicitly disable width limiting
  - `undefined` - Use default behavior (no width limit)

**Available exports:**
- `defaultOptions` - Pre-configured with defaultPalette and defaultContainers
- `defaultPalette`, `forestPalette`, `boldPalette`, `duskPalette` - Built-in color schemes
- `defaultContainers` - Default container delimiters

### Painting AST Nodes

Kyrie provides three paint functions for different output formats:
- `paint_ansi()` - ANSI escape codes for terminal display (using Chalk)
- `paint_html()` - HTML with inline CSS for web browsers
- `paint_log()` - Plain text for logging and environments without color support

#### `paint_ansi(node: ASTNode, options?: Options): string`

Renders AST nodes with colors and formatting using Chalk. Converts parsed AST nodes into colorized strings with ANSI escape codes for terminal display. Colors are always generated regardless of environment (forced color support at 16 million color level).

Converts an AST node into a colorized string representation.

**Parameters:**
- `node` (ASTNode): The AST node to paint
- `options` (Options, optional): Configuration with palette and container settings. Defaults are used for any missing values.

**Returns:**
- string: The colorized string representation with ANSI escape codes (24-bit RGB colors)

**Example: Basic usage (using defaults)**

```typescript
import { parse_string, paint_ansi } from 'kyrie';

const ast = parse_string('{"name": "Alice", "age": 25}');
const colored = paint_ansi(ast);
console.log(colored);
// Outputs: {"name": "Alice", "age": 25} with colors
```

**Example: Using different palettes**

```typescript
import { parse_string, paint_ansi, forestPalette, boldPalette, duskPalette } from 'kyrie';

const ast = parse_string('[1, 2, 3, "hello", true, null]');

// Forest theme
console.log(paint_ansi(ast, { palette: forestPalette }));

// Bold vibrant colors
console.log(paint_ansi(ast, { palette: boldPalette }));

// Dark theme (near-black colors)
console.log(paint_ansi(ast, { palette: duskPalette }));
```

**Example: Custom containers with default palette**

```typescript
import { parse_string, paint_ansi, type ContainerConfig } from 'kyrie';

const customContainers: ContainerConfig = {
  array: { start: '<<', delimiter: '|', end: '>>' },
  object: { start: 'obj{', separator: ' => ', delimiter: '; ', end: '}' }
};

const ast = parse_string('{"items": [1, 2, 3]}');
const colored = paint_ansi(ast, { containers: customContainers });
console.log(colored);
// Outputs: obj{items => <<1| 2| 3>>} with colors
```

**Example: Painting JavaScript values directly**

```typescript
import { parse_value, paint_ansi } from 'kyrie';

// Parse and paint any JavaScript value
const obj = { users: ['Alice', 'Bob'], count: 2 };
const ast = parse_value(obj);
const colored = paint_ansi(ast);
console.log(colored);
```

**Note:** The paint_ansi function uses Chalk with forced color support (level 3 - 16 million colors). This ensures ANSI color codes are always generated in the output, regardless of the environment. When displayed in a color-supporting terminal, you'll see the fully colorized output.

#### `paint_html(node: ASTNode, options?: Options): string`

Converts an AST node into an HTML-formatted string with inline CSS color styling. Perfect for web browser output.

**Parameters:**
- `node` (ASTNode): The AST node to paint
- `options` (Options, optional): Configuration with palette and container settings

**Returns:**
- string: HTML string with `<span>` tags and inline CSS styles

**Example:**

```typescript
import { parse_value, paint_html } from 'kyrie';

const data = { name: "Alice", score: 95 };
const ast = parse_value(data);
const html = paint_html(ast);
document.body.innerHTML = `<pre>${html}</pre>`;
// Renders colorized JSON in browser
```

#### `paint_log(node: ASTNode, options?: Options): string`

Converts an AST node into plain text without any color formatting. Ideal for logging to files, databases, or environments without color support.

**Parameters:**
- `node` (ASTNode): The AST node to paint
- `options` (Options, optional): Configuration with container settings (palette is ignored)

**Returns:**
- string: Plain text representation without any formatting codes

**Example:**

```typescript
import { parse_value, paint_log } from 'kyrie';
import fs from 'fs';

const logData = { level: "error", message: "Failed to connect", code: 500 };
const ast = parse_value(logData);
const plainText = paint_log(ast);

// Write to log file without ANSI codes
fs.appendFileSync('app.log', plainText + '\n');

// Or log to console as plain text
console.log(plainText);
// Outputs: {level: "error", message: "Failed to connect", code: 500}
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
import { parse_string, paint_ansi, defaultPalette, type ContainerConfig } from 'kyrie';

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
const result = paint_ansi(ast, options);
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
import { testdata, parse_value, paint_ansi } from 'kyrie';

// Parse and paint any testdata item
const ast = parse_value(testdata.array_all_primitives);
console.log(paint_ansi(ast));

// Test with nested containers
const nestedAst = parse_value(testdata.object_all_containers);
console.log(paint_ansi(nestedAst, { palette: forestPalette }));

// Verify circular reference detection
const circularAst = parse_value(testdata.circular);
console.log(circularAst.properties.self.deep_type.isCircularReference); // true
```

## Available Palettes

Kyrie includes 120 themed palettes, each with light and dark variants:

### Palette Themes

- **default** - Balanced, standard colors suitable for general use
  - `palettes.default.light` - Dark colors for light backgrounds
  - `palettes.default.dark` - Light colors for dark backgrounds

- **pastel** - Soft, muted colors with gentle tones
  - `palettes.pastel.light` - Dark pastels for light backgrounds
  - `palettes.pastel.dark` - Light pastels for dark backgrounds

- **garden** - Greens and earth tones inspired by nature
  - `palettes.garden.light` - Dark garden colors for light backgrounds
  - `palettes.garden.dark` - Light garden colors for dark backgrounds

- **forest** - Deeper greens and browns with rich, natural hues
  - `palettes.forest.light` - Dark forest colors for light backgrounds
  - `palettes.forest.dark` - Light forest colors for dark backgrounds

- **bold** - Vibrant, saturated colors with high contrast
  - `palettes.bold.light` - Dark bold colors for light backgrounds
  - `palettes.bold.dark` - Light bold colors for dark backgrounds

- **dusk** - Purples and twilight colors for a moody atmosphere
  - `palettes.dusk.light` - Dark dusk colors for light backgrounds
  - `palettes.dusk.dark` - Light dusk colors for dark backgrounds

- **lightPastel** - Very light, delicate colors with soft contrast
  - `palettes.lightPastel.light` - Muted light pastels for light backgrounds
  - `palettes.lightPastel.dark` - Bright light pastels for dark backgrounds

- **funky** - Unusual, bright, varied colors for a playful look
  - `palettes.funky.light` - Dark funky colors for light backgrounds
  - `palettes.funky.dark` - Light funky colors for dark backgrounds

- **boring** - Muted, low-saturation grays and subdued colors
  - `palettes.boring.light` - Dark grays for light backgrounds
  - `palettes.boring.dark` - Light grays for dark backgrounds

- **mobster** - Film noir and gangster-inspired dark tones
  - `palettes.mobster.light` - Dark noir colors for light backgrounds
  - `palettes.mobster.dark` - Light silver/gray tones for dark backgrounds

- **money** - Currency-inspired greens and golds
  - `palettes.money.light` - Dark money greens for light backgrounds
  - `palettes.money.dark` - Light gold and green tones for dark backgrounds

- **skeleton** - Bone whites and grays with ghostly tones
  - `palettes.skeleton.light` - Dark bone colors for light backgrounds
  - `palettes.skeleton.dark` - Light bone whites for dark backgrounds

- **sinister** - Dark and ominous color scheme
  - `palettes.sinister.light` - Very dark sinister tones for light backgrounds
  - `palettes.sinister.dark` - Muted threatening colors for dark backgrounds

- **halloween** - Orange, purple, black, and green seasonal colors
  - `palettes.halloween.light` - Dark Halloween colors for light backgrounds
  - `palettes.halloween.dark` - Bright Halloween colors for dark backgrounds

- **vampire** - Blood reds, blacks, and pale gothic colors
  - `palettes.vampire.light` - Very dark vampiric tones for light backgrounds
  - `palettes.vampire.dark` - Pale and blood-red colors for dark backgrounds

- **grayscale** - Pure grayscale with no color saturation
  - `palettes.grayscale.light` - Dark grays for light backgrounds
  - `palettes.grayscale.dark` - Light grays for dark backgrounds

- **blues** - Various shades of blue throughout
  - `palettes.blues.light` - Dark blues for light backgrounds
  - `palettes.blues.dark` - Light sky and ocean blues for dark backgrounds

- **circus** - Bright festive reds, yellows, and primary colors
  - `palettes.circus.light` - Saturated circus colors for light backgrounds
  - `palettes.circus.dark` - Bright carnival colors for dark backgrounds

- **monkey** - Browns, tans, and jungle-inspired earth tones
  - `palettes.monkey.light` - Dark brown and tan for light backgrounds
  - `palettes.monkey.dark` - Light brown and cream tones for dark backgrounds

- **sky** - Sky blues with sun yellows and cloud whites
  - `palettes.sky.light` - Dark sky blues for light backgrounds
  - `palettes.sky.dark` - Bright sky and sun colors for dark backgrounds

- **protanopia** - Red color blindness (no red perception, uses blues and yellows)
  - `palettes.protanopia.light` - Dark blues and yellows for light backgrounds
  - `palettes.protanopia.dark` - Light blues and yellows for dark backgrounds

- **deuteranopia** - Green color blindness (no green perception, uses blues and yellows)
  - `palettes.deuteranopia.light` - Dark blues and yellows for light backgrounds
  - `palettes.deuteranopia.dark` - Light blues and yellows for dark backgrounds

- **tritanopia** - Blue color blindness (no blue perception, uses reds, greens, and yellows)
  - `palettes.tritanopia.light` - Dark warm colors for light backgrounds
  - `palettes.tritanopia.dark` - Light warm colors for dark backgrounds

- **monochromacy** - Complete color blindness (grayscale only, distinct brightness levels)
  - `palettes.monochromacy.light` - Dark grays with varied brightness for light backgrounds
  - `palettes.monochromacy.dark` - Light grays with varied brightness for dark backgrounds

- **deuteranomaly** - Weak green perception (reduced greens, emphasizes blues and yellows)
  - `palettes.deuteranomaly.light` - Dark blues and yellows for light backgrounds
  - `palettes.deuteranomaly.dark` - Light blues and yellows for dark backgrounds

- **protanomaly** - Weak red perception (reduced reds, emphasizes blues and yellows)
  - `palettes.protanomaly.light` - Dark blues and yellows for light backgrounds
  - `palettes.protanomaly.dark` - Light blues and yellows for dark backgrounds

- **tritanomaly** - Weak blue perception (reduced blues, emphasizes reds and greens)
  - `palettes.tritanomaly.light` - Dark warm colors for light backgrounds
  - `palettes.tritanomaly.dark` - Light warm colors for dark backgrounds

- **achromatopsia** - Rod monochromacy (complete absence of cone function, grayscale only)
  - `palettes.achromatopsia.light` - Dark grays with varied brightness for light backgrounds
  - `palettes.achromatopsia.dark` - Light grays with varied brightness for dark backgrounds

- **rainbow** - Vibrant spectrum of colors across the rainbow
  - `palettes.rainbow.light` - Dark rainbow colors for light backgrounds
  - `palettes.rainbow.dark` - Bright rainbow colors for dark backgrounds

- **mutedRainbow** - Softer, desaturated rainbow spectrum
  - `palettes.mutedRainbow.light` - Dark muted rainbow for light backgrounds
  - `palettes.mutedRainbow.dark` - Light muted rainbow for dark backgrounds

- **sunflower** - Warm yellows and browns inspired by sunflowers
  - `palettes.sunflower.light` - Dark gold and brown for light backgrounds
  - `palettes.sunflower.dark` - Bright yellow and warm tones for dark backgrounds

- **strawberry** - Reds, pinks, and berry-inspired colors
  - `palettes.strawberry.light` - Dark berry reds for light backgrounds
  - `palettes.strawberry.dark` - Light pink and red tones for dark backgrounds

- **brownAndGreen** - Earth tones combining browns and greens
  - `palettes.brownAndGreen.light` - Dark brown and green for light backgrounds
  - `palettes.brownAndGreen.dark` - Light tan and sage for dark backgrounds

- **solarFlare** - Intense oranges, yellows, and hot colors
  - `palettes.solarFlare.light` - Dark solar colors for light backgrounds
  - `palettes.solarFlare.dark` - Bright solar yellows and oranges for dark backgrounds

- **purpleToOrange** - Gradient from purple through red to orange
  - `palettes.purpleToOrange.light` - Dark gradient colors for light backgrounds
  - `palettes.purpleToOrange.dark` - Bright gradient colors for dark backgrounds

- **commodore64** - Retro computer palette inspired by the Commodore 64
  - `palettes.commodore64.light` - Dark C64 colors for light backgrounds
  - `palettes.commodore64.dark` - Bright C64 colors for dark backgrounds

- **military** - Olive greens, khakis, and camouflage-inspired earth tones
  - `palettes.military.light` - Dark military colors for light backgrounds
  - `palettes.military.dark` - Light olive and khaki for dark backgrounds

- **police** - Blues and blacks with emergency light accents
  - `palettes.police.light` - Dark police blues for light backgrounds
  - `palettes.police.dark` - Light blue and white tones for dark backgrounds

- **hacker** - Matrix-inspired greens and terminal colors
  - `palettes.hacker.light` - Dark terminal greens for light backgrounds
  - `palettes.hacker.dark` - Bright matrix greens for dark backgrounds

- **wizard** - Mystical purples, blues, and magical tones
  - `palettes.wizard.light` - Dark mystical colors for light backgrounds
  - `palettes.wizard.dark` - Bright magical purples and blues for dark backgrounds

- **butterfly** - Delicate, varied colors inspired by butterfly wings
  - `palettes.butterfly.light` - Dark wing colors for light backgrounds
  - `palettes.butterfly.dark` - Bright vibrant wing colors for dark backgrounds

- **gunmetal** - Dark grays and metallic tones
  - `palettes.gunmetal.light` - Very dark metallic grays for light backgrounds
  - `palettes.gunmetal.dark` - Light metallic tones for dark backgrounds

- **cocaCola** - Classic red and white brand colors
  - `palettes.cocaCola.light` - Dark Coca-Cola reds for light backgrounds
  - `palettes.cocaCola.dark` - Bright reds and whites for dark backgrounds

- **ogre** - Swamp greens and muddy browns
  - `palettes.ogre.light` - Dark swamp colors for light backgrounds
  - `palettes.ogre.dark` - Light moss and mud tones for dark backgrounds

- **burglar** - Black, gray stripes, and stealth colors
  - `palettes.burglar.light` - Very dark grays and blacks for light backgrounds
  - `palettes.burglar.dark` - Light grays for dark backgrounds

- **crystal** - Clear, icy blues and whites with gem-like tones
  - `palettes.crystal.light` - Dark crystal blues for light backgrounds
  - `palettes.crystal.dark` - Bright icy and white tones for dark backgrounds

- **laser** - Neon reds, pinks, and bright sci-fi colors
  - `palettes.laser.light` - Dark laser colors for light backgrounds
  - `palettes.laser.dark` - Bright neon laser colors for dark backgrounds

- **kungFu** - Martial arts-inspired oranges, golds, and reds
  - `palettes.kungFu.light` - Dark martial arts colors for light backgrounds
  - `palettes.kungFu.dark` - Bright gold and red tones for dark backgrounds

- **starTrek** - Starfleet command gold, science blue, and engineering red
  - `palettes.starTrek.light` - Dark Trek colors for light backgrounds
  - `palettes.starTrek.dark` - Bright Starfleet colors for dark backgrounds

- **antique** - Aged browns, sepias, and vintage tones
  - `palettes.antique.light` - Dark sepia and brown for light backgrounds
  - `palettes.antique.dark` - Light aged cream and tan for dark backgrounds

- **book** - Paper whites, ink blacks, and library colors
  - `palettes.book.light` - Dark ink colors for light backgrounds
  - `palettes.book.dark` - Light cream and aged paper for dark backgrounds

- **eighties** - Neon pinks, purples, and retro 1980s colors
  - `palettes.eighties.light` - Dark 80s colors for light backgrounds
  - `palettes.eighties.dark` - Bright neon 80s colors for dark backgrounds

- **neon** - Ultra-bright neon colors for signs and displays
  - `palettes.neon.light` - Dark neon base colors for light backgrounds
  - `palettes.neon.dark` - Bright glowing neon for dark backgrounds

- **flowers** - Colorful floral-inspired palette with varied hues
  - `palettes.flowers.light` - Dark floral colors for light backgrounds
  - `palettes.flowers.dark` - Bright petal colors for dark backgrounds

- **logger** - Wood browns, bark grays, and forest work colors
  - `palettes.logger.light` - Dark wood and bark for light backgrounds
  - `palettes.logger.dark` - Light lumber and sawdust tones for dark backgrounds

- **system** - Terminal grays, tech blues, and computer interface colors
  - `palettes.system.light` - Dark system colors for light backgrounds
  - `palettes.system.dark` - Light terminal colors for dark backgrounds

- **alien** - Otherworldly greens, purples, and sci-fi extraterrestrial colors
  - `palettes.alien.light` - Dark alien colors for light backgrounds
  - `palettes.alien.dark` - Bright UFO and alien greens for dark backgrounds

- **protanopiaBright** - Red color blindness with bright, saturated blues and yellows (no reds)
  - `palettes.protanopiaBright.light` - Dark bright blues and yellows for light backgrounds
  - `palettes.protanopiaBright.dark` - Bright vibrant blues and yellows for dark backgrounds

- **protanopiaSubtle** - Red color blindness with muted, low-saturation blues and yellows (no reds)
  - `palettes.protanopiaSubtle.light` - Dark muted blues and yellows for light backgrounds
  - `palettes.protanopiaSubtle.dark` - Light muted blues and yellows for dark backgrounds

- **protanopiaPastel** - Red color blindness with soft, pastel blues and yellows (no reds)
  - `palettes.protanopiaPastel.light` - Dark pastel blues and yellows for light backgrounds
  - `palettes.protanopiaPastel.dark` - Light pastel blues and yellows for dark backgrounds

- **protanopiaBoring** - Red color blindness with grayscale-ish, very muted tones (no reds)
  - `palettes.protanopiaBoring.light` - Dark grayscale blues and yellows for light backgrounds
  - `palettes.protanopiaBoring.dark` - Light grayscale blues and yellows for dark backgrounds

- **protanopiaFunky** - Red color blindness with playful, unusual blues and yellows (no reds)
  - `palettes.protanopiaFunky.light` - Dark funky blues and yellows for light backgrounds
  - `palettes.protanopiaFunky.dark` - Bright playful blues and yellows for dark backgrounds

- **protanopiaVivid** - Red color blindness with intense, highly saturated blues and yellows (no reds)
  - `palettes.protanopiaVivid.light` - Very dark vivid blues and yellows for light backgrounds
  - `palettes.protanopiaVivid.dark` - Very bright vivid blues and yellows for dark backgrounds

- **deuteranopiaBright** - Green color blindness with bright, saturated blues and yellows (no greens)
  - `palettes.deuteranopiaBright.light` - Dark bright blues and yellows for light backgrounds
  - `palettes.deuteranopiaBright.dark` - Bright vibrant blues and yellows for dark backgrounds

- **deuteranopiaSubtle** - Green color blindness with muted, low-saturation blues and yellows (no greens)
  - `palettes.deuteranopiaSubtle.light` - Dark muted blues and yellows for light backgrounds
  - `palettes.deuteranopiaSubtle.dark` - Light muted blues and yellows for dark backgrounds

- **deuteranopiaPastel** - Green color blindness with soft, pastel blues and yellows (no greens)
  - `palettes.deuteranopiaPastel.light` - Dark pastel blues and yellows for light backgrounds
  - `palettes.deuteranopiaPastel.dark` - Light pastel blues and yellows for dark backgrounds

- **deuteranopiaBoring** - Green color blindness with grayscale-ish, very muted tones (no greens)
  - `palettes.deuteranopiaBoring.light` - Dark grayscale blues and yellows for light backgrounds
  - `palettes.deuteranopiaBoring.dark` - Light grayscale blues and yellows for dark backgrounds

- **deuteranopiaFunky** - Green color blindness with playful, unusual blues and yellows (no greens)
  - `palettes.deuteranopiaFunky.light` - Dark funky blues and yellows for light backgrounds
  - `palettes.deuteranopiaFunky.dark` - Bright playful blues and yellows for dark backgrounds

- **deuteranopiaVivid** - Green color blindness with intense, highly saturated blues and yellows (no greens)
  - `palettes.deuteranopiaVivid.light` - Very dark vivid blues and yellows for light backgrounds
  - `palettes.deuteranopiaVivid.dark` - Very bright vivid blues and yellows for dark backgrounds

- **tritanopiaBright** - Blue color blindness with bright, saturated reds, greens, and yellows (no blues)
  - `palettes.tritanopiaBright.light` - Dark bright warm colors for light backgrounds
  - `palettes.tritanopiaBright.dark` - Bright vibrant warm colors for dark backgrounds

- **tritanopiaSubtle** - Blue color blindness with muted, low-saturation reds, greens, and yellows (no blues)
  - `palettes.tritanopiaSubtle.light` - Dark muted warm colors for light backgrounds
  - `palettes.tritanopiaSubtle.dark` - Light muted warm colors for dark backgrounds

- **tritanopiaPastel** - Blue color blindness with soft, pastel reds, greens, and yellows (no blues)
  - `palettes.tritanopiaPastel.light` - Dark pastel warm colors for light backgrounds
  - `palettes.tritanopiaPastel.dark` - Light pastel warm colors for dark backgrounds

- **tritanopiaBoring** - Blue color blindness with grayscale-ish, very muted warm tones (no blues)
  - `palettes.tritanopiaBoring.light` - Dark grayscale warm colors for light backgrounds
  - `palettes.tritanopiaBoring.dark` - Light grayscale warm colors for dark backgrounds

- **tritanopiaFunky** - Blue color blindness with playful, unusual reds, greens, and yellows (no blues)
  - `palettes.tritanopiaFunky.light` - Dark funky warm colors for light backgrounds
  - `palettes.tritanopiaFunky.dark` - Bright playful warm colors for dark backgrounds

- **tritanopiaVivid** - Blue color blindness with intense, highly saturated reds, greens, and yellows (no blues)
  - `palettes.tritanopiaVivid.light` - Very dark vivid warm colors for light backgrounds
  - `palettes.tritanopiaVivid.dark` - Very bright vivid warm colors for dark backgrounds

- **monochromacyBright** - Complete color blindness with bright, high-contrast grayscale (no colors, only grays)
  - `palettes.monochromacyBright.light` - Very dark grays with strong brightness contrast for light backgrounds
  - `palettes.monochromacyBright.dark` - Very light grays with strong brightness contrast for dark backgrounds

- **monochromacySubtle** - Complete color blindness with subtle, moderate grayscale contrast (no colors, only grays)
  - `palettes.monochromacySubtle.light` - Dark grays with moderate brightness levels for light backgrounds
  - `palettes.monochromacySubtle.dark` - Light grays with moderate brightness levels for dark backgrounds

- **monochromacyPastel** - Complete color blindness with soft, light grayscale tones (no colors, only grays)
  - `palettes.monochromacyPastel.light` - Medium-dark grays with subtle contrast for light backgrounds
  - `palettes.monochromacyPastel.dark` - Very light grays with subtle contrast for dark backgrounds

- **monochromacyBoring** - Complete color blindness with minimal, low-contrast grayscale (no colors, only grays)
  - `palettes.monochromacyBoring.light` - Dark grays with minimal brightness variation for light backgrounds
  - `palettes.monochromacyBoring.dark` - Light grays with minimal brightness variation for dark backgrounds

- **monochromacyFunky** - Complete color blindness with varied, distinct grayscale levels (no colors, only grays)
  - `palettes.monochromacyFunky.light` - Very dark to black grays with high variation for light backgrounds
  - `palettes.monochromacyFunky.dark` - Very light to white grays with high variation for dark backgrounds

- **monochromacyVivid** - Complete color blindness with extreme, maximum-contrast grayscale (no colors, only grays)
  - `palettes.monochromacyVivid.light` - Pure blacks and very dark grays for light backgrounds
  - `palettes.monochromacyVivid.dark` - Pure whites and very light grays for dark backgrounds

- **deuteranomalyBright** - Weak green perception with bright, saturated blues and yellows (reduced greens)
  - `palettes.deuteranomalyBright.light` - Dark bright blues and yellows for light backgrounds
  - `palettes.deuteranomalyBright.dark` - Bright vibrant blues and yellows for dark backgrounds

- **deuteranomalySubtle** - Weak green perception with muted, low-saturation blues and yellows (reduced greens)
  - `palettes.deuteranomalySubtle.light` - Dark muted blues and yellows for light backgrounds
  - `palettes.deuteranomalySubtle.dark` - Light muted blues and yellows for dark backgrounds

- **deuteranomalyPastel** - Weak green perception with soft, pastel blues and yellows (reduced greens)
  - `palettes.deuteranomalyPastel.light` - Dark pastel blues and yellows for light backgrounds
  - `palettes.deuteranomalyPastel.dark` - Light pastel blues and yellows for dark backgrounds

- **deuteranomalyBoring** - Weak green perception with grayscale-ish, very muted tones (reduced greens)
  - `palettes.deuteranomalyBoring.light` - Dark grayscale blues and yellows for light backgrounds
  - `palettes.deuteranomalyBoring.dark` - Light grayscale blues and yellows for dark backgrounds

- **deuteranomalyFunky** - Weak green perception with playful, unusual blues and yellows (reduced greens)
  - `palettes.deuteranomalyFunky.light` - Dark funky blues and yellows for light backgrounds
  - `palettes.deuteranomalyFunky.dark` - Bright playful blues and yellows for dark backgrounds

- **deuteranomalyVivid** - Weak green perception with intense, highly saturated blues and yellows (reduced greens)
  - `palettes.deuteranomalyVivid.light` - Very dark vivid blues and yellows for light backgrounds
  - `palettes.deuteranomalyVivid.dark` - Very bright vivid blues and yellows for dark backgrounds

- **protanomalyBright** - Weak red perception with bright, saturated blues and yellows (reduced reds)
  - `palettes.protanomalyBright.light` - Dark bright blues and yellows for light backgrounds
  - `palettes.protanomalyBright.dark` - Bright vibrant blues and yellows for dark backgrounds

- **protanomalySubtle** - Weak red perception with muted, low-saturation blues and yellows (reduced reds)
  - `palettes.protanomalySubtle.light` - Dark muted blues and yellows for light backgrounds
  - `palettes.protanomalySubtle.dark` - Light muted blues and yellows for dark backgrounds

- **protanomalyPastel** - Weak red perception with soft, pastel blues and yellows (reduced reds)
  - `palettes.protanomalyPastel.light` - Dark pastel blues and yellows for light backgrounds
  - `palettes.protanomalyPastel.dark` - Light pastel blues and yellows for dark backgrounds

- **protanomalyBoring** - Weak red perception with grayscale-ish, very muted tones (reduced reds)
  - `palettes.protanomalyBoring.light` - Dark grayscale blues and yellows for light backgrounds
  - `palettes.protanomalyBoring.dark` - Light grayscale blues and yellows for dark backgrounds

- **protanomalyFunky** - Weak red perception with playful, unusual blues and yellows (reduced reds)
  - `palettes.protanomalyFunky.light` - Dark funky blues and yellows for light backgrounds
  - `palettes.protanomalyFunky.dark` - Bright playful blues and yellows for dark backgrounds

- **protanomalyVivid** - Weak red perception with intense, highly saturated blues and yellows (reduced reds)
  - `palettes.protanomalyVivid.light` - Very dark vivid blues and yellows for light backgrounds
  - `palettes.protanomalyVivid.dark` - Very bright vivid blues and yellows for dark backgrounds

- **tritanomalyBright** - Weak blue perception with bright, saturated reds, greens, and yellows (reduced blues)
  - `palettes.tritanomalyBright.light` - Dark bright warm colors for light backgrounds
  - `palettes.tritanomalyBright.dark` - Bright vibrant warm colors for dark backgrounds

- **tritanomalySubtle** - Weak blue perception with muted, low-saturation reds, greens, and yellows (reduced blues)
  - `palettes.tritanomalySubtle.light` - Dark muted warm colors for light backgrounds
  - `palettes.tritanomalySubtle.dark` - Light muted warm colors for dark backgrounds

- **tritanomalyPastel** - Weak blue perception with soft, pastel reds, greens, and yellows (reduced blues)
  - `palettes.tritanomalyPastel.light` - Dark pastel warm colors for light backgrounds
  - `palettes.tritanomalyPastel.dark` - Light pastel warm colors for dark backgrounds

- **tritanomalyBoring** - Weak blue perception with grayscale-ish, very muted warm tones (reduced blues)
  - `palettes.tritanomalyBoring.light` - Dark grayscale warm colors for light backgrounds
  - `palettes.tritanomalyBoring.dark` - Light grayscale warm colors for dark backgrounds

- **tritanomalyFunky** - Weak blue perception with playful, unusual reds, greens, and yellows (reduced blues)
  - `palettes.tritanomalyFunky.light` - Dark funky warm colors for light backgrounds
  - `palettes.tritanomalyFunky.dark` - Bright playful warm colors for dark backgrounds

- **tritanomalyVivid** - Weak blue perception with intense, highly saturated reds, greens, and yellows (reduced blues)
  - `palettes.tritanomalyVivid.light` - Very dark vivid warm colors for light backgrounds
  - `palettes.tritanomalyVivid.dark` - Very bright vivid warm colors for dark backgrounds

- **redsAndOranges** - Color combination with predominantly red tones accented by orange
  - `palettes.redsAndOranges.light` - Dark reds with orange accents for light backgrounds
  - `palettes.redsAndOranges.dark` - Bright reds with orange accents for dark backgrounds

- **redsAndYellows** - Color combination with predominantly red tones accented by yellow
  - `palettes.redsAndYellows.light` - Dark reds with yellow accents for light backgrounds
  - `palettes.redsAndYellows.dark` - Bright reds with yellow accents for dark backgrounds

- **redsAndGreens** - Color combination with predominantly red tones accented by green
  - `palettes.redsAndGreens.light` - Dark reds with green accents for light backgrounds
  - `palettes.redsAndGreens.dark` - Bright reds with green accents for dark backgrounds

- **redsAndBlues** - Color combination with predominantly red tones accented by blue
  - `palettes.redsAndBlues.light` - Dark reds with blue accents for light backgrounds
  - `palettes.redsAndBlues.dark` - Bright reds with blue accents for dark backgrounds

- **redsAndPurples** - Color combination with predominantly red tones accented by purple
  - `palettes.redsAndPurples.light` - Dark reds with purple accents for light backgrounds
  - `palettes.redsAndPurples.dark` - Bright reds with purple accents for dark backgrounds

- **redsAndBrowns** - Color combination with predominantly red tones accented by brown
  - `palettes.redsAndBrowns.light` - Dark reds with brown accents for light backgrounds
  - `palettes.redsAndBrowns.dark` - Bright reds with brown accents for dark backgrounds

- **redsAndGrays** - Color combination with predominantly red tones accented by gray
  - `palettes.redsAndGrays.light` - Dark reds with gray accents for light backgrounds
  - `palettes.redsAndGrays.dark` - Bright reds with gray accents for dark backgrounds

- **redsAndMagentas** - Color combination with predominantly red tones accented by magenta
  - `palettes.redsAndMagentas.light` - Dark reds with magenta accents for light backgrounds
  - `palettes.redsAndMagentas.dark` - Bright reds with magenta accents for dark backgrounds

- **redsAndCyans** - Color combination with predominantly red tones accented by cyan
  - `palettes.redsAndCyans.light` - Dark reds with cyan accents for light backgrounds
  - `palettes.redsAndCyans.dark` - Bright reds with cyan accents for dark backgrounds

- **redsAndCharcoals** - Color combination with predominantly red tones accented by charcoal
  - `palettes.redsAndCharcoals.light` - Dark reds with charcoal accents for light backgrounds
  - `palettes.redsAndCharcoals.dark` - Bright reds with charcoal accents for dark backgrounds

- **orangesAndReds** - Color combination with predominantly orange tones accented by red
  - `palettes.orangesAndReds.light` - Dark oranges with red accents for light backgrounds
  - `palettes.orangesAndReds.dark` - Bright oranges with red accents for dark backgrounds

- **orangesAndYellows** - Color combination with predominantly orange tones accented by yellow
  - `palettes.orangesAndYellows.light` - Dark oranges with yellow accents for light backgrounds
  - `palettes.orangesAndYellows.dark` - Bright oranges with yellow accents for dark backgrounds

- **orangesAndGreens** - Color combination with predominantly orange tones accented by green
  - `palettes.orangesAndGreens.light` - Dark oranges with green accents for light backgrounds
  - `palettes.orangesAndGreens.dark` - Bright oranges with green accents for dark backgrounds

- **orangesAndBlues** - Color combination with predominantly orange tones accented by blue
  - `palettes.orangesAndBlues.light` - Dark oranges with blue accents for light backgrounds
  - `palettes.orangesAndBlues.dark` - Bright oranges with blue accents for dark backgrounds

- **orangesAndPurples** - Color combination with predominantly orange tones accented by purple
  - `palettes.orangesAndPurples.light` - Dark oranges with purple accents for light backgrounds
  - `palettes.orangesAndPurples.dark` - Bright oranges with purple accents for dark backgrounds

- **orangesAndBrowns** - Color combination with predominantly orange tones accented by brown
  - `palettes.orangesAndBrowns.light` - Dark oranges with brown accents for light backgrounds
  - `palettes.orangesAndBrowns.dark` - Bright oranges with brown accents for dark backgrounds

- **orangesAndGrays** - Color combination with predominantly orange tones accented by gray
  - `palettes.orangesAndGrays.light` - Dark oranges with gray accents for light backgrounds
  - `palettes.orangesAndGrays.dark` - Bright oranges with gray accents for dark backgrounds

- **orangesAndMagentas** - Color combination with predominantly orange tones accented by magenta
  - `palettes.orangesAndMagentas.light` - Dark oranges with magenta accents for light backgrounds
  - `palettes.orangesAndMagentas.dark` - Bright oranges with magenta accents for dark backgrounds

- **orangesAndCyans** - Color combination with predominantly orange tones accented by cyan
  - `palettes.orangesAndCyans.light` - Dark oranges with cyan accents for light backgrounds
  - `palettes.orangesAndCyans.dark` - Bright oranges with cyan accents for dark backgrounds

- **orangesAndCharcoals** - Color combination with predominantly orange tones accented by charcoal
  - `palettes.orangesAndCharcoals.light` - Dark oranges with charcoal accents for light backgrounds
  - `palettes.orangesAndCharcoals.dark` - Bright oranges with charcoal accents for dark backgrounds

- **yellowsAndReds** - Color combination with predominantly yellow tones accented by red
  - `palettes.yellowsAndReds.light` - Dark yellows with red accents for light backgrounds
  - `palettes.yellowsAndReds.dark` - Bright yellows with red accents for dark backgrounds

- **yellowsAndOranges** - Color combination with predominantly yellow tones accented by orange
  - `palettes.yellowsAndOranges.light` - Dark yellows with orange accents for light backgrounds
  - `palettes.yellowsAndOranges.dark` - Bright yellows with orange accents for dark backgrounds

### Usage Example

```typescript
import { highlight_value, palettes } from 'kyrie';

const data = { name: 'Alice', items: [1, 2, 3] };

// Use light variant (dark colors for light backgrounds)
console.log(highlight_value(data, { palette: palettes.forest.light }));

// Use dark variant (light colors for dark backgrounds)
console.log(highlight_value(data, { palette: palettes.bold.dark }));
```

## Development

### Running Tests

```bash
npm test
```

## License

MIT
