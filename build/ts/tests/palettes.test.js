import { palettes } from '../index.js';
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
            const forestKeys = Object.keys(palettes.forest.light).sort();
            const boldKeys = Object.keys(palettes.bold.light).sort();
            const duskKeys = Object.keys(palettes.dusk.light).sort();
            const pastelKeys = Object.keys(palettes.pastel.light).sort();
            const gardenKeys = Object.keys(palettes.garden.light).sort();
            const lightPastelKeys = Object.keys(palettes.lightPastel.light).sort();
            const funkyKeys = Object.keys(palettes.funky.light).sort();
            const boringKeys = Object.keys(palettes.boring.light).sort();
            expect(forestKeys).toEqual(defaultKeys);
            expect(boldKeys).toEqual(defaultKeys);
            expect(duskKeys).toEqual(defaultKeys);
            expect(pastelKeys).toEqual(defaultKeys);
            expect(gardenKeys).toEqual(defaultKeys);
            expect(lightPastelKeys).toEqual(defaultKeys);
            expect(funkyKeys).toEqual(defaultKeys);
            expect(boringKeys).toEqual(defaultKeys);
        });
        test('all dark palettes should have the same keys', () => {
            const defaultKeys = Object.keys(palettes.default.dark).sort();
            const forestKeys = Object.keys(palettes.forest.dark).sort();
            const boldKeys = Object.keys(palettes.bold.dark).sort();
            const duskKeys = Object.keys(palettes.dusk.dark).sort();
            const pastelKeys = Object.keys(palettes.pastel.dark).sort();
            const gardenKeys = Object.keys(palettes.garden.dark).sort();
            const lightPastelKeys = Object.keys(palettes.lightPastel.dark).sort();
            const funkyKeys = Object.keys(palettes.funky.dark).sort();
            const boringKeys = Object.keys(palettes.boring.dark).sort();
            expect(forestKeys).toEqual(defaultKeys);
            expect(boldKeys).toEqual(defaultKeys);
            expect(duskKeys).toEqual(defaultKeys);
            expect(pastelKeys).toEqual(defaultKeys);
            expect(gardenKeys).toEqual(defaultKeys);
            expect(lightPastelKeys).toEqual(defaultKeys);
            expect(funkyKeys).toEqual(defaultKeys);
            expect(boringKeys).toEqual(defaultKeys);
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
});
//# sourceMappingURL=palettes.test.js.map