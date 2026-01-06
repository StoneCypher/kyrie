/**
 * CLI for Kyrie - JavaScript/TypeScript/JSON syntax highlighter
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import {
  highlight_string,
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
} from './index.js';
import type { HighlightOptions, OutputMode, ColorPalette } from './index.js';

// Combine all palette collections for lookup
export const allPalettes = {
  ...palettes,
  ...naturePalettes,
  ...protanopiaPalettes,
  ...deuteranopiaPalettes,
  ...tritanopiaPalettes,
  ...monochromacyPalettes,
  ...deuteranomalyPalettes,
  ...protanomalyPalettes,
  ...tritanomalyPalettes,
  ...achromatopsiaPalettes,
  ...redsColorRangePalettes,
  ...orangesColorRangePalettes,
  ...yellowsColorRangePalettes,
  ...greensColorRangePalettes,
  ...bluesColorRangePalettes,
  ...purplesColorRangePalettes,
  ...brownsColorRangePalettes,
  ...greysColorRangePalettes,
  ...charcoalsColorRangePalettes,
  ...cyansColorRangePalettes,
  ...magentasColorRangePalettes,
  ...lightGraysColorRangePalettes
};

export interface CLIOptions {
  palette: string;
  theme: string;
  maxWidth?: number | false | undefined;
  outputMode: string;
}

export interface CLIResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Get palette from options
 */
export function getPalette(paletteName: string, theme: string): { success: boolean; palette?: ColorPalette; error?: string } {
  const paletteObj = (allPalettes as any)[paletteName];

  if (!paletteObj) {
    return {
      success: false,
      error: `Unknown palette: ${paletteName}\nAvailable palettes: ${Object.keys(allPalettes).join(', ')}`
    };
  }

  const themeVariant = theme === 'dark' ? 'dark' : 'light';
  const selectedPalette = paletteObj[themeVariant];

  if (!selectedPalette) {
    return {
      success: false,
      error: `Palette "${paletteName}" does not have a ${themeVariant} variant`
    };
  }

  return { success: true, palette: selectedPalette };
}

/**
 * Validate output mode
 */
export function validateOutputMode(mode: string): { success: boolean; error?: string } {
  const validOutputModes: OutputMode[] = ['ansi', 'html', 'chrome-console', 'logger'];
  if (!validOutputModes.includes(mode as OutputMode)) {
    return {
      success: false,
      error: `Invalid output mode: ${mode}\nValid modes: ${validOutputModes.join(', ')}`
    };
  }
  return { success: true };
}

/**
 * Process input and highlight
 */
export function processInput(input: string, options: CLIOptions): CLIResult {
  // Get palette
  const paletteResult = getPalette(options.palette, options.theme);
  if (!paletteResult.success) {
    return { success: false, error: paletteResult.error || 'Unknown palette error' };
  }

  // Validate output mode
  const outputModeResult = validateOutputMode(options.outputMode);
  if (!outputModeResult.success) {
    return { success: false, error: outputModeResult.error || 'Unknown output mode error' };
  }

  // Build highlight options
  const highlightOptions: HighlightOptions = {
    palette: paletteResult.palette!,
    maxWidth: options.maxWidth,
    outputMode: options.outputMode as OutputMode
  };

  // Highlight and return
  try {
    const highlighted = highlight_string(input, highlightOptions);
    return { success: true, output: highlighted };
  } catch (error) {
    return {
      success: false,
      error: `Error highlighting input: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

const program = new Command();

program
  .name('kyrie')
  .description('Syntax highlighter for JavaScript, TypeScript, and JSON')
  .version('0.21.0')
  .argument('[file]', 'File to highlight (reads from stdin if not provided)')
  .option('-p, --palette <name>', 'Color palette to use (e.g., default, pastel, forest)', 'default')
  .option('-t, --theme <variant>', 'Theme variant: light or dark', 'light')
  .option('-w, --max-width <width>', 'Maximum width for output (number, or "false" to disable)', parseMaxWidth)
  .option('-o, --output-mode <mode>', 'Output mode: ansi, html, chrome-console, or logger', 'ansi')
  .action((file: string | undefined, options: { palette: string; theme: string; maxWidth?: number | false | undefined; outputMode: string }) => {
    let input = '';

    // Read input from file or stdin
    if (file) {
      try {
        input = readFileSync(file, 'utf-8');
      } catch (error) {
        console.error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    } else {
      // Read from stdin
      input = readFileSync(0, 'utf-8');
    }

    // Process input with refactored function
    const result = processInput(input, options);

    if (!result.success) {
      console.error(result.error);
      process.exit(1);
    }

    console.log(result.output);
  });

/**
 * Parse maxWidth option
 * Accepts: numbers, "false", or undefined
 */
export function parseMaxWidth(value: string): number | false | undefined {
  if (value === 'false') {
    return false;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid max-width value: ${value}. Expected a number or "false".`);
  }
  return parsed;
}

// Only run CLI when not in test environment
if (process.env['NODE_ENV'] !== 'test' && process.env['VITEST'] !== 'true') {
  program.parse();
}
