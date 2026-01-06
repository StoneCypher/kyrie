/**
 * Collection of achromatopsia color palettes
 * Each palette has light and dark variants for different backgrounds
 */
export const achromatopsiaPalettes = {
  achromatopsia: {
    light: {
      null: '#3B3B3B',
      undefined: '#4B4B4B',
      boolean: '#2B2B2B',
      number: '#5B5B5B',
      string: '#363636',
      symbol: '#464646',
      function: '#616161',
      object: '#414141',
      array: '#262626',
      map: '#515151',
      set: '#393939',
      weakmap: '#676767',
      weakset: '#494949',
      date: '#565656',
      regexp: '#343434',
      error: '#595959',
      circularReference: '#3B3B3B',
      propertyKey: '#2B2B2B',
      punctuation: '#4B4B4B'
    },
    dark: {
      null: '#C6C6C6',
      undefined: '#D6D6D6',
      boolean: '#B0B0B0',
      number: '#E6E6E6',
      string: '#CBCBCB',
      symbol: '#D1D1D1',
      function: '#F0F0F0',
      object: '#D0D0D0',
      array: '#A6A6A6',
      map: '#DBDBDB',
      set: '#C9C9C9',
      weakmap: '#F6F6F6',
      weakset: '#D9D9D9',
      date: '#E1E1E1',
      regexp: '#C1C1C1',
      error: '#E9E9E9',
      circularReference: '#C6C6C6',
      propertyKey: '#F1F1F1',
      punctuation: '#D6D6D6'
    }
  }
} as const;
