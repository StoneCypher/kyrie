'use strict';

const ANSI_BACKGROUND_OFFSET = 10;

const wrapAnsi16 = (offset = 0) => code => `\u001B[${code + offset}m`;

const wrapAnsi256 = (offset = 0) => code => `\u001B[${38 + offset};5;${code}m`;

const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;

const styles$1 = {
	modifier: {
		reset: [0, 0],
		// 21 isn't widely supported and 22 does the same thing
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29],
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],

		// Bright color
		blackBright: [90, 39],
		gray: [90, 39], // Alias of `blackBright`
		grey: [90, 39], // Alias of `blackBright`
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39],
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],

		// Bright color
		bgBlackBright: [100, 49],
		bgGray: [100, 49], // Alias of `bgBlackBright`
		bgGrey: [100, 49], // Alias of `bgBlackBright`
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49],
	},
};

Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
[...foregroundColorNames, ...backgroundColorNames];

function assembleStyles() {
	const codes = new Map();

	for (const [groupName, group] of Object.entries(styles$1)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles$1[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`,
			};

			group[styleName] = styles$1[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles$1, groupName, {
			value: group,
			enumerable: false,
		});
	}

	Object.defineProperty(styles$1, 'codes', {
		value: codes,
		enumerable: false,
	});

	styles$1.color.close = '\u001B[39m';
	styles$1.bgColor.close = '\u001B[49m';

	styles$1.color.ansi = wrapAnsi16();
	styles$1.color.ansi256 = wrapAnsi256();
	styles$1.color.ansi16m = wrapAnsi16m();
	styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

	// From https://github.com/Qix-/color-convert/blob/3f0e0d4e92e235796ccb17f6e85c72094a651f49/conversions.js
	Object.defineProperties(styles$1, {
		rgbToAnsi256: {
			value(red, green, blue) {
				// We use the extended greyscale palette here, with the exception of
				// black and white. normal palette only has 4 greyscale shades.
				if (red === green && green === blue) {
					if (red < 8) {
						return 16;
					}

					if (red > 248) {
						return 231;
					}

					return Math.round(((red - 8) / 247) * 24) + 232;
				}

				return 16
					+ (36 * Math.round(red / 255 * 5))
					+ (6 * Math.round(green / 255 * 5))
					+ Math.round(blue / 255 * 5);
			},
			enumerable: false,
		},
		hexToRgb: {
			value(hex) {
				const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
				if (!matches) {
					return [0, 0, 0];
				}

				let [colorString] = matches;

				if (colorString.length === 3) {
					colorString = [...colorString].map(character => character + character).join('');
				}

				const integer = Number.parseInt(colorString, 16);

				return [
					/* eslint-disable no-bitwise */
					(integer >> 16) & 0xFF,
					(integer >> 8) & 0xFF,
					integer & 0xFF,
					/* eslint-enable no-bitwise */
				];
			},
			enumerable: false,
		},
		hexToAnsi256: {
			value: hex => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
			enumerable: false,
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) {
					return 30 + code;
				}

				if (code < 16) {
					return 90 + (code - 8);
				}

				let red;
				let green;
				let blue;

				if (code >= 232) {
					red = (((code - 232) * 10) + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;

					const remainder = code % 36;

					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = (remainder % 6) / 5;
				}

				const value = Math.max(red, green, blue) * 2;

				if (value === 0) {
					return 30;
				}

				// eslint-disable-next-line no-bitwise
				let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));

				if (value === 2) {
					result += 60;
				}

				return result;
			},
			enumerable: false,
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
			enumerable: false,
		},
		hexToAnsi: {
			value: hex => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
			enumerable: false,
		},
	});

	return styles$1;
}

const ansiStyles = assembleStyles();

/* eslint-env browser */

const level = (() => {
	if (!('navigator' in globalThis)) {
		return 0;
	}

	if (globalThis.navigator.userAgentData) {
		const brand = navigator.userAgentData.brands.find(({brand}) => brand === 'Chromium');
		if (brand && brand.version > 93) {
			return 3;
		}
	}

	if (/\b(Chrome|Chromium)\//.test(globalThis.navigator.userAgent)) {
		return 1;
	}

	return 0;
})();

const colorSupport = level !== 0 && {
	level};

const supportsColor = {
	stdout: colorSupport,
	stderr: colorSupport,
};

// TODO: When targeting Node.js 16, use `String.prototype.replaceAll`.
function stringReplaceAll(string, substring, replacer) {
	let index = string.indexOf(substring);
	if (index === -1) {
		return string;
	}

	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = '';
	do {
		returnValue += string.slice(endIndex, index) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);

	returnValue += string.slice(endIndex);
	return returnValue;
}

function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
	let endIndex = 0;
	let returnValue = '';
	do {
		const gotCR = string[index - 1] === '\r';
		returnValue += string.slice(endIndex, (gotCR ? index - 1 : index)) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
		endIndex = index + 1;
		index = string.indexOf('\n', endIndex);
	} while (index !== -1);

	returnValue += string.slice(endIndex);
	return returnValue;
}

const {stdout: stdoutColor, stderr: stderrColor} = supportsColor;

const GENERATOR = Symbol('GENERATOR');
const STYLER = Symbol('STYLER');
const IS_EMPTY = Symbol('IS_EMPTY');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = [
	'ansi',
	'ansi',
	'ansi256',
	'ansi16m',
];

const styles = Object.create(null);

const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
		throw new Error('The `level` option should be an integer from 0 to 3');
	}

	// Detect level if not set manually
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === undefined ? colorLevel : options.level;
};

class Chalk {
	constructor(options) {
		// eslint-disable-next-line no-constructor-return
		return chalkFactory(options);
	}
}

const chalkFactory = options => {
	const chalk = (...strings) => strings.join(' ');
	applyOptions(chalk, options);

	Object.setPrototypeOf(chalk, createChalk.prototype);

	return chalk;
};

function createChalk(options) {
	return chalkFactory(options);
}

Object.setPrototypeOf(createChalk.prototype, Function.prototype);

for (const [styleName, style] of Object.entries(ansiStyles)) {
	styles[styleName] = {
		get() {
			const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
			Object.defineProperty(this, styleName, {value: builder});
			return builder;
		},
	};
}

styles.visible = {
	get() {
		const builder = createBuilder(this, this[STYLER], true);
		Object.defineProperty(this, 'visible', {value: builder});
		return builder;
	},
};

const getModelAnsi = (model, level, type, ...arguments_) => {
	if (model === 'rgb') {
		if (level === 'ansi16m') {
			return ansiStyles[type].ansi16m(...arguments_);
		}

		if (level === 'ansi256') {
			return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
		}

		return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
	}

	if (model === 'hex') {
		return getModelAnsi('rgb', level, type, ...ansiStyles.hexToRgb(...arguments_));
	}

	return ansiStyles[type][model](...arguments_);
};

const usedModels = ['rgb', 'hex', 'ansi256'];

for (const model of usedModels) {
	styles[model] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'color', ...arguments_), ansiStyles.color.close, this[STYLER]);
				return createBuilder(this, styler, this[IS_EMPTY]);
			};
		},
	};

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
				return createBuilder(this, styler, this[IS_EMPTY]);
			};
		},
	};
}

const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this[GENERATOR].level;
		},
		set(level) {
			this[GENERATOR].level = level;
		},
	},
});

const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === undefined) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}

	return {
		open,
		close,
		openAll,
		closeAll,
		parent,
	};
};

const createBuilder = (self, _styler, _isEmpty) => {
	// Single argument is hot path, implicit coercion is faster than anything
	// eslint-disable-next-line no-implicit-coercion
	const builder = (...arguments_) => applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));

	// We alter the prototype because we must return a function, but there is
	// no way to create a function with a different prototype
	Object.setPrototypeOf(builder, proto);

	builder[GENERATOR] = self;
	builder[STYLER] = _styler;
	builder[IS_EMPTY] = _isEmpty;

	return builder;
};

const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) {
		return self[IS_EMPTY] ? '' : string;
	}

	let styler = self[STYLER];

	if (styler === undefined) {
		return string;
	}

	const {openAll, closeAll} = styler;
	if (string.includes('\u001B')) {
		while (styler !== undefined) {
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			string = stringReplaceAll(string, styler.close, styler.open);

			styler = styler.parent;
		}
	}

	// We can move both next actions out of loop, because remaining actions in loop won't have
	// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
	// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
	const lfIndex = string.indexOf('\n');
	if (lfIndex !== -1) {
		string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	}

	return openAll + string + closeAll;
};

Object.defineProperties(createChalk.prototype, styles);

createChalk();
createChalk({level: stderrColor ? stderrColor.level : 0});

/**
 * Collection of built-in color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const palettes = {
    default: {
        light: {
            null: '#808080',
            undefined: '#999999',
            boolean: '#0066CC',
            number: '#CC6600',
            string: '#008844',
            symbol: '#8844CC',
            function: '#CC4400',
            object: '#CC0044',
            array: '#0088CC',
            map: '#00AA88',
            set: '#008866',
            weakmap: '#BB5500',
            weakset: '#AA2200',
            date: '#CCAA00',
            regexp: '#7700AA',
            error: '#CC0044',
            circularReference: '#777777',
            propertyKey: '#444444',
            punctuation: '#666666'
        },
        dark: {
            null: '#A0A0A0',
            undefined: '#B8B8B8',
            boolean: '#66AAFF',
            number: '#FFAA66',
            string: '#66DD99',
            symbol: '#CC99FF',
            function: '#FF9966',
            object: '#FF6699',
            array: '#66CCFF',
            map: '#66DDCC',
            set: '#66CCAA',
            weakmap: '#FFAA77',
            weakset: '#FF7766',
            date: '#FFDD66',
            regexp: '#BB77FF',
            error: '#FF6699',
            circularReference: '#AAAAAA',
            propertyKey: '#CCCCCC',
            punctuation: '#999999'
        }
    },
    pastel: {
        light: {
            null: '#7A7A8A',
            undefined: '#8A8A9A',
            boolean: '#5A7A9A',
            number: '#AA7A5A',
            string: '#5A9A7A',
            symbol: '#9A5A9A',
            function: '#AA6A5A',
            object: '#AA5A6A',
            array: '#5A8AAA',
            map: '#5AAAAA',
            set: '#5A9A8A',
            weakmap: '#AA8A5A',
            weakset: '#AA5A5A',
            date: '#AAAA5A',
            regexp: '#8A5A9A',
            error: '#AA5A6A',
            circularReference: '#7A7A8A',
            propertyKey: '#5A5A6A',
            punctuation: '#6A6A7A'
        },
        dark: {
            null: '#C8C8D8',
            undefined: '#D8D8E8',
            boolean: '#B8D8F8',
            number: '#F8C8A8',
            string: '#B8E8C8',
            symbol: '#E8B8E8',
            function: '#F8C8B8',
            object: '#F8B8C8',
            array: '#B8D8F8',
            map: '#B8F8F8',
            set: '#B8E8D8',
            weakmap: '#F8D8B8',
            weakset: '#F8B8B8',
            date: '#F8F8B8',
            regexp: '#D8B8E8',
            error: '#F8B8C8',
            circularReference: '#C8C8D8',
            propertyKey: '#D8D8E8',
            punctuation: '#C8C8D8'
        }
    },
    garden: {
        light: {
            null: '#556655',
            undefined: '#667766',
            boolean: '#336688',
            number: '#AA6633',
            string: '#338855',
            symbol: '#883388',
            function: '#AA5533',
            object: '#AA3344',
            array: '#447799',
            map: '#339988',
            set: '#338866',
            weakmap: '#AA7733',
            weakset: '#AA3333',
            date: '#AA9933',
            regexp: '#773388',
            error: '#AA3344',
            circularReference: '#556655',
            propertyKey: '#334433',
            punctuation: '#445544'
        },
        dark: {
            null: '#AACCAA',
            undefined: '#BBDDBB',
            boolean: '#88CCEE',
            number: '#FFBB88',
            string: '#88DDAA',
            symbol: '#DD88DD',
            function: '#FFAA88',
            object: '#FF8899',
            array: '#99DDFF',
            map: '#88EEDD',
            set: '#88DDBB',
            weakmap: '#FFCC88',
            weakset: '#FF8888',
            date: '#FFEE88',
            regexp: '#CC88DD',
            error: '#FF8899',
            circularReference: '#AACCAA',
            propertyKey: '#CCEECC',
            punctuation: '#BBDDBB'
        }
    },
    forest: {
        light: {
            null: '#445544',
            undefined: '#556655',
            boolean: '#225577',
            number: '#885522',
            string: '#227744',
            symbol: '#662277',
            function: '#884422',
            object: '#882233',
            array: '#336688',
            map: '#228877',
            set: '#227755',
            weakmap: '#886622',
            weakset: '#882222',
            date: '#888822',
            regexp: '#662277',
            error: '#882233',
            circularReference: '#445544',
            propertyKey: '#223322',
            punctuation: '#334433'
        },
        dark: {
            null: '#99BB99',
            undefined: '#AACCAA',
            boolean: '#77BBEE',
            number: '#DDAA77',
            string: '#77CC99',
            symbol: '#BB77CC',
            function: '#DD9977',
            object: '#DD7788',
            array: '#88CCFF',
            map: '#77DDCC',
            set: '#77CCAA',
            weakmap: '#DDBB77',
            weakset: '#DD7777',
            date: '#DDDD77',
            regexp: '#BB77CC',
            error: '#DD7788',
            circularReference: '#99BB99',
            propertyKey: '#BBDDBB',
            punctuation: '#AACCAA'
        }
    },
    bold: {
        light: {
            null: '#666666',
            undefined: '#888888',
            boolean: '#0055DD',
            number: '#DD5500',
            string: '#00AA00',
            symbol: '#9900DD',
            function: '#DD3300',
            object: '#DD0044',
            array: '#0088DD',
            map: '#00CCAA',
            set: '#00AA77',
            weakmap: '#CC5500',
            weakset: '#BB0000',
            date: '#DDAA00',
            regexp: '#7700BB',
            error: '#DD0044',
            circularReference: '#666666',
            propertyKey: '#333333',
            punctuation: '#555555'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#DDDDDD',
            boolean: '#66AAFF',
            number: '#FFAA44',
            string: '#44FF44',
            symbol: '#EE44FF',
            function: '#FF8844',
            object: '#FF4488',
            array: '#44DDFF',
            map: '#44FFDD',
            set: '#44FFBB',
            weakmap: '#FFAA44',
            weakset: '#FF4444',
            date: '#FFFF44',
            regexp: '#CC44FF',
            error: '#FF4488',
            circularReference: '#BBBBBB',
            propertyKey: '#EEEEEE',
            punctuation: '#DDDDDD'
        }
    },
    dusk: {
        light: {
            null: '#554466',
            undefined: '#665577',
            boolean: '#445588',
            number: '#885544',
            string: '#447755',
            symbol: '#774477',
            function: '#885544',
            object: '#884455',
            array: '#446699',
            map: '#448888',
            set: '#447766',
            weakmap: '#886644',
            weakset: '#884444',
            date: '#888844',
            regexp: '#664477',
            error: '#884455',
            circularReference: '#554466',
            propertyKey: '#443355',
            punctuation: '#554466'
        },
        dark: {
            null: '#BBAACC',
            undefined: '#CCBBDD',
            boolean: '#AABBEE',
            number: '#EEBBAA',
            string: '#AADDBB',
            symbol: '#DDAAEE',
            function: '#EEBBAA',
            object: '#EEAABB',
            array: '#AACCFF',
            map: '#AAEEEE',
            set: '#AADDCC',
            weakmap: '#EECCAA',
            weakset: '#EEAAAA',
            date: '#EEEEAA',
            regexp: '#CCAADD',
            error: '#EEAABB',
            circularReference: '#BBAACC',
            propertyKey: '#DDCCEE',
            punctuation: '#CCBBDD'
        }
    },
    lightPastel: {
        light: {
            null: '#9A9AAA',
            undefined: '#AAAABC',
            boolean: '#8AACBC',
            number: '#BC9A8A',
            string: '#8ABC9A',
            symbol: '#BC8ABC',
            function: '#BC9A8A',
            object: '#BC8A9A',
            array: '#8AACCA',
            map: '#8ABCBC',
            set: '#8ABCAA',
            weakmap: '#BCAA8A',
            weakset: '#BC8A8A',
            date: '#BCBC8A',
            regexp: '#AA8ABC',
            error: '#BC8A9A',
            circularReference: '#9A9AAA',
            propertyKey: '#8A8A9A',
            punctuation: '#9A9AAA'
        },
        dark: {
            null: '#E8E8F8',
            undefined: '#F8F8FF',
            boolean: '#E8F8FF',
            number: '#FFF8E8',
            string: '#E8FFE8',
            symbol: '#FFE8FF',
            function: '#FFF8E8',
            object: '#FFE8F8',
            array: '#E8F8FF',
            map: '#E8FFFF',
            set: '#E8FFF8',
            weakmap: '#FFF8E8',
            weakset: '#FFE8E8',
            date: '#FFFFE8',
            regexp: '#F8E8FF',
            error: '#FFE8F8',
            circularReference: '#E8E8F8',
            propertyKey: '#F8F8FF',
            punctuation: '#E8E8F8'
        }
    },
    funky: {
        light: {
            null: '#666677',
            undefined: '#777788',
            boolean: '#CC0088',
            number: '#0088CC',
            string: '#88CC00',
            symbol: '#CC00CC',
            function: '#CC4400',
            object: '#00CC88',
            array: '#4400CC',
            map: '#CC8800',
            set: '#00CCCC',
            weakmap: '#8800CC',
            weakset: '#CC0066',
            date: '#66CC00',
            regexp: '#0066CC',
            error: '#CC0088',
            circularReference: '#666677',
            propertyKey: '#444455',
            punctuation: '#555566'
        },
        dark: {
            null: '#BBBBCC',
            undefined: '#CCCCDD',
            boolean: '#FF66DD',
            number: '#66DDFF',
            string: '#DDFF66',
            symbol: '#FF66FF',
            function: '#FF9966',
            object: '#66FFDD',
            array: '#9966FF',
            map: '#FFDD66',
            set: '#66FFFF',
            weakmap: '#DD66FF',
            weakset: '#FF66BB',
            date: '#BBFF66',
            regexp: '#66BBFF',
            error: '#FF66DD',
            circularReference: '#BBBBCC',
            propertyKey: '#DDDDEE',
            punctuation: '#CCCCDD'
        }
    },
    boring: {
        light: {
            null: '#666666',
            undefined: '#777777',
            boolean: '#555577',
            number: '#775555',
            string: '#557755',
            symbol: '#775577',
            function: '#776655',
            object: '#775566',
            array: '#556677',
            map: '#557777',
            set: '#557766',
            weakmap: '#777755',
            weakset: '#775555',
            date: '#777766',
            regexp: '#665577',
            error: '#775566',
            circularReference: '#666666',
            propertyKey: '#555555',
            punctuation: '#666666'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBBB',
            boolean: '#AAAACC',
            number: '#CCAAAA',
            string: '#AACCAA',
            symbol: '#CCAACC',
            function: '#CCBBAA',
            object: '#CCAABB',
            array: '#AABBCC',
            map: '#AACCCC',
            set: '#AACCBB',
            weakmap: '#CCCCAA',
            weakset: '#CCAAAA',
            date: '#CCCCBB',
            regexp: '#BBAACC',
            error: '#CCAABB',
            circularReference: '#AAAAAA',
            propertyKey: '#BBBBBB',
            punctuation: '#AAAAAA'
        }
    },
    mobster: {
        light: {
            null: '#2A2A2A',
            undefined: '#3A3A3A',
            boolean: '#1A3A5A',
            number: '#5A4A2A',
            string: '#2A4A2A',
            symbol: '#4A2A4A',
            function: '#5A3A2A',
            object: '#4A2A3A',
            array: '#2A3A4A',
            map: '#2A4A4A',
            set: '#2A4A3A',
            weakmap: '#4A4A2A',
            weakset: '#4A2A2A',
            date: '#3A3A2A',
            regexp: '#3A2A4A',
            error: '#5A2A2A',
            circularReference: '#2A2A2A',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#A5C5E5',
            number: '#E5D5C5',
            string: '#C5E5C5',
            symbol: '#D5C5D5',
            function: '#E5D5C5',
            object: '#D5C5D5',
            array: '#C5D5E5',
            map: '#C5E5E5',
            set: '#C5E5D5',
            weakmap: '#E5E5C5',
            weakset: '#E5C5C5',
            date: '#D5D5C5',
            regexp: '#D5C5E5',
            error: '#E5C5C5',
            circularReference: '#D5D5D5',
            propertyKey: '#F5F5F5',
            punctuation: '#E5E5E5'
        }
    },
    money: {
        light: {
            null: '#2A4A2A',
            undefined: '#3A5A3A',
            boolean: '#1A5A2A',
            number: '#6A5A1A',
            string: '#2A6A2A',
            symbol: '#4A6A3A',
            function: '#7A6A2A',
            object: '#5A4A2A',
            array: '#2A5A3A',
            map: '#3A6A3A',
            set: '#2A6A4A',
            weakmap: '#6A6A2A',
            weakset: '#5A5A1A',
            date: '#8A7A3A',
            regexp: '#4A5A2A',
            error: '#6A3A1A',
            circularReference: '#2A4A2A',
            propertyKey: '#1A3A1A',
            punctuation: '#3A5A3A'
        },
        dark: {
            null: '#A5D5A5',
            undefined: '#B5E5B5',
            boolean: '#85E5A5',
            number: '#F5E585',
            string: '#A5F5A5',
            symbol: '#C5E5B5',
            function: '#FFE5A5',
            object: '#E5D5A5',
            array: '#A5E5B5',
            map: '#B5F5B5',
            set: '#A5F5C5',
            weakmap: '#F5F5A5',
            weakset: '#E5E585',
            date: '#FFFFB5',
            regexp: '#C5E5A5',
            error: '#F5B585',
            circularReference: '#A5D5A5',
            propertyKey: '#C5F5C5',
            punctuation: '#B5E5B5'
        }
    },
    skeleton: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#3A4A5A',
            number: '#5A4A3A',
            string: '#4A5A4A',
            symbol: '#5A4A5A',
            function: '#6A5A4A',
            object: '#5A4A4A',
            array: '#4A5A5A',
            map: '#4A6A6A',
            set: '#4A5A6A',
            weakmap: '#6A6A4A',
            weakset: '#5A5A3A',
            date: '#6A6A5A',
            regexp: '#5A4A6A',
            error: '#6A4A4A',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#E5E5E5',
            undefined: '#F5F5F5',
            boolean: '#D5E5F5',
            number: '#F5E5D5',
            string: '#E5F5E5',
            symbol: '#F5E5F5',
            function: '#FFF5E5',
            object: '#F5E5E5',
            array: '#E5F5F5',
            map: '#E5FFFF',
            set: '#E5F5FF',
            weakmap: '#FFFFE5',
            weakset: '#F5F5D5',
            date: '#FFFFF5',
            regexp: '#F5E5FF',
            error: '#FFE5E5',
            circularReference: '#E5E5E5',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    },
    sinister: {
        light: {
            null: '#2A1A1A',
            undefined: '#3A2A2A',
            boolean: '#1A1A3A',
            number: '#4A1A1A',
            string: '#1A3A1A',
            symbol: '#3A1A3A',
            function: '#4A2A1A',
            object: '#3A1A2A',
            array: '#1A2A3A',
            map: '#1A3A3A',
            set: '#1A3A2A',
            weakmap: '#3A3A1A',
            weakset: '#3A1A1A',
            date: '#4A3A2A',
            regexp: '#2A1A3A',
            error: '#5A1A1A',
            circularReference: '#2A1A1A',
            propertyKey: '#1A1A1A',
            punctuation: '#2A2A2A'
        },
        dark: {
            null: '#C5A5A5',
            undefined: '#D5B5B5',
            boolean: '#A5A5D5',
            number: '#E5A5A5',
            string: '#A5D5A5',
            symbol: '#D5A5D5',
            function: '#E5B5A5',
            object: '#D5A5B5',
            array: '#A5B5D5',
            map: '#A5D5D5',
            set: '#A5D5B5',
            weakmap: '#D5D5A5',
            weakset: '#D5A5A5',
            date: '#E5D5B5',
            regexp: '#B5A5D5',
            error: '#F5A5A5',
            circularReference: '#C5A5A5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    halloween: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#4A2A6A',
            number: '#CC6600',
            string: '#2A5A2A',
            symbol: '#7A3A7A',
            function: '#DD7700',
            object: '#1A1A1A',
            array: '#5A2A8A',
            map: '#338833',
            set: '#3A6A3A',
            weakmap: '#EE8800',
            weakset: '#2A2A2A',
            date: '#CC5500',
            regexp: '#6A2A7A',
            error: '#AA2200',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#D5A5FF',
            number: '#FFAA44',
            string: '#A5E5A5',
            symbol: '#EE99EE',
            function: '#FFBB55',
            object: '#F5F5F5',
            array: '#E5A5FF',
            map: '#88EE88',
            set: '#B5F5B5',
            weakmap: '#FFCC66',
            weakset: '#E5E5E5',
            date: '#FFAA33',
            regexp: '#DD99EE',
            error: '#FF6633',
            circularReference: '#D5D5D5',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    vampire: {
        light: {
            null: '#1A1A1A',
            undefined: '#2A2A2A',
            boolean: '#3A1A2A',
            number: '#5A1A1A',
            string: '#2A1A3A',
            symbol: '#4A1A3A',
            function: '#6A1A1A',
            object: '#3A1A1A',
            array: '#2A1A4A',
            map: '#4A2A2A',
            set: '#3A2A3A',
            weakmap: '#5A2A1A',
            weakset: '#4A1A1A',
            date: '#6A2A2A',
            regexp: '#3A1A4A',
            error: '#7A1A1A',
            circularReference: '#1A1A1A',
            propertyKey: '#0A0A0A',
            punctuation: '#2A2A2A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5B5C5',
            number: '#FF9999',
            string: '#C5B5E5',
            symbol: '#E5B5E5',
            function: '#FF8888',
            object: '#D5B5B5',
            array: '#C5B5F5',
            map: '#E5C5C5',
            set: '#D5C5D5',
            weakmap: '#FFAA99',
            weakset: '#E5B5B5',
            date: '#FF9999',
            regexp: '#D5B5F5',
            error: '#FF7777',
            circularReference: '#C5C5C5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    grayscale: {
        light: {
            null: '#444444',
            undefined: '#555555',
            boolean: '#333333',
            number: '#666666',
            string: '#3A3A3A',
            symbol: '#4A4A4A',
            function: '#6A6A6A',
            object: '#3F3F3F',
            array: '#2A2A2A',
            map: '#505050',
            set: '#454545',
            weakmap: '#5F5F5F',
            weakset: '#484848',
            date: '#5A5A5A',
            regexp: '#3D3D3D',
            error: '#5D5D5D',
            circularReference: '#444444',
            propertyKey: '#333333',
            punctuation: '#555555'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCCC',
            boolean: '#AAAAAA',
            number: '#DDDDDD',
            string: '#B5B5B5',
            symbol: '#C5C5C5',
            function: '#E5E5E5',
            object: '#BFBFBF',
            array: '#A5A5A5',
            map: '#D0D0D0',
            set: '#C8C8C8',
            weakmap: '#DFDFDF',
            weakset: '#C3C3C3',
            date: '#D5D5D5',
            regexp: '#B8B8B8',
            error: '#D8D8D8',
            circularReference: '#BBBBBB',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    blues: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#3A5A7A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#3A6A8A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#2A3A5A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#AADDFF',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#BBDDFF',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#99BBDD',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    circus: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#CC0000',
            number: '#CCAA00',
            string: '#0088CC',
            symbol: '#CC00CC',
            function: '#DD5500',
            object: '#00AA00',
            array: '#8800CC',
            map: '#CC8800',
            set: '#0099DD',
            weakmap: '#DD0077',
            weakset: '#7700DD',
            date: '#DDAA00',
            regexp: '#0066AA',
            error: '#DD0000',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#FF6666',
            number: '#FFEE66',
            string: '#66DDFF',
            symbol: '#FF66FF',
            function: '#FF9944',
            object: '#66FF66',
            array: '#DD66FF',
            map: '#FFDD66',
            set: '#66EEFF',
            weakmap: '#FF66BB',
            weakset: '#BB66FF',
            date: '#FFEE44',
            regexp: '#66AAFF',
            error: '#FF4444',
            circularReference: '#D5D5D5',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    monkey: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#3A4A2A',
            number: '#6A5A3A',
            string: '#2A5A2A',
            symbol: '#5A4A2A',
            function: '#7A6A4A',
            object: '#5A3A2A',
            array: '#3A5A3A',
            map: '#4A6A3A',
            set: '#2A6A3A',
            weakmap: '#8A7A5A',
            weakset: '#6A5A4A',
            date: '#7A5A3A',
            regexp: '#4A5A2A',
            error: '#6A4A2A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#C5B5A5',
            undefined: '#D5C5B5',
            boolean: '#B5D5A5',
            number: '#E5D5B5',
            string: '#A5E5A5',
            symbol: '#D5C5A5',
            function: '#F5E5C5',
            object: '#D5B5A5',
            array: '#B5D5B5',
            map: '#C5E5B5',
            set: '#A5E5B5',
            weakmap: '#FFEFD5',
            weakset: '#E5D5C5',
            date: '#EFD5B5',
            regexp: '#C5D5A5',
            error: '#E5C5A5',
            circularReference: '#C5B5A5',
            propertyKey: '#E5D5C5',
            punctuation: '#D5C5B5'
        }
    },
    sky: {
        light: {
            null: '#3A5A7A',
            undefined: '#4A6A8A',
            boolean: '#2A6A9A',
            number: '#7A7A3A',
            string: '#3A7AAA',
            symbol: '#5A6A9A',
            function: '#8A8A4A',
            object: '#4A6A7A',
            array: '#2A5A8A',
            map: '#3A8ABA',
            set: '#3A7A9A',
            weakmap: '#9A9A5A',
            weakset: '#6A7A4A',
            date: '#8A8A3A',
            regexp: '#3A6AAA',
            error: '#5A5A3A',
            circularReference: '#3A5A7A',
            propertyKey: '#2A4A6A',
            punctuation: '#4A6A8A'
        },
        dark: {
            null: '#AADDFF',
            undefined: '#BBEEFF',
            boolean: '#99EEFF',
            number: '#FFFFAA',
            string: '#AAFFFF',
            symbol: '#CCDDFF',
            function: '#FFFFCC',
            object: '#BBDDFF',
            array: '#99DDFF',
            map: '#AAFFFF',
            set: '#AAFFFF',
            weakmap: '#FFFFDD',
            weakset: '#EEFFAA',
            date: '#FFFFAA',
            regexp: '#AADDFF',
            error: '#DDDDAA',
            circularReference: '#AADDFF',
            propertyKey: '#EEFFFF',
            punctuation: '#BBEEFF'
        }
    },
    rainbow: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#8800CC',
            number: '#CC0000',
            string: '#00AA00',
            symbol: '#0088CC',
            function: '#CC6600',
            object: '#CC00CC',
            array: '#0000AA',
            map: '#00CC88',
            set: '#AA00AA',
            weakmap: '#CCAA00',
            weakset: '#CC0066',
            date: '#00AAAA',
            regexp: '#6600CC',
            error: '#AA0000',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#DD66FF',
            number: '#FF6666',
            string: '#66FF66',
            symbol: '#66DDFF',
            function: '#FFAA44',
            object: '#FF66FF',
            array: '#6666FF',
            map: '#66FFDD',
            set: '#EE66EE',
            weakmap: '#FFEE66',
            weakset: '#FF66AA',
            date: '#66FFFF',
            regexp: '#AA66FF',
            error: '#FF4444',
            circularReference: '#D5D5D5',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    mutedRainbow: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#6A4A7A',
            number: '#8A4A4A',
            string: '#4A7A4A',
            symbol: '#4A6A8A',
            function: '#8A6A4A',
            object: '#7A4A7A',
            array: '#4A4A7A',
            map: '#4A8A7A',
            set: '#7A4A6A',
            weakmap: '#8A7A5A',
            weakset: '#8A4A5A',
            date: '#4A7A8A',
            regexp: '#5A4A7A',
            error: '#7A4A4A',
            circularReference: '#5A5A5A',
            propertyKey: '#4A4A4A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#C5A5D5',
            number: '#E5A5A5',
            string: '#A5D5A5',
            symbol: '#A5C5E5',
            function: '#E5C5A5',
            object: '#D5A5D5',
            array: '#A5A5D5',
            map: '#A5E5D5',
            set: '#D5A5C5',
            weakmap: '#E5D5B5',
            weakset: '#E5A5B5',
            date: '#A5D5E5',
            regexp: '#B5A5D5',
            error: '#D5A5A5',
            circularReference: '#C5C5C5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    sunflower: {
        light: {
            null: '#5A4A2A',
            undefined: '#6A5A3A',
            boolean: '#4A5A2A',
            number: '#8A6A1A',
            string: '#3A6A2A',
            symbol: '#7A5A2A',
            function: '#9A7A2A',
            object: '#6A4A2A',
            array: '#4A6A3A',
            map: '#5A7A2A',
            set: '#2A7A2A',
            weakmap: '#AA8A3A',
            weakset: '#7A6A3A',
            date: '#9A8A2A',
            regexp: '#6A5A2A',
            error: '#7A5A1A',
            circularReference: '#5A4A2A',
            propertyKey: '#4A3A1A',
            punctuation: '#6A5A3A'
        },
        dark: {
            null: '#E5D5B5',
            undefined: '#F5E5C5',
            boolean: '#D5E5A5',
            number: '#FFEE88',
            string: '#B5F5A5',
            symbol: '#EFD5A5',
            function: '#FFFFAA',
            object: '#F5D5A5',
            array: '#C5E5B5',
            map: '#D5EFA5',
            set: '#A5EFA5',
            weakmap: '#FFFFBB',
            weakset: '#EFE5B5',
            date: '#FFFFAA',
            regexp: '#E5D5A5',
            error: '#EFD588',
            circularReference: '#E5D5B5',
            propertyKey: '#FFF5D5',
            punctuation: '#F5E5C5'
        }
    },
    strawberry: {
        light: {
            null: '#5A3A3A',
            undefined: '#6A4A4A',
            boolean: '#AA2A4A',
            number: '#CC1A3A',
            string: '#2A6A3A',
            symbol: '#8A2A5A',
            function: '#DD2A4A',
            object: '#9A2A3A',
            array: '#AA3A5A',
            map: '#3A7A4A',
            set: '#3A8A4A',
            weakmap: '#CC3A5A',
            weakset: '#8A3A4A',
            date: '#BB2A4A',
            regexp: '#9A2A4A',
            error: '#CC2A2A',
            circularReference: '#5A3A3A',
            propertyKey: '#4A2A2A',
            punctuation: '#6A4A4A'
        },
        dark: {
            null: '#E5C5C5',
            undefined: '#F5D5D5',
            boolean: '#FF88AA',
            number: '#FF66AA',
            string: '#A5F5C5',
            symbol: '#EE88BB',
            function: '#FF88BB',
            object: '#FF7799',
            array: '#FF99CC',
            map: '#B5FFD5',
            set: '#B5FFDD',
            weakmap: '#FFAACC',
            weakset: '#EE99AA',
            date: '#FF99BB',
            regexp: '#FF88AA',
            error: '#FF6666',
            circularReference: '#E5C5C5',
            propertyKey: '#FFEEEE',
            punctuation: '#F5D5D5'
        }
    },
    brownAndGreen: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#2A5A3A',
            number: '#6A4A2A',
            string: '#2A6A3A',
            symbol: '#5A4A2A',
            function: '#7A5A3A',
            object: '#4A3A2A',
            array: '#3A6A4A',
            map: '#3A7A4A',
            set: '#2A7A4A',
            weakmap: '#8A6A4A',
            weakset: '#6A5A3A',
            date: '#7A6A3A',
            regexp: '#4A5A3A',
            error: '#6A4A2A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#D5C5B5',
            undefined: '#E5D5C5',
            boolean: '#A5E5C5',
            number: '#F5D5B5',
            string: '#A5F5C5',
            symbol: '#E5D5B5',
            function: '#FFE5C5',
            object: '#D5C5B5',
            array: '#B5F5D5',
            map: '#B5EFDD',
            set: '#A5EFD5',
            weakmap: '#FFEFD5',
            weakset: '#F5E5C5',
            date: '#EFE5C5',
            regexp: '#C5E5C5',
            error: '#F5D5B5',
            circularReference: '#D5C5B5',
            propertyKey: '#F5E5D5',
            punctuation: '#E5D5C5'
        }
    },
    solarFlare: {
        light: {
            null: '#5A3A1A',
            undefined: '#6A4A2A',
            boolean: '#AA4A1A',
            number: '#CC5A1A',
            string: '#8A3A1A',
            symbol: '#9A4A2A',
            function: '#DD6A2A',
            object: '#7A3A1A',
            array: '#BB5A2A',
            map: '#AA5A3A',
            set: '#8A4A2A',
            weakmap: '#EE7A3A',
            weakset: '#9A5A3A',
            date: '#CC6A2A',
            regexp: '#AA5A2A',
            error: '#DD5A1A',
            circularReference: '#5A3A1A',
            propertyKey: '#4A2A0A',
            punctuation: '#6A4A2A'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFD5AA',
            boolean: '#FFAA66',
            number: '#FFBB55',
            string: '#FFCC88',
            symbol: '#FFBB77',
            function: '#FFDD88',
            object: '#FFAA55',
            array: '#FFCC77',
            map: '#FFBB88',
            set: '#FFAA77',
            weakmap: '#FFEE99',
            weakset: '#FFCC99',
            date: '#FFDD77',
            regexp: '#FFBB66',
            error: '#FFBB44',
            circularReference: '#FFCC99',
            propertyKey: '#FFF5DD',
            punctuation: '#FFD5AA'
        }
    },
    purpleToOrange: {
        light: {
            null: '#4A3A5A',
            undefined: '#5A4A6A',
            boolean: '#6A3A7A',
            number: '#8A4A5A',
            string: '#7A3A4A',
            symbol: '#6A4A6A',
            function: '#9A5A4A',
            object: '#5A3A5A',
            array: '#7A4A7A',
            map: '#8A5A5A',
            set: '#9A6A5A',
            weakmap: '#AA6A4A',
            weakset: '#8A5A4A',
            date: '#AA7A5A',
            regexp: '#7A4A6A',
            error: '#9A5A3A',
            circularReference: '#4A3A5A',
            propertyKey: '#3A2A4A',
            punctuation: '#5A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#E5B5EE',
            number: '#EEBBDD',
            string: '#EECCCC',
            symbol: '#E5C5E5',
            function: '#FFCCBB',
            object: '#D5B5D5',
            array: '#EECCEE',
            map: '#EECCDD',
            set: '#FFCCCC',
            weakmap: '#FFDDBB',
            weakset: '#EECCBB',
            date: '#FFDDCC',
            regexp: '#EECCEE',
            error: '#FFCCAA',
            circularReference: '#D5C5E5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5F5'
        }
    },
    commodore64: {
        light: {
            null: '#2A3A5A',
            undefined: '#3A4A6A',
            boolean: '#1A2A7A',
            number: '#4A5A8A',
            string: '#2A4A8A',
            symbol: '#3A3A7A',
            function: '#5A6A9A',
            object: '#2A3A6A',
            array: '#1A3A7A',
            map: '#3A5A8A',
            set: '#2A5A9A',
            weakmap: '#4A6AAA',
            weakset: '#3A4A7A',
            date: '#5A7AAA',
            regexp: '#2A4A7A',
            error: '#3A3A6A',
            circularReference: '#2A3A5A',
            propertyKey: '#1A2A4A',
            punctuation: '#3A4A6A'
        },
        dark: {
            null: '#AACCFF',
            undefined: '#BBDDFF',
            boolean: '#88AAFF',
            number: '#CCDDFF',
            string: '#99CCFF',
            symbol: '#AABBFF',
            function: '#DDEEFF',
            object: '#99BBFF',
            array: '#88BBFF',
            map: '#AADDFF',
            set: '#99DDFF',
            weakmap: '#CCEEFF',
            weakset: '#AACCEE',
            date: '#DDFFFF',
            regexp: '#99CCEE',
            error: '#AABBEE',
            circularReference: '#AACCFF',
            propertyKey: '#EEFFFF',
            punctuation: '#BBDDFF'
        }
    },
    military: {
        light: {
            null: '#3A4A2A',
            undefined: '#4A5A3A',
            boolean: '#2A5A2A',
            number: '#5A5A2A',
            string: '#2A6A2A',
            symbol: '#4A5A2A',
            function: '#6A6A3A',
            object: '#3A4A2A',
            array: '#2A5A3A',
            map: '#3A6A3A',
            set: '#2A7A3A',
            weakmap: '#7A7A4A',
            weakset: '#5A5A3A',
            date: '#6A6A2A',
            regexp: '#4A5A2A',
            error: '#5A4A2A',
            circularReference: '#3A4A2A',
            propertyKey: '#2A3A1A',
            punctuation: '#4A5A3A'
        },
        dark: {
            null: '#C5D5B5',
            undefined: '#D5E5C5',
            boolean: '#A5E5A5',
            number: '#D5D5A5',
            string: '#A5F5A5',
            symbol: '#C5E5A5',
            function: '#E5E5B5',
            object: '#C5D5B5',
            array: '#A5E5C5',
            map: '#B5F5C5',
            set: '#A5EFD5',
            weakmap: '#EFEFCC',
            weakset: '#D5D5B5',
            date: '#E5E5A5',
            regexp: '#C5E5A5',
            error: '#D5C5A5',
            circularReference: '#C5D5B5',
            propertyKey: '#E5F5D5',
            punctuation: '#D5E5C5'
        }
    },
    police: {
        light: {
            null: '#1A2A3A',
            undefined: '#2A3A4A',
            boolean: '#0A2A5A',
            number: '#3A4A6A',
            string: '#1A3A6A',
            symbol: '#2A3A5A',
            function: '#4A5A7A',
            object: '#1A2A4A',
            array: '#0A3A6A',
            map: '#2A4A7A',
            set: '#1A4A8A',
            weakmap: '#4A6A8A',
            weakset: '#2A3A5A',
            date: '#5A7A9A',
            regexp: '#1A3A5A',
            error: '#2A2A4A',
            circularReference: '#1A2A3A',
            propertyKey: '#0A1A2A',
            punctuation: '#2A3A4A'
        },
        dark: {
            null: '#99CCEE',
            undefined: '#AADDFF',
            boolean: '#77BBFF',
            number: '#BBDDFF',
            string: '#88CCFF',
            symbol: '#99BBFF',
            function: '#CCEEFF',
            object: '#88BBEE',
            array: '#77CCFF',
            map: '#99DDFF',
            set: '#88EEFF',
            weakmap: '#CCEEFF',
            weakset: '#99BBEE',
            date: '#DDFFFF',
            regexp: '#88BBFF',
            error: '#99AAEE',
            circularReference: '#99CCEE',
            propertyKey: '#DDEEFF',
            punctuation: '#AADDFF'
        }
    },
    hacker: {
        light: {
            null: '#1A2A1A',
            undefined: '#2A3A2A',
            boolean: '#0A3A1A',
            number: '#2A4A2A',
            string: '#0A4A2A',
            symbol: '#1A3A2A',
            function: '#3A5A3A',
            object: '#1A2A1A',
            array: '#0A4A3A',
            map: '#1A5A3A',
            set: '#0A5A4A',
            weakmap: '#3A6A4A',
            weakset: '#2A4A3A',
            date: '#4A6A5A',
            regexp: '#1A4A2A',
            error: '#2A2A1A',
            circularReference: '#1A2A1A',
            propertyKey: '#0A1A0A',
            punctuation: '#2A3A2A'
        },
        dark: {
            null: '#88EE88',
            undefined: '#99FF99',
            boolean: '#66FF88',
            number: '#99FFAA',
            string: '#66FFAA',
            symbol: '#88FF99',
            function: '#AAFFBB',
            object: '#77EE77',
            array: '#66FFBB',
            map: '#77FFCC',
            set: '#66FFDD',
            weakmap: '#AAFFDD',
            weakset: '#99FFAA',
            date: '#CCFFEE',
            regexp: '#77FFAA',
            error: '#88FF77',
            circularReference: '#88EE88',
            propertyKey: '#DDFFDD',
            punctuation: '#99FF99'
        }
    },
    wizard: {
        light: {
            null: '#2A2A4A',
            undefined: '#3A3A5A',
            boolean: '#4A2A6A',
            number: '#3A4A7A',
            string: '#2A4A8A',
            symbol: '#5A3A7A',
            function: '#4A5A9A',
            object: '#2A2A5A',
            array: '#5A2A8A',
            map: '#3A5A9A',
            set: '#2A5AAA',
            weakmap: '#5A6AAA',
            weakset: '#3A3A6A',
            date: '#6A7ABA',
            regexp: '#4A3A7A',
            error: '#3A2A5A',
            circularReference: '#2A2A4A',
            propertyKey: '#1A1A3A',
            punctuation: '#3A3A5A'
        },
        dark: {
            null: '#AAAADD',
            undefined: '#BBBBEE',
            boolean: '#CC99FF',
            number: '#AACCFF',
            string: '#99CCFF',
            symbol: '#DD99FF',
            function: '#CCDDFF',
            object: '#9999EE',
            array: '#DD99FF',
            map: '#AADDFF',
            set: '#99DDFF',
            weakmap: '#DDEEFF',
            weakset: '#AAAAEE',
            date: '#EEFFFF',
            regexp: '#CC99FF',
            error: '#AA99DD',
            circularReference: '#AAAADD',
            propertyKey: '#EEEEFF',
            punctuation: '#BBBBEE'
        }
    },
    butterfly: {
        light: {
            null: '#4A4A5A',
            undefined: '#5A5A6A',
            boolean: '#AA2A8A',
            number: '#CC6A2A',
            string: '#2AAA6A',
            symbol: '#7A2AAA',
            function: '#DDAA3A',
            object: '#8A2A7A',
            array: '#2A6AAA',
            map: '#2ACA8A',
            set: '#AA2ACA',
            weakmap: '#CCAA5A',
            weakset: '#9A3A8A',
            date: '#2A9ACA',
            regexp: '#9A2A9A',
            error: '#CA3A4A',
            circularReference: '#4A4A5A',
            propertyKey: '#3A3A4A',
            punctuation: '#5A5A6A'
        },
        dark: {
            null: '#D5D5E5',
            undefined: '#E5E5F5',
            boolean: '#FF88EE',
            number: '#FFCC88',
            string: '#88FFCC',
            symbol: '#EE88FF',
            function: '#FFEEAA',
            object: '#EE88DD',
            array: '#88CCFF',
            map: '#88FFEE',
            set: '#FF88FF',
            weakmap: '#FFEECC',
            weakset: '#FFAAE',
            date: '#88EEFF',
            regexp: '#FF88FF',
            error: '#FF99AA',
            circularReference: '#D5D5E5',
            propertyKey: '#F5F5FF',
            punctuation: '#E5E5F5'
        }
    },
    gunmetal: {
        light: {
            null: '#2A2A2A',
            undefined: '#3A3A3A',
            boolean: '#2A2A3A',
            number: '#3A3A4A',
            string: '#2A3A3A',
            symbol: '#3A2A3A',
            function: '#4A4A5A',
            object: '#2A2A2A',
            array: '#2A3A4A',
            map: '#3A4A4A',
            set: '#2A4A5A',
            weakmap: '#4A5A6A',
            weakset: '#3A3A4A',
            date: '#5A6A7A',
            regexp: '#2A3A4A',
            error: '#3A2A2A',
            circularReference: '#2A2A2A',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#C5C5D5',
            number: '#D5D5E5',
            string: '#C5D5D5',
            symbol: '#D5C5D5',
            function: '#E5E5F5',
            object: '#C5C5C5',
            array: '#C5D5E5',
            map: '#D5E5E5',
            set: '#C5E5F5',
            weakmap: '#E5F5FF',
            weakset: '#D5D5E5',
            date: '#F5FFFF',
            regexp: '#C5D5E5',
            error: '#D5C5C5',
            circularReference: '#C5C5C5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    cocaCola: {
        light: {
            null: '#4A2A2A',
            undefined: '#5A3A3A',
            boolean: '#AA1A1A',
            number: '#CC2A2A',
            string: '#2A2A2A',
            symbol: '#8A1A1A',
            function: '#DD3A3A',
            object: '#9A2A2A',
            array: '#BB2A2A',
            map: '#3A3A3A',
            set: '#4A4A4A',
            weakmap: '#CC4A4A',
            weakset: '#8A2A2A',
            date: '#DD2A2A',
            regexp: '#AA2A2A',
            error: '#CC1A1A',
            circularReference: '#4A2A2A',
            propertyKey: '#2A1A1A',
            punctuation: '#5A3A3A'
        },
        dark: {
            null: '#E5C5C5',
            undefined: '#F5D5D5',
            boolean: '#FF8888',
            number: '#FF9999',
            string: '#E5E5E5',
            symbol: '#EE7777',
            function: '#FFAAAA',
            object: '#FF8888',
            array: '#FFAAAA',
            map: '#F5F5F5',
            set: '#FFFFFF',
            weakmap: '#FFCCCC',
            weakset: '#EE8888',
            date: '#FF9999',
            regexp: '#FF9999',
            error: '#FF7777',
            circularReference: '#E5C5C5',
            propertyKey: '#FFEEEE',
            punctuation: '#F5D5D5'
        }
    },
    ogre: {
        light: {
            null: '#3A4A2A',
            undefined: '#4A5A3A',
            boolean: '#2A5A1A',
            number: '#5A5A2A',
            string: '#1A6A2A',
            symbol: '#4A4A2A',
            function: '#6A6A3A',
            object: '#3A3A1A',
            array: '#2A5A2A',
            map: '#3A6A2A',
            set: '#1A7A2A',
            weakmap: '#7A7A4A',
            weakset: '#5A4A2A',
            date: '#6A5A2A',
            regexp: '#4A5A2A',
            error: '#4A3A1A',
            circularReference: '#3A4A2A',
            propertyKey: '#2A3A1A',
            punctuation: '#4A5A3A'
        },
        dark: {
            null: '#C5D5B5',
            undefined: '#D5E5C5',
            boolean: '#A5E588',
            number: '#D5D5A5',
            string: '#88F5A5',
            symbol: '#C5C5A5',
            function: '#E5E5B5',
            object: '#B5B588',
            array: '#A5E5A5',
            map: '#B5F5A5',
            set: '#88EFA5',
            weakmap: '#EFEFCC',
            weakset: '#D5C5A5',
            date: '#E5D5A5',
            regexp: '#C5E5A5',
            error: '#C5B588',
            circularReference: '#C5D5B5',
            propertyKey: '#E5F5D5',
            punctuation: '#D5E5C5'
        }
    },
    burglar: {
        light: {
            null: '#1A1A1A',
            undefined: '#2A2A2A',
            boolean: '#0A0A0A',
            number: '#3A3A3A',
            string: '#0A0A0A',
            symbol: '#2A2A2A',
            function: '#4A4A4A',
            object: '#1A1A1A',
            array: '#0A0A0A',
            map: '#2A2A2A',
            set: '#0A0A0A',
            weakmap: '#5A5A5A',
            weakset: '#2A2A2A',
            date: '#3A3A3A',
            regexp: '#1A1A1A',
            error: '#2A2A2A',
            circularReference: '#1A1A1A',
            propertyKey: '#0A0A0A',
            punctuation: '#2A2A2A'
        },
        dark: {
            null: '#E5E5E5',
            undefined: '#F5F5F5',
            boolean: '#D5D5D5',
            number: '#FFFFFF',
            string: '#D5D5D5',
            symbol: '#F5F5F5',
            function: '#FFFFFF',
            object: '#E5E5E5',
            array: '#D5D5D5',
            map: '#F5F5F5',
            set: '#D5D5D5',
            weakmap: '#FFFFFF',
            weakset: '#F5F5F5',
            date: '#FFFFFF',
            regexp: '#E5E5E5',
            error: '#F5F5F5',
            circularReference: '#E5E5E5',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    },
    crystal: {
        light: {
            null: '#3A4A5A',
            undefined: '#4A5A6A',
            boolean: '#2A5A7A',
            number: '#5A4A6A',
            string: '#2A6A8A',
            symbol: '#4A3A7A',
            function: '#6A5A8A',
            object: '#3A4A6A',
            array: '#2A5A8A',
            map: '#4A6A9A',
            set: '#2A6AAA',
            weakmap: '#6A6A9A',
            weakset: '#4A4A6A',
            date: '#7A7AAA',
            regexp: '#3A5A8A',
            error: '#5A3A6A',
            circularReference: '#3A4A5A',
            propertyKey: '#2A3A4A',
            punctuation: '#4A5A6A'
        },
        dark: {
            null: '#CCDDEE',
            undefined: '#DDEEFF',
            boolean: '#AADDFF',
            number: '#EEDDFF',
            string: '#AAFFFF',
            symbol: '#DDAAFF',
            function: '#FFDDFF',
            object: '#CCDDFF',
            array: '#AADDFF',
            map: '#DDEEFF',
            set: '#AAFFFF',
            weakmap: '#EEEEFF',
            weakset: '#CCCCFF',
            date: '#FFFFFF',
            regexp: '#BBDDFF',
            error: '#EEAAFF',
            circularReference: '#CCDDEE',
            propertyKey: '#EEFFFF',
            punctuation: '#DDEEFF'
        }
    },
    laser: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#AA00AA',
            number: '#CC0000',
            string: '#00AA00',
            symbol: '#00AAAA',
            function: '#CCAA00',
            object: '#AA00CC',
            array: '#0000AA',
            map: '#00CC00',
            set: '#00CCCC',
            weakmap: '#CC00CC',
            weakset: '#CC0000',
            date: '#AAAA00',
            regexp: '#0088AA',
            error: '#CC00AA',
            circularReference: '#4A4A4A',
            propertyKey: '#2A2A2A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#EEEEE',
            undefined: '#F5F5F5',
            boolean: '#FF66FF',
            number: '#FF6666',
            string: '#66FF66',
            symbol: '#66FFFF',
            function: '#FFEE66',
            object: '#FF66FF',
            array: '#6666FF',
            map: '#66FF66',
            set: '#66FFFF',
            weakmap: '#FF66FF',
            weakset: '#FF6666',
            date: '#FFFF66',
            regexp: '#66DDFF',
            error: '#FF66FF',
            circularReference: '#EEEEEE',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    },
    kungFu: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#8A2A1A',
            number: '#AA6A1A',
            string: '#2A2A2A',
            symbol: '#6A2A1A',
            function: '#BB7A2A',
            object: '#3A2A1A',
            array: '#9A3A1A',
            map: '#3A3A3A',
            set: '#1A1A1A',
            weakmap: '#CC8A3A',
            weakset: '#7A3A2A',
            date: '#AA7A2A',
            regexp: '#6A3A1A',
            error: '#8A2A1A',
            circularReference: '#4A3A2A',
            propertyKey: '#2A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#E5D5C5',
            undefined: '#F5E5D5',
            boolean: '#FF9988',
            number: '#FFDD88',
            string: '#E5E5E5',
            symbol: '#EE9977',
            function: '#FFEEAA',
            object: '#D5AA88',
            array: '#FFAA88',
            map: '#F5F5F5',
            set: '#D5D5D5',
            weakmap: '#FFFFBB',
            weakset: '#EFBB99',
            date: '#FFEEAA',
            regexp: '#EEAA88',
            error: '#FF9977',
            circularReference: '#E5D5C5',
            propertyKey: '#FFF5E5',
            punctuation: '#F5E5D5'
        }
    },
    starTrek: {
        light: {
            null: '#3A3A4A',
            undefined: '#4A4A5A',
            boolean: '#1A2A7A',
            number: '#8A2A2A',
            string: '#6A5A1A',
            symbol: '#2A3A6A',
            function: '#9A7A2A',
            object: '#9A2A2A',
            array: '#2A3A8A',
            map: '#7A6A2A',
            set: '#3A4A9A',
            weakmap: '#AA8A3A',
            weakset: '#7A3A3A',
            date: '#2A4AAA',
            regexp: '#3A3A7A',
            error: '#AA3A3A',
            circularReference: '#3A3A4A',
            propertyKey: '#2A2A3A',
            punctuation: '#4A4A5A'
        },
        dark: {
            null: '#CCCCDD',
            undefined: '#DDDDEE',
            boolean: '#88AAFF',
            number: '#FF9999',
            string: '#FFEE88',
            symbol: '#99BBFF',
            function: '#FFFFAA',
            object: '#FFAAAA',
            array: '#99BBFF',
            map: '#FFEEAA',
            set: '#AACCFF',
            weakmap: '#FFFFCC',
            weakset: '#EEBBBB',
            date: '#AADDFF',
            regexp: '#AAAAFF',
            error: '#FFBBBB',
            circularReference: '#CCCCDD',
            propertyKey: '#EEEEFF',
            punctuation: '#DDDDEE'
        }
    },
    antique: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#6A4A2A',
            number: '#7A5A3A',
            string: '#5A4A2A',
            symbol: '#6A5A3A',
            function: '#8A6A4A',
            object: '#5A3A2A',
            array: '#6A5A4A',
            map: '#7A6A4A',
            set: '#6A6A5A',
            weakmap: '#9A7A5A',
            weakset: '#7A5A4A',
            date: '#8A7A5A',
            regexp: '#6A5A4A',
            error: '#7A5A3A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#D5C5B5',
            undefined: '#E5D5C5',
            boolean: '#F5D5B5',
            number: '#FFE5C5',
            string: '#E5D5B5',
            symbol: '#F5E5C5',
            function: '#FFEFD5',
            object: '#E5C5B5',
            array: '#F5E5D5',
            map: '#FFE5D5',
            set: '#F5F5E5',
            weakmap: '#FFEFD5',
            weakset: '#EFD5C5',
            date: '#FFF5E5',
            regexp: '#F5E5D5',
            error: '#EFD5C5',
            circularReference: '#D5C5B5',
            propertyKey: '#F5E5D5',
            punctuation: '#E5D5C5'
        }
    },
    book: {
        light: {
            null: '#4A4A3A',
            undefined: '#5A5A4A',
            boolean: '#3A4A2A',
            number: '#6A5A3A',
            string: '#4A5A3A',
            symbol: '#5A4A3A',
            function: '#7A6A4A',
            object: '#4A3A2A',
            array: '#5A5A4A',
            map: '#6A6A4A',
            set: '#5A6A5A',
            weakmap: '#8A7A5A',
            weakset: '#6A5A4A',
            date: '#7A7A5A',
            regexp: '#5A5A4A',
            error: '#6A5A3A',
            circularReference: '#4A4A3A',
            propertyKey: '#3A3A2A',
            punctuation: '#5A5A4A'
        },
        dark: {
            null: '#E5E5D5',
            undefined: '#F5F5E5',
            boolean: '#D5E5C5',
            number: '#FFF5D5',
            string: '#E5F5D5',
            symbol: '#F5E5D5',
            function: '#FFFFD5',
            object: '#E5D5C5',
            array: '#F5F5E5',
            map: '#FFF5E5',
            set: '#F5FFE5',
            weakmap: '#FFFFE5',
            weakset: '#F5E5D5',
            date: '#FFFFF5',
            regexp: '#F5F5E5',
            error: '#F5E5D5',
            circularReference: '#E5E5D5',
            propertyKey: '#FFFEE5',
            punctuation: '#F5F5E5'
        }
    },
    eighties: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#AA00AA',
            number: '#CC6600',
            string: '#00AAAA',
            symbol: '#AA00CC',
            function: '#CCAA00',
            object: '#CC00AA',
            array: '#0088CC',
            map: '#00CCAA',
            set: '#AA00AA',
            weakmap: '#CC8800',
            weakset: '#CC0088',
            date: '#00AACC',
            regexp: '#8800AA',
            error: '#CC00CC',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#E5E5E5',
            undefined: '#F5F5F5',
            boolean: '#FF66FF',
            number: '#FFAA44',
            string: '#66FFFF',
            symbol: '#FF66FF',
            function: '#FFEE66',
            object: '#FF66EE',
            array: '#66DDFF',
            map: '#66FFEE',
            set: '#FF66FF',
            weakmap: '#FFDD66',
            weakset: '#FF66DD',
            date: '#66EEFF',
            regexp: '#DD66FF',
            error: '#FF66FF',
            circularReference: '#E5E5E5',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    },
    neon: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#CC00FF',
            number: '#FF0000',
            string: '#00FF00',
            symbol: '#00FFFF',
            function: '#FFCC00',
            object: '#FF00CC',
            array: '#0000FF',
            map: '#00FF88',
            set: '#FF00FF',
            weakmap: '#FFFF00',
            weakset: '#FF0088',
            date: '#00FFFF',
            regexp: '#8800FF',
            error: '#FF00FF',
            circularReference: '#4A4A4A',
            propertyKey: '#2A2A2A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#F5F5F5',
            undefined: '#FFFFFF',
            boolean: '#FF66FF',
            number: '#FF6666',
            string: '#66FF66',
            symbol: '#66FFFF',
            function: '#FFEE66',
            object: '#FF66FF',
            array: '#6666FF',
            map: '#66FFDD',
            set: '#FF66FF',
            weakmap: '#FFFF66',
            weakset: '#FF66DD',
            date: '#66FFFF',
            regexp: '#DD66FF',
            error: '#FF66FF',
            circularReference: '#F5F5F5',
            propertyKey: '#FFFFFF',
            punctuation: '#FFFFFF'
        }
    },
    flowers: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#AA2A7A',
            number: '#CC7A2A',
            string: '#2A8A4A',
            symbol: '#8A2AAA',
            function: '#CCAA3A',
            object: '#9A2A6A',
            array: '#3A5A9A',
            map: '#2AAA5A',
            set: '#AA2A9A',
            weakmap: '#CC9A4A',
            weakset: '#8A3A6A',
            date: '#4A7AAA',
            regexp: '#7A2A9A',
            error: '#AA3A5A',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#E5E5E5',
            undefined: '#F5F5F5',
            boolean: '#FF99DD',
            number: '#FFDD99',
            string: '#99EEBB',
            symbol: '#EE99FF',
            function: '#FFEEAA',
            object: '#FF99CC',
            array: '#99CCFF',
            map: '#99FFCC',
            set: '#FF99FF',
            weakmap: '#FFEECC',
            weakset: '#EEAACC',
            date: '#AADDFF',
            regexp: '#DD99FF',
            error: '#FFAACC',
            circularReference: '#E5E5E5',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    },
    logger: {
        light: {
            null: '#3A3A2A',
            undefined: '#4A4A3A',
            boolean: '#7A2A2A',
            number: '#5A4A2A',
            string: '#2A5A2A',
            symbol: '#6A3A2A',
            function: '#6A5A3A',
            object: '#8A3A2A',
            array: '#4A5A3A',
            map: '#3A6A3A',
            set: '#2A6A3A',
            weakmap: '#7A6A4A',
            weakset: '#6A4A3A',
            date: '#5A5A3A',
            regexp: '#5A4A2A',
            error: '#7A3A2A',
            circularReference: '#3A3A2A',
            propertyKey: '#2A2A1A',
            punctuation: '#4A4A3A'
        },
        dark: {
            null: '#C5C5B5',
            undefined: '#D5D5C5',
            boolean: '#EE9999',
            number: '#D5C5A5',
            string: '#A5E5A5',
            symbol: '#EEAA99',
            function: '#E5D5B5',
            object: '#FFAA99',
            array: '#C5E5B5',
            map: '#B5F5C5',
            set: '#A5F5C5',
            weakmap: '#EFE5CC',
            weakset: '#E5C5B5',
            date: '#D5D5B5',
            regexp: '#D5C5A5',
            error: '#EEAA99',
            circularReference: '#C5C5B5',
            propertyKey: '#E5E5D5',
            punctuation: '#D5D5C5'
        }
    },
    system: {
        light: {
            null: '#2A3A4A',
            undefined: '#3A4A5A',
            boolean: '#1A3A5A',
            number: '#4A5A6A',
            string: '#2A4A6A',
            symbol: '#3A4A5A',
            function: '#5A6A7A',
            object: '#2A3A5A',
            array: '#1A4A6A',
            map: '#3A5A7A',
            set: '#2A5A8A',
            weakmap: '#5A7A8A',
            weakset: '#3A4A6A',
            date: '#6A8A9A',
            regexp: '#2A4A6A',
            error: '#3A3A5A',
            circularReference: '#2A3A4A',
            propertyKey: '#1A2A3A',
            punctuation: '#3A4A5A'
        },
        dark: {
            null: '#AACCDD',
            undefined: '#BBDDEE',
            boolean: '#88BBDD',
            number: '#CCEEFF',
            string: '#99CCEE',
            symbol: '#AACCDD',
            function: '#DDEEFF',
            object: '#99BBDD',
            array: '#88CCEE',
            map: '#AADDEE',
            set: '#99DDFF',
            weakmap: '#DDEEFF',
            weakset: '#AACCEE',
            date: '#EEFFFF',
            regexp: '#99CCEE',
            error: '#AABBDD',
            circularReference: '#AACCDD',
            propertyKey: '#DDEEFF',
            punctuation: '#BBDDEE'
        }
    },
    alien: {
        light: {
            null: '#2A3A2A',
            undefined: '#3A4A3A',
            boolean: '#1A5A3A',
            number: '#4A6A3A',
            string: '#0A6A4A',
            symbol: '#2A4A4A',
            function: '#5A7A5A',
            object: '#1A4A2A',
            array: '#2A5A5A',
            map: '#0A7A5A',
            set: '#1A8A6A',
            weakmap: '#6A8A6A',
            weakset: '#3A5A4A',
            date: '#5A9A7A',
            regexp: '#2A5A4A',
            error: '#3A4A2A',
            circularReference: '#2A3A2A',
            propertyKey: '#1A2A1A',
            punctuation: '#3A4A3A'
        },
        dark: {
            null: '#A5D5A5',
            undefined: '#B5E5B5',
            boolean: '#88E5C5',
            number: '#CCF5B5',
            string: '#77F5D5',
            symbol: '#99CCCC',
            function: '#DDFFE5',
            object: '#88E5A5',
            array: '#99E5E5',
            map: '#77FFD5',
            set: '#88FFEE',
            weakmap: '#EEFFEE',
            weakset: '#B5E5CC',
            date: '#DDFFDD',
            regexp: '#99E5CC',
            error: '#B5E5A5',
            circularReference: '#A5D5A5',
            propertyKey: '#DDFFD5',
            punctuation: '#B5E5B5'
        }
    }
};

/**
 * Collection of color range combination palettes
 * Each palette combines two colors with the first color used more heavily than the second
 * Each palette has light and dark variants for different backgrounds
 */
const colorRangePalettes = {
    redsAndOranges: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#AA5500',
            string: '#990000',
            symbol: '#BB6600',
            function: '#AA0000',
            object: '#CC3300',
            array: '#BB0000',
            map: '#DD6600',
            set: '#CC0000',
            weakmap: '#EE7700',
            weakset: '#DD1100',
            date: '#FF8800',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#FFBB77',
            string: '#FFCCCC',
            symbol: '#FFCC88',
            function: '#FFDDDD',
            object: '#FFAA66',
            array: '#FFEEEE',
            map: '#FFDD99',
            set: '#FFBBBB',
            weakmap: '#FFEEAA',
            weakset: '#FF9999',
            date: '#FFFFBB',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndYellows: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#AA9900',
            string: '#990000',
            symbol: '#BBAA00',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#DDBB00',
            set: '#CC0000',
            weakmap: '#EECC00',
            weakset: '#DD1100',
            date: '#FFDD00',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#FFFFAA',
            string: '#FFCCCC',
            symbol: '#FFFFBB',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#FFFFCC',
            set: '#FFBBBB',
            weakmap: '#FFFFDD',
            weakset: '#FF9999',
            date: '#FFFFEE',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndGreens: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#006600',
            string: '#990000',
            symbol: '#007700',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#008800',
            set: '#CC0000',
            weakmap: '#009900',
            weakset: '#DD1100',
            date: '#00AA00',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#99FF99',
            string: '#FFCCCC',
            symbol: '#AAFFAA',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#BBFFBB',
            set: '#FFBBBB',
            weakmap: '#CCFFCC',
            weakset: '#FF9999',
            date: '#DDFFDD',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndBlues: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#000066',
            string: '#990000',
            symbol: '#000077',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#000088',
            set: '#CC0000',
            weakmap: '#000099',
            weakset: '#DD1100',
            date: '#0000AA',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#9999FF',
            string: '#FFCCCC',
            symbol: '#AAAAFF',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#BBBBFF',
            set: '#FFBBBB',
            weakmap: '#CCCCFF',
            weakset: '#FF9999',
            date: '#DDDDFF',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndPurples: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#660066',
            string: '#990000',
            symbol: '#770077',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#880088',
            set: '#CC0000',
            weakmap: '#990099',
            weakset: '#DD1100',
            date: '#AA00AA',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#FF99FF',
            string: '#FFCCCC',
            symbol: '#FFAAFF',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#FFBBFF',
            set: '#FFBBBB',
            weakmap: '#FFCCFF',
            weakset: '#FF9999',
            date: '#FFDDFF',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndBrowns: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#664400',
            string: '#990000',
            symbol: '#775500',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#886600',
            set: '#CC0000',
            weakmap: '#997700',
            weakset: '#DD1100',
            date: '#AA8800',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#FFCC99',
            string: '#FFCCCC',
            symbol: '#FFDDAA',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#FFEEBB',
            set: '#FFBBBB',
            weakmap: '#FFFFCC',
            weakset: '#FF9999',
            date: '#FFFFDD',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndGrays: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#444444',
            string: '#990000',
            symbol: '#555555',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#666666',
            set: '#CC0000',
            weakmap: '#777777',
            weakset: '#DD1100',
            date: '#888888',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#CCCCCC',
            string: '#FFCCCC',
            symbol: '#DDDDDD',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#EEEEEE',
            set: '#FFBBBB',
            weakmap: '#FFFFFF',
            weakset: '#FF9999',
            date: '#F5F5F5',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndMagentas: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#880044',
            string: '#990000',
            symbol: '#990055',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#AA0066',
            set: '#CC0000',
            weakmap: '#BB0077',
            weakset: '#DD1100',
            date: '#CC0088',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#FFAACC',
            string: '#FFCCCC',
            symbol: '#FFBBDD',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#FFCCEE',
            set: '#FFBBBB',
            weakmap: '#FFDDFF',
            weakset: '#FF9999',
            date: '#FFEEFF',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndCyans: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#006666',
            string: '#990000',
            symbol: '#007777',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#008888',
            set: '#CC0000',
            weakmap: '#009999',
            weakset: '#DD1100',
            date: '#00AAAA',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#99FFFF',
            string: '#FFCCCC',
            symbol: '#AAFFFF',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#BBFFFF',
            set: '#FFBBBB',
            weakmap: '#CCFFFF',
            weakset: '#FF9999',
            date: '#DDFFFF',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    redsAndCharcoals: {
        light: {
            null: '#660000',
            undefined: '#770000',
            boolean: '#880011',
            number: '#222222',
            string: '#990000',
            symbol: '#333333',
            function: '#AA0000',
            object: '#CC2200',
            array: '#BB0000',
            map: '#444444',
            set: '#CC0000',
            weakmap: '#555555',
            weakset: '#DD1100',
            date: '#666666',
            regexp: '#EE0000',
            error: '#FF2200',
            circularReference: '#550000',
            propertyKey: '#440000',
            punctuation: '#660000'
        },
        dark: {
            null: '#FFAAAA',
            undefined: '#FFBBBB',
            boolean: '#FF9999',
            number: '#AAAAAA',
            string: '#FFCCCC',
            symbol: '#BBBBBB',
            function: '#FFDDDD',
            object: '#FFAA99',
            array: '#FFEEEE',
            map: '#CCCCCC',
            set: '#FFBBBB',
            weakmap: '#DDDDDD',
            weakset: '#FF9999',
            date: '#EEEEEE',
            regexp: '#FF8888',
            error: '#FFCCAA',
            circularReference: '#FF9999',
            propertyKey: '#FFCCCC',
            punctuation: '#FFAAAA'
        }
    },
    orangesAndReds: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#880000',
            string: '#996600',
            symbol: '#990000',
            function: '#AA7700',
            object: '#AA0000',
            array: '#BB8800',
            map: '#BB0000',
            set: '#CC9900',
            weakmap: '#CC1100',
            weakset: '#DDAA00',
            date: '#DD2200',
            regexp: '#EEBB00',
            error: '#EE3300',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#FFAAAA',
            string: '#FFEEBB',
            symbol: '#FFBBBB',
            function: '#FFFFCC',
            object: '#FFCCCC',
            array: '#FFFFDD',
            map: '#FFDDDD',
            set: '#FFFFEE',
            weakmap: '#FFEEEE',
            weakset: '#FFFFBB',
            date: '#FFCCAA',
            regexp: '#FFFFCC',
            error: '#FFDDBB',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndYellows: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#888800',
            string: '#996600',
            symbol: '#999900',
            function: '#AA7700',
            object: '#AAAA00',
            array: '#BB8800',
            map: '#BBBB00',
            set: '#CC9900',
            weakmap: '#CCCC00',
            weakset: '#DDAA00',
            date: '#DDDD00',
            regexp: '#EEBB00',
            error: '#EEEE00',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#FFFFAA',
            string: '#FFEEBB',
            symbol: '#FFFFBB',
            function: '#FFFFCC',
            object: '#FFFFCC',
            array: '#FFFFDD',
            map: '#FFFFDD',
            set: '#FFFFEE',
            weakmap: '#FFFFEE',
            weakset: '#FFFFBB',
            date: '#FFFFFF',
            regexp: '#FFFFCC',
            error: '#FFFFDD',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndGreens: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#006600',
            string: '#996600',
            symbol: '#007700',
            function: '#AA7700',
            object: '#008800',
            array: '#BB8800',
            map: '#009900',
            set: '#CC9900',
            weakmap: '#00AA00',
            weakset: '#DDAA00',
            date: '#00BB00',
            regexp: '#EEBB00',
            error: '#00CC00',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#99FF99',
            string: '#FFEEBB',
            symbol: '#AAFFAA',
            function: '#FFFFCC',
            object: '#BBFFBB',
            array: '#FFFFDD',
            map: '#CCFFCC',
            set: '#FFFFEE',
            weakmap: '#DDFFDD',
            weakset: '#FFFFBB',
            date: '#EEFFEE',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndBlues: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#000066',
            string: '#996600',
            symbol: '#000077',
            function: '#AA7700',
            object: '#000088',
            array: '#BB8800',
            map: '#000099',
            set: '#CC9900',
            weakmap: '#0000AA',
            weakset: '#DDAA00',
            date: '#0000BB',
            regexp: '#EEBB00',
            error: '#0000CC',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#9999FF',
            string: '#FFEEBB',
            symbol: '#AAAAFF',
            function: '#FFFFCC',
            object: '#BBBBFF',
            array: '#FFFFDD',
            map: '#CCCCFF',
            set: '#FFFFEE',
            weakmap: '#DDDDFF',
            weakset: '#FFFFBB',
            date: '#EEEEFF',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndPurples: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#660066',
            string: '#996600',
            symbol: '#770077',
            function: '#AA7700',
            object: '#880088',
            array: '#BB8800',
            map: '#990099',
            set: '#CC9900',
            weakmap: '#AA00AA',
            weakset: '#DDAA00',
            date: '#BB00BB',
            regexp: '#EEBB00',
            error: '#CC00CC',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#FF99FF',
            string: '#FFEEBB',
            symbol: '#FFAAFF',
            function: '#FFFFCC',
            object: '#FFBBFF',
            array: '#FFFFDD',
            map: '#FFCCFF',
            set: '#FFFFEE',
            weakmap: '#FFDDFF',
            weakset: '#FFFFBB',
            date: '#FFEEFF',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndBrowns: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#553300',
            string: '#996600',
            symbol: '#664400',
            function: '#AA7700',
            object: '#775500',
            array: '#BB8800',
            map: '#886600',
            set: '#CC9900',
            weakmap: '#997700',
            weakset: '#DDAA00',
            date: '#AA8800',
            regexp: '#EEBB00',
            error: '#BB9900',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#DDBB88',
            string: '#FFEEBB',
            symbol: '#EECC99',
            function: '#FFFFCC',
            object: '#FFDDAA',
            array: '#FFFFDD',
            map: '#FFEEBB',
            set: '#FFFFEE',
            weakmap: '#FFFFCC',
            weakset: '#FFFFBB',
            date: '#FFFFDD',
            regexp: '#FFFFCC',
            error: '#FFFFEE',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndGrays: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#444444',
            string: '#996600',
            symbol: '#555555',
            function: '#AA7700',
            object: '#666666',
            array: '#BB8800',
            map: '#777777',
            set: '#CC9900',
            weakmap: '#888888',
            weakset: '#DDAA00',
            date: '#999999',
            regexp: '#EEBB00',
            error: '#AAAAAA',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#CCCCCC',
            string: '#FFEEBB',
            symbol: '#DDDDDD',
            function: '#FFFFCC',
            object: '#EEEEEE',
            array: '#FFFFDD',
            map: '#FFFFFF',
            set: '#FFFFEE',
            weakmap: '#F5F5F5',
            weakset: '#FFFFBB',
            date: '#FAFAFA',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndMagentas: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#880044',
            string: '#996600',
            symbol: '#990055',
            function: '#AA7700',
            object: '#AA0066',
            array: '#BB8800',
            map: '#BB0077',
            set: '#CC9900',
            weakmap: '#CC0088',
            weakset: '#DDAA00',
            date: '#DD0099',
            regexp: '#EEBB00',
            error: '#EE00AA',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#FFAACC',
            string: '#FFEEBB',
            symbol: '#FFBBDD',
            function: '#FFFFCC',
            object: '#FFCCEE',
            array: '#FFFFDD',
            map: '#FFDDFF',
            set: '#FFFFEE',
            weakmap: '#FFEEFF',
            weakset: '#FFFFBB',
            date: '#FFFFFF',
            regexp: '#FFFFCC',
            error: '#FFEEFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndCyans: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#006666',
            string: '#996600',
            symbol: '#007777',
            function: '#AA7700',
            object: '#008888',
            array: '#BB8800',
            map: '#009999',
            set: '#CC9900',
            weakmap: '#00AAAA',
            weakset: '#DDAA00',
            date: '#00BBBB',
            regexp: '#EEBB00',
            error: '#00CCCC',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#99FFFF',
            string: '#FFEEBB',
            symbol: '#AAFFFF',
            function: '#FFFFCC',
            object: '#BBFFFF',
            array: '#FFFFDD',
            map: '#CCFFFF',
            set: '#FFFFEE',
            weakmap: '#DDFFFF',
            weakset: '#FFFFBB',
            date: '#EEFFFF',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    orangesAndCharcoals: {
        light: {
            null: '#664400',
            undefined: '#775500',
            boolean: '#885500',
            number: '#222222',
            string: '#996600',
            symbol: '#333333',
            function: '#AA7700',
            object: '#444444',
            array: '#BB8800',
            map: '#555555',
            set: '#CC9900',
            weakmap: '#666666',
            weakset: '#DDAA00',
            date: '#777777',
            regexp: '#EEBB00',
            error: '#888888',
            circularReference: '#553300',
            propertyKey: '#442200',
            punctuation: '#664400'
        },
        dark: {
            null: '#FFCC99',
            undefined: '#FFDDAA',
            boolean: '#FFDDBB',
            number: '#AAAAAA',
            string: '#FFEEBB',
            symbol: '#BBBBBB',
            function: '#FFFFCC',
            object: '#CCCCCC',
            array: '#FFFFDD',
            map: '#DDDDDD',
            set: '#FFFFEE',
            weakmap: '#EEEEEE',
            weakset: '#FFFFBB',
            date: '#F5F5F5',
            regexp: '#FFFFCC',
            error: '#FFFFFF',
            circularReference: '#FFBB99',
            propertyKey: '#FFDDCC',
            punctuation: '#FFCC99'
        }
    },
    yellowsAndReds: {
        light: {
            null: '#888800',
            undefined: '#999900',
            boolean: '#AAAA00',
            number: '#880000',
            string: '#BBBB00',
            symbol: '#990000',
            function: '#CCCC00',
            object: '#AA0000',
            array: '#DDDD00',
            map: '#BB0000',
            set: '#EEEE00',
            weakmap: '#CC1100',
            weakset: '#FFFF00',
            date: '#DD2200',
            regexp: '#FFFF11',
            error: '#EE3300',
            circularReference: '#777700',
            propertyKey: '#666600',
            punctuation: '#888800'
        },
        dark: {
            null: '#FFFFAA',
            undefined: '#FFFFBB',
            boolean: '#FFFFCC',
            number: '#FFAAAA',
            string: '#FFFFDD',
            symbol: '#FFBBBB',
            function: '#FFFFEE',
            object: '#FFCCCC',
            array: '#FFFFFF',
            map: '#FFDDDD',
            set: '#FFFFEE',
            weakmap: '#FFEEEE',
            weakset: '#FFFFDD',
            date: '#FFCCAA',
            regexp: '#FFFFEE',
            error: '#FFDDBB',
            circularReference: '#FFFF99',
            propertyKey: '#FFFFDD',
            punctuation: '#FFFFAA'
        }
    },
    yellowsAndOranges: {
        light: {
            null: '#888800',
            undefined: '#999900',
            boolean: '#AAAA00',
            number: '#885500',
            string: '#BBBB00',
            symbol: '#996600',
            function: '#CCCC00',
            object: '#AA7700',
            array: '#DDDD00',
            map: '#BB8800',
            set: '#EEEE00',
            weakmap: '#CC9900',
            weakset: '#FFFF00',
            date: '#DDAA00',
            regexp: '#FFFF11',
            error: '#EEBB00',
            circularReference: '#777700',
            propertyKey: '#666600',
            punctuation: '#888800'
        },
        dark: {
            null: '#FFFFAA',
            undefined: '#FFFFBB',
            boolean: '#FFFFCC',
            number: '#FFDDAA',
            string: '#FFFFDD',
            symbol: '#FFEEBB',
            function: '#FFFFEE',
            object: '#FFFFCC',
            array: '#FFFFFF',
            map: '#FFFFDD',
            set: '#FFFFEE',
            weakmap: '#FFFFEE',
            weakset: '#FFFFDD',
            date: '#FFFFBB',
            regexp: '#FFFFEE',
            error: '#FFFFCC',
            circularReference: '#FFFF99',
            propertyKey: '#FFFFDD',
            punctuation: '#FFFFAA'
        }
    }
};

/**
 * Collection of protanopia color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const protanopiaPalettes = {
    protanopia: {
        light: {
            null: '#2A4A6A',
            undefined: '#3A5A7A',
            boolean: '#1A5A8A',
            number: '#5A5A2A',
            string: '#2A6A9A',
            symbol: '#3A4A7A',
            function: '#6A6A3A',
            object: '#2A5A7A',
            array: '#1A4A7A',
            map: '#3A7AAA',
            set: '#2A5A8A',
            weakmap: '#7A7A4A',
            weakset: '#4A5A3A',
            date: '#6A6A2A',
            regexp: '#2A6A8A',
            error: '#4A4A2A',
            circularReference: '#2A4A6A',
            propertyKey: '#1A3A5A',
            punctuation: '#3A5A7A'
        },
        dark: {
            null: '#99CCFF',
            undefined: '#AADDFF',
            boolean: '#88EEFF',
            number: '#DDDD99',
            string: '#99EEFF',
            symbol: '#AACCFF',
            function: '#EEEEAA',
            object: '#99DDFF',
            array: '#88CCFF',
            map: '#AAFFFF',
            set: '#99EEFF',
            weakmap: '#FFFFCC',
            weakset: '#CCDD99',
            date: '#EEEE99',
            regexp: '#99EEFF',
            error: '#CCCC99',
            circularReference: '#99CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#AADDFF'
        }
    },
    protanopiaBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A5A',
            boolean: '#0055AA',
            number: '#AA8800',
            string: '#0088AA',
            symbol: '#5555AA',
            function: '#0099BB',
            object: '#6688AA',
            array: '#0066BB',
            map: '#0077AA',
            set: '#4488BB',
            weakmap: '#AA9900',
            weakset: '#3366AA',
            date: '#BBAA00',
            regexp: '#3355AA',
            error: '#5577AA',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCFF',
            boolean: '#66AAFF',
            number: '#FFDD66',
            string: '#66DDFF',
            symbol: '#AAAAFF',
            function: '#77EEFF',
            object: '#BBDDFF',
            array: '#77CCFF',
            map: '#66DDFF',
            set: '#99DDFF',
            weakmap: '#FFEE66',
            weakset: '#88BBFF',
            date: '#FFEE77',
            regexp: '#88AAFF',
            error: '#AACCFF',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    protanopiaSubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#4A4A6A',
            boolean: '#3A5A7A',
            number: '#7A6A4A',
            string: '#3A6A7A',
            symbol: '#4A4A7A',
            function: '#3A7A8A',
            object: '#5A6A7A',
            array: '#3A5A8A',
            map: '#3A6A7A',
            set: '#4A6A8A',
            weakmap: '#7A6A3A',
            weakset: '#3A5A7A',
            date: '#8A7A4A',
            regexp: '#3A4A7A',
            error: '#4A5A7A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBC5',
            boolean: '#99BBCC',
            number: '#C5B599',
            string: '#99CCCC',
            symbol: '#AAAACC',
            function: '#99DDDD',
            object: '#AABBCC',
            array: '#99BBDD',
            map: '#99CCCC',
            set: '#AACCDD',
            weakmap: '#C5BB99',
            weakset: '#99BBCC',
            date: '#D5CC99',
            regexp: '#9999CC',
            error: '#AABBCC',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    protanopiaPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#5A5A7A',
            boolean: '#4A6A8A',
            number: '#8A7A5A',
            string: '#4A7A8A',
            symbol: '#5A5A8A',
            function: '#4A8A9A',
            object: '#6A7A8A',
            array: '#4A6A9A',
            map: '#4A7A8A',
            set: '#5A7A9A',
            weakmap: '#8A7A4A',
            weakset: '#4A6A8A',
            date: '#9A8A5A',
            regexp: '#4A5A8A',
            error: '#5A6A8A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5FF',
            boolean: '#CCEEFF',
            number: '#FFEECC',
            string: '#CCEEFF',
            symbol: '#DDDDFF',
            function: '#CCFFFF',
            object: '#DDEEFF',
            array: '#CCEEFF',
            map: '#CCEEFF',
            set: '#DDEEFF',
            weakmap: '#FFEECC',
            weakset: '#CCEEFF',
            date: '#FFFFCC',
            regexp: '#CCDDFF',
            error: '#DDEEFF',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    protanopiaBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#2A3A4A',
            number: '#4A4A3A',
            string: '#2A4A5A',
            symbol: '#3A3A4A',
            function: '#2A5A6A',
            object: '#4A4A5A',
            array: '#2A3A5A',
            map: '#2A4A5A',
            set: '#3A4A6A',
            weakmap: '#4A4A2A',
            weakset: '#2A3A4A',
            date: '#5A5A3A',
            regexp: '#3A3A5A',
            error: '#3A4A5A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#99AAAA',
            number: '#AAAA99',
            string: '#99BBCC',
            symbol: '#A5A5AA',
            function: '#99CCDD',
            object: '#AAAACC',
            array: '#99AACC',
            map: '#99BBCC',
            set: '#AABBDD',
            weakmap: '#AAAA88',
            weakset: '#99AAAA',
            date: '#BBBB99',
            regexp: '#9999AA',
            error: '#AABBCC',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    protanopiaFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#2A2A6A',
            boolean: '#0044AA',
            number: '#AA7700',
            string: '#0099CC',
            symbol: '#6622AA',
            function: '#00AACC',
            object: '#5566AA',
            array: '#0077BB',
            map: '#0088AA',
            set: '#3388CC',
            weakmap: '#BB9900',
            weakset: '#2255AA',
            date: '#CCAA00',
            regexp: '#4433AA',
            error: '#4477BB',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#DDDDFF',
            boolean: '#77BBFF',
            number: '#FFEE77',
            string: '#77FFFF',
            symbol: '#CC88FF',
            function: '#88FFFF',
            object: '#CCDDFF',
            array: '#88DDFF',
            map: '#77EEFF',
            set: '#AAEEFF',
            weakmap: '#FFFF77',
            weakset: '#99CCFF',
            date: '#FFFF88',
            regexp: '#AA99FF',
            error: '#BBDDFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    protanopiaVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#1A1A5A',
            boolean: '#0033AA',
            number: '#AA6600',
            string: '#0077BB',
            symbol: '#4400AA',
            function: '#0088CC',
            object: '#4455AA',
            array: '#0055BB',
            map: '#0066AA',
            set: '#2266BB',
            weakmap: '#AA7700',
            weakset: '#1144AA',
            date: '#BB9900',
            regexp: '#2233AA',
            error: '#3366AA',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#EEEEFF',
            boolean: '#88CCFF',
            number: '#FFEE55',
            string: '#88EEFF',
            symbol: '#CC99FF',
            function: '#99FFFF',
            object: '#DDEEFF',
            array: '#99EEFF',
            map: '#88EEFF',
            set: '#BBEEFF',
            weakmap: '#FFFF55',
            weakset: '#AADDFF',
            date: '#FFFF66',
            regexp: '#BB99FF',
            error: '#CCDEFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of deuteranopia color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const deuteranopiaPalettes = {
    deuteranopia: {
        light: {
            null: '#3A4A6A',
            undefined: '#4A5A7A',
            boolean: '#2A5A8A',
            number: '#6A5A2A',
            string: '#3A6A9A',
            symbol: '#4A4A7A',
            function: '#7A6A3A',
            object: '#3A5A7A',
            array: '#2A4A7A',
            map: '#4A7AAA',
            set: '#3A5A8A',
            weakmap: '#8A7A4A',
            weakset: '#5A5A3A',
            date: '#7A6A2A',
            regexp: '#3A6A8A',
            error: '#5A4A2A',
            circularReference: '#3A4A6A',
            propertyKey: '#2A3A5A',
            punctuation: '#4A5A7A'
        },
        dark: {
            null: '#AACCFF',
            undefined: '#BBDDFF',
            boolean: '#99EEFF',
            number: '#EEDD99',
            string: '#AAFFFF',
            symbol: '#BBCCFF',
            function: '#FFEEAA',
            object: '#AADDFF',
            array: '#99CCFF',
            map: '#BBFFFF',
            set: '#AAFFFF',
            weakmap: '#FFFFDD',
            weakset: '#DDEE99',
            date: '#FFEE99',
            regexp: '#AAFFFF',
            error: '#DDCC99',
            circularReference: '#AACCFF',
            propertyKey: '#DDFFFF',
            punctuation: '#BBDDFF'
        }
    },
    deuteranopiaBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A5A',
            boolean: '#0055AA',
            number: '#AA8800',
            string: '#0088BB',
            symbol: '#5555AA',
            function: '#0099CC',
            object: '#6688BB',
            array: '#0066CC',
            map: '#0077BB',
            set: '#4488CC',
            weakmap: '#AA9900',
            weakset: '#3366BB',
            date: '#BBAA00',
            regexp: '#3355AA',
            error: '#5577BB',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCFF',
            boolean: '#66AAFF',
            number: '#FFDD66',
            string: '#66EEFF',
            symbol: '#AAAAFF',
            function: '#77EEFF',
            object: '#BBDDFF',
            array: '#77DDFF',
            map: '#66EEFF',
            set: '#99DDFF',
            weakmap: '#FFEE66',
            weakset: '#88BBFF',
            date: '#FFEE77',
            regexp: '#88AAFF',
            error: '#AACCFF',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    deuteranopiaSubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#4A4A6A',
            boolean: '#3A5A7A',
            number: '#7A6A4A',
            string: '#3A6A8A',
            symbol: '#4A4A7A',
            function: '#3A7A9A',
            object: '#5A6A8A',
            array: '#3A5A9A',
            map: '#3A6A8A',
            set: '#4A6A9A',
            weakmap: '#7A6A3A',
            weakset: '#3A5A8A',
            date: '#8A7A4A',
            regexp: '#3A4A7A',
            error: '#4A5A8A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBC5',
            boolean: '#99BBCC',
            number: '#C5B599',
            string: '#99DDDD',
            symbol: '#AAAACC',
            function: '#99EEEE',
            object: '#AABBDD',
            array: '#99CCEE',
            map: '#99DDDD',
            set: '#AADDEE',
            weakmap: '#C5BB99',
            weakset: '#99BBDD',
            date: '#D5CC99',
            regexp: '#9999CC',
            error: '#AABBDD',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    deuteranopiaPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#5A5A7A',
            boolean: '#4A6A8A',
            number: '#8A7A5A',
            string: '#4A7A9A',
            symbol: '#5A5A8A',
            function: '#4A8AAA',
            object: '#6A7A9A',
            array: '#4A6AAA',
            map: '#4A7A9A',
            set: '#5A7AAA',
            weakmap: '#8A7A4A',
            weakset: '#4A6A9A',
            date: '#9A8A5A',
            regexp: '#4A5A8A',
            error: '#5A6A9A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5FF',
            boolean: '#CCEEFF',
            number: '#FFEECC',
            string: '#CCFFFF',
            symbol: '#DDDDFF',
            function: '#DDFFFF',
            object: '#DDEEFF',
            array: '#CCEEFF',
            map: '#CCFFFF',
            set: '#DDEEFF',
            weakmap: '#FFEECC',
            weakset: '#CCEEFF',
            date: '#FFFFCC',
            regexp: '#CCDDFF',
            error: '#DDEEFF',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    deuteranopiaBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#2A3A4A',
            number: '#4A4A3A',
            string: '#2A4A6A',
            symbol: '#3A3A4A',
            function: '#2A5A7A',
            object: '#4A4A6A',
            array: '#2A3A6A',
            map: '#2A4A6A',
            set: '#3A4A7A',
            weakmap: '#4A4A2A',
            weakset: '#2A3A5A',
            date: '#5A5A3A',
            regexp: '#3A3A5A',
            error: '#3A4A6A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#99AAAA',
            number: '#AAAA99',
            string: '#99CCDD',
            symbol: '#A5A5AA',
            function: '#99DDEE',
            object: '#AAAADD',
            array: '#99AADD',
            map: '#99CCDD',
            set: '#AABBEE',
            weakmap: '#AAAA88',
            weakset: '#99AACC',
            date: '#BBBB99',
            regexp: '#9999AA',
            error: '#AABBDD',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    deuteranopiaFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#2A2A6A',
            boolean: '#0044AA',
            number: '#AA7700',
            string: '#0099DD',
            symbol: '#6622AA',
            function: '#00AADD',
            object: '#5566BB',
            array: '#0077CC',
            map: '#0088BB',
            set: '#3388DD',
            weakmap: '#BB9900',
            weakset: '#2255BB',
            date: '#CCAA00',
            regexp: '#4433AA',
            error: '#4477CC',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#DDDDFF',
            boolean: '#77BBFF',
            number: '#FFEE77',
            string: '#77FFFF',
            symbol: '#CC88FF',
            function: '#88FFFF',
            object: '#CCDDFF',
            array: '#88EEFF',
            map: '#77FFFF',
            set: '#AAEEFF',
            weakmap: '#FFFF77',
            weakset: '#99CCFF',
            date: '#FFFF88',
            regexp: '#AA99FF',
            error: '#BBDDFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    deuteranopiaVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#1A1A5A',
            boolean: '#0033AA',
            number: '#AA6600',
            string: '#0077CC',
            symbol: '#4400AA',
            function: '#0088DD',
            object: '#4455BB',
            array: '#0055CC',
            map: '#0066BB',
            set: '#2266CC',
            weakmap: '#AA7700',
            weakset: '#1144BB',
            date: '#BB9900',
            regexp: '#2233AA',
            error: '#3366BB',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#EEEEFF',
            boolean: '#88CCFF',
            number: '#FFEE55',
            string: '#88FFFF',
            symbol: '#CC99FF',
            function: '#99FFFF',
            object: '#DDEEFF',
            array: '#99EEFF',
            map: '#88FFFF',
            set: '#BBEEFF',
            weakmap: '#FFFF55',
            weakset: '#AADDFF',
            date: '#FFFF66',
            regexp: '#BB99FF',
            error: '#CCDEFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of tritanopia color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const tritanopiaPalettes = {
    tritanopia: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#3A5A2A',
            number: '#6A4A2A',
            string: '#2A6A2A',
            symbol: '#5A4A3A',
            function: '#7A5A3A',
            object: '#4A3A2A',
            array: '#3A6A3A',
            map: '#5A5A2A',
            set: '#2A7A3A',
            weakmap: '#8A6A4A',
            weakset: '#6A5A3A',
            date: '#7A6A2A',
            regexp: '#4A5A2A',
            error: '#6A3A2A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#D5C5B5',
            undefined: '#E5D5C5',
            boolean: '#C5E5B5',
            number: '#F5D5B5',
            string: '#B5F5B5',
            symbol: '#E5D5C5',
            function: '#FFE5C5',
            object: '#D5C5B5',
            array: '#C5F5C5',
            map: '#E5E5B5',
            set: '#B5FFD5',
            weakmap: '#FFEFD5',
            weakset: '#F5E5D5',
            date: '#FFE5B5',
            regexp: '#D5E5B5',
            error: '#F5C5B5',
            circularReference: '#D5C5B5',
            propertyKey: '#E5D5C5',
            punctuation: '#E5D5C5'
        }
    },
    tritanopiaBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A3A3A',
            boolean: '#AA0055',
            number: '#AA8800',
            string: '#00AA44',
            symbol: '#AA5500',
            function: '#00BB55',
            object: '#AA4488',
            array: '#00AA55',
            map: '#00BB44',
            set: '#44AA55',
            weakmap: '#BB9900',
            weakset: '#33AA44',
            date: '#CCAA00',
            regexp: '#AA3355',
            error: '#AA5577',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#FFCCCC',
            boolean: '#FF66AA',
            number: '#FFDD66',
            string: '#66FF99',
            symbol: '#FFAA66',
            function: '#77FFAA',
            object: '#FFAAE5',
            array: '#66FFAA',
            map: '#77FFAA',
            set: '#99FFAA',
            weakmap: '#FFEE66',
            weakset: '#88FFAA',
            date: '#FFEE77',
            regexp: '#FF88AA',
            error: '#FFAACC',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    tritanopiaSubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A4A4A',
            boolean: '#7A3A5A',
            number: '#7A6A4A',
            string: '#3A7A5A',
            symbol: '#7A5A4A',
            function: '#3A8A6A',
            object: '#7A5A7A',
            array: '#3A7A6A',
            map: '#3A8A5A',
            set: '#4A7A6A',
            weakmap: '#8A7A3A',
            weakset: '#3A7A5A',
            date: '#9A8A4A',
            regexp: '#7A4A5A',
            error: '#7A5A6A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#C5BBBB',
            boolean: '#CC99AA',
            number: '#C5B599',
            string: '#99CCAA',
            symbol: '#C5AA99',
            function: '#99DDBB',
            object: '#CCAAC5',
            array: '#99CCBB',
            map: '#99DDAA',
            set: '#AACCBB',
            weakmap: '#D5C599',
            weakset: '#99CCAA',
            date: '#E5D599',
            regexp: '#CC99AA',
            error: '#CCAABB',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    tritanopiaPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#7A5A5A',
            boolean: '#8A4A6A',
            number: '#8A7A5A',
            string: '#4A8A6A',
            symbol: '#8A6A5A',
            function: '#4A9A7A',
            object: '#8A6A8A',
            array: '#4A8A7A',
            map: '#4A9A6A',
            set: '#5A8A7A',
            weakmap: '#9A8A4A',
            weakset: '#4A8A6A',
            date: '#AA9A5A',
            regexp: '#8A5A6A',
            error: '#8A6A7A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#FFEEEE',
            boolean: '#FFCCDD',
            number: '#FFEECC',
            string: '#CCFFDD',
            symbol: '#FFDDCC',
            function: '#CCFFEE',
            object: '#FFDDFF',
            array: '#CCFFEE',
            map: '#CCFFDD',
            set: '#DDFFEE',
            weakmap: '#FFFFCC',
            weakset: '#CCFFDD',
            date: '#FFFFDD',
            regexp: '#FFCCDD',
            error: '#FFDDEE',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    tritanopiaBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#4A2A3A',
            number: '#4A4A3A',
            string: '#2A4A3A',
            symbol: '#4A3A3A',
            function: '#2A5A4A',
            object: '#4A3A4A',
            array: '#2A4A4A',
            map: '#2A5A3A',
            set: '#3A4A4A',
            weakmap: '#5A4A2A',
            weakset: '#2A4A3A',
            date: '#6A5A3A',
            regexp: '#4A3A3A',
            error: '#4A3A4A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#AAAA99',
            number: '#AAAA99',
            string: '#99AAAA',
            symbol: '#AAA599',
            function: '#99BBAA',
            object: '#AAA5AA',
            array: '#99AAAA',
            map: '#99BBAA',
            set: '#AABBAA',
            weakmap: '#BBAA88',
            weakset: '#99AAAA',
            date: '#CCBB99',
            regexp: '#AAA599',
            error: '#AAA5AA',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    tritanopiaFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#6A2A2A',
            boolean: '#AA0044',
            number: '#AA7700',
            string: '#00AA33',
            symbol: '#AA4400',
            function: '#00CC55',
            object: '#AA3377',
            array: '#00AA44',
            map: '#00BB33',
            set: '#33AA44',
            weakmap: '#CC9900',
            weakset: '#22AA33',
            date: '#DDAA00',
            regexp: '#AA2244',
            error: '#AA4466',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#FFDDDD',
            boolean: '#FF77BB',
            number: '#FFEE77',
            string: '#77FF99',
            symbol: '#FFBB77',
            function: '#88FFBB',
            object: '#FF99DD',
            array: '#77FFAA',
            map: '#88FF99',
            set: '#AAFFBB',
            weakmap: '#FFFF77',
            weakset: '#99FFAA',
            date: '#FFFF88',
            regexp: '#FF99BB',
            error: '#FFBBDD',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    tritanopiaVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#5A1A1A',
            boolean: '#AA0033',
            number: '#AA6600',
            string: '#00AA22',
            symbol: '#AA3300',
            function: '#00BB44',
            object: '#AA2266',
            array: '#00AA33',
            map: '#00BB22',
            set: '#22AA33',
            weakmap: '#BB7700',
            weakset: '#11AA22',
            date: '#CC9900',
            regexp: '#AA1133',
            error: '#AA3355',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#FFEEEE',
            boolean: '#FF88CC',
            number: '#FFEE55',
            string: '#88FF99',
            symbol: '#FFCC55',
            function: '#99FFBB',
            object: '#FF99EE',
            array: '#88FFAA',
            map: '#99FF99',
            set: '#BBFFBB',
            weakmap: '#FFFF55',
            weakset: '#AAFFBB',
            date: '#FFFF66',
            regexp: '#FF99CC',
            error: '#FFCCEE',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of monochromacy color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const monochromacyPalettes = {
    monochromacy: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#2A2A2A',
            number: '#5A5A5A',
            string: '#353535',
            symbol: '#454545',
            function: '#5F5F5F',
            object: '#404040',
            array: '#252525',
            map: '#505050',
            set: '#383838',
            weakmap: '#656565',
            weakset: '#484848',
            date: '#555555',
            regexp: '#333333',
            error: '#585858',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#AFAFAF',
            number: '#E5E5E5',
            string: '#CACACA',
            symbol: '#D0D0D0',
            function: '#EFEFEF',
            object: '#CFCFCF',
            array: '#A5A5A5',
            map: '#DADADA',
            set: '#C8C8C8',
            weakmap: '#F5F5F5',
            weakset: '#D8D8D8',
            date: '#E0E0E0',
            regexp: '#C0C0C0',
            error: '#E8E8E8',
            circularReference: '#C5C5C5',
            propertyKey: '#F0F0F0',
            punctuation: '#D5D5D5'
        }
    },
    monochromacyBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#1A1A1A',
            number: '#2A2A2A',
            string: '#0A0A0A',
            symbol: '#2A2A2A',
            function: '#1A1A1A',
            object: '#3A3A3A',
            array: '#0A0A0A',
            map: '#1A1A1A',
            set: '#2A2A2A',
            weakmap: '#3A3A3A',
            weakset: '#1A1A1A',
            date: '#4A4A4A',
            regexp: '#2A2A2A',
            error: '#2A2A2A',
            circularReference: '#5A5A5A',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCCC',
            boolean: '#EEEEEE',
            number: '#DDDDDD',
            string: '#FFFFFF',
            symbol: '#DDDDDD',
            function: '#EEEEEE',
            object: '#CCCCCC',
            array: '#FFFFFF',
            map: '#EEEEEE',
            set: '#DDDDDD',
            weakmap: '#CCCCCC',
            weakset: '#EEEEEE',
            date: '#BBBBBB',
            regexp: '#DDDDDD',
            error: '#DDDDDD',
            circularReference: '#AAAAAA',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    monochromacySubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#4A4A4A',
            boolean: '#3A3A3A',
            number: '#4A4A4A',
            string: '#2A2A2A',
            symbol: '#4A4A4A',
            function: '#3A3A3A',
            object: '#5A5A5A',
            array: '#2A2A2A',
            map: '#3A3A3A',
            set: '#4A4A4A',
            weakmap: '#5A5A5A',
            weakset: '#3A3A3A',
            date: '#6A6A6A',
            regexp: '#4A4A4A',
            error: '#4A4A4A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBBB',
            boolean: '#CCCCCC',
            number: '#BBBBBB',
            string: '#DDDDDD',
            symbol: '#BBBBBB',
            function: '#CCCCCC',
            object: '#AAAAAA',
            array: '#DDDDDD',
            map: '#CCCCCC',
            set: '#BBBBBB',
            weakmap: '#AAAAAA',
            weakset: '#CCCCCC',
            date: '#999999',
            regexp: '#BBBBBB',
            error: '#BBBBBB',
            circularReference: '#999999',
            propertyKey: '#BBBBBB',
            punctuation: '#AAAAAA'
        }
    },
    monochromacyPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#5A5A5A',
            boolean: '#4A4A4A',
            number: '#5A5A5A',
            string: '#3A3A3A',
            symbol: '#5A5A5A',
            function: '#4A4A4A',
            object: '#6A6A6A',
            array: '#3A3A3A',
            map: '#4A4A4A',
            set: '#5A5A5A',
            weakmap: '#6A6A6A',
            weakset: '#4A4A4A',
            date: '#7A7A7A',
            regexp: '#5A5A5A',
            error: '#5A5A5A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#F5F5F5',
            number: '#E5E5E5',
            string: '#FFFFFF',
            symbol: '#E5E5E5',
            function: '#F5F5F5',
            object: '#D5D5D5',
            array: '#FFFFFF',
            map: '#F5F5F5',
            set: '#E5E5E5',
            weakmap: '#D5D5D5',
            weakset: '#F5F5F5',
            date: '#C5C5C5',
            regexp: '#E5E5E5',
            error: '#E5E5E5',
            circularReference: '#C5C5C5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    monochromacyBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#2A2A2A',
            number: '#3A3A3A',
            string: '#1A1A1A',
            symbol: '#3A3A3A',
            function: '#2A2A2A',
            object: '#4A4A4A',
            array: '#1A1A1A',
            map: '#2A2A2A',
            set: '#3A3A3A',
            weakmap: '#4A4A4A',
            weakset: '#2A2A2A',
            date: '#5A5A5A',
            regexp: '#3A3A3A',
            error: '#3A3A3A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#C0C0C0',
            number: '#B5B5B5',
            string: '#CCCCCC',
            symbol: '#B5B5B5',
            function: '#C0C0C0',
            object: '#AAAAAA',
            array: '#CCCCCC',
            map: '#C0C0C0',
            set: '#B5B5B5',
            weakmap: '#AAAAAA',
            weakset: '#C0C0C0',
            date: '#999999',
            regexp: '#B5B5B5',
            error: '#B5B5B5',
            circularReference: '#999999',
            propertyKey: '#BBBBBB',
            punctuation: '#AAAAAA'
        }
    },
    monochromacyFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#2A2A2A',
            boolean: '#0A0A0A',
            number: '#1A1A1A',
            string: '#000000',
            symbol: '#1A1A1A',
            function: '#0A0A0A',
            object: '#3A3A3A',
            array: '#000000',
            map: '#0A0A0A',
            set: '#1A1A1A',
            weakmap: '#3A3A3A',
            weakset: '#0A0A0A',
            date: '#5A5A5A',
            regexp: '#1A1A1A',
            error: '#1A1A1A',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#DDDDDD',
            boolean: '#FFFFFF',
            number: '#EEEEEE',
            string: '#FFFFFF',
            symbol: '#EEEEEE',
            function: '#FFFFFF',
            object: '#CCCCCC',
            array: '#FFFFFF',
            map: '#FFFFFF',
            set: '#EEEEEE',
            weakmap: '#CCCCCC',
            weakset: '#FFFFFF',
            date: '#AAAAAA',
            regexp: '#EEEEEE',
            error: '#EEEEEE',
            circularReference: '#AAAAAA',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    monochromacyVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#1A1A1A',
            boolean: '#000000',
            number: '#0A0A0A',
            string: '#000000',
            symbol: '#0A0A0A',
            function: '#000000',
            object: '#2A2A2A',
            array: '#000000',
            map: '#000000',
            set: '#0A0A0A',
            weakmap: '#2A2A2A',
            weakset: '#000000',
            date: '#4A4A4A',
            regexp: '#0A0A0A',
            error: '#0A0A0A',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#EEEEEE',
            boolean: '#FFFFFF',
            number: '#F5F5F5',
            string: '#FFFFFF',
            symbol: '#F5F5F5',
            function: '#FFFFFF',
            object: '#DDDDDD',
            array: '#FFFFFF',
            map: '#FFFFFF',
            set: '#F5F5F5',
            weakmap: '#DDDDDD',
            weakset: '#FFFFFF',
            date: '#BBBBBB',
            regexp: '#F5F5F5',
            error: '#F5F5F5',
            circularReference: '#BBBBBB',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of deuteranomaly color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const deuteranomalyPalettes = {
    deuteranomaly: {
        light: {
            null: '#3A4A5A',
            undefined: '#4A5A6A',
            boolean: '#2A5A7A',
            number: '#6A5A3A',
            string: '#3A6A8A',
            symbol: '#4A4A6A',
            function: '#7A6A4A',
            object: '#3A5A6A',
            array: '#2A4A6A',
            map: '#4A7A9A',
            set: '#3A5A7A',
            weakmap: '#8A7A5A',
            weakset: '#5A5A4A',
            date: '#7A6A3A',
            regexp: '#3A6A7A',
            error: '#5A4A3A',
            circularReference: '#3A4A5A',
            propertyKey: '#2A3A4A',
            punctuation: '#4A5A6A'
        },
        dark: {
            null: '#AACCEE',
            undefined: '#BBDDFF',
            boolean: '#99EEFF',
            number: '#EEDDAA',
            string: '#AAFFFF',
            symbol: '#BBCCEE',
            function: '#FFEECC',
            object: '#AADDEE',
            array: '#99CCEE',
            map: '#BBFFFF',
            set: '#AAEEEE',
            weakmap: '#FFFFDD',
            weakset: '#DDEEBB',
            date: '#FFEEAA',
            regexp: '#AAEEEE',
            error: '#DDCCAA',
            circularReference: '#AACCEE',
            propertyKey: '#DDFFFF',
            punctuation: '#BBDDFF'
        }
    },
    deuteranomalyBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A5A',
            boolean: '#0055AA',
            number: '#AA8800',
            string: '#0088BB',
            symbol: '#5555AA',
            function: '#0099CC',
            object: '#6688BB',
            array: '#0066CC',
            map: '#0077BB',
            set: '#4488CC',
            weakmap: '#AA9900',
            weakset: '#3366BB',
            date: '#BBAA00',
            regexp: '#3355AA',
            error: '#5577BB',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCFF',
            boolean: '#66AAFF',
            number: '#FFDD66',
            string: '#66EEFF',
            symbol: '#AAAAFF',
            function: '#77EEFF',
            object: '#BBDDFF',
            array: '#77DDFF',
            map: '#66EEFF',
            set: '#99DDFF',
            weakmap: '#FFEE66',
            weakset: '#88BBFF',
            date: '#FFEE77',
            regexp: '#88AAFF',
            error: '#AACCFF',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    deuteranomalySubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#4A4A6A',
            boolean: '#3A5A7A',
            number: '#7A6A4A',
            string: '#3A6A8A',
            symbol: '#4A4A7A',
            function: '#3A7A9A',
            object: '#5A6A8A',
            array: '#3A5A9A',
            map: '#3A6A8A',
            set: '#4A6A9A',
            weakmap: '#7A6A3A',
            weakset: '#3A5A8A',
            date: '#8A7A4A',
            regexp: '#3A4A7A',
            error: '#4A5A8A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBC5',
            boolean: '#99BBCC',
            number: '#C5B599',
            string: '#99DDDD',
            symbol: '#AAAACC',
            function: '#99EEEE',
            object: '#AABBDD',
            array: '#99CCEE',
            map: '#99DDDD',
            set: '#AADDEE',
            weakmap: '#C5BB99',
            weakset: '#99BBDD',
            date: '#D5CC99',
            regexp: '#9999CC',
            error: '#AABBDD',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    deuteranomalyPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#5A5A7A',
            boolean: '#4A6A8A',
            number: '#8A7A5A',
            string: '#4A7A9A',
            symbol: '#5A5A8A',
            function: '#4A8AAA',
            object: '#6A7A9A',
            array: '#4A6AAA',
            map: '#4A7A9A',
            set: '#5A7AAA',
            weakmap: '#8A7A4A',
            weakset: '#4A6A9A',
            date: '#9A8A5A',
            regexp: '#4A5A8A',
            error: '#5A6A9A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5FF',
            boolean: '#CCEEFF',
            number: '#FFEECC',
            string: '#CCFFFF',
            symbol: '#DDDDFF',
            function: '#DDFFFF',
            object: '#DDEEFF',
            array: '#CCEEFF',
            map: '#CCFFFF',
            set: '#DDEEFF',
            weakmap: '#FFEECC',
            weakset: '#CCEEFF',
            date: '#FFFFCC',
            regexp: '#CCDDFF',
            error: '#DDEEFF',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    deuteranomalyBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#2A3A4A',
            number: '#4A4A3A',
            string: '#2A4A6A',
            symbol: '#3A3A4A',
            function: '#2A5A7A',
            object: '#4A4A6A',
            array: '#2A3A6A',
            map: '#2A4A6A',
            set: '#3A4A7A',
            weakmap: '#4A4A2A',
            weakset: '#2A3A5A',
            date: '#5A5A3A',
            regexp: '#3A3A5A',
            error: '#3A4A6A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#99AAAA',
            number: '#AAAA99',
            string: '#99CCDD',
            symbol: '#A5A5AA',
            function: '#99DDEE',
            object: '#AAAADD',
            array: '#99AADD',
            map: '#99CCDD',
            set: '#AABBEE',
            weakmap: '#AAAA88',
            weakset: '#99AACC',
            date: '#BBBB99',
            regexp: '#9999AA',
            error: '#AABBDD',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    deuteranomalyFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#2A2A6A',
            boolean: '#0044AA',
            number: '#AA7700',
            string: '#0099DD',
            symbol: '#6622AA',
            function: '#00AADD',
            object: '#5566BB',
            array: '#0077CC',
            map: '#0088BB',
            set: '#3388DD',
            weakmap: '#BB9900',
            weakset: '#2255BB',
            date: '#CCAA00',
            regexp: '#4433AA',
            error: '#4477CC',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#DDDDFF',
            boolean: '#77BBFF',
            number: '#FFEE77',
            string: '#77FFFF',
            symbol: '#CC88FF',
            function: '#88FFFF',
            object: '#CCDDFF',
            array: '#88EEFF',
            map: '#77FFFF',
            set: '#AAEEFF',
            weakmap: '#FFFF77',
            weakset: '#99CCFF',
            date: '#FFFF88',
            regexp: '#AA99FF',
            error: '#BBDDFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    deuteranomalyVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#1A1A5A',
            boolean: '#0033AA',
            number: '#AA6600',
            string: '#0077CC',
            symbol: '#4400AA',
            function: '#0088DD',
            object: '#4455BB',
            array: '#0055CC',
            map: '#0066BB',
            set: '#2266CC',
            weakmap: '#AA7700',
            weakset: '#1144BB',
            date: '#BB9900',
            regexp: '#2233AA',
            error: '#3366BB',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#EEEEFF',
            boolean: '#88CCFF',
            number: '#FFEE55',
            string: '#88FFFF',
            symbol: '#CC99FF',
            function: '#99FFFF',
            object: '#DDEEFF',
            array: '#99EEFF',
            map: '#88FFFF',
            set: '#BBEEFF',
            weakmap: '#FFFF55',
            weakset: '#AADDFF',
            date: '#FFFF66',
            regexp: '#BB99FF',
            error: '#CCDEFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of protanomaly color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const protanomalyPalettes = {
    protanomaly: {
        light: {
            null: '#2A4A5A',
            undefined: '#3A5A6A',
            boolean: '#1A5A7A',
            number: '#5A5A3A',
            string: '#2A6A8A',
            symbol: '#3A4A6A',
            function: '#6A6A4A',
            object: '#2A5A6A',
            array: '#1A4A6A',
            map: '#3A7A9A',
            set: '#2A5A7A',
            weakmap: '#7A7A5A',
            weakset: '#4A5A4A',
            date: '#6A6A3A',
            regexp: '#2A6A7A',
            error: '#4A4A3A',
            circularReference: '#2A4A5A',
            propertyKey: '#1A3A4A',
            punctuation: '#3A5A6A'
        },
        dark: {
            null: '#99CCEE',
            undefined: '#AADDFF',
            boolean: '#88EEFF',
            number: '#DDDDAA',
            string: '#99FFFF',
            symbol: '#AACCEE',
            function: '#EEEECC',
            object: '#99DDEE',
            array: '#88CCEE',
            map: '#AAFFFF',
            set: '#99EEEE',
            weakmap: '#FFFFDD',
            weakset: '#CCDDBB',
            date: '#EEEEAA',
            regexp: '#99EEEE',
            error: '#CCCCAA',
            circularReference: '#99CCEE',
            propertyKey: '#CCFFFF',
            punctuation: '#AADDFF'
        }
    },
    protanomalyBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A5A',
            boolean: '#0055AA',
            number: '#AA8800',
            string: '#0088AA',
            symbol: '#5555AA',
            function: '#0099BB',
            object: '#6688AA',
            array: '#0066BB',
            map: '#0077AA',
            set: '#4488BB',
            weakmap: '#AA9900',
            weakset: '#3366AA',
            date: '#BBAA00',
            regexp: '#3355AA',
            error: '#5577AA',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#CCCCFF',
            boolean: '#66AAFF',
            number: '#FFDD66',
            string: '#66DDFF',
            symbol: '#AAAAFF',
            function: '#77EEFF',
            object: '#BBDDFF',
            array: '#77CCFF',
            map: '#66DDFF',
            set: '#99DDFF',
            weakmap: '#FFEE66',
            weakset: '#88BBFF',
            date: '#FFEE77',
            regexp: '#88AAFF',
            error: '#AACCFF',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    protanomalySubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#4A4A6A',
            boolean: '#3A5A7A',
            number: '#7A6A4A',
            string: '#3A6A7A',
            symbol: '#4A4A7A',
            function: '#3A7A8A',
            object: '#5A6A7A',
            array: '#3A5A8A',
            map: '#3A6A7A',
            set: '#4A6A8A',
            weakmap: '#7A6A3A',
            weakset: '#3A5A7A',
            date: '#8A7A4A',
            regexp: '#3A4A7A',
            error: '#4A5A7A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BBBBC5',
            boolean: '#99BBCC',
            number: '#C5B599',
            string: '#99CCCC',
            symbol: '#AAAACC',
            function: '#99DDDD',
            object: '#AABBCC',
            array: '#99BBDD',
            map: '#99CCCC',
            set: '#AACCDD',
            weakmap: '#C5BB99',
            weakset: '#99BBCC',
            date: '#D5CC99',
            regexp: '#9999CC',
            error: '#AABBCC',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    protanomalyPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#5A5A7A',
            boolean: '#4A6A8A',
            number: '#8A7A5A',
            string: '#4A7A8A',
            symbol: '#5A5A8A',
            function: '#4A8A9A',
            object: '#6A7A8A',
            array: '#4A6A9A',
            map: '#4A7A8A',
            set: '#5A7A9A',
            weakmap: '#8A7A4A',
            weakset: '#4A6A8A',
            date: '#9A8A5A',
            regexp: '#4A5A8A',
            error: '#5A6A8A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5FF',
            boolean: '#CCEEFF',
            number: '#FFEECC',
            string: '#CCEEFF',
            symbol: '#DDDDFF',
            function: '#CCFFFF',
            object: '#DDEEFF',
            array: '#CCEEFF',
            map: '#CCEEFF',
            set: '#DDEEFF',
            weakmap: '#FFEECC',
            weakset: '#CCEEFF',
            date: '#FFFFCC',
            regexp: '#CCDDFF',
            error: '#DDEEFF',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    protanomalyBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#2A3A4A',
            number: '#4A4A3A',
            string: '#2A4A5A',
            symbol: '#3A3A4A',
            function: '#2A5A6A',
            object: '#4A4A5A',
            array: '#2A3A5A',
            map: '#2A4A5A',
            set: '#3A4A6A',
            weakmap: '#4A4A2A',
            weakset: '#2A3A4A',
            date: '#5A5A3A',
            regexp: '#3A3A5A',
            error: '#3A4A5A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#99AAAA',
            number: '#AAAA99',
            string: '#99BBCC',
            symbol: '#A5A5AA',
            function: '#99CCDD',
            object: '#AAAACC',
            array: '#99AACC',
            map: '#99BBCC',
            set: '#AABBDD',
            weakmap: '#AAAA88',
            weakset: '#99AAAA',
            date: '#BBBB99',
            regexp: '#9999AA',
            error: '#AABBCC',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    protanomalyFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#2A2A6A',
            boolean: '#0044AA',
            number: '#AA7700',
            string: '#0099CC',
            symbol: '#6622AA',
            function: '#00AACC',
            object: '#5566AA',
            array: '#0077BB',
            map: '#0088AA',
            set: '#3388CC',
            weakmap: '#BB9900',
            weakset: '#2255AA',
            date: '#CCAA00',
            regexp: '#4433AA',
            error: '#4477BB',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#DDDDFF',
            boolean: '#77BBFF',
            number: '#FFEE77',
            string: '#77FFFF',
            symbol: '#CC88FF',
            function: '#88FFFF',
            object: '#CCDDFF',
            array: '#88DDFF',
            map: '#77EEFF',
            set: '#AAEEFF',
            weakmap: '#FFFF77',
            weakset: '#99CCFF',
            date: '#FFFF88',
            regexp: '#AA99FF',
            error: '#BBDDFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    protanomalyVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#1A1A5A',
            boolean: '#0033AA',
            number: '#AA6600',
            string: '#0077BB',
            symbol: '#4400AA',
            function: '#0088CC',
            object: '#4455AA',
            array: '#0055BB',
            map: '#0066AA',
            set: '#2266BB',
            weakmap: '#AA7700',
            weakset: '#1144AA',
            date: '#BB9900',
            regexp: '#2233AA',
            error: '#3366AA',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#EEEEFF',
            boolean: '#88CCFF',
            number: '#FFEE55',
            string: '#88EEFF',
            symbol: '#CC99FF',
            function: '#99FFFF',
            object: '#DDEEFF',
            array: '#99EEFF',
            map: '#88EEFF',
            set: '#BBEEFF',
            weakmap: '#FFFF55',
            weakset: '#AADDFF',
            date: '#FFFF66',
            regexp: '#BB99FF',
            error: '#CCDEFF',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of tritanomaly color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const tritanomalyPalettes = {
    tritanomaly: {
        light: {
            null: '#4A3A3A',
            undefined: '#5A4A4A',
            boolean: '#3A5A3A',
            number: '#6A4A3A',
            string: '#2A6A3A',
            symbol: '#5A4A4A',
            function: '#7A5A4A',
            object: '#4A3A3A',
            array: '#3A6A4A',
            map: '#5A5A3A',
            set: '#2A7A4A',
            weakmap: '#8A6A5A',
            weakset: '#6A5A4A',
            date: '#7A6A3A',
            regexp: '#4A5A3A',
            error: '#6A3A3A',
            circularReference: '#4A3A3A',
            propertyKey: '#3A2A2A',
            punctuation: '#5A4A4A'
        },
        dark: {
            null: '#D5C5C5',
            undefined: '#E5D5D5',
            boolean: '#C5E5C5',
            number: '#F5D5C5',
            string: '#B5F5C5',
            symbol: '#E5D5D5',
            function: '#FFE5D5',
            object: '#D5C5C5',
            array: '#C5F5D5',
            map: '#E5E5C5',
            set: '#B5FFE5',
            weakmap: '#FFEFDD',
            weakset: '#F5E5D5',
            date: '#FFE5C5',
            regexp: '#D5E5C5',
            error: '#F5C5C5',
            circularReference: '#D5C5C5',
            propertyKey: '#E5D5D5',
            punctuation: '#E5D5D5'
        }
    },
    tritanomalyBright: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A3A3A',
            boolean: '#AA0055',
            number: '#AA8800',
            string: '#00AA44',
            symbol: '#AA5500',
            function: '#00BB55',
            object: '#AA4488',
            array: '#00AA55',
            map: '#00BB44',
            set: '#44AA55',
            weakmap: '#BB9900',
            weakset: '#33AA44',
            date: '#CCAA00',
            regexp: '#AA3355',
            error: '#AA5577',
            circularReference: '#555555',
            propertyKey: '#333333',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#BBBBBB',
            undefined: '#FFCCCC',
            boolean: '#FF66AA',
            number: '#FFDD66',
            string: '#66FF99',
            symbol: '#FFAA66',
            function: '#77FFAA',
            object: '#FFAAE5',
            array: '#66FFAA',
            map: '#77FFAA',
            set: '#99FFAA',
            weakmap: '#FFEE66',
            weakset: '#88FFAA',
            date: '#FFEE77',
            regexp: '#FF88AA',
            error: '#FFAACC',
            circularReference: '#CCCCCC',
            propertyKey: '#DDDDDD',
            punctuation: '#BBBBBB'
        }
    },
    tritanomalySubtle: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A4A4A',
            boolean: '#7A3A5A',
            number: '#7A6A4A',
            string: '#3A7A5A',
            symbol: '#7A5A4A',
            function: '#3A8A6A',
            object: '#7A5A7A',
            array: '#3A7A6A',
            map: '#3A8A5A',
            set: '#4A7A6A',
            weakmap: '#8A7A3A',
            weakset: '#3A7A5A',
            date: '#9A8A4A',
            regexp: '#7A4A5A',
            error: '#7A5A6A',
            circularReference: '#6A6A6A',
            propertyKey: '#4A4A4A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#C5BBBB',
            boolean: '#CC99AA',
            number: '#C5B599',
            string: '#99CCAA',
            symbol: '#C5AA99',
            function: '#99DDBB',
            object: '#CCAAC5',
            array: '#99CCBB',
            map: '#99DDAA',
            set: '#AACCBB',
            weakmap: '#D5C599',
            weakset: '#99CCAA',
            date: '#E5D599',
            regexp: '#CC99AA',
            error: '#CCAABB',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    tritanomalyPastel: {
        light: {
            null: '#6A6A6A',
            undefined: '#7A5A5A',
            boolean: '#8A4A6A',
            number: '#8A7A5A',
            string: '#4A8A6A',
            symbol: '#8A6A5A',
            function: '#4A9A7A',
            object: '#8A6A8A',
            array: '#4A8A7A',
            map: '#4A9A6A',
            set: '#5A8A7A',
            weakmap: '#9A8A4A',
            weakset: '#4A8A6A',
            date: '#AA9A5A',
            regexp: '#8A5A6A',
            error: '#8A6A7A',
            circularReference: '#7A7A7A',
            propertyKey: '#5A5A5A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#FFEEEE',
            boolean: '#FFCCDD',
            number: '#FFEECC',
            string: '#CCFFDD',
            symbol: '#FFDDCC',
            function: '#CCFFEE',
            object: '#FFDDFF',
            array: '#CCFFEE',
            map: '#CCFFDD',
            set: '#DDFFEE',
            weakmap: '#FFFFCC',
            weakset: '#CCFFDD',
            date: '#FFFFDD',
            regexp: '#FFCCDD',
            error: '#FFDDEE',
            circularReference: '#E5E5E5',
            propertyKey: '#F5F5F5',
            punctuation: '#D5D5D5'
        }
    },
    tritanomalyBoring: {
        light: {
            null: '#4A4A4A',
            undefined: '#3A3A3A',
            boolean: '#4A2A3A',
            number: '#4A4A3A',
            string: '#2A4A3A',
            symbol: '#4A3A3A',
            function: '#2A5A4A',
            object: '#4A3A4A',
            array: '#2A4A4A',
            map: '#2A5A3A',
            set: '#3A4A4A',
            weakmap: '#5A4A2A',
            weakset: '#2A4A3A',
            date: '#6A5A3A',
            regexp: '#4A3A3A',
            error: '#4A3A4A',
            circularReference: '#5A5A5A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#B5B5B5',
            boolean: '#AAAA99',
            number: '#AAAA99',
            string: '#99AAAA',
            symbol: '#AAA599',
            function: '#99BBAA',
            object: '#AAA5AA',
            array: '#99AAAA',
            map: '#99BBAA',
            set: '#AABBAA',
            weakmap: '#BBAA88',
            weakset: '#99AAAA',
            date: '#CCBB99',
            regexp: '#AAA599',
            error: '#AAA5AA',
            circularReference: '#BBBBBB',
            propertyKey: '#CCCCCC',
            punctuation: '#AAAAAA'
        }
    },
    tritanomalyFunky: {
        light: {
            null: '#4A4A4A',
            undefined: '#6A2A2A',
            boolean: '#AA0044',
            number: '#AA7700',
            string: '#00AA33',
            symbol: '#AA4400',
            function: '#00CC55',
            object: '#AA3377',
            array: '#00AA44',
            map: '#00BB33',
            set: '#33AA44',
            weakmap: '#CC9900',
            weakset: '#22AA33',
            date: '#DDAA00',
            regexp: '#AA2244',
            error: '#AA4466',
            circularReference: '#555555',
            propertyKey: '#222222',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#FFDDDD',
            boolean: '#FF77BB',
            number: '#FFEE77',
            string: '#77FF99',
            symbol: '#FFBB77',
            function: '#88FFBB',
            object: '#FF99DD',
            array: '#77FFAA',
            map: '#88FF99',
            set: '#AAFFBB',
            weakmap: '#FFFF77',
            weakset: '#99FFAA',
            date: '#FFFF88',
            regexp: '#FF99BB',
            error: '#FFBBDD',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    },
    tritanomalyVivid: {
        light: {
            null: '#3A3A3A',
            undefined: '#5A1A1A',
            boolean: '#AA0033',
            number: '#AA6600',
            string: '#00AA22',
            symbol: '#AA3300',
            function: '#00BB44',
            object: '#AA2266',
            array: '#00AA33',
            map: '#00BB22',
            set: '#22AA33',
            weakmap: '#BB7700',
            weakset: '#11AA22',
            date: '#CC9900',
            regexp: '#AA1133',
            error: '#AA3355',
            circularReference: '#444444',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#CCCCCC',
            undefined: '#FFEEEE',
            boolean: '#FF88CC',
            number: '#FFEE55',
            string: '#88FF99',
            symbol: '#FFCC55',
            function: '#99FFBB',
            object: '#FF99EE',
            array: '#88FFAA',
            map: '#99FF99',
            set: '#BBFFBB',
            weakmap: '#FFFF55',
            weakset: '#AAFFBB',
            date: '#FFFF66',
            regexp: '#FF99CC',
            error: '#FFCCEE',
            circularReference: '#DDDDDD',
            propertyKey: '#EEEEEE',
            punctuation: '#CCCCCC'
        }
    }
};

/**
 * Collection of achromatopsia color palettes
 * Each palette has light and dark variants for different backgrounds
 */
const achromatopsiaPalettes = {
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
};

// Create a chalk instance with forced color support (level 3 = 16m colors)
const chalkInstance = new Chalk({ level: 3 });
/**
 * Default container configuration
 */
const defaultContainers = {
    array: {
        start: '[',
        delimiter: ',',
        end: ']'
    },
    object: {
        start: '{',
        separator: ':',
        delimiter: ',',
        end: '}'
    },
    map: {
        start: '{<',
        separator: ':',
        delimiter: ',',
        end: '>}'
    },
    set: {
        start: '{(',
        delimiter: ',',
        end: ')}'
    },
    weakmap: {
        start: '(<',
        separator: ':',
        delimiter: ',',
        end: '>)'
    },
    weakset: {
        start: '((',
        delimiter: ',',
        end: '))'
    },
    date: {
        start: 'Date(',
        end: ')'
    },
    regexp: {
        start: '/',
        end: '/'
    },
    error: {
        start: 'Error(',
        end: ')'
    },
    function: {
        start: 'function(',
        end: ')'
    }
};
/**
 * Comprehensive test data containing all AST node types
 * Each container includes members of every non-container type
 * Top-level containers include all other container types
 */
const testdata = {
    // Primitive types
    null: null,
    undefined: undefined,
    boolean_true: true,
    boolean_false: false,
    number_integer: 42,
    number_negative: -17,
    number_float: 3.14159,
    number_scientific: 1.23e10,
    number_zero: 0,
    string: "hello world",
    string_empty: "",
    string_escaped: "line1\nline2\ttab",
    symbol_with_description: Symbol('test'),
    symbol_without_description: Symbol(),
    function: function testFunc() { return 42; },
    // Simple array with all non-container types
    array_all_primitives: [
        null,
        undefined,
        true,
        false,
        42,
        -17,
        3.14,
        "string",
        Symbol('array-symbol')
    ],
    // Array with holes (sparse array)
    array_with_holes: (() => {
        const arr = [1, 2, 3, 4, 5];
        delete arr[1];
        delete arr[3];
        return arr; // [1, empty, 3, empty, 5]
    })(),
    // Object with all non-container types
    object_all_primitives: {
        null: null,
        undefined: undefined,
        boolean_true: true,
        boolean_false: false,
        number: 123,
        negative: -456,
        float: 7.89,
        string: "object value",
        symbol: Symbol('object-symbol')
    },
    // Map with all non-container types
    map_all_primitives: new Map([
        ['null', null],
        ['undefined', undefined],
        ['boolean', true],
        ['number', 999],
        ['string', 'map value'],
        ['symbol', Symbol('map-symbol')]
    ]),
    // Set with all non-container types
    set_all_primitives: new Set([
        null,
        undefined,
        true,
        false,
        42,
        "set string"
    ]),
    // Date
    date: new Date('2024-01-01T00:00:00.000Z'),
    // RegExp
    regexp_with_flags: /pattern/gi,
    regexp_simple: /test/,
    // Error
    error: new Error('test error message'),
    // WeakMap (can only have object keys)
    weakmap: (() => {
        const wm = new WeakMap();
        const key1 = {};
        const key2 = {};
        wm.set(key1, 'value1');
        wm.set(key2, 'value2');
        return wm;
    })(),
    // WeakSet (can only have object values)
    weakset: (() => {
        const ws = new WeakSet();
        const obj1 = {};
        const obj2 = {};
        ws.add(obj1);
        ws.add(obj2);
        return ws;
    })(),
    // Array containing all container types (nested containers)
    array_all_containers: [
        // Array
        [1, 2, 3],
        // Object
        { a: 1, b: 2, c: 3 },
        // Map
        new Map([['key1', 'value1'], ['key2', 'value2']]),
        // Set
        new Set([10, 20, 30]),
        // Date
        new Date('2024-06-15'),
        // RegExp
        /nested/i,
        // Error
        new Error('nested in array')
    ],
    // Object containing all container types
    object_all_containers: {
        array: [100, 200, 300],
        object: { x: 1, y: 2, z: 3 },
        map: new Map([['m1', 'v1'], ['m2', 'v2']]),
        set: new Set(['a', 'b', 'c']),
        date: new Date('2024-12-25'),
        regexp: /object-nested/g,
        error: new Error('nested in object')
    },
    // Map containing all container types
    map_all_containers: new Map([
        ['array', [7, 8, 9]],
        ['object', { p: 1, q: 2 }],
        ['map', new Map([['inner-key', 'inner-value']])],
        ['set', new Set([true, false])],
        ['date', new Date('2024-03-14')],
        ['regexp', /map-nested/],
        ['error', new Error('nested in map')]
    ]),
    // Set containing all container types
    set_all_containers: new Set([
        // Array
        [11, 12, 13],
        // Object
        { name: 'set-obj', value: 42 },
        // Map
        new Map([['set-map-key', 'set-map-value']]),
        // Set (nested set)
        new Set([1, 2]),
        // Date
        new Date('2024-07-04'),
        // RegExp
        /set-nested/,
        // Error
        new Error('nested in set')
    ]),
    // Deeply nested structure
    deeply_nested: {
        level1: {
            level2: {
                level3: {
                    array: [1, 2, [3, 4, [5, 6]]],
                    map: new Map([
                        ['key', { nested: 'value' }]
                    ])
                }
            }
        }
    },
    // Circular reference example (will be detected by parse_value)
    circular: (() => {
        const obj = {
            name: 'circular',
            value: 123
        };
        obj.self = obj;
        return obj;
    })()
};
/**
 * Highlights a JavaScript value with colors
 *
 * @param {unknown} value - The value to highlight
 * @param {HighlightOptions} [options] - Optional configuration for highlighting
 * @returns {string} The highlighted string with ANSI color codes
 *
 * @example
 * ```typescript
 * const obj = {name: "John", age: 30};
 * const highlighted = highlight_value(obj);
 * console.log(highlighted); // Outputs colorized representation
 * ```
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, "hello", true];
 * const highlighted = highlight_value(arr, { palette: forestPalette });
 * console.log(highlighted);
 * ```
 */
function highlight_value(value, options) {
    const ast = parse_value(value);
    return paint(ast, options);
}
/**
 * Highlights a JSON or JavaScript string with colors
 *
 * @param {string} str - The string to highlight (JSON or JavaScript literal)
 * @param {HighlightOptions} [options] - Optional configuration for highlighting
 * @returns {string} The highlighted string with ANSI color codes
 *
 * @example
 * ```typescript
 * const json = '{"name": "John", "age": 30}';
 * const highlighted = highlight_string(json);
 * console.log(highlighted); // Outputs colorized representation
 * ```
 *
 * @example
 * ```typescript
 * const arr = '[1, 2, 3, "hello", true]';
 * const highlighted = highlight_string(arr, { palette: boldPalette });
 * console.log(highlighted);
 * ```
 */
function highlight_string(str, options) {
    const ast = parse_string(str);
    return paint(ast, options);
}
/**
 * Default highlight options
 */
const defaultHighlightOptions = {
    palette: palettes.default.light,
    containers: defaultContainers,
    maxWidth: undefined
};
/**
 * Paints an AST node with colors and formatting
 *
 * @param {ASTNode} node - The AST node to paint
 * @param {HighlightOptions} [options] - Optional configuration. Defaults will be used for any missing values.
 * @returns {string} The painted string representation of the node
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const painted = paint(ast); // Uses defaults
 * console.log(painted);
 * ```
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John"}');
 * const options = { palette: forestPalette }; // containers will use default
 * const painted = paint(ast, options);
 * console.log(painted);
 * ```
 */
function paint(node, options) {
    // Merge provided options with defaults
    const palette = options?.palette ?? defaultHighlightOptions.palette;
    const containers = options?.containers ?? defaultHighlightOptions.containers;
    // Handle null
    if (node.value === null) {
        return chalkInstance.hex(palette.null)('null');
    }
    // Handle primitives
    if (node.basic_type === 'undefined') {
        return chalkInstance.hex(palette.undefined)('undefined');
    }
    if (node.basic_type === 'boolean') {
        return chalkInstance.hex(palette.boolean)(String(node.value));
    }
    if (node.basic_type === 'number') {
        return chalkInstance.hex(palette.number)(String(node.value));
    }
    if (node.basic_type === 'string') {
        return chalkInstance.hex(palette.string)('"' + String(node.value) + '"');
    }
    if (node.basic_type === 'symbol') {
        const desc = node.deep_type.description !== undefined ? `(${node.deep_type.description})` : '';
        return chalkInstance.hex(palette.symbol)(`Symbol${desc}`);
    }
    if (node.basic_type === 'function') {
        const config = containers.function ?? defaultContainers.function;
        const start = config.start ?? 'function(';
        const end = config.end ?? ')';
        return chalkInstance.hex(palette.function)(start + end);
    }
    // Handle circular references
    if (node.deep_type.isCircularReference) {
        const refId = node.deep_type.referenceId !== undefined ? `#${node.deep_type.referenceId}` : '';
        return chalkInstance.hex(palette.circularReference)(`[Circular${refId}]`);
    }
    // Handle containers
    if (node.basic_type === 'object') {
        // Handle arrays
        if (node.deep_type.isArray && node.elements) {
            const config = containers.array ?? defaultContainers.array;
            const start = config.start ?? '[';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? ']';
            const elements = node.elements.map(el => paint(el, options));
            const joined = elements.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.array)(start) + joined + chalkInstance.hex(palette.array)(end);
        }
        // Handle Maps
        if (node.deep_type.isMap && node.properties) {
            const config = containers.map ?? defaultContainers.map;
            const start = config.start ?? '{<';
            const separator = config.separator ?? ':';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? '>}';
            const entries = Object.entries(node.properties).map(([key, val]) => {
                const paintedKey = chalkInstance.hex(palette.propertyKey)(key);
                const paintedSep = chalkInstance.hex(palette.punctuation)(separator);
                const paintedVal = paint(val, options);
                return paintedKey + paintedSep + ' ' + paintedVal;
            });
            const joined = entries.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.map)(start) + joined + chalkInstance.hex(palette.map)(end);
        }
        // Handle Sets
        if (node.deep_type.isSet && node.properties) {
            const config = containers.set ?? defaultContainers.set;
            const start = config.start ?? '{(';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? ')}';
            const values = Object.values(node.properties).map(val => paint(val, options));
            const joined = values.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.set)(start) + joined + chalkInstance.hex(palette.set)(end);
        }
        // Handle WeakMaps
        if (node.deep_type.isWeakMap) {
            const config = containers.weakmap ?? defaultContainers.weakmap;
            const start = config.start ?? '(<';
            const end = config.end ?? '>)';
            return chalkInstance.hex(palette.weakmap)(start + end);
        }
        // Handle WeakSets
        if (node.deep_type.isWeakSet) {
            const config = containers.weakset ?? defaultContainers.weakset;
            const start = config.start ?? '((';
            const end = config.end ?? '))';
            return chalkInstance.hex(palette.weakset)(start + end);
        }
        // Handle Dates
        if (node.deep_type.isDate) {
            const config = containers.date ?? defaultContainers.date;
            const start = config.start ?? 'Date(';
            const end = config.end ?? ')';
            return chalkInstance.hex(palette.date)(start + String(node.value) + end);
        }
        // Handle RegExp
        if (node.deep_type.isRegExp) {
            const config = containers.regexp ?? defaultContainers.regexp;
            const start = config.start ?? '/';
            const end = config.end ?? '/';
            return chalkInstance.hex(palette.regexp)(start + String(node.value) + end);
        }
        // Handle Errors
        if (node.deep_type.isError) {
            const config = containers.error ?? defaultContainers.error;
            const start = config.start ?? 'Error(';
            const end = config.end ?? ')';
            return chalkInstance.hex(palette.error)(start + String(node.value) + end);
        }
        // Handle regular objects
        if (node.properties) {
            const config = containers.object ?? defaultContainers.object;
            const start = config.start ?? '{';
            const separator = config.separator ?? ':';
            const delimiter = config.delimiter ?? ',';
            const end = config.end ?? '}';
            const entries = Object.entries(node.properties).map(([key, val]) => {
                const paintedKey = chalkInstance.hex(palette.propertyKey)(key);
                const paintedSep = chalkInstance.hex(palette.punctuation)(separator);
                const paintedVal = paint(val, options);
                return paintedKey + paintedSep + ' ' + paintedVal;
            });
            const joined = entries.join(chalkInstance.hex(palette.punctuation)(delimiter) + ' ');
            return chalkInstance.hex(palette.object)(start) + joined + chalkInstance.hex(palette.object)(end);
        }
    }
    // Fallback
    return String(node.value);
}
/**
 * Tokenizer for JSON/JavaScript values
 */
