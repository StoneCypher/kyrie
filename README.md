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

## Development

### Running Tests

```bash
npm test
```

## License

MIT
