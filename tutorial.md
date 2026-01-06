# Kyrie Tutorial

Welcome to the Kyrie tutorial! This guide will walk you through the key features of Kyrie, a formatting colorizer for JavaScript, TypeScript, and JSON with customizable color palettes.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Using the CLI](#using-the-cli)
4. [Working with Palettes](#working-with-palettes)
5. [Parsing and Painting](#parsing-and-painting)
6. [Customizing Containers](#customizing-containers)
7. [Creating Custom Palettes](#creating-custom-palettes)
8. [Advanced Features](#advanced-features)

## Getting Started

### Installation

First, install Kyrie in your project:

```bash
npm install kyrie
```

### Your First Colorized Output

Let's start with the simplest example:

```typescript
import { highlight_value } from 'kyrie';

const data = { name: 'Alice', age: 25, active: true };
console.log(highlight_value(data));
```

That's it! This will output a beautifully colorized representation of your object to the terminal with the default pastel palette.

## Basic Usage

### Highlighting JavaScript Values

The easiest way to use Kyrie is with the `highlight_value()` function, which accepts any JavaScript value:

```typescript
import { highlight_value } from 'kyrie';

// Objects
const user = { name: 'John', email: 'john@example.com' };
console.log(highlight_value(user));

// Arrays
const numbers = [1, 2, 3, 4, 5];
console.log(highlight_value(numbers));

// Nested structures
const complex = {
  users: ['Alice', 'Bob'],
  count: 2,
  settings: { theme: 'dark', notifications: true }
};
console.log(highlight_value(complex));
```

### Highlighting JSON Strings

If you have a JSON string, use `highlight_string()`:

```typescript
import { highlight_string } from 'kyrie';

const json = '{"name": "Alice", "age": 25, "active": true}';
console.log(highlight_string(json));

// Works with arrays too
const arrayJson = '[1, 2, 3, "hello", true, null]';
console.log(highlight_string(arrayJson));
```

## Using the CLI

Kyrie includes a powerful command-line interface for highlighting files.

### Basic File Highlighting

Highlight a JSON file:

```bash
kyrie myfile.json
```

### Reading from stdin

Pipe JSON data to Kyrie:

```bash
echo '{"name": "John", "age": 30}' | kyrie
```

Or from another command:

```bash
curl https://api.example.com/data | kyrie
```

### Choosing a Palette

Use the `--palette` flag to select a different color scheme:

```bash
# Forest theme
kyrie --palette forest myfile.json

# Bold vibrant colors
kyrie --palette bold myfile.json

# Hacker/Matrix theme
kyrie --palette hacker myfile.json

# Accessibility palette for protanopia
kyrie --palette protanopia myfile.json
```

### Light vs Dark Themes

Each palette has a light and dark variant:

```bash
# Dark theme variant (light colors on dark background)
kyrie --theme dark --palette bold myfile.json

# Light theme variant (dark colors on light background)
kyrie --theme light --palette bold myfile.json
```

### Controlling Output Width

Limit the width of the output:

```bash
# Maximum 80 characters wide
kyrie --max-width 80 myfile.json

# Disable width limiting
kyrie --max-width false myfile.json
```

## Working with Palettes

### Using Built-in Palettes

Kyrie comes with 120 themed palettes. Here's how to use them programmatically:

```typescript
import { highlight_value, palettes } from 'kyrie';

const data = { name: 'Alice', items: [1, 2, 3] };

// Forest theme with dark variant
console.log(highlight_value(data, { palette: palettes.forest.dark }));

// Bold theme with light variant
console.log(highlight_value(data, { palette: palettes.bold.light }));

// Hacker/Matrix theme
console.log(highlight_value(data, { palette: palettes.hacker.dark }));
```

### Popular Palette Themes

Here are some popular palettes to try:

**Visual Themes:**
- `palettes.pastel` - Soft, muted colors
- `palettes.bold` - Vibrant, saturated colors
- `palettes.forest` - Natural greens and browns
- `palettes.dusk` - Purples and twilight colors
- `palettes.rainbow` - Full spectrum of colors
- `palettes.neon` - Ultra-bright neon colors

**Themed Palettes:**
- `palettes.hacker` - Matrix-inspired terminal greens
- `palettes.vampire` - Blood reds and gothic colors
- `palettes.halloween` - Orange, purple, and seasonal colors
- `palettes.eighties` - Neon pinks and retro 1980s colors
- `palettes.starTrek` - Starfleet command colors

**Accessibility Palettes:**
- `palettes.protanopia` - For red color blindness
- `palettes.deuteranopia` - For green color blindness
- `palettes.tritanopia` - For blue color blindness
- `palettes.monochromacy` - Grayscale only

**Color Combination Palettes:**
- `palettes.redsAndOranges` - Red tones with orange accents
- `palettes.orangesAndBlues` - Orange tones with blue accents
- `palettes.yellowsAndOranges` - Yellow tones with orange accents

Each palette has `.light` and `.dark` variants:

```typescript
// Light variant (dark colors for light backgrounds)
highlight_value(data, { palette: palettes.rainbow.light });

// Dark variant (light colors for dark backgrounds)
highlight_value(data, { palette: palettes.rainbow.dark });
```

## Parsing and Painting

For more control, you can separate the parsing and painting steps.

### Parse then Paint Workflow

```typescript
import { parse_value, paint } from 'kyrie';

// Step 1: Parse the value into an AST
const data = { name: 'John', age: 30 };
const ast = parse_value(data);

// Step 2: Examine the AST structure
console.log(ast.basic_type);  // "object"
console.log(ast.deep_type.constructorName);  // "Object"
console.log(ast.properties.name.value);  // "John"

// Step 3: Paint the AST with colors
const colored = paint(ast);
console.log(colored);
```

### Parsing JSON Strings

```typescript
import { parse_string, paint } from 'kyrie';

// Parse a JSON string
const json = '{"name": "Alice", "age": 25}';
const ast = parse_string(json);

// Paint it
console.log(paint(ast));
```

### Understanding AST Nodes

The AST provides detailed type information:

```typescript
import { parse_value } from 'kyrie';

// Primitives
const num = parse_value(42);
console.log(num.basic_type);  // "number"
console.log(num.value);  // 42

// Arrays
const arr = parse_value([1, 2, 3]);
console.log(arr.basic_type);  // "object"
console.log(arr.deep_type.isArray);  // true
console.log(arr.elements[0].value);  // 1

// Special types
const date = parse_value(new Date('2024-01-01'));
console.log(date.deep_type.isDate);  // true

// Symbols
const sym = parse_value(Symbol('test'));
console.log(sym.basic_type);  // "symbol"
console.log(sym.deep_type.description);  // "test"
```

### Circular Reference Detection

Kyrie safely handles circular references:

```typescript
import { parse_value, paint } from 'kyrie';

const circular = { a: 1 };
circular.self = circular;

const ast = parse_value(circular);
console.log(ast.properties.self.deep_type.isCircularReference);  // true

// Paint it safely
console.log(paint(ast));
```

## Customizing Containers

Kyrie allows you to customize how containers (arrays, objects, etc.) are formatted.

### Default Container Format

By default, Kyrie uses standard JSON-like formatting:

- Arrays: `[1, 2, 3]`
- Objects: `{"key": "value"}`
- Maps: `{<key: value>}`
- Sets: `{(1, 2, 3)}`

### Custom Array and Object Delimiters

```typescript
import { parse_value, paint, type ContainerConfig } from 'kyrie';

const customContainers: ContainerConfig = {
  array: {
    start: '<<',
    delimiter: ' | ',
    end: '>>'
  },
  object: {
    start: 'obj{',
    separator: ' => ',
    delimiter: '; ',
    end: '}'
  }
};

const data = { items: [1, 2, 3] };
const ast = parse_value(data);
const colored = paint(ast, { containers: customContainers });
console.log(colored);
// Outputs: obj{items => <<1 | 2 | 3>>}
```

### Container Types

You can customize delimiters for all container types:

```typescript
const allContainers: ContainerConfig = {
  array: { start: '[', delimiter: ',', end: ']' },
  object: { start: '{', separator: ':', delimiter: ',', end: '}' },
  map: { start: 'Map{', separator: '=>', delimiter: ',', end: '}' },
  set: { start: 'Set{', delimiter: ',', end: '}' },
  weakmap: { start: 'WeakMap{', separator: '=>', delimiter: ',', end: '}' },
  weakset: { start: 'WeakSet{', delimiter: ',', end: '}' },
  date: { start: 'Date(', end: ')' },
  regexp: { start: '/', end: '/' },
  error: { start: 'Error(', end: ')' },
  function: { start: 'fn(', end: ')' }
};
```

## Creating Custom Palettes

### Defining a Custom Palette

Create your own color scheme using hex color codes:

```typescript
import { type ColorPalette, highlight_value } from 'kyrie';

const myPalette: ColorPalette = {
  null: '#808080',           // Gray for null
  undefined: '#A0A0A0',      // Light gray for undefined
  boolean: '#4A90E2',        // Blue for booleans
  number: '#F39C12',         // Orange for numbers
  string: '#27AE60',         // Green for strings
  symbol: '#9B59B6',         // Purple for symbols
  function: '#E67E22',       // Dark orange for functions
  object: '#E74C3C',         // Red for objects
  array: '#3498DB',          // Bright blue for arrays
  map: '#1ABC9C',            // Teal for Maps
  set: '#16A085',            // Dark teal for Sets
  weakmap: '#D35400',        // Dark orange for WeakMaps
  weakset: '#C0392B',        // Dark red for WeakSets
  date: '#F1C40F',           // Yellow for Dates
  regexp: '#8E44AD',         // Purple for RegExp
  error: '#E74C3C',          // Red for Errors
  circularReference: '#95A5A6',  // Gray for circular refs
  propertyKey: '#2C3E50',    // Dark blue-gray for keys
  punctuation: '#7F8C8D'     // Gray for punctuation
};

// Use your custom palette
const data = { name: 'Alice', age: 25, active: true };
console.log(highlight_value(data, { palette: myPalette }));
```

### Light and Dark Variants

Create light and dark variants for your custom palette:

```typescript
const myLightPalette: ColorPalette = {
  // Use darker colors for light backgrounds
  null: '#404040',
  undefined: '#505050',
  boolean: '#1E5090',
  // ... etc
};

const myDarkPalette: ColorPalette = {
  // Use lighter colors for dark backgrounds
  null: '#C0C0C0',
  undefined: '#D0D0D0',
  boolean: '#7AB0FF',
  // ... etc
};
```

## Advanced Features

### Using HighlightOptions

Combine multiple options:

```typescript
import { highlight_value, palettes, type ContainerConfig } from 'kyrie';

const customContainers: ContainerConfig = {
  array: { start: '[', delimiter: ' | ', end: ']' },
  object: { start: '{', separator: ': ', delimiter: '; ', end: '}' }
};

const options = {
  palette: palettes.forest.dark,
  containers: customContainers,
  maxWidth: 80
};

const data = { users: ['Alice', 'Bob', 'Charlie'], count: 3 };
console.log(highlight_value(data, options));
```

### Working with Special Types

Kyrie handles many JavaScript types:

```typescript
import { highlight_value } from 'kyrie';

// Dates
console.log(highlight_value(new Date()));

// Regular expressions
console.log(highlight_value(/pattern/gi));

// Errors
console.log(highlight_value(new Error('Something went wrong')));

// Maps
const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
console.log(highlight_value(map));

// Sets
const set = new Set([1, 2, 3, 4, 5]);
console.log(highlight_value(set));

// Functions
console.log(highlight_value(() => console.log('hello')));
```

### Using Test Data

Kyrie exports comprehensive test data for demonstrations:

```typescript
import { testdata, highlight_value } from 'kyrie';

// Array with all primitive types
console.log(highlight_value(testdata.array_all_primitives));

// Object with all container types
console.log(highlight_value(testdata.object_all_containers));

// Circular reference example
console.log(highlight_value(testdata.circular));

// Deeply nested structure
console.log(highlight_value(testdata.deeply_nested));
```

### Width Limiting

Control the maximum width of output:

```typescript
import { highlight_value } from 'kyrie';

const data = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  address: '123 Main Street, Anytown, USA'
};

// Limit to 60 characters
console.log(highlight_value(data, { maxWidth: 60 }));

// No width limit
console.log(highlight_value(data, { maxWidth: false }));

// Use default (undefined = no limit)
console.log(highlight_value(data, { maxWidth: undefined }));
```

## Complete Example

Here's a complete example combining multiple features:

```typescript
import {
  highlight_value,
  parse_value,
  paint,
  palettes,
  type ColorPalette,
  type ContainerConfig
} from 'kyrie';

// Sample data
const userData = {
  id: 123,
  name: 'Alice Johnson',
  email: 'alice@example.com',
  active: true,
  roles: ['admin', 'editor'],
  metadata: {
    created: new Date('2024-01-01'),
    lastLogin: new Date('2024-03-15')
  }
};

// Example 1: Simple highlighting with default palette
console.log('\n=== Default Palette ===');
console.log(highlight_value(userData));

// Example 2: Using a themed palette
console.log('\n=== Forest Dark Theme ===');
console.log(highlight_value(userData, { palette: palettes.forest.dark }));

// Example 3: Custom containers
console.log('\n=== Custom Containers ===');
const customContainers: ContainerConfig = {
  array: { start: '[', delimiter: ' | ', end: ']' },
  object: { start: '{ ', separator: ': ', delimiter: ', ', end: ' }' }
};
console.log(highlight_value(userData, { containers: customContainers }));

// Example 4: Parse and examine AST
console.log('\n=== AST Inspection ===');
const ast = parse_value(userData);
console.log('Type:', ast.basic_type);
console.log('Is Array:', ast.deep_type.isArray);
console.log('Name value:', ast.properties.name.value);

// Example 5: Custom palette
console.log('\n=== Custom Palette ===');
const monochrome: ColorPalette = {
  null: '#808080',
  undefined: '#909090',
  boolean: '#606060',
  number: '#707070',
  string: '#505050',
  symbol: '#656565',
  function: '#757575',
  object: '#555555',
  array: '#858585',
  map: '#454545',
  set: '#959595',
  weakmap: '#404040',
  weakset: '#353535',
  date: '#656565',
  regexp: '#A0A0A0',
  error: '#303030',
  circularReference: '#B0B0B0',
  propertyKey: '#606060',
  punctuation: '#C0C0C0'
};
console.log(highlight_value(userData, { palette: monochrome }));
```

## Next Steps

Now that you've learned the basics of Kyrie, you can:

1. Experiment with different palettes to find your favorite
2. Create custom color schemes for your brand or project
3. Use the CLI to quickly inspect JSON files and API responses
4. Integrate Kyrie into your logging and debugging workflows
5. Explore the 120+ built-in palettes for different themes and accessibility needs

For more information, check out the [README](README.md) and the full API documentation.

Happy colorizing! 🎨