class Tokenizer {
    input;
    position;
    constructor(input) {
        this.input = input;
        this.position = 0;
    }
    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }
    peek() {
        return this.input[this.position];
    }
    consume() {
        const char = this.input[this.position];
        this.position++;
        return char;
    }
    consumeString() {
        const quote = this.consume(); // consume opening quote
        let result = '';
        while (this.position < this.input.length) {
            const char = this.peek();
            if (char === '\\') {
                this.consume(); // consume backslash
                const escaped = this.consume();
                // Handle escape sequences
                switch (escaped) {
                    case 'n':
                        result += '\n';
                        break;
                    case 't':
                        result += '\t';
                        break;
                    case 'r':
                        result += '\r';
                        break;
                    case '\\':
                        result += '\\';
                        break;
                    case '"':
                        result += '"';
                        break;
                    case "'":
                        result += "'";
                        break;
                    default: result += escaped;
                }
            }
            else if (char === quote) {
                this.consume(); // consume closing quote
                break;
            }
            else {
                result += this.consume();
            }
        }
        return result;
    }
    consumeNumber() {
        let numStr = '';
        if (this.peek() === '-') {
            numStr += this.consume();
        }
        while (this.position < this.input.length && /[0-9.]/.test(this.peek())) {
            numStr += this.consume();
        }
        // Handle scientific notation
        if (this.peek() === 'e' || this.peek() === 'E') {
            numStr += this.consume();
            if (this.peek() === '+' || this.peek() === '-') {
                numStr += this.consume();
            }
            while (this.position < this.input.length && /[0-9]/.test(this.peek())) {
                numStr += this.consume();
            }
        }
        return parseFloat(numStr);
    }
    consumeIdentifier() {
        let result = '';
        while (this.position < this.input.length && /[a-zA-Z_]/.test(this.peek())) {
            result += this.consume();
        }
        return result;
    }
    parseValue() {
        this.skipWhitespace();
        const char = this.peek();
        if (char === undefined) {
            return undefined;
        }
        // String
        if (char === '"' || char === "'") {
            return this.consumeString();
        }
        // Number
        if (char === '-' || /[0-9]/.test(char)) {
            return this.consumeNumber();
        }
        // Object
        if (char === '{') {
            return this.parseObject();
        }
        // Array
        if (char === '[') {
            return this.parseArray();
        }
        // Keywords
        const identifier = this.consumeIdentifier();
        if (identifier === 'null') {
            return null;
        }
        if (identifier === 'undefined') {
            return undefined;
        }
        if (identifier === 'true') {
            return true;
        }
        if (identifier === 'false') {
            return false;
        }
        throw new Error(`Unexpected token: ${identifier}`);
    }
    parseObject() {
        const obj = {};
        this.consume(); // consume '{'
        this.skipWhitespace();
        while (this.peek() !== '}') {
            this.skipWhitespace();
            // Parse key
            let key;
            if (this.peek() === '"' || this.peek() === "'") {
                key = this.consumeString();
            }
            else {
                key = this.consumeIdentifier();
            }
            this.skipWhitespace();
            // Consume ':'
            if (this.peek() === ':') {
                this.consume();
            }
            this.skipWhitespace();
            // Parse value
            const value = this.parseValue();
            obj[key] = value;
            this.skipWhitespace();
            // Check for comma
            if (this.peek() === ',') {
                this.consume();
            }
            this.skipWhitespace();
        }
        this.consume(); // consume '}'
        return obj;
    }
    parseArray() {
        const arr = [];
        this.consume(); // consume '['
        this.skipWhitespace();
        while (this.peek() !== ']') {
            this.skipWhitespace();
            const value = this.parseValue();
            arr.push(value);
            this.skipWhitespace();
            // Check for comma
            if (this.peek() === ',') {
                this.consume();
            }
            this.skipWhitespace();
        }
        this.consume(); // consume ']'
        return arr;
    }
}
/**
 * Creates an AST builder with cycle detection
 */
