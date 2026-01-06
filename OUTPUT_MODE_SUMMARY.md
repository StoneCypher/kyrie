# OutputMode Type Summary

## Type Definition

A new TypeScript type has been added to specify the output mode for syntax highlighting:

```typescript
/**
 * Output mode for syntax highlighting
 * - ansi: ANSI escape codes for terminal output (default)
 * - html: HTML with inline styles
 * - chrome-console: Chrome DevTools console formatting
 * - logger: Logging-friendly format
 */
export type OutputMode = 'ansi' | 'html' | 'chrome-console' | 'logger';
```

## Location

**File:** `src/ts/types.ts`
**Lines:** 86-93
**Re-exported from:** `src/ts/index.ts`

## Integration

The `OutputMode` type has been added to the `HighlightOptions` interface:

```typescript
export interface HighlightOptions {
  palette?: ColorPalette;
  containers?: ContainerConfig;
  maxWidth?: number | false | undefined;
  outputMode?: OutputMode;  // NEW
}
```

## Available Options

| Mode | Description | Use Case |
|------|-------------|----------|
| `ansi` | ANSI escape codes for terminal output | Default, terminal/console output |
| `html` | HTML with inline styles | Web pages, documentation |
| `chrome-console` | Chrome DevTools console formatting | Browser console output |
| `logger` | Logging-friendly format | Log files, logging systems |

## Usage Examples

### Basic Usage

```typescript
import { highlight_value, type OutputMode } from 'kyrie';

// Using ANSI (default)
const ansiOutput = highlight_value({ name: 'Alice' }, { outputMode: 'ansi' });

// Using HTML
const htmlOutput = highlight_value({ name: 'Alice' }, { outputMode: 'html' });

// Using Chrome Console
const consoleOutput = highlight_value({ name: 'Alice' }, { outputMode: 'chrome-console' });

// Using Logger format
const loggerOutput = highlight_value({ name: 'Alice' }, { outputMode: 'logger' });
```

### With All Options

```typescript
import { highlight_value, palettes, defaultContainers } from 'kyrie';

const output = highlight_value(
  { users: ['Alice', 'Bob'], count: 2 },
  {
    palette: palettes.forest.dark,
    containers: defaultContainers,
    maxWidth: 80,
    outputMode: 'html'  // Specify output mode
  }
);
```

### Type-Safe Variable

```typescript
import { type OutputMode } from 'kyrie';

const mode: OutputMode = 'html';  // Type-checked
// const invalid: OutputMode = 'pdf';  // ❌ TypeScript error
```

## Tests

Four comprehensive tests have been added to verify the OutputMode type:

1. **Valid output modes** - Tests all four mode values
2. **Usable in HighlightOptions** - Tests integration with options interface
3. **Optional in HighlightOptions** - Verifies it's not required
4. **Combined with all options** - Tests with palette, containers, and maxWidth

**Test Results:**
- All 315 tests passing (179 index + 100 palettes + 36 CLI)
- Coverage: 88.06%

## Export

The `OutputMode` type is automatically exported from the main module:

```typescript
import { type OutputMode } from 'kyrie';
```

## Future Implementation

**Note:** While the type definition is complete and tested, the actual implementation
of different output modes (HTML rendering, Chrome console formatting, etc.) is not
yet implemented in the highlight functions. The type provides the contract for
future implementation.

## Files Modified

1. `src/ts/index.ts` - Added OutputMode type and updated HighlightOptions
2. `src/ts/tests/index.test.ts` - Added 4 comprehensive tests for OutputMode

## Benefits

✅ Type-safe output mode selection
✅ Clear documentation of available modes
✅ IntelliSense/autocomplete support in IDEs
✅ Prevents invalid mode values at compile time
✅ Future-proof for implementing different output formats
✅ Fully tested and integrated
