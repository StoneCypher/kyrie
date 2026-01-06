/**
 * Greens Color Range Palette Collection
 *
 * This module provides color palettes that combine greens (60-70%) with various other colors (30-40%).
 * Each palette includes both light and dark variants for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */

import type { ColorPalette } from '../index.js';

/**
 * Greens and Reds Color Palette
 * Combines predominantly green tones with red accents
 */
export const greensAndReds = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#8A3A2A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#9A4A3A',
    object: '#7A2A2A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#AA5A4A',
    weakset: '#6A3A2A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#AA2A2A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#FFAA99',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#FFBBAA',
    object: '#FF8888',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFCCBB',
    weakset: '#EE9999',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#FF6666',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Oranges Color Palette
 * Combines predominantly green tones with orange accents
 */
export const greensAndOranges = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#AA5A2A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#CC6A3A',
    object: '#9A4A2A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#DD7A4A',
    weakset: '#8A4A2A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#BB5A2A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#FFCC99',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#FFDD99',
    object: '#FFAA77',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFEE99',
    weakset: '#FFBB88',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#FFBB66',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Yellows Color Palette
 * Combines predominantly green tones with yellow accents
 */
export const greensAndYellows = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#8A7A2A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#AA9A3A',
    object: '#7A6A2A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#CCAA4A',
    weakset: '#6A5A2A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#9A8A2A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#FFEEAA',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#FFFFBB',
    object: '#EEDD99',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFFFDD',
    weakset: '#DDCC88',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#FFEE88',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Blues Color Palette
 * Combines predominantly green tones with blue accents
 */
export const greensAndBlues = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A4A7A',
    number: '#2A3A6A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#3A5A8A',
    object: '#1A3A5A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#4A6A9A',
    weakset: '#2A4A6A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#3A4A7A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88CCFF',
    number: '#99BBEE',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#AADDFF',
    object: '#77AADD',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#CCEEFF',
    weakset: '#99CCEE',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#AACCFF',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Purples Color Palette
 * Combines predominantly green tones with purple accents
 */
export const greensAndPurples = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#5A2A7A',
    number: '#6A3A8A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#7A4A9A',
    object: '#4A2A6A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#8A5AAA',
    weakset: '#5A3A7A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#6A2A8A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#DD99FF',
    number: '#EE99FF',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#FFAAFF',
    object: '#CC88EE',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFCCFF',
    weakset: '#DD99EE',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#EE88FF',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Browns Color Palette
 * Combines predominantly green tones with brown accents
 */
export const greensAndBrowns = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#6A4A2A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#7A5A3A',
    object: '#5A3A2A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#8A6A4A',
    weakset: '#6A4A3A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#7A4A2A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#DDBB99',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#EECCAA',
    object: '#CCAA88',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFDDBB',
    weakset: '#DDBB99',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#EEBB88',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Greys Color Palette
 * Combines predominantly green tones with grey accents
 */
export const greensAndGreys = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#5A5A5A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#6A6A6A',
    object: '#4A4A4A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#7A7A7A',
    weakset: '#555555',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#666666',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#CCCCCC',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#DDDDDD',
    object: '#BBBBBB',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#EEEEEE',
    weakset: '#CCCCCC',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#DDDDDD',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Charcoals Color Palette
 * Combines predominantly green tones with dark charcoal accents
 */
export const greensAndCharcoals = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#2A2A2A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#3A3A3A',
    object: '#1A1A1A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#4A4A4A',
    weakset: '#2A2A2A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#333333',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#D5D5D5',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#E5E5E5',
    object: '#C5C5C5',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#F5F5F5',
    weakset: '#D5D5D5',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#EEEEEE',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Cyans Color Palette
 * Combines predominantly green tones with cyan accents
 */
export const greensAndCyans = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#1A5A7A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#2A6A8A',
    object: '#0A4A6A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#3A7A9A',
    weakset: '#1A5A7A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#2A5A8A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#88DDFF',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#99EEFF',
    object: '#77CCEE',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#AAFFFF',
    weakset: '#88DDFF',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#99DDFF',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Magentas Color Palette
 * Combines predominantly green tones with magenta accents
 */
export const greensAndMagentas = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#8A2A6A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#AA3A7A',
    object: '#7A1A5A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#CC4A8A',
    weakset: '#8A2A6A',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#9A2A7A',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#FF99DD',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#FFAAEE',
    object: '#EE88CC',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFCCFF',
    weakset: '#FF99DD',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#FF88EE',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Greens and Light Grays Color Palette
 * Combines predominantly green tones with light gray accents
 */
export const greensAndLightGrays = {
  light: {
    null: '#2A5A3A',
    undefined: '#3A6A4A',
    boolean: '#1A6A3A',
    number: '#7A7A7A',
    string: '#2A7A4A',
    symbol: '#3A5A3A',
    function: '#8A8A8A',
    object: '#6A6A6A',
    array: '#1A7A5A',
    map: '#2A8A5A',
    set: '#1A8A6A',
    weakmap: '#9A9A9A',
    weakset: '#777777',
    date: '#2A9A6A',
    regexp: '#3A6A4A',
    error: '#888888',
    circularReference: '#2A5A3A',
    propertyKey: '#1A4A2A',
    punctuation: '#3A6A4A'
  } as ColorPalette,
  dark: {
    null: '#A5E5C5',
    undefined: '#B5F5D5',
    boolean: '#88F5C5',
    number: '#E5E5E5',
    string: '#A5FFDD',
    symbol: '#B5E5C5',
    function: '#F5F5F5',
    object: '#D5D5D5',
    array: '#88FFEE',
    map: '#AAFFEE',
    set: '#88FFFF',
    weakmap: '#FFFFFF',
    weakset: '#E5E5E5',
    date: '#AAFFFF',
    regexp: '#B5F5D5',
    error: '#F5F5F5',
    circularReference: '#A5E5C5',
    propertyKey: '#CCFFEE',
    punctuation: '#B5F5D5'
  } as ColorPalette
} as const;

/**
 * Collection of all greens color range palettes
 */
export const greensColorRangePalettes = {
  greensAndReds,
  greensAndOranges,
  greensAndYellows,
  greensAndBlues,
  greensAndPurples,
  greensAndBrowns,
  greensAndGreys,
  greensAndCharcoals,
  greensAndCyans,
  greensAndMagentas,
  greensAndLightGrays
} as const;