function createASTBuilder() {
    // Track objects to detect cycles
    const objectMap = new WeakMap();
    let referenceCounter = 0;
    function buildAST(val) {
        const basicType = typeof val;
        const deepType = {};
        // Handle null specially
        if (val === null) {
            return {
                basic_type: 'object',
                deep_type: { constructorName: 'null' },
                value: null
            };
        }
        // Handle primitives
        if (basicType === 'string' || basicType === 'number' || basicType === 'boolean' || basicType === 'undefined') {
            return {
                basic_type: basicType,
                deep_type: {},
                value: val
            };
        }
        // Handle symbols
        if (basicType === 'symbol') {
            const symbolDesc = val.description;
            if (symbolDesc !== undefined) {
                deepType.description = symbolDesc;
            }
            return {
                basic_type: basicType,
                deep_type: deepType,
                value: val
            };
        }
        // Handle objects (including arrays, dates, etc.)
        if (basicType === 'object' && val !== null) {
            // Check for circular reference
            if (objectMap.has(val)) {
                const existingRefId = objectMap.get(val);
                const circularDeepType = { isCircularReference: true };
                if (existingRefId !== undefined) {
                    circularDeepType.referenceId = existingRefId;
                }
                return {
                    basic_type: basicType,
                    deep_type: circularDeepType
                };
            }
            // Assign reference ID
            const refId = referenceCounter++;
            objectMap.set(val, refId);
            deepType.referenceId = refId;
            // Determine specific object type
            if (Array.isArray(val)) {
                deepType.isArray = true;
                deepType.constructorName = 'Array';
                return {
                    basic_type: basicType,
                    deep_type: deepType,
                    elements: val.map(buildAST)
                };
            }
            // Check for other built-in types
            const constructor = val.constructor;
            if (constructor) {
                deepType.constructorName = constructor.name;
                if (constructor.name === 'WeakMap')
                    deepType.isWeakMap = true;
                if (constructor.name === 'WeakSet')
                    deepType.isWeakSet = true;
                if (constructor.name === 'Map')
                    deepType.isMap = true;
                if (constructor.name === 'Set')
                    deepType.isSet = true;
                if (constructor.name === 'Date')
                    deepType.isDate = true;
                if (constructor.name === 'RegExp')
                    deepType.isRegExp = true;
                if (constructor.name === 'Error' || val instanceof Error)
                    deepType.isError = true;
            }
            // Parse object properties
            const properties = {};
            for (const key in val) {
                if (Object.prototype.hasOwnProperty.call(val, key)) {
                    properties[key] = buildAST(val[key]);
                }
            }
            return {
                basic_type: basicType,
                deep_type: deepType,
                properties
            };
        }
        // Fallback for functions and other types
        return {
            basic_type: basicType,
            deep_type: {},
            value: val
        };
    }
    return buildAST;
}
/**
 * Parses a JavaScript or JSON value string into an Abstract Syntax Tree
 *
 * @param {unknown} input - The string to parse (should be a string)
 * @returns {ASTNode} The AST representation of the parsed value
 *
 * @example
 * ```typescript
 * const ast = parse_string('{"name": "John", "age": 30}');
 * console.log(ast.basic_type); // "object"
 * console.log(ast.deep_type.isArray); // false
 * ```
 */
