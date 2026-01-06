import { palettes, colorRangePalettes, protanopiaPalettes, deuteranopiaPalettes, tritanopiaPalettes, monochromacyPalettes, deuteranomalyPalettes, protanomalyPalettes, tritanomalyPalettes, achromatopsiaPalettes } from '../index.js';
describe('ColorPalette', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const requiredKeys = [
        'null', 'undefined', 'boolean', 'number', 'string', 'symbol', 'function',
        'object', 'array', 'map', 'set', 'weakmap', 'weakset', 'date', 'regexp',
        'error', 'circularReference', 'propertyKey', 'punctuation'
    ];
    describe('palettes.default.light', () => {
        test('should have all required keys', () => {
            requiredKeys.forEach(key => {
                expect(palettes.default.light).toHaveProperty(key);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(palettes.default.light).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('should be of type ColorPalette', () => {
            const palette = palettes.default.light;
            expect(palette).toBeDefined();
        });
    });
    describe('palettes.default.dark', () => {
        test('should have all required keys', () => {
            requiredKeys.forEach(key => {
                expect(palettes.default.dark).toHaveProperty(key);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(palettes.default.dark).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('should be of type ColorPalette', () => {
            const palette = palettes.default.dark;
            expect(palette).toBeDefined();
        });
    });
    describe('palettes.forest.light', () => {
        test('should have all required keys', () => {
            requiredKeys.forEach(key => {
                expect(palettes.forest.light).toHaveProperty(key);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(palettes.forest.light).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('should be of type ColorPalette', () => {
            const palette = palettes.forest.light;
            expect(palette).toBeDefined();
        });
    });
    describe('palettes.bold.dark', () => {
        test('should have all required keys', () => {
            requiredKeys.forEach(key => {
                expect(palettes.bold.dark).toHaveProperty(key);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(palettes.bold.dark).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('should be of type ColorPalette', () => {
            const palette = palettes.bold.dark;
            expect(palette).toBeDefined();
        });
    });
    describe('palettes.dusk.light', () => {
        test('should have all required keys', () => {
            requiredKeys.forEach(key => {
                expect(palettes.dusk.light).toHaveProperty(key);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(palettes.dusk.light).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('should be of type ColorPalette', () => {
            const palette = palettes.dusk.light;
            expect(palette).toBeDefined();
        });
    });
    describe('palette structure', () => {
        test('all light palettes should have the same keys', () => {
            const defaultKeys = Object.keys(palettes.default.light).sort();
            const paletteNames = ['forest', 'bold', 'dusk', 'pastel', 'garden', 'lightPastel',
                'funky', 'boring', 'mobster', 'money', 'skeleton', 'sinister', 'halloween',
                'vampire', 'grayscale', 'blues', 'circus', 'monkey', 'sky', 'rainbow', 'mutedRainbow',
                'sunflower', 'strawberry', 'brownAndGreen', 'solarFlare', 'purpleToOrange', 'commodore64',
                'military', 'police', 'hacker', 'wizard', 'butterfly', 'gunmetal', 'cocaCola',
                'ogre', 'burglar', 'crystal', 'laser', 'kungFu', 'starTrek', 'antique', 'book',
                'eighties', 'neon', 'flowers', 'logger', 'system', 'alien'];
            paletteNames.forEach(name => {
                const paletteKeys = Object.keys(palettes[name].light).sort();
                expect(paletteKeys).toEqual(defaultKeys);
            });
        });
        test('all dark palettes should have the same keys', () => {
            const defaultKeys = Object.keys(palettes.default.dark).sort();
            const paletteNames = ['forest', 'bold', 'dusk', 'pastel', 'garden', 'lightPastel',
                'funky', 'boring', 'mobster', 'money', 'skeleton', 'sinister', 'halloween',
                'vampire', 'grayscale', 'blues', 'circus', 'monkey', 'sky', 'rainbow', 'mutedRainbow',
                'sunflower', 'strawberry', 'brownAndGreen', 'solarFlare', 'purpleToOrange', 'commodore64',
                'military', 'police', 'hacker', 'wizard', 'butterfly', 'gunmetal', 'cocaCola',
                'ogre', 'burglar', 'crystal', 'laser', 'kungFu', 'starTrek', 'antique', 'book',
                'eighties', 'neon', 'flowers', 'logger', 'system', 'alien'];
            paletteNames.forEach(name => {
                const paletteKeys = Object.keys(palettes[name].dark).sort();
                expect(paletteKeys).toEqual(defaultKeys);
            });
        });
        test('palettes should have different color values', () => {
            // Verify that each palette is unique
            expect(palettes.default.light.string).not.toBe(palettes.forest.light.string);
            expect(palettes.default.dark.number).not.toBe(palettes.bold.dark.number);
            expect(palettes.forest.light.object).not.toBe(palettes.dusk.light.object);
        });
        test('light and dark variants should be different', () => {
            expect(palettes.default.light.string).not.toBe(palettes.default.dark.string);
            expect(palettes.forest.light.number).not.toBe(palettes.forest.dark.number);
            expect(palettes.bold.light.boolean).not.toBe(palettes.bold.dark.boolean);
        });
    });
    describe('colorRangePalettes', () => {
        test('all light color range palettes should have the same keys', () => {
            const defaultKeys = Object.keys(palettes.default.light).sort();
            const colorRangePaletteNames = ['redsAndOranges', 'redsAndYellows', 'redsAndGreens',
                'redsAndBlues', 'redsAndPurples', 'redsAndBrowns', 'redsAndGrays', 'redsAndMagentas',
                'redsAndCyans', 'redsAndCharcoals', 'orangesAndReds', 'orangesAndYellows',
                'orangesAndGreens', 'orangesAndBlues', 'orangesAndPurples', 'orangesAndBrowns',
                'orangesAndGrays', 'orangesAndMagentas', 'orangesAndCyans', 'orangesAndCharcoals',
                'yellowsAndReds', 'yellowsAndOranges'];
            colorRangePaletteNames.forEach(name => {
                const paletteKeys = Object.keys(colorRangePalettes[name].light).sort();
                expect(paletteKeys).toEqual(defaultKeys);
            });
        });
        test('all dark color range palettes should have the same keys', () => {
            const defaultKeys = Object.keys(palettes.default.dark).sort();
            const colorRangePaletteNames = ['redsAndOranges', 'redsAndYellows', 'redsAndGreens',
                'redsAndBlues', 'redsAndPurples', 'redsAndBrowns', 'redsAndGrays', 'redsAndMagentas',
                'redsAndCyans', 'redsAndCharcoals', 'orangesAndReds', 'orangesAndYellows',
                'orangesAndGreens', 'orangesAndBlues', 'orangesAndPurples', 'orangesAndBrowns',
                'orangesAndGrays', 'orangesAndMagentas', 'orangesAndCyans', 'orangesAndCharcoals',
                'yellowsAndReds', 'yellowsAndOranges'];
            colorRangePaletteNames.forEach(name => {
                const paletteKeys = Object.keys(colorRangePalettes[name].dark).sort();
                expect(paletteKeys).toEqual(defaultKeys);
            });
        });
        test('should have valid hex colors for all values', () => {
            Object.values(colorRangePalettes.redsAndOranges.light).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
            Object.values(colorRangePalettes.orangesAndBlues.dark).forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });
        test('light and dark variants should be different', () => {
            expect(colorRangePalettes.redsAndOranges.light.string).not.toBe(colorRangePalettes.redsAndOranges.dark.string);
            expect(colorRangePalettes.orangesAndYellows.light.number).not.toBe(colorRangePalettes.orangesAndYellows.dark.number);
            expect(colorRangePalettes.yellowsAndReds.light.boolean).not.toBe(colorRangePalettes.yellowsAndReds.dark.boolean);
        });
    });
    describe('Vision accessibility palettes', () => {
        const visionPaletteCollections = [
            { name: 'protanopiaPalettes', collection: protanopiaPalettes, variants: ['protanopia', 'protanopiaBright', 'protanopiaSubtle', 'protanopiaPastel', 'protanopiaBoring', 'protanopiaFunky', 'protanopiaVivid'] },
            { name: 'deuteranopiaPalettes', collection: deuteranopiaPalettes, variants: ['deuteranopia', 'deuteranopiaBright', 'deuteranopiaSubtle', 'deuteranopiaPastel', 'deuteranopiaBoring', 'deuteranopiaFunky', 'deuteranopiaVivid'] },
            { name: 'tritanopiaPalettes', collection: tritanopiaPalettes, variants: ['tritanopia', 'tritanopiaBright', 'tritanopiaSubtle', 'tritanopiaPastel', 'tritanopiaBoring', 'tritanopiaFunky', 'tritanopiaVivid'] },
            { name: 'monochromacyPalettes', collection: monochromacyPalettes, variants: ['monochromacy', 'monochromacyBright', 'monochromacySubtle', 'monochromacyPastel', 'monochromacyBoring', 'monochromacyFunky', 'monochromacyVivid'] },
            { name: 'deuteranomalyPalettes', collection: deuteranomalyPalettes, variants: ['deuteranomaly', 'deuteranomalyBright', 'deuteranomalySubtle', 'deuteranomalyPastel', 'deuteranomalyBoring', 'deuteranomalyFunky', 'deuteranomalyVivid'] },
            { name: 'protanomalyPalettes', collection: protanomalyPalettes, variants: ['protanomaly', 'protanomalyBright', 'protanomalySubtle', 'protanomalyPastel', 'protanomalyBoring', 'protanomalyFunky', 'protanomalyVivid'] },
            { name: 'tritanomalyPalettes', collection: tritanomalyPalettes, variants: ['tritanomaly', 'tritanomalyBright', 'tritanomalySubtle', 'tritanomalyPastel', 'tritanomalyBoring', 'tritanomalyFunky', 'tritanomalyVivid'] },
            { name: 'achromatopsiaPalettes', collection: achromatopsiaPalettes, variants: ['achromatopsia'] }
        ];
        visionPaletteCollections.forEach(({ name, collection, variants }) => {
            describe(name, () => {
                test('all light variants should have the same keys', () => {
                    const defaultKeys = Object.keys(palettes.default.light).sort();
                    variants.forEach(variant => {
                        const paletteKeys = Object.keys(collection[variant].light).sort();
                        expect(paletteKeys).toEqual(defaultKeys);
                    });
                });
                test('all dark variants should have the same keys', () => {
                    const defaultKeys = Object.keys(palettes.default.dark).sort();
                    variants.forEach(variant => {
                        const paletteKeys = Object.keys(collection[variant].dark).sort();
                        expect(paletteKeys).toEqual(defaultKeys);
                    });
                });
                test('should have valid hex colors for all values', () => {
                    variants.forEach(variant => {
                        Object.values(collection[variant].light).forEach(color => {
                            expect(color).toMatch(hexColorRegex);
                        });
                        Object.values(collection[variant].dark).forEach(color => {
                            expect(color).toMatch(hexColorRegex);
                        });
                    });
                });
                test('light and dark variants should be different', () => {
                    variants.forEach(variant => {
                        expect(collection[variant].light.string).not.toBe(collection[variant].dark.string);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=palettes.test.js.map