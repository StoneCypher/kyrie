import {
  type ColorPalette,
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
} from '../index.js';

describe('ColorPalette', () => {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  const requiredKeys: (keyof ColorPalette)[] = [
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
      const palette: ColorPalette = palettes.default.light;
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
      const palette: ColorPalette = palettes.default.dark;
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
      const palette: ColorPalette = palettes.bold.dark;
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
      const palette: ColorPalette = palettes.dusk.light;
      expect(palette).toBeDefined();
    });
  });

  describe('palette structure', () => {
    test('all light palettes should have the same keys', () => {
      const defaultKeys = Object.keys(palettes.default.light).sort();
      const paletteNames = ['bold', 'dusk', 'pastel', 'lightPastel',
        'funky', 'boring', 'mobster', 'money', 'skeleton', 'sinister', 'halloween',
        'vampire', 'grayscale', 'blues', 'circus', 'monkey', 'rainbow', 'mutedRainbow',
        'brownAndGreen', 'solarFlare', 'purpleToOrange', 'commodore64',
        'military', 'police', 'hacker', 'wizard', 'gunmetal', 'cocaCola',
        'ogre', 'burglar', 'crystal', 'laser', 'kungFu', 'starTrek', 'antique', 'book',
        'eighties', 'neon', 'logger', 'system', 'alien'];

      paletteNames.forEach(name => {
        const paletteKeys = Object.keys((palettes as any)[name].light).sort();
        expect(paletteKeys).toEqual(defaultKeys);
      });
    });

    test('all dark palettes should have the same keys', () => {
      const defaultKeys = Object.keys(palettes.default.dark).sort();
      const paletteNames = ['bold', 'dusk', 'pastel', 'lightPastel',
        'funky', 'boring', 'mobster', 'money', 'skeleton', 'sinister', 'halloween',
        'vampire', 'grayscale', 'blues', 'circus', 'monkey', 'rainbow', 'mutedRainbow',
        'brownAndGreen', 'solarFlare', 'purpleToOrange', 'commodore64',
        'military', 'police', 'hacker', 'wizard', 'gunmetal', 'cocaCola',
        'ogre', 'burglar', 'crystal', 'laser', 'kungFu', 'starTrek', 'antique', 'book',
        'eighties', 'neon', 'logger', 'system', 'alien'];

      paletteNames.forEach(name => {
        const paletteKeys = Object.keys((palettes as any)[name].dark).sort();
        expect(paletteKeys).toEqual(defaultKeys);
      });
    });

    test('palettes should have different color values', () => {
      // Verify that each palette is unique
      expect(palettes.default.light.string).not.toBe(palettes.bold.light.string);
      expect(palettes.default.dark.number).not.toBe(palettes.bold.dark.number);
      expect(palettes.pastel.light.object).not.toBe(palettes.dusk.light.object);
    });

    test('light and dark variants should be different', () => {
      expect(palettes.default.light.string).not.toBe(palettes.default.dark.string);
      expect(palettes.pastel.light.number).not.toBe(palettes.pastel.dark.number);
      expect(palettes.bold.light.boolean).not.toBe(palettes.bold.dark.boolean);
    });
  });

  describe('Nature palettes', () => {
    const natureVariants = ['forest', 'garden', 'flowers', 'sky', 'sunflower', 'strawberry', 'butterfly'];

    test('all light nature palettes should have the same keys', () => {
      const defaultKeys = Object.keys(palettes.default.light).sort();
      natureVariants.forEach(variant => {
        const paletteKeys = Object.keys((naturePalettes as any)[variant].light).sort();
        expect(paletteKeys).toEqual(defaultKeys);
      });
    });

    test('all dark nature palettes should have the same keys', () => {
      const defaultKeys = Object.keys(palettes.default.dark).sort();
      natureVariants.forEach(variant => {
        const paletteKeys = Object.keys((naturePalettes as any)[variant].dark).sort();
        expect(paletteKeys).toEqual(defaultKeys);
      });
    });

    test('should have valid hex colors for all values', () => {
      natureVariants.forEach(variant => {
        Object.values((naturePalettes as any)[variant].light).forEach(color => {
          expect(color).toMatch(hexColorRegex);
        });
        Object.values((naturePalettes as any)[variant].dark).forEach(color => {
          expect(color).toMatch(hexColorRegex);
        });
      });
    });

    test('light and dark variants should be different', () => {
      natureVariants.forEach(variant => {
        expect((naturePalettes as any)[variant].light.string).not.toBe((naturePalettes as any)[variant].dark.string);
      });
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
            const paletteKeys = Object.keys((collection as any)[variant].light).sort();
            expect(paletteKeys).toEqual(defaultKeys);
          });
        });

        test('all dark variants should have the same keys', () => {
          const defaultKeys = Object.keys(palettes.default.dark).sort();
          variants.forEach(variant => {
            const paletteKeys = Object.keys((collection as any)[variant].dark).sort();
            expect(paletteKeys).toEqual(defaultKeys);
          });
        });

        test('should have valid hex colors for all values', () => {
          variants.forEach(variant => {
            Object.values((collection as any)[variant].light).forEach(color => {
              expect(color).toMatch(hexColorRegex);
            });
            Object.values((collection as any)[variant].dark).forEach(color => {
              expect(color).toMatch(hexColorRegex);
            });
          });
        });

        test('light and dark variants should be different', () => {
          variants.forEach(variant => {
            expect((collection as any)[variant].light.string).not.toBe((collection as any)[variant].dark.string);
          });
        });
      });
    });
  });

  describe('Color range palettes', () => {
    const colorRangePaletteCollections = [
      { name: 'redsColorRangePalettes', collection: redsColorRangePalettes, variants: ['redsAndOranges', 'redsAndYellows', 'redsAndGreens', 'redsAndBlues', 'redsAndPurples', 'redsAndBrowns', 'redsAndGreys', 'redsAndCharcoals', 'redsAndCyans', 'redsAndMagentas', 'redsAndLightGrays'] },
      { name: 'orangesColorRangePalettes', collection: orangesColorRangePalettes, variants: ['orangesAndReds', 'orangesAndYellows', 'orangesAndGreens', 'orangesAndBlues', 'orangesAndPurples', 'orangesAndBrowns', 'orangesAndGreys', 'orangesAndCharcoals', 'orangesAndCyans', 'orangesAndMagentas', 'orangesAndLightGrays'] },
      { name: 'yellowsColorRangePalettes', collection: yellowsColorRangePalettes, variants: ['yellowsAndReds', 'yellowsAndOranges', 'yellowsAndGreens', 'yellowsAndBlues', 'yellowsAndPurples', 'yellowsAndBrowns', 'yellowsAndGreys', 'yellowsAndCharcoals', 'yellowsAndCyans', 'yellowsAndMagentas', 'yellowsAndLightGrays'] },
      { name: 'greensColorRangePalettes', collection: greensColorRangePalettes, variants: ['greensAndReds', 'greensAndOranges', 'greensAndYellows', 'greensAndBlues', 'greensAndPurples', 'greensAndBrowns', 'greensAndGreys', 'greensAndCharcoals', 'greensAndCyans', 'greensAndMagentas', 'greensAndLightGrays'] },
      { name: 'bluesColorRangePalettes', collection: bluesColorRangePalettes, variants: ['bluesAndReds', 'bluesAndOranges', 'bluesAndYellows', 'bluesAndGreens', 'bluesAndPurples', 'bluesAndBrowns', 'bluesAndGreys', 'bluesAndCharcoals', 'bluesAndCyans', 'bluesAndMagentas', 'bluesAndLightGrays'] },
      { name: 'purplesColorRangePalettes', collection: purplesColorRangePalettes, variants: ['purplesAndReds', 'purplesAndOranges', 'purplesAndYellows', 'purplesAndGreens', 'purplesAndBlues', 'purplesAndBrowns', 'purplesAndGreys', 'purplesAndCharcoals', 'purplesAndCyans', 'purplesAndMagentas', 'purplesAndLightGrays'] },
      { name: 'brownsColorRangePalettes', collection: brownsColorRangePalettes, variants: ['brownsAndReds', 'brownsAndOranges', 'brownsAndYellows', 'brownsAndGreens', 'brownsAndBlues', 'brownsAndPurples', 'brownsAndGreys', 'brownsAndCharcoals', 'brownsAndCyans', 'brownsAndMagentas', 'brownsAndLightGrays'] },
      { name: 'greysColorRangePalettes', collection: greysColorRangePalettes, variants: ['greysAndReds', 'greysAndOranges', 'greysAndYellows', 'greysAndGreens', 'greysAndBlues', 'greysAndPurples', 'greysAndBrowns', 'greysAndCharcoals', 'greysAndCyans', 'greysAndMagentas', 'greysAndLightGrays'] },
      { name: 'charcoalsColorRangePalettes', collection: charcoalsColorRangePalettes, variants: ['charcoalsAndReds', 'charcoalsAndOranges', 'charcoalsAndYellows', 'charcoalsAndGreens', 'charcoalsAndBlues', 'charcoalsAndPurples', 'charcoalsAndBrowns', 'charcoalsAndGreys', 'charcoalsAndCyans', 'charcoalsAndMagentas', 'charcoalsAndLightGrays'] },
      { name: 'cyansColorRangePalettes', collection: cyansColorRangePalettes, variants: ['cyansAndReds', 'cyansAndOranges', 'cyansAndYellows', 'cyansAndGreens', 'cyansAndBlues', 'cyansAndPurples', 'cyansAndBrowns', 'cyansAndGreys', 'cyansAndCharcoals', 'cyansAndMagentas', 'cyansAndLightGrays'] },
      { name: 'magentasColorRangePalettes', collection: magentasColorRangePalettes, variants: ['magentasAndReds', 'magentasAndOranges', 'magentasAndYellows', 'magentasAndGreens', 'magentasAndBlues', 'magentasAndPurples', 'magentasAndBrowns', 'magentasAndGreys', 'magentasAndCharcoals', 'magentasAndCyans', 'magentasAndLightGrays'] },
      { name: 'lightGraysColorRangePalettes', collection: lightGraysColorRangePalettes, variants: ['lightGraysAndReds', 'lightGraysAndOranges', 'lightGraysAndYellows', 'lightGraysAndGreens', 'lightGraysAndBlues', 'lightGraysAndPurples', 'lightGraysAndBrowns', 'lightGraysAndGreys', 'lightGraysAndCharcoals', 'lightGraysAndCyans', 'lightGraysAndMagentas'] }
    ];

    colorRangePaletteCollections.forEach(({ name, collection, variants }) => {
      describe(name, () => {
        test('all light variants should have the same keys', () => {
          const defaultKeys = Object.keys(palettes.default.light).sort();
          variants.forEach(variant => {
            const paletteKeys = Object.keys((collection as any)[variant].light).sort();
            expect(paletteKeys).toEqual(defaultKeys);
          });
        });

        test('all dark variants should have the same keys', () => {
          const defaultKeys = Object.keys(palettes.default.dark).sort();
          variants.forEach(variant => {
            const paletteKeys = Object.keys((collection as any)[variant].dark).sort();
            expect(paletteKeys).toEqual(defaultKeys);
          });
        });

        test('should have valid hex colors for all values', () => {
          variants.forEach(variant => {
            Object.values((collection as any)[variant].light).forEach(color => {
              expect(color).toMatch(hexColorRegex);
            });
            Object.values((collection as any)[variant].dark).forEach(color => {
              expect(color).toMatch(hexColorRegex);
            });
          });
        });

        test('light and dark variants should be different', () => {
          variants.forEach(variant => {
            expect((collection as any)[variant].light.string).not.toBe((collection as any)[variant].dark.string);
          });
        });
      });
    });
  });
});
