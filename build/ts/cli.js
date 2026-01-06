/**
 * CLI for Kyrie - JavaScript/TypeScript/JSON syntax highlighter
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { highlight_string, palettes, naturePalettes, protanopiaPalettes, deuteranopiaPalettes, tritanopiaPalettes, monochromacyPalettes, deuteranomalyPalettes, protanomalyPalettes, tritanomalyPalettes, achromatopsiaPalettes, redsColorRangePalettes, orangesColorRangePalettes, yellowsColorRangePalettes, greensColorRangePalettes, bluesColorRangePalettes, purplesColorRangePalettes, brownsColorRangePalettes, greysColorRangePalettes, charcoalsColorRangePalettes, cyansColorRangePalettes, magentasColorRangePalettes, lightGraysColorRangePalettes } from './index.js';
const program = new Command();
// Combine all palette collections for lookup
const allPalettes = {
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
program
    .name('kyrie')
    .description('Syntax highlighter for JavaScript, TypeScript, and JSON')
    .version('0.18.0')
    .argument('[file]', 'File to highlight (reads from stdin if not provided)')
    .option('-p, --palette <name>', 'Color palette to use (e.g., default, pastel, forest)', 'default')
    .option('-t, --theme <variant>', 'Theme variant: light or dark', 'light')
    .option('-w, --max-width <width>', 'Maximum width for output (number, or "false" to disable)', parseMaxWidth)
    .action((file, options) => {
    let input = '';
    // Read input from file or stdin
    if (file) {
        try {
            input = readFileSync(file, 'utf-8');
        }
        catch (error) {
            console.error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    else {
        // Read from stdin
        input = readFileSync(0, 'utf-8');
    }
    // Get the palette
    const paletteObj = allPalettes[options.palette];
    if (!paletteObj) {
        console.error(`Unknown palette: ${options.palette}`);
        console.error(`Available palettes: ${Object.keys(allPalettes).join(', ')}`);
        process.exit(1);
    }
    // Get the theme variant
    const themeVariant = options.theme === 'dark' ? 'dark' : 'light';
    const selectedPalette = paletteObj[themeVariant];
    if (!selectedPalette) {
        console.error(`Palette "${options.palette}" does not have a ${themeVariant} variant`);
        process.exit(1);
    }
    // Build highlight options
    const highlightOptions = {
        palette: selectedPalette,
        maxWidth: options.maxWidth
    };
    // Highlight and output
    try {
        const highlighted = highlight_string(input, highlightOptions);
        console.log(highlighted);
    }
    catch (error) {
        console.error(`Error highlighting input: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
/**
 * Parse maxWidth option
 * Accepts: numbers, "false", or undefined
 */
function parseMaxWidth(value) {
    if (value === 'false') {
        return false;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid max-width value: ${value}. Expected a number or "false".`);
    }
    return parsed;
}
program.parse();
//# sourceMappingURL=cli.js.map