function parse_string(input) {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    const tokenizer = new Tokenizer(input);
    const value = tokenizer.parseValue();
    const buildAST = createASTBuilder();
    return buildAST(value);
}
/**
 * Parses a JavaScript or JSON value into an Abstract Syntax Tree
 *
 * @param {unknown} input - The value to parse
 * @returns {ASTNode} The AST representation of the parsed value
 *
 * @example
 * ```typescript
 * const obj = {name: "John", age: 30};
 * const ast = parse_value(obj);
 * console.log(ast.basic_type); // "object"
 * console.log(ast.properties.name.value); // "John"
 * ```
 */
function parse_value(input) {
    const buildAST = createASTBuilder();
    return buildAST(input);
}

exports.achromatopsiaPalettes = achromatopsiaPalettes;
exports.colorRangePalettes = colorRangePalettes;
exports.defaultContainers = defaultContainers;
exports.defaultHighlightOptions = defaultHighlightOptions;
exports.deuteranomalyPalettes = deuteranomalyPalettes;
exports.deuteranopiaPalettes = deuteranopiaPalettes;
exports.highlight_string = highlight_string;
exports.highlight_value = highlight_value;
exports.monochromacyPalettes = monochromacyPalettes;
exports.paint = paint;
exports.palettes = palettes;
exports.parse_string = parse_string;
exports.parse_value = parse_value;
exports.protanomalyPalettes = protanomalyPalettes;
exports.protanopiaPalettes = protanopiaPalettes;
exports.testdata = testdata;
exports.tritanomalyPalettes = tritanomalyPalettes;
exports.tritanopiaPalettes = tritanopiaPalettes;
