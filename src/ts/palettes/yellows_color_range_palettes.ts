/**
 * Yellows Color Range Palette Collection
 *
 * This file contains color palettes that combine yellows (60-70%) with other colors (30-40%).
 * Each palette includes light and dark variants for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */

import type { ColorPalette } from '../index.js';

/**
 * Collection of yellows-based color range palettes
 * Combines yellows heavily with complementary colors
 */
export const yellowsColorRangePalettes = {
  /**
   * Yellows and Reds palette
   * Warm palette combining yellows (majority) with reds
   */
  yellowsAndReds: {
    light: {
      text: '#000000',
      null: '#7A6A1A',
      undefined: '#8A7A2A',
      boolean: '#9A7A1A',
      number: '#AA8A2A',
      bigint: '#AA9E2A',
      specialNumber: '#C88020',
      string: '#8A6A1A',
      symbol: '#7A5A1A',
      function: '#BA9A3A',
      object: '#8A3A1A',
      array: '#AA9A2A',
      map: '#9A8A2A',
      set: '#8A7A1A',
      weakmap: '#AA4A1A',
      weakset: '#9A5A2A',
      date: '#BA8A2A',
      regexp: '#7A7A1A',
      error: '#AA2A1A',
      circularReference: '#6A5A1A',
      propertyKey: '#5A4A1A',
      punctuation: '#7A6A2A',
      indentGuide: '#BDB595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFEE99',
      undefined: '#FFFF88',
      boolean: '#FFEE77',
      number: '#FFDD66',
      bigint: '#FFF166',
      specialNumber: '#FFD35C',
      string: '#FFEE88',
      symbol: '#FFCC77',
      function: '#FFFFAA',
      object: '#FF9966',
      array: '#FFEE99',
      map: '#FFDD88',
      set: '#FFEE77',
      weakmap: '#FFAA55',
      weakset: '#FFBB77',
      date: '#FFFFBB',
      regexp: '#FFDD99',
      error: '#FF8844',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFDD',
      punctuation: '#FFEE99',
      indentGuide: '#80774D'
    } as ColorPalette
  },

  /**
   * Yellows and Oranges palette
   * Warm palette combining yellows (majority) with oranges
   */
  yellowsAndOranges: {
    light: {
      text: '#000000',
      null: '#8A7A2A',
      undefined: '#9A8A3A',
      boolean: '#AA8A1A',
      number: '#BA9A2A',
      bigint: '#BAAE2A',
      specialNumber: '#D89020',
      string: '#9A7A1A',
      symbol: '#8A6A1A',
      function: '#CA9A3A',
      object: '#AA6A1A',
      array: '#BA8A2A',
      map: '#AA9A3A',
      set: '#9A8A2A',
      weakmap: '#CC7A2A',
      weakset: '#AA7A3A',
      date: '#CAAA3A',
      regexp: '#8A8A2A',
      error: '#BB5A1A',
      circularReference: '#7A6A2A',
      propertyKey: '#6A5A2A',
      punctuation: '#8A7A3A',
      indentGuide: '#C5BD9D'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFEE88',
      undefined: '#FFFFAA',
      boolean: '#FFEE66',
      number: '#FFDD77',
      bigint: '#FFF177',
      specialNumber: '#FFD36D',
      string: '#FFEE99',
      symbol: '#FFDD88',
      function: '#FFFFBB',
      object: '#FFCC77',
      array: '#FFEE88',
      map: '#FFDD99',
      set: '#FFEE77',
      weakmap: '#FFCC88',
      weakset: '#FFDD99',
      date: '#FFFFCC',
      regexp: '#FFEE99',
      error: '#FFBB66',
      circularReference: '#EEDD99',
      propertyKey: '#FFFFEE',
      punctuation: '#FFEE99',
      indentGuide: '#80774D'
    } as ColorPalette
  },

  /**
   * Yellows and Greens palette
   * Natural palette combining yellows (majority) with greens
   */
  yellowsAndGreens: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#8A9A1A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#7AAA2A',
      symbol: '#9A8A1A',
      function: '#BABA3A',
      object: '#5A8A2A',
      array: '#9AAA2A',
      map: '#6A9A2A',
      set: '#7A9A1A',
      weakmap: '#4A7A2A',
      weakset: '#6A8A2A',
      date: '#BAAA2A',
      regexp: '#8A9A2A',
      error: '#9A7A1A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#EEFF77',
      number: '#FFFF99',
      bigint: '#FFFF99',
      specialNumber: '#FFFF8F',
      string: '#DDFF88',
      symbol: '#EEFF88',
      function: '#FFFFBB',
      object: '#CCFF88',
      array: '#EEFF99',
      map: '#CCFF77',
      set: '#DDFF99',
      weakmap: '#BBFF88',
      weakset: '#CCEE88',
      date: '#FFFFCC',
      regexp: '#EEFF99',
      error: '#EEDD66',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Blues palette
   * Contrasting palette combining yellows (majority) with blues
   */
  yellowsAndBlues: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#7A8A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#9A9A1A',
      symbol: '#8A7A1A',
      function: '#BABA3A',
      object: '#4A6A8A',
      array: '#8A9A2A',
      map: '#9AAA3A',
      set: '#8A8A2A',
      weakmap: '#3A5A7A',
      weakset: '#5A7A9A',
      date: '#AAAA3A',
      regexp: '#7A7A2A',
      error: '#2A4A6A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#DDEE99',
      number: '#FFFF99',
      bigint: '#FFFF99',
      specialNumber: '#FFFF8F',
      string: '#EEFF88',
      symbol: '#FFEE77',
      function: '#FFFFBB',
      object: '#99CCFF',
      array: '#EEFF99',
      map: '#EEFFAA',
      set: '#FFFF77',
      weakmap: '#88BBFF',
      weakset: '#AADDFF',
      date: '#FFFFCC',
      regexp: '#EEDD88',
      error: '#77AAEE',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Purples palette
   * Vibrant palette combining yellows (majority) with purples
   */
  yellowsAndPurples: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#8A7A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#9A9A1A',
      symbol: '#7A6A2A',
      function: '#BABA3A',
      object: '#6A3A7A',
      array: '#8A9A2A',
      map: '#9AAA3A',
      set: '#8A8A2A',
      weakmap: '#5A2A6A',
      weakset: '#7A4A8A',
      date: '#AAAA3A',
      regexp: '#6A5A3A',
      error: '#4A1A5A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#EEEE99',
      number: '#FFFF99',
      bigint: '#FFFF99',
      specialNumber: '#FFFF8F',
      string: '#EEFF88',
      symbol: '#FFDD88',
      function: '#FFFFBB',
      object: '#DD99FF',
      array: '#EEFF99',
      map: '#EEFFAA',
      set: '#FFFF77',
      weakmap: '#CC88FF',
      weakset: '#EEAAFF',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#BB77EE',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Browns palette
   * Earthy palette combining yellows (majority) with browns
   */
  yellowsAndBrowns: {
    light: {
      text: '#000000',
      null: '#8A7A1A',
      undefined: '#9A8A2A',
      boolean: '#9A8A3A',
      number: '#AA9A2A',
      bigint: '#AAAE2A',
      specialNumber: '#C89020',
      string: '#8A7A1A',
      symbol: '#7A6A2A',
      function: '#BA9A3A',
      object: '#6A4A2A',
      array: '#9A8A2A',
      map: '#AA9A3A',
      set: '#8A7A1A',
      weakmap: '#5A3A1A',
      weakset: '#7A5A3A',
      date: '#AAAA3A',
      regexp: '#7A6A2A',
      error: '#4A2A1A',
      circularReference: '#7A6A1A',
      propertyKey: '#5A4A1A',
      punctuation: '#8A7A2A',
      indentGuide: '#C5BD95'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFEE88',
      undefined: '#FFFFAA',
      boolean: '#FFEE99',
      number: '#FFEE77',
      bigint: '#FFFF77',
      specialNumber: '#FFE46D',
      string: '#FFEE88',
      symbol: '#FFDD99',
      function: '#FFFFBB',
      object: '#DDAA77',
      array: '#FFEE99',
      map: '#FFEE88',
      set: '#FFDD77',
      weakmap: '#CC9966',
      weakset: '#EEBB88',
      date: '#FFFFCC',
      regexp: '#FFDD99',
      error: '#BB8855',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFEE99',
      indentGuide: '#80774D'
    } as ColorPalette
  },

  /**
   * Yellows and Greys palette
   * Neutral palette combining yellows (majority) with greys
   */
  yellowsAndGreys: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#9A9A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#8A8A1A',
      symbol: '#7A7A2A',
      function: '#BABA3A',
      object: '#5A5A5A',
      array: '#9A9A2A',
      map: '#AAAA3A',
      set: '#8A8A2A',
      weakmap: '#4A4A4A',
      weakset: '#6A6A6A',
      date: '#AAAA3A',
      regexp: '#7A7A2A',
      error: '#3A3A3A',
      circularReference: '#7A7A1A',
      propertyKey: '#5A5A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#FFFF99',
      number: '#FFFF77',
      bigint: '#FFFF77',
      specialNumber: '#FFFF6D',
      string: '#FFEE88',
      symbol: '#EEDD88',
      function: '#FFFFBB',
      object: '#CCCCCC',
      array: '#FFEE99',
      map: '#FFEE88',
      set: '#FFDD77',
      weakmap: '#BBBBBB',
      weakset: '#DDDDDD',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#AAAAAA',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Charcoals palette
   * High contrast palette combining yellows (majority) with charcoals
   */
  yellowsAndCharcoals: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#9A9A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#8A8A1A',
      symbol: '#7A7A2A',
      function: '#BABA3A',
      object: '#2A2A2A',
      array: '#9A9A2A',
      map: '#AAAA3A',
      set: '#8A8A2A',
      weakmap: '#1A1A1A',
      weakset: '#3A3A3A',
      date: '#AAAA3A',
      regexp: '#7A7A2A',
      error: '#0A0A0A',
      circularReference: '#7A7A1A',
      propertyKey: '#4A4A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#FFFF99',
      number: '#FFFF77',
      bigint: '#FFFF77',
      specialNumber: '#FFFF6D',
      string: '#FFEE88',
      symbol: '#EEDD88',
      function: '#FFFFBB',
      object: '#E5E5E5',
      array: '#FFEE99',
      map: '#FFEE88',
      set: '#FFDD77',
      weakmap: '#F5F5F5',
      weakset: '#DDDDDD',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#FFFFFF',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Cyans palette
   * Cool-warm palette combining yellows (majority) with cyans
   */
  yellowsAndCyans: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#8A9A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#9A9A1A',
      symbol: '#7A8A2A',
      function: '#BABA3A',
      object: '#1A6A7A',
      array: '#8A9A2A',
      map: '#9AAA3A',
      set: '#8A8A2A',
      weakmap: '#1A5A6A',
      weakset: '#2A7A8A',
      date: '#AAAA3A',
      regexp: '#7A8A2A',
      error: '#1A4A5A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#EEFF99',
      number: '#FFFF99',
      bigint: '#FFFF99',
      specialNumber: '#FFFF8F',
      string: '#EEFF88',
      symbol: '#EEDD88',
      function: '#FFFFBB',
      object: '#88EEFF',
      array: '#EEFF99',
      map: '#EEFFAA',
      set: '#FFFF77',
      weakmap: '#77DDEE',
      weakset: '#99FFFF',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#66CCDD',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Magentas palette
   * Bold palette combining yellows (majority) with magentas
   */
  yellowsAndMagentas: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#9A8A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#9A9A1A',
      symbol: '#8A7A2A',
      function: '#BABA3A',
      object: '#8A1A6A',
      array: '#9A9A2A',
      map: '#AAAA3A',
      set: '#8A8A2A',
      weakmap: '#7A1A5A',
      weakset: '#9A2A7A',
      date: '#AAAA3A',
      regexp: '#7A6A2A',
      error: '#6A1A4A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#FFEE99',
      number: '#FFFF99',
      bigint: '#FFFF99',
      specialNumber: '#FFFF8F',
      string: '#EEFF88',
      symbol: '#FFDD88',
      function: '#FFFFBB',
      object: '#FF88EE',
      array: '#FFEE99',
      map: '#FFEE88',
      set: '#FFDD77',
      weakmap: '#EE77DD',
      weakset: '#FF99EE',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#DD66CC',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  },

  /**
   * Yellows and Light Grays palette
   * Soft palette combining yellows (majority) with light grays
   */
  yellowsAndLightGrays: {
    light: {
      text: '#000000',
      null: '#8A8A1A',
      undefined: '#9A9A2A',
      boolean: '#9A9A3A',
      number: '#AAAA2A',
      bigint: '#AABE2A',
      specialNumber: '#C8C820',
      string: '#8A8A1A',
      symbol: '#7A7A2A',
      function: '#BABA3A',
      object: '#7A7A7A',
      array: '#9A9A2A',
      map: '#AAAA3A',
      set: '#8A8A2A',
      weakmap: '#6A6A6A',
      weakset: '#8A8A8A',
      date: '#AAAA3A',
      regexp: '#7A7A2A',
      error: '#5A5A5A',
      circularReference: '#7A7A1A',
      propertyKey: '#6A6A1A',
      punctuation: '#8A8A2A',
      indentGuide: '#C5C595'
    } as ColorPalette,
    dark: {
      text: '#FFFFFF',
      null: '#FFFF88',
      undefined: '#FFFFAA',
      boolean: '#FFFF99',
      number: '#FFFF77',
      bigint: '#FFFF77',
      specialNumber: '#FFFF6D',
      string: '#FFEE88',
      symbol: '#EEDD88',
      function: '#FFFFBB',
      object: '#EEEEEE',
      array: '#FFEE99',
      map: '#FFEE88',
      set: '#FFDD77',
      weakmap: '#DDDDDD',
      weakset: '#F5F5F5',
      date: '#FFFFCC',
      regexp: '#EEDD99',
      error: '#CCCCCC',
      circularReference: '#EEDD88',
      propertyKey: '#FFFFEE',
      punctuation: '#FFFF99',
      indentGuide: '#80804D'
    } as ColorPalette
  }
} as const;
