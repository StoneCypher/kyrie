#!/usr/bin/env node
'use strict';

var require$$0 = require('node:events');
var require$$1 = require('node:child_process');
var require$$2 = require('node:path');
var require$$3 = require('node:fs');
var require$$4 = require('node:process');
var fs = require('fs');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var commander$1 = {};

var argument = {};

var error = {};

/**
 * CommanderError class
 */

var hasRequiredError;

function requireError () {
	if (hasRequiredError) return error;
	hasRequiredError = 1;
	class CommanderError extends Error {
	  /**
	   * Constructs the CommanderError class
	   * @param {number} exitCode suggested exit code which could be used with process.exit
	   * @param {string} code an id string representing the error
	   * @param {string} message human-readable description of the error
	   */
	  constructor(exitCode, code, message) {
	    super(message);
	    // properly capture stack trace in Node.js
	    Error.captureStackTrace(this, this.constructor);
	    this.name = this.constructor.name;
	    this.code = code;
	    this.exitCode = exitCode;
	    this.nestedError = undefined;
	  }
	}

	/**
	 * InvalidArgumentError class
	 */
	class InvalidArgumentError extends CommanderError {
	  /**
	   * Constructs the InvalidArgumentError class
	   * @param {string} [message] explanation of why argument is invalid
	   */
	  constructor(message) {
	    super(1, 'commander.invalidArgument', message);
	    // properly capture stack trace in Node.js
	    Error.captureStackTrace(this, this.constructor);
	    this.name = this.constructor.name;
	  }
	}

	error.CommanderError = CommanderError;
	error.InvalidArgumentError = InvalidArgumentError;
	return error;
}

var hasRequiredArgument;

function requireArgument () {
	if (hasRequiredArgument) return argument;
	hasRequiredArgument = 1;
	const { InvalidArgumentError } = requireError();

	class Argument {
	  /**
	   * Initialize a new command argument with the given name and description.
	   * The default is that the argument is required, and you can explicitly
	   * indicate this with <> around the name. Put [] around the name for an optional argument.
	   *
	   * @param {string} name
	   * @param {string} [description]
	   */

	  constructor(name, description) {
	    this.description = description || '';
	    this.variadic = false;
	    this.parseArg = undefined;
	    this.defaultValue = undefined;
	    this.defaultValueDescription = undefined;
	    this.argChoices = undefined;

	    switch (name[0]) {
	      case '<': // e.g. <required>
	        this.required = true;
	        this._name = name.slice(1, -1);
	        break;
	      case '[': // e.g. [optional]
	        this.required = false;
	        this._name = name.slice(1, -1);
	        break;
	      default:
	        this.required = true;
	        this._name = name;
	        break;
	    }

	    if (this._name.endsWith('...')) {
	      this.variadic = true;
	      this._name = this._name.slice(0, -3);
	    }
	  }

	  /**
	   * Return argument name.
	   *
	   * @return {string}
	   */

	  name() {
	    return this._name;
	  }

	  /**
	   * @package
	   */

	  _collectValue(value, previous) {
	    if (previous === this.defaultValue || !Array.isArray(previous)) {
	      return [value];
	    }

	    previous.push(value);
	    return previous;
	  }

	  /**
	   * Set the default value, and optionally supply the description to be displayed in the help.
	   *
	   * @param {*} value
	   * @param {string} [description]
	   * @return {Argument}
	   */

	  default(value, description) {
	    this.defaultValue = value;
	    this.defaultValueDescription = description;
	    return this;
	  }

	  /**
	   * Set the custom handler for processing CLI command arguments into argument values.
	   *
	   * @param {Function} [fn]
	   * @return {Argument}
	   */

	  argParser(fn) {
	    this.parseArg = fn;
	    return this;
	  }

	  /**
	   * Only allow argument value to be one of choices.
	   *
	   * @param {string[]} values
	   * @return {Argument}
	   */

	  choices(values) {
	    this.argChoices = values.slice();
	    this.parseArg = (arg, previous) => {
	      if (!this.argChoices.includes(arg)) {
	        throw new InvalidArgumentError(
	          `Allowed choices are ${this.argChoices.join(', ')}.`,
	        );
	      }
	      if (this.variadic) {
	        return this._collectValue(arg, previous);
	      }
	      return arg;
	    };
	    return this;
	  }

	  /**
	   * Make argument required.
	   *
	   * @returns {Argument}
	   */
	  argRequired() {
	    this.required = true;
	    return this;
	  }

	  /**
	   * Make argument optional.
	   *
	   * @returns {Argument}
	   */
	  argOptional() {
	    this.required = false;
	    return this;
	  }
	}

	/**
	 * Takes an argument and returns its human readable equivalent for help usage.
	 *
	 * @param {Argument} arg
	 * @return {string}
	 * @private
	 */

	function humanReadableArgName(arg) {
	  const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');

	  return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
	}

	argument.Argument = Argument;
	argument.humanReadableArgName = humanReadableArgName;
	return argument;
}

var command = {};

var help = {};

var hasRequiredHelp;

function requireHelp () {
	if (hasRequiredHelp) return help;
	hasRequiredHelp = 1;
	const { humanReadableArgName } = requireArgument();

	/**
	 * TypeScript import types for JSDoc, used by Visual Studio Code IntelliSense and `npm run typescript-checkJS`
	 * https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
	 * @typedef { import("./argument.js").Argument } Argument
	 * @typedef { import("./command.js").Command } Command
	 * @typedef { import("./option.js").Option } Option
	 */

	// Although this is a class, methods are static in style to allow override using subclass or just functions.
	class Help {
	  constructor() {
	    this.helpWidth = undefined;
	    this.minWidthToWrap = 40;
	    this.sortSubcommands = false;
	    this.sortOptions = false;
	    this.showGlobalOptions = false;
	  }

	  /**
	   * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
	   * and just before calling `formatHelp()`.
	   *
	   * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
	   *
	   * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
	   */
	  prepareContext(contextOptions) {
	    this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
	  }

	  /**
	   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
	   *
	   * @param {Command} cmd
	   * @returns {Command[]}
	   */

	  visibleCommands(cmd) {
	    const visibleCommands = cmd.commands.filter((cmd) => !cmd._hidden);
	    const helpCommand = cmd._getHelpCommand();
	    if (helpCommand && !helpCommand._hidden) {
	      visibleCommands.push(helpCommand);
	    }
	    if (this.sortSubcommands) {
	      visibleCommands.sort((a, b) => {
	        // @ts-ignore: because overloaded return type
	        return a.name().localeCompare(b.name());
	      });
	    }
	    return visibleCommands;
	  }

	  /**
	   * Compare options for sort.
	   *
	   * @param {Option} a
	   * @param {Option} b
	   * @returns {number}
	   */
	  compareOptions(a, b) {
	    const getSortKey = (option) => {
	      // WYSIWYG for order displayed in help. Short used for comparison if present. No special handling for negated.
	      return option.short
	        ? option.short.replace(/^-/, '')
	        : option.long.replace(/^--/, '');
	    };
	    return getSortKey(a).localeCompare(getSortKey(b));
	  }

	  /**
	   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
	   *
	   * @param {Command} cmd
	   * @returns {Option[]}
	   */

	  visibleOptions(cmd) {
	    const visibleOptions = cmd.options.filter((option) => !option.hidden);
	    // Built-in help option.
	    const helpOption = cmd._getHelpOption();
	    if (helpOption && !helpOption.hidden) {
	      // Automatically hide conflicting flags. Bit dubious but a historical behaviour that is convenient for single-command programs.
	      const removeShort = helpOption.short && cmd._findOption(helpOption.short);
	      const removeLong = helpOption.long && cmd._findOption(helpOption.long);
	      if (!removeShort && !removeLong) {
	        visibleOptions.push(helpOption); // no changes needed
	      } else if (helpOption.long && !removeLong) {
	        visibleOptions.push(
	          cmd.createOption(helpOption.long, helpOption.description),
	        );
	      } else if (helpOption.short && !removeShort) {
	        visibleOptions.push(
	          cmd.createOption(helpOption.short, helpOption.description),
	        );
	      }
	    }
	    if (this.sortOptions) {
	      visibleOptions.sort(this.compareOptions);
	    }
	    return visibleOptions;
	  }

	  /**
	   * Get an array of the visible global options. (Not including help.)
	   *
	   * @param {Command} cmd
	   * @returns {Option[]}
	   */

	  visibleGlobalOptions(cmd) {
	    if (!this.showGlobalOptions) return [];

	    const globalOptions = [];
	    for (
	      let ancestorCmd = cmd.parent;
	      ancestorCmd;
	      ancestorCmd = ancestorCmd.parent
	    ) {
	      const visibleOptions = ancestorCmd.options.filter(
	        (option) => !option.hidden,
	      );
	      globalOptions.push(...visibleOptions);
	    }
	    if (this.sortOptions) {
	      globalOptions.sort(this.compareOptions);
	    }
	    return globalOptions;
	  }

	  /**
	   * Get an array of the arguments if any have a description.
	   *
	   * @param {Command} cmd
	   * @returns {Argument[]}
	   */

	  visibleArguments(cmd) {
	    // Side effect! Apply the legacy descriptions before the arguments are displayed.
	    if (cmd._argsDescription) {
	      cmd.registeredArguments.forEach((argument) => {
	        argument.description =
	          argument.description || cmd._argsDescription[argument.name()] || '';
	      });
	    }

	    // If there are any arguments with a description then return all the arguments.
	    if (cmd.registeredArguments.find((argument) => argument.description)) {
	      return cmd.registeredArguments;
	    }
	    return [];
	  }

	  /**
	   * Get the command term to show in the list of subcommands.
	   *
	   * @param {Command} cmd
	   * @returns {string}
	   */

	  subcommandTerm(cmd) {
	    // Legacy. Ignores custom usage string, and nested commands.
	    const args = cmd.registeredArguments
	      .map((arg) => humanReadableArgName(arg))
	      .join(' ');
	    return (
	      cmd._name +
	      (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
	      (cmd.options.length ? ' [options]' : '') + // simplistic check for non-help option
	      (args ? ' ' + args : '')
	    );
	  }

	  /**
	   * Get the option term to show in the list of options.
	   *
	   * @param {Option} option
	   * @returns {string}
	   */

	  optionTerm(option) {
	    return option.flags;
	  }

	  /**
	   * Get the argument term to show in the list of arguments.
	   *
	   * @param {Argument} argument
	   * @returns {string}
	   */

	  argumentTerm(argument) {
	    return argument.name();
	  }

	  /**
	   * Get the longest command term length.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {number}
	   */

	  longestSubcommandTermLength(cmd, helper) {
	    return helper.visibleCommands(cmd).reduce((max, command) => {
	      return Math.max(
	        max,
	        this.displayWidth(
	          helper.styleSubcommandTerm(helper.subcommandTerm(command)),
	        ),
	      );
	    }, 0);
	  }

	  /**
	   * Get the longest option term length.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {number}
	   */

	  longestOptionTermLength(cmd, helper) {
	    return helper.visibleOptions(cmd).reduce((max, option) => {
	      return Math.max(
	        max,
	        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
	      );
	    }, 0);
	  }

	  /**
	   * Get the longest global option term length.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {number}
	   */

	  longestGlobalOptionTermLength(cmd, helper) {
	    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
	      return Math.max(
	        max,
	        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
	      );
	    }, 0);
	  }

	  /**
	   * Get the longest argument term length.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {number}
	   */

	  longestArgumentTermLength(cmd, helper) {
	    return helper.visibleArguments(cmd).reduce((max, argument) => {
	      return Math.max(
	        max,
	        this.displayWidth(
	          helper.styleArgumentTerm(helper.argumentTerm(argument)),
	        ),
	      );
	    }, 0);
	  }

	  /**
	   * Get the command usage to be displayed at the top of the built-in help.
	   *
	   * @param {Command} cmd
	   * @returns {string}
	   */

	  commandUsage(cmd) {
	    // Usage
	    let cmdName = cmd._name;
	    if (cmd._aliases[0]) {
	      cmdName = cmdName + '|' + cmd._aliases[0];
	    }
	    let ancestorCmdNames = '';
	    for (
	      let ancestorCmd = cmd.parent;
	      ancestorCmd;
	      ancestorCmd = ancestorCmd.parent
	    ) {
	      ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
	    }
	    return ancestorCmdNames + cmdName + ' ' + cmd.usage();
	  }

	  /**
	   * Get the description for the command.
	   *
	   * @param {Command} cmd
	   * @returns {string}
	   */

	  commandDescription(cmd) {
	    // @ts-ignore: because overloaded return type
	    return cmd.description();
	  }

	  /**
	   * Get the subcommand summary to show in the list of subcommands.
	   * (Fallback to description for backwards compatibility.)
	   *
	   * @param {Command} cmd
	   * @returns {string}
	   */

	  subcommandDescription(cmd) {
	    // @ts-ignore: because overloaded return type
	    return cmd.summary() || cmd.description();
	  }

	  /**
	   * Get the option description to show in the list of options.
	   *
	   * @param {Option} option
	   * @return {string}
	   */

	  optionDescription(option) {
	    const extraInfo = [];

	    if (option.argChoices) {
	      extraInfo.push(
	        // use stringify to match the display of the default value
	        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
	      );
	    }
	    if (option.defaultValue !== undefined) {
	      // default for boolean and negated more for programmer than end user,
	      // but show true/false for boolean option as may be for hand-rolled env or config processing.
	      const showDefault =
	        option.required ||
	        option.optional ||
	        (option.isBoolean() && typeof option.defaultValue === 'boolean');
	      if (showDefault) {
	        extraInfo.push(
	          `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`,
	        );
	      }
	    }
	    // preset for boolean and negated are more for programmer than end user
	    if (option.presetArg !== undefined && option.optional) {
	      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
	    }
	    if (option.envVar !== undefined) {
	      extraInfo.push(`env: ${option.envVar}`);
	    }
	    if (extraInfo.length > 0) {
	      const extraDescription = `(${extraInfo.join(', ')})`;
	      if (option.description) {
	        return `${option.description} ${extraDescription}`;
	      }
	      return extraDescription;
	    }

	    return option.description;
	  }

	  /**
	   * Get the argument description to show in the list of arguments.
	   *
	   * @param {Argument} argument
	   * @return {string}
	   */

	  argumentDescription(argument) {
	    const extraInfo = [];
	    if (argument.argChoices) {
	      extraInfo.push(
	        // use stringify to match the display of the default value
	        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
	      );
	    }
	    if (argument.defaultValue !== undefined) {
	      extraInfo.push(
	        `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`,
	      );
	    }
	    if (extraInfo.length > 0) {
	      const extraDescription = `(${extraInfo.join(', ')})`;
	      if (argument.description) {
	        return `${argument.description} ${extraDescription}`;
	      }
	      return extraDescription;
	    }
	    return argument.description;
	  }

	  /**
	   * Format a list of items, given a heading and an array of formatted items.
	   *
	   * @param {string} heading
	   * @param {string[]} items
	   * @param {Help} helper
	   * @returns string[]
	   */
	  formatItemList(heading, items, helper) {
	    if (items.length === 0) return [];

	    return [helper.styleTitle(heading), ...items, ''];
	  }

	  /**
	   * Group items by their help group heading.
	   *
	   * @param {Command[] | Option[]} unsortedItems
	   * @param {Command[] | Option[]} visibleItems
	   * @param {Function} getGroup
	   * @returns {Map<string, Command[] | Option[]>}
	   */
	  groupItems(unsortedItems, visibleItems, getGroup) {
	    const result = new Map();
	    // Add groups in order of appearance in unsortedItems.
	    unsortedItems.forEach((item) => {
	      const group = getGroup(item);
	      if (!result.has(group)) result.set(group, []);
	    });
	    // Add items in order of appearance in visibleItems.
	    visibleItems.forEach((item) => {
	      const group = getGroup(item);
	      if (!result.has(group)) {
	        result.set(group, []);
	      }
	      result.get(group).push(item);
	    });
	    return result;
	  }

	  /**
	   * Generate the built-in help text.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {string}
	   */

	  formatHelp(cmd, helper) {
	    const termWidth = helper.padWidth(cmd, helper);
	    const helpWidth = helper.helpWidth ?? 80; // in case prepareContext() was not called

	    function callFormatItem(term, description) {
	      return helper.formatItem(term, termWidth, description, helper);
	    }

	    // Usage
	    let output = [
	      `${helper.styleTitle('Usage:')} ${helper.styleUsage(helper.commandUsage(cmd))}`,
	      '',
	    ];

	    // Description
	    const commandDescription = helper.commandDescription(cmd);
	    if (commandDescription.length > 0) {
	      output = output.concat([
	        helper.boxWrap(
	          helper.styleCommandDescription(commandDescription),
	          helpWidth,
	        ),
	        '',
	      ]);
	    }

	    // Arguments
	    const argumentList = helper.visibleArguments(cmd).map((argument) => {
	      return callFormatItem(
	        helper.styleArgumentTerm(helper.argumentTerm(argument)),
	        helper.styleArgumentDescription(helper.argumentDescription(argument)),
	      );
	    });
	    output = output.concat(
	      this.formatItemList('Arguments:', argumentList, helper),
	    );

	    // Options
	    const optionGroups = this.groupItems(
	      cmd.options,
	      helper.visibleOptions(cmd),
	      (option) => option.helpGroupHeading ?? 'Options:',
	    );
	    optionGroups.forEach((options, group) => {
	      const optionList = options.map((option) => {
	        return callFormatItem(
	          helper.styleOptionTerm(helper.optionTerm(option)),
	          helper.styleOptionDescription(helper.optionDescription(option)),
	        );
	      });
	      output = output.concat(this.formatItemList(group, optionList, helper));
	    });

	    if (helper.showGlobalOptions) {
	      const globalOptionList = helper
	        .visibleGlobalOptions(cmd)
	        .map((option) => {
	          return callFormatItem(
	            helper.styleOptionTerm(helper.optionTerm(option)),
	            helper.styleOptionDescription(helper.optionDescription(option)),
	          );
	        });
	      output = output.concat(
	        this.formatItemList('Global Options:', globalOptionList, helper),
	      );
	    }

	    // Commands
	    const commandGroups = this.groupItems(
	      cmd.commands,
	      helper.visibleCommands(cmd),
	      (sub) => sub.helpGroup() || 'Commands:',
	    );
	    commandGroups.forEach((commands, group) => {
	      const commandList = commands.map((sub) => {
	        return callFormatItem(
	          helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
	          helper.styleSubcommandDescription(helper.subcommandDescription(sub)),
	        );
	      });
	      output = output.concat(this.formatItemList(group, commandList, helper));
	    });

	    return output.join('\n');
	  }

	  /**
	   * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
	   *
	   * @param {string} str
	   * @returns {number}
	   */
	  displayWidth(str) {
	    return stripColor(str).length;
	  }

	  /**
	   * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
	   *
	   * @param {string} str
	   * @returns {string}
	   */
	  styleTitle(str) {
	    return str;
	  }

	  styleUsage(str) {
	    // Usage has lots of parts the user might like to color separately! Assume default usage string which is formed like:
	    //    command subcommand [options] [command] <foo> [bar]
	    return str
	      .split(' ')
	      .map((word) => {
	        if (word === '[options]') return this.styleOptionText(word);
	        if (word === '[command]') return this.styleSubcommandText(word);
	        if (word[0] === '[' || word[0] === '<')
	          return this.styleArgumentText(word);
	        return this.styleCommandText(word); // Restrict to initial words?
	      })
	      .join(' ');
	  }
	  styleCommandDescription(str) {
	    return this.styleDescriptionText(str);
	  }
	  styleOptionDescription(str) {
	    return this.styleDescriptionText(str);
	  }
	  styleSubcommandDescription(str) {
	    return this.styleDescriptionText(str);
	  }
	  styleArgumentDescription(str) {
	    return this.styleDescriptionText(str);
	  }
	  styleDescriptionText(str) {
	    return str;
	  }
	  styleOptionTerm(str) {
	    return this.styleOptionText(str);
	  }
	  styleSubcommandTerm(str) {
	    // This is very like usage with lots of parts! Assume default string which is formed like:
	    //    subcommand [options] <foo> [bar]
	    return str
	      .split(' ')
	      .map((word) => {
	        if (word === '[options]') return this.styleOptionText(word);
	        if (word[0] === '[' || word[0] === '<')
	          return this.styleArgumentText(word);
	        return this.styleSubcommandText(word); // Restrict to initial words?
	      })
	      .join(' ');
	  }
	  styleArgumentTerm(str) {
	    return this.styleArgumentText(str);
	  }
	  styleOptionText(str) {
	    return str;
	  }
	  styleArgumentText(str) {
	    return str;
	  }
	  styleSubcommandText(str) {
	    return str;
	  }
	  styleCommandText(str) {
	    return str;
	  }

	  /**
	   * Calculate the pad width from the maximum term length.
	   *
	   * @param {Command} cmd
	   * @param {Help} helper
	   * @returns {number}
	   */

	  padWidth(cmd, helper) {
	    return Math.max(
	      helper.longestOptionTermLength(cmd, helper),
	      helper.longestGlobalOptionTermLength(cmd, helper),
	      helper.longestSubcommandTermLength(cmd, helper),
	      helper.longestArgumentTermLength(cmd, helper),
	    );
	  }

	  /**
	   * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
	   *
	   * @param {string} str
	   * @returns {boolean}
	   */
	  preformatted(str) {
	    return /\n[^\S\r\n]/.test(str);
	  }

	  /**
	   * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
	   *
	   * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
	   *   TTT  DDD DDDD
	   *        DD DDD
	   *
	   * @param {string} term
	   * @param {number} termWidth
	   * @param {string} description
	   * @param {Help} helper
	   * @returns {string}
	   */
	  formatItem(term, termWidth, description, helper) {
	    const itemIndent = 2;
	    const itemIndentStr = ' '.repeat(itemIndent);
	    if (!description) return itemIndentStr + term;

	    // Pad the term out to a consistent width, so descriptions are aligned.
	    const paddedTerm = term.padEnd(
	      termWidth + term.length - helper.displayWidth(term),
	    );

	    // Format the description.
	    const spacerWidth = 2; // between term and description
	    const helpWidth = this.helpWidth ?? 80; // in case prepareContext() was not called
	    const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
	    let formattedDescription;
	    if (
	      remainingWidth < this.minWidthToWrap ||
	      helper.preformatted(description)
	    ) {
	      formattedDescription = description;
	    } else {
	      const wrappedDescription = helper.boxWrap(description, remainingWidth);
	      formattedDescription = wrappedDescription.replace(
	        /\n/g,
	        '\n' + ' '.repeat(termWidth + spacerWidth),
	      );
	    }

	    // Construct and overall indent.
	    return (
	      itemIndentStr +
	      paddedTerm +
	      ' '.repeat(spacerWidth) +
	      formattedDescription.replace(/\n/g, `\n${itemIndentStr}`)
	    );
	  }

	  /**
	   * Wrap a string at whitespace, preserving existing line breaks.
	   * Wrapping is skipped if the width is less than `minWidthToWrap`.
	   *
	   * @param {string} str
	   * @param {number} width
	   * @returns {string}
	   */
	  boxWrap(str, width) {
	    if (width < this.minWidthToWrap) return str;

	    const rawLines = str.split(/\r\n|\n/);
	    // split up text by whitespace
	    const chunkPattern = /[\s]*[^\s]+/g;
	    const wrappedLines = [];
	    rawLines.forEach((line) => {
	      const chunks = line.match(chunkPattern);
	      if (chunks === null) {
	        wrappedLines.push('');
	        return;
	      }

	      let sumChunks = [chunks.shift()];
	      let sumWidth = this.displayWidth(sumChunks[0]);
	      chunks.forEach((chunk) => {
	        const visibleWidth = this.displayWidth(chunk);
	        // Accumulate chunks while they fit into width.
	        if (sumWidth + visibleWidth <= width) {
	          sumChunks.push(chunk);
	          sumWidth += visibleWidth;
	          return;
	        }
	        wrappedLines.push(sumChunks.join(''));

	        const nextChunk = chunk.trimStart(); // trim space at line break
	        sumChunks = [nextChunk];
	        sumWidth = this.displayWidth(nextChunk);
	      });
	      wrappedLines.push(sumChunks.join(''));
	    });

	    return wrappedLines.join('\n');
	  }
	}

	/**
	 * Strip style ANSI escape sequences from the string. In particular, SGR (Select Graphic Rendition) codes.
	 *
	 * @param {string} str
	 * @returns {string}
	 * @package
	 */

	function stripColor(str) {
	  // eslint-disable-next-line no-control-regex
	  const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
	  return str.replace(sgrPattern, '');
	}

	help.Help = Help;
	help.stripColor = stripColor;
	return help;
}

var option = {};

var hasRequiredOption;

function requireOption () {
	if (hasRequiredOption) return option;
	hasRequiredOption = 1;
	const { InvalidArgumentError } = requireError();

	class Option {
	  /**
	   * Initialize a new `Option` with the given `flags` and `description`.
	   *
	   * @param {string} flags
	   * @param {string} [description]
	   */

	  constructor(flags, description) {
	    this.flags = flags;
	    this.description = description || '';

	    this.required = flags.includes('<'); // A value must be supplied when the option is specified.
	    this.optional = flags.includes('['); // A value is optional when the option is specified.
	    // variadic test ignores <value,...> et al which might be used to describe custom splitting of single argument
	    this.variadic = /\w\.\.\.[>\]]$/.test(flags); // The option can take multiple values.
	    this.mandatory = false; // The option must have a value after parsing, which usually means it must be specified on command line.
	    const optionFlags = splitOptionFlags(flags);
	    this.short = optionFlags.shortFlag; // May be a short flag, undefined, or even a long flag (if option has two long flags).
	    this.long = optionFlags.longFlag;
	    this.negate = false;
	    if (this.long) {
	      this.negate = this.long.startsWith('--no-');
	    }
	    this.defaultValue = undefined;
	    this.defaultValueDescription = undefined;
	    this.presetArg = undefined;
	    this.envVar = undefined;
	    this.parseArg = undefined;
	    this.hidden = false;
	    this.argChoices = undefined;
	    this.conflictsWith = [];
	    this.implied = undefined;
	    this.helpGroupHeading = undefined; // soft initialised when option added to command
	  }

	  /**
	   * Set the default value, and optionally supply the description to be displayed in the help.
	   *
	   * @param {*} value
	   * @param {string} [description]
	   * @return {Option}
	   */

	  default(value, description) {
	    this.defaultValue = value;
	    this.defaultValueDescription = description;
	    return this;
	  }

	  /**
	   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
	   * The custom processing (parseArg) is called.
	   *
	   * @example
	   * new Option('--color').default('GREYSCALE').preset('RGB');
	   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
	   *
	   * @param {*} arg
	   * @return {Option}
	   */

	  preset(arg) {
	    this.presetArg = arg;
	    return this;
	  }

	  /**
	   * Add option name(s) that conflict with this option.
	   * An error will be displayed if conflicting options are found during parsing.
	   *
	   * @example
	   * new Option('--rgb').conflicts('cmyk');
	   * new Option('--js').conflicts(['ts', 'jsx']);
	   *
	   * @param {(string | string[])} names
	   * @return {Option}
	   */

	  conflicts(names) {
	    this.conflictsWith = this.conflictsWith.concat(names);
	    return this;
	  }

	  /**
	   * Specify implied option values for when this option is set and the implied options are not.
	   *
	   * The custom processing (parseArg) is not called on the implied values.
	   *
	   * @example
	   * program
	   *   .addOption(new Option('--log', 'write logging information to file'))
	   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
	   *
	   * @param {object} impliedOptionValues
	   * @return {Option}
	   */
	  implies(impliedOptionValues) {
	    let newImplied = impliedOptionValues;
	    if (typeof impliedOptionValues === 'string') {
	      // string is not documented, but easy mistake and we can do what user probably intended.
	      newImplied = { [impliedOptionValues]: true };
	    }
	    this.implied = Object.assign(this.implied || {}, newImplied);
	    return this;
	  }

	  /**
	   * Set environment variable to check for option value.
	   *
	   * An environment variable is only used if when processed the current option value is
	   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
	   *
	   * @param {string} name
	   * @return {Option}
	   */

	  env(name) {
	    this.envVar = name;
	    return this;
	  }

	  /**
	   * Set the custom handler for processing CLI option arguments into option values.
	   *
	   * @param {Function} [fn]
	   * @return {Option}
	   */

	  argParser(fn) {
	    this.parseArg = fn;
	    return this;
	  }

	  /**
	   * Whether the option is mandatory and must have a value after parsing.
	   *
	   * @param {boolean} [mandatory=true]
	   * @return {Option}
	   */

	  makeOptionMandatory(mandatory = true) {
	    this.mandatory = !!mandatory;
	    return this;
	  }

	  /**
	   * Hide option in help.
	   *
	   * @param {boolean} [hide=true]
	   * @return {Option}
	   */

	  hideHelp(hide = true) {
	    this.hidden = !!hide;
	    return this;
	  }

	  /**
	   * @package
	   */

	  _collectValue(value, previous) {
	    if (previous === this.defaultValue || !Array.isArray(previous)) {
	      return [value];
	    }

	    previous.push(value);
	    return previous;
	  }

	  /**
	   * Only allow option value to be one of choices.
	   *
	   * @param {string[]} values
	   * @return {Option}
	   */

	  choices(values) {
	    this.argChoices = values.slice();
	    this.parseArg = (arg, previous) => {
	      if (!this.argChoices.includes(arg)) {
	        throw new InvalidArgumentError(
	          `Allowed choices are ${this.argChoices.join(', ')}.`,
	        );
	      }
	      if (this.variadic) {
	        return this._collectValue(arg, previous);
	      }
	      return arg;
	    };
	    return this;
	  }

	  /**
	   * Return option name.
	   *
	   * @return {string}
	   */

	  name() {
	    if (this.long) {
	      return this.long.replace(/^--/, '');
	    }
	    return this.short.replace(/^-/, '');
	  }

	  /**
	   * Return option name, in a camelcase format that can be used
	   * as an object attribute key.
	   *
	   * @return {string}
	   */

	  attributeName() {
	    if (this.negate) {
	      return camelcase(this.name().replace(/^no-/, ''));
	    }
	    return camelcase(this.name());
	  }

	  /**
	   * Set the help group heading.
	   *
	   * @param {string} heading
	   * @return {Option}
	   */
	  helpGroup(heading) {
	    this.helpGroupHeading = heading;
	    return this;
	  }

	  /**
	   * Check if `arg` matches the short or long flag.
	   *
	   * @param {string} arg
	   * @return {boolean}
	   * @package
	   */

	  is(arg) {
	    return this.short === arg || this.long === arg;
	  }

	  /**
	   * Return whether a boolean option.
	   *
	   * Options are one of boolean, negated, required argument, or optional argument.
	   *
	   * @return {boolean}
	   * @package
	   */

	  isBoolean() {
	    return !this.required && !this.optional && !this.negate;
	  }
	}

	/**
	 * This class is to make it easier to work with dual options, without changing the existing
	 * implementation. We support separate dual options for separate positive and negative options,
	 * like `--build` and `--no-build`, which share a single option value. This works nicely for some
	 * use cases, but is tricky for others where we want separate behaviours despite
	 * the single shared option value.
	 */
	class DualOptions {
	  /**
	   * @param {Option[]} options
	   */
	  constructor(options) {
	    this.positiveOptions = new Map();
	    this.negativeOptions = new Map();
	    this.dualOptions = new Set();
	    options.forEach((option) => {
	      if (option.negate) {
	        this.negativeOptions.set(option.attributeName(), option);
	      } else {
	        this.positiveOptions.set(option.attributeName(), option);
	      }
	    });
	    this.negativeOptions.forEach((value, key) => {
	      if (this.positiveOptions.has(key)) {
	        this.dualOptions.add(key);
	      }
	    });
	  }

	  /**
	   * Did the value come from the option, and not from possible matching dual option?
	   *
	   * @param {*} value
	   * @param {Option} option
	   * @returns {boolean}
	   */
	  valueFromOption(value, option) {
	    const optionKey = option.attributeName();
	    if (!this.dualOptions.has(optionKey)) return true;

	    // Use the value to deduce if (probably) came from the option.
	    const preset = this.negativeOptions.get(optionKey).presetArg;
	    const negativeValue = preset !== undefined ? preset : false;
	    return option.negate === (negativeValue === value);
	  }
	}

	/**
	 * Convert string from kebab-case to camelCase.
	 *
	 * @param {string} str
	 * @return {string}
	 * @private
	 */

	function camelcase(str) {
	  return str.split('-').reduce((str, word) => {
	    return str + word[0].toUpperCase() + word.slice(1);
	  });
	}

	/**
	 * Split the short and long flag out of something like '-m,--mixed <value>'
	 *
	 * @private
	 */

	function splitOptionFlags(flags) {
	  let shortFlag;
	  let longFlag;
	  // short flag, single dash and single character
	  const shortFlagExp = /^-[^-]$/;
	  // long flag, double dash and at least one character
	  const longFlagExp = /^--[^-]/;

	  const flagParts = flags.split(/[ |,]+/).concat('guard');
	  // Normal is short and/or long.
	  if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
	  if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
	  // Long then short. Rarely used but fine.
	  if (!shortFlag && shortFlagExp.test(flagParts[0]))
	    shortFlag = flagParts.shift();
	  // Allow two long flags, like '--ws, --workspace'
	  // This is the supported way to have a shortish option flag.
	  if (!shortFlag && longFlagExp.test(flagParts[0])) {
	    shortFlag = longFlag;
	    longFlag = flagParts.shift();
	  }

	  // Check for unprocessed flag. Fail noisily rather than silently ignore.
	  if (flagParts[0].startsWith('-')) {
	    const unsupportedFlag = flagParts[0];
	    const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
	    if (/^-[^-][^-]/.test(unsupportedFlag))
	      throw new Error(
	        `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`,
	      );
	    if (shortFlagExp.test(unsupportedFlag))
	      throw new Error(`${baseError}
- too many short flags`);
	    if (longFlagExp.test(unsupportedFlag))
	      throw new Error(`${baseError}
- too many long flags`);

	    throw new Error(`${baseError}
- unrecognised flag format`);
	  }
	  if (shortFlag === undefined && longFlag === undefined)
	    throw new Error(
	      `option creation failed due to no flags found in '${flags}'.`,
	    );

	  return { shortFlag, longFlag };
	}

	option.Option = Option;
	option.DualOptions = DualOptions;
	return option;
}

var suggestSimilar = {};

var hasRequiredSuggestSimilar;

function requireSuggestSimilar () {
	if (hasRequiredSuggestSimilar) return suggestSimilar;
	hasRequiredSuggestSimilar = 1;
	const maxDistance = 3;

	function editDistance(a, b) {
	  // https://en.wikipedia.org/wiki/Damerau–Levenshtein_distance
	  // Calculating optimal string alignment distance, no substring is edited more than once.
	  // (Simple implementation.)

	  // Quick early exit, return worst case.
	  if (Math.abs(a.length - b.length) > maxDistance)
	    return Math.max(a.length, b.length);

	  // distance between prefix substrings of a and b
	  const d = [];

	  // pure deletions turn a into empty string
	  for (let i = 0; i <= a.length; i++) {
	    d[i] = [i];
	  }
	  // pure insertions turn empty string into b
	  for (let j = 0; j <= b.length; j++) {
	    d[0][j] = j;
	  }

	  // fill matrix
	  for (let j = 1; j <= b.length; j++) {
	    for (let i = 1; i <= a.length; i++) {
	      let cost = 1;
	      if (a[i - 1] === b[j - 1]) {
	        cost = 0;
	      } else {
	        cost = 1;
	      }
	      d[i][j] = Math.min(
	        d[i - 1][j] + 1, // deletion
	        d[i][j - 1] + 1, // insertion
	        d[i - 1][j - 1] + cost, // substitution
	      );
	      // transposition
	      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
	        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
	      }
	    }
	  }

	  return d[a.length][b.length];
	}

	/**
	 * Find close matches, restricted to same number of edits.
	 *
	 * @param {string} word
	 * @param {string[]} candidates
	 * @returns {string}
	 */

	function suggestSimilar$1(word, candidates) {
	  if (!candidates || candidates.length === 0) return '';
	  // remove possible duplicates
	  candidates = Array.from(new Set(candidates));

	  const searchingOptions = word.startsWith('--');
	  if (searchingOptions) {
	    word = word.slice(2);
	    candidates = candidates.map((candidate) => candidate.slice(2));
	  }

	  let similar = [];
	  let bestDistance = maxDistance;
	  const minSimilarity = 0.4;
	  candidates.forEach((candidate) => {
	    if (candidate.length <= 1) return; // no one character guesses

	    const distance = editDistance(word, candidate);
	    const length = Math.max(word.length, candidate.length);
	    const similarity = (length - distance) / length;
	    if (similarity > minSimilarity) {
	      if (distance < bestDistance) {
	        // better edit distance, throw away previous worse matches
	        bestDistance = distance;
	        similar = [candidate];
	      } else if (distance === bestDistance) {
	        similar.push(candidate);
	      }
	    }
	  });

	  similar.sort((a, b) => a.localeCompare(b));
	  if (searchingOptions) {
	    similar = similar.map((candidate) => `--${candidate}`);
	  }

	  if (similar.length > 1) {
	    return `\n(Did you mean one of ${similar.join(', ')}?)`;
	  }
	  if (similar.length === 1) {
	    return `\n(Did you mean ${similar[0]}?)`;
	  }
	  return '';
	}

	suggestSimilar.suggestSimilar = suggestSimilar$1;
	return suggestSimilar;
}

var hasRequiredCommand;

function requireCommand () {
	if (hasRequiredCommand) return command;
	hasRequiredCommand = 1;
	const EventEmitter = require$$0.EventEmitter;
	const childProcess = require$$1;
	const path = require$$2;
	const fs = require$$3;
	const process = require$$4;

	const { Argument, humanReadableArgName } = requireArgument();
	const { CommanderError } = requireError();
	const { Help, stripColor } = requireHelp();
	const { Option, DualOptions } = requireOption();
	const { suggestSimilar } = requireSuggestSimilar();

	class Command extends EventEmitter {
	  /**
	   * Initialize a new `Command`.
	   *
	   * @param {string} [name]
	   */

	  constructor(name) {
	    super();
	    /** @type {Command[]} */
	    this.commands = [];
	    /** @type {Option[]} */
	    this.options = [];
	    this.parent = null;
	    this._allowUnknownOption = false;
	    this._allowExcessArguments = false;
	    /** @type {Argument[]} */
	    this.registeredArguments = [];
	    this._args = this.registeredArguments; // deprecated old name
	    /** @type {string[]} */
	    this.args = []; // cli args with options removed
	    this.rawArgs = [];
	    this.processedArgs = []; // like .args but after custom processing and collecting variadic
	    this._scriptPath = null;
	    this._name = name || '';
	    this._optionValues = {};
	    this._optionValueSources = {}; // default, env, cli etc
	    this._storeOptionsAsProperties = false;
	    this._actionHandler = null;
	    this._executableHandler = false;
	    this._executableFile = null; // custom name for executable
	    this._executableDir = null; // custom search directory for subcommands
	    this._defaultCommandName = null;
	    this._exitCallback = null;
	    this._aliases = [];
	    this._combineFlagAndOptionalValue = true;
	    this._description = '';
	    this._summary = '';
	    this._argsDescription = undefined; // legacy
	    this._enablePositionalOptions = false;
	    this._passThroughOptions = false;
	    this._lifeCycleHooks = {}; // a hash of arrays
	    /** @type {(boolean | string)} */
	    this._showHelpAfterError = false;
	    this._showSuggestionAfterError = true;
	    this._savedState = null; // used in save/restoreStateBeforeParse

	    // see configureOutput() for docs
	    this._outputConfiguration = {
	      writeOut: (str) => process.stdout.write(str),
	      writeErr: (str) => process.stderr.write(str),
	      outputError: (str, write) => write(str),
	      getOutHelpWidth: () =>
	        process.stdout.isTTY ? process.stdout.columns : undefined,
	      getErrHelpWidth: () =>
	        process.stderr.isTTY ? process.stderr.columns : undefined,
	      getOutHasColors: () =>
	        useColor() ?? (process.stdout.isTTY && process.stdout.hasColors?.()),
	      getErrHasColors: () =>
	        useColor() ?? (process.stderr.isTTY && process.stderr.hasColors?.()),
	      stripColor: (str) => stripColor(str),
	    };

	    this._hidden = false;
	    /** @type {(Option | null | undefined)} */
	    this._helpOption = undefined; // Lazy created on demand. May be null if help option is disabled.
	    this._addImplicitHelpCommand = undefined; // undecided whether true or false yet, not inherited
	    /** @type {Command} */
	    this._helpCommand = undefined; // lazy initialised, inherited
	    this._helpConfiguration = {};
	    /** @type {string | undefined} */
	    this._helpGroupHeading = undefined; // soft initialised when added to parent
	    /** @type {string | undefined} */
	    this._defaultCommandGroup = undefined;
	    /** @type {string | undefined} */
	    this._defaultOptionGroup = undefined;
	  }

	  /**
	   * Copy settings that are useful to have in common across root command and subcommands.
	   *
	   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
	   *
	   * @param {Command} sourceCommand
	   * @return {Command} `this` command for chaining
	   */
	  copyInheritedSettings(sourceCommand) {
	    this._outputConfiguration = sourceCommand._outputConfiguration;
	    this._helpOption = sourceCommand._helpOption;
	    this._helpCommand = sourceCommand._helpCommand;
	    this._helpConfiguration = sourceCommand._helpConfiguration;
	    this._exitCallback = sourceCommand._exitCallback;
	    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
	    this._combineFlagAndOptionalValue =
	      sourceCommand._combineFlagAndOptionalValue;
	    this._allowExcessArguments = sourceCommand._allowExcessArguments;
	    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
	    this._showHelpAfterError = sourceCommand._showHelpAfterError;
	    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;

	    return this;
	  }

	  /**
	   * @returns {Command[]}
	   * @private
	   */

	  _getCommandAndAncestors() {
	    const result = [];
	    // eslint-disable-next-line @typescript-eslint/no-this-alias
	    for (let command = this; command; command = command.parent) {
	      result.push(command);
	    }
	    return result;
	  }

	  /**
	   * Define a command.
	   *
	   * There are two styles of command: pay attention to where to put the description.
	   *
	   * @example
	   * // Command implemented using action handler (description is supplied separately to `.command`)
	   * program
	   *   .command('clone <source> [destination]')
	   *   .description('clone a repository into a newly created directory')
	   *   .action((source, destination) => {
	   *     console.log('clone command called');
	   *   });
	   *
	   * // Command implemented using separate executable file (description is second parameter to `.command`)
	   * program
	   *   .command('start <service>', 'start named service')
	   *   .command('stop [service]', 'stop named service, or all if no name supplied');
	   *
	   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
	   * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
	   * @param {object} [execOpts] - configuration options (for executable)
	   * @return {Command} returns new command for action handler, or `this` for executable command
	   */

	  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
	    let desc = actionOptsOrExecDesc;
	    let opts = execOpts;
	    if (typeof desc === 'object' && desc !== null) {
	      opts = desc;
	      desc = null;
	    }
	    opts = opts || {};
	    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);

	    const cmd = this.createCommand(name);
	    if (desc) {
	      cmd.description(desc);
	      cmd._executableHandler = true;
	    }
	    if (opts.isDefault) this._defaultCommandName = cmd._name;
	    cmd._hidden = !!(opts.noHelp || opts.hidden); // noHelp is deprecated old name for hidden
	    cmd._executableFile = opts.executableFile || null; // Custom name for executable file, set missing to null to match constructor
	    if (args) cmd.arguments(args);
	    this._registerCommand(cmd);
	    cmd.parent = this;
	    cmd.copyInheritedSettings(this);

	    if (desc) return this;
	    return cmd;
	  }

	  /**
	   * Factory routine to create a new unattached command.
	   *
	   * See .command() for creating an attached subcommand, which uses this routine to
	   * create the command. You can override createCommand to customise subcommands.
	   *
	   * @param {string} [name]
	   * @return {Command} new command
	   */

	  createCommand(name) {
	    return new Command(name);
	  }

	  /**
	   * You can customise the help with a subclass of Help by overriding createHelp,
	   * or by overriding Help properties using configureHelp().
	   *
	   * @return {Help}
	   */

	  createHelp() {
	    return Object.assign(new Help(), this.configureHelp());
	  }

	  /**
	   * You can customise the help by overriding Help properties using configureHelp(),
	   * or with a subclass of Help by overriding createHelp().
	   *
	   * @param {object} [configuration] - configuration options
	   * @return {(Command | object)} `this` command for chaining, or stored configuration
	   */

	  configureHelp(configuration) {
	    if (configuration === undefined) return this._helpConfiguration;

	    this._helpConfiguration = configuration;
	    return this;
	  }

	  /**
	   * The default output goes to stdout and stderr. You can customise this for special
	   * applications. You can also customise the display of errors by overriding outputError.
	   *
	   * The configuration properties are all functions:
	   *
	   *     // change how output being written, defaults to stdout and stderr
	   *     writeOut(str)
	   *     writeErr(str)
	   *     // change how output being written for errors, defaults to writeErr
	   *     outputError(str, write) // used for displaying errors and not used for displaying help
	   *     // specify width for wrapping help
	   *     getOutHelpWidth()
	   *     getErrHelpWidth()
	   *     // color support, currently only used with Help
	   *     getOutHasColors()
	   *     getErrHasColors()
	   *     stripColor() // used to remove ANSI escape codes if output does not have colors
	   *
	   * @param {object} [configuration] - configuration options
	   * @return {(Command | object)} `this` command for chaining, or stored configuration
	   */

	  configureOutput(configuration) {
	    if (configuration === undefined) return this._outputConfiguration;

	    this._outputConfiguration = {
	      ...this._outputConfiguration,
	      ...configuration,
	    };
	    return this;
	  }

	  /**
	   * Display the help or a custom message after an error occurs.
	   *
	   * @param {(boolean|string)} [displayHelp]
	   * @return {Command} `this` command for chaining
	   */
	  showHelpAfterError(displayHelp = true) {
	    if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
	    this._showHelpAfterError = displayHelp;
	    return this;
	  }

	  /**
	   * Display suggestion of similar commands for unknown commands, or options for unknown options.
	   *
	   * @param {boolean} [displaySuggestion]
	   * @return {Command} `this` command for chaining
	   */
	  showSuggestionAfterError(displaySuggestion = true) {
	    this._showSuggestionAfterError = !!displaySuggestion;
	    return this;
	  }

	  /**
	   * Add a prepared subcommand.
	   *
	   * See .command() for creating an attached subcommand which inherits settings from its parent.
	   *
	   * @param {Command} cmd - new subcommand
	   * @param {object} [opts] - configuration options
	   * @return {Command} `this` command for chaining
	   */

	  addCommand(cmd, opts) {
	    if (!cmd._name) {
	      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
	    }

	    opts = opts || {};
	    if (opts.isDefault) this._defaultCommandName = cmd._name;
	    if (opts.noHelp || opts.hidden) cmd._hidden = true; // modifying passed command due to existing implementation

	    this._registerCommand(cmd);
	    cmd.parent = this;
	    cmd._checkForBrokenPassThrough();

	    return this;
	  }

	  /**
	   * Factory routine to create a new unattached argument.
	   *
	   * See .argument() for creating an attached argument, which uses this routine to
	   * create the argument. You can override createArgument to return a custom argument.
	   *
	   * @param {string} name
	   * @param {string} [description]
	   * @return {Argument} new argument
	   */

	  createArgument(name, description) {
	    return new Argument(name, description);
	  }

	  /**
	   * Define argument syntax for command.
	   *
	   * The default is that the argument is required, and you can explicitly
	   * indicate this with <> around the name. Put [] around the name for an optional argument.
	   *
	   * @example
	   * program.argument('<input-file>');
	   * program.argument('[output-file]');
	   *
	   * @param {string} name
	   * @param {string} [description]
	   * @param {(Function|*)} [parseArg] - custom argument processing function or default value
	   * @param {*} [defaultValue]
	   * @return {Command} `this` command for chaining
	   */
	  argument(name, description, parseArg, defaultValue) {
	    const argument = this.createArgument(name, description);
	    if (typeof parseArg === 'function') {
	      argument.default(defaultValue).argParser(parseArg);
	    } else {
	      argument.default(parseArg);
	    }
	    this.addArgument(argument);
	    return this;
	  }

	  /**
	   * Define argument syntax for command, adding multiple at once (without descriptions).
	   *
	   * See also .argument().
	   *
	   * @example
	   * program.arguments('<cmd> [env]');
	   *
	   * @param {string} names
	   * @return {Command} `this` command for chaining
	   */

	  arguments(names) {
	    names
	      .trim()
	      .split(/ +/)
	      .forEach((detail) => {
	        this.argument(detail);
	      });
	    return this;
	  }

	  /**
	   * Define argument syntax for command, adding a prepared argument.
	   *
	   * @param {Argument} argument
	   * @return {Command} `this` command for chaining
	   */
	  addArgument(argument) {
	    const previousArgument = this.registeredArguments.slice(-1)[0];
	    if (previousArgument?.variadic) {
	      throw new Error(
	        `only the last argument can be variadic '${previousArgument.name()}'`,
	      );
	    }
	    if (
	      argument.required &&
	      argument.defaultValue !== undefined &&
	      argument.parseArg === undefined
	    ) {
	      throw new Error(
	        `a default value for a required argument is never used: '${argument.name()}'`,
	      );
	    }
	    this.registeredArguments.push(argument);
	    return this;
	  }

	  /**
	   * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
	   *
	   * @example
	   *    program.helpCommand('help [cmd]');
	   *    program.helpCommand('help [cmd]', 'show help');
	   *    program.helpCommand(false); // suppress default help command
	   *    program.helpCommand(true); // add help command even if no subcommands
	   *
	   * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
	   * @param {string} [description] - custom description
	   * @return {Command} `this` command for chaining
	   */

	  helpCommand(enableOrNameAndArgs, description) {
	    if (typeof enableOrNameAndArgs === 'boolean') {
	      this._addImplicitHelpCommand = enableOrNameAndArgs;
	      if (enableOrNameAndArgs && this._defaultCommandGroup) {
	        // make the command to store the group
	        this._initCommandGroup(this._getHelpCommand());
	      }
	      return this;
	    }

	    const nameAndArgs = enableOrNameAndArgs ?? 'help [command]';
	    const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
	    const helpDescription = description ?? 'display help for command';

	    const helpCommand = this.createCommand(helpName);
	    helpCommand.helpOption(false);
	    if (helpArgs) helpCommand.arguments(helpArgs);
	    if (helpDescription) helpCommand.description(helpDescription);

	    this._addImplicitHelpCommand = true;
	    this._helpCommand = helpCommand;
	    // init group unless lazy create
	    if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);

	    return this;
	  }

	  /**
	   * Add prepared custom help command.
	   *
	   * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
	   * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
	   * @return {Command} `this` command for chaining
	   */
	  addHelpCommand(helpCommand, deprecatedDescription) {
	    // If not passed an object, call through to helpCommand for backwards compatibility,
	    // as addHelpCommand was originally used like helpCommand is now.
	    if (typeof helpCommand !== 'object') {
	      this.helpCommand(helpCommand, deprecatedDescription);
	      return this;
	    }

	    this._addImplicitHelpCommand = true;
	    this._helpCommand = helpCommand;
	    this._initCommandGroup(helpCommand);
	    return this;
	  }

	  /**
	   * Lazy create help command.
	   *
	   * @return {(Command|null)}
	   * @package
	   */
	  _getHelpCommand() {
	    const hasImplicitHelpCommand =
	      this._addImplicitHelpCommand ??
	      (this.commands.length &&
	        !this._actionHandler &&
	        !this._findCommand('help'));

	    if (hasImplicitHelpCommand) {
	      if (this._helpCommand === undefined) {
	        this.helpCommand(undefined, undefined); // use default name and description
	      }
	      return this._helpCommand;
	    }
	    return null;
	  }

	  /**
	   * Add hook for life cycle event.
	   *
	   * @param {string} event
	   * @param {Function} listener
	   * @return {Command} `this` command for chaining
	   */

	  hook(event, listener) {
	    const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
	    if (!allowedValues.includes(event)) {
	      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
	    }
	    if (this._lifeCycleHooks[event]) {
	      this._lifeCycleHooks[event].push(listener);
	    } else {
	      this._lifeCycleHooks[event] = [listener];
	    }
	    return this;
	  }

	  /**
	   * Register callback to use as replacement for calling process.exit.
	   *
	   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
	   * @return {Command} `this` command for chaining
	   */

	  exitOverride(fn) {
	    if (fn) {
	      this._exitCallback = fn;
	    } else {
	      this._exitCallback = (err) => {
	        if (err.code !== 'commander.executeSubCommandAsync') {
	          throw err;
	        }
	      };
	    }
	    return this;
	  }

	  /**
	   * Call process.exit, and _exitCallback if defined.
	   *
	   * @param {number} exitCode exit code for using with process.exit
	   * @param {string} code an id string representing the error
	   * @param {string} message human-readable description of the error
	   * @return never
	   * @private
	   */

	  _exit(exitCode, code, message) {
	    if (this._exitCallback) {
	      this._exitCallback(new CommanderError(exitCode, code, message));
	      // Expecting this line is not reached.
	    }
	    process.exit(exitCode);
	  }

	  /**
	   * Register callback `fn` for the command.
	   *
	   * @example
	   * program
	   *   .command('serve')
	   *   .description('start service')
	   *   .action(function() {
	   *      // do work here
	   *   });
	   *
	   * @param {Function} fn
	   * @return {Command} `this` command for chaining
	   */

	  action(fn) {
	    const listener = (args) => {
	      // The .action callback takes an extra parameter which is the command or options.
	      const expectedArgsCount = this.registeredArguments.length;
	      const actionArgs = args.slice(0, expectedArgsCount);
	      if (this._storeOptionsAsProperties) {
	        actionArgs[expectedArgsCount] = this; // backwards compatible "options"
	      } else {
	        actionArgs[expectedArgsCount] = this.opts();
	      }
	      actionArgs.push(this);

	      return fn.apply(this, actionArgs);
	    };
	    this._actionHandler = listener;
	    return this;
	  }

	  /**
	   * Factory routine to create a new unattached option.
	   *
	   * See .option() for creating an attached option, which uses this routine to
	   * create the option. You can override createOption to return a custom option.
	   *
	   * @param {string} flags
	   * @param {string} [description]
	   * @return {Option} new option
	   */

	  createOption(flags, description) {
	    return new Option(flags, description);
	  }

	  /**
	   * Wrap parseArgs to catch 'commander.invalidArgument'.
	   *
	   * @param {(Option | Argument)} target
	   * @param {string} value
	   * @param {*} previous
	   * @param {string} invalidArgumentMessage
	   * @private
	   */

	  _callParseArg(target, value, previous, invalidArgumentMessage) {
	    try {
	      return target.parseArg(value, previous);
	    } catch (err) {
	      if (err.code === 'commander.invalidArgument') {
	        const message = `${invalidArgumentMessage} ${err.message}`;
	        this.error(message, { exitCode: err.exitCode, code: err.code });
	      }
	      throw err;
	    }
	  }

	  /**
	   * Check for option flag conflicts.
	   * Register option if no conflicts found, or throw on conflict.
	   *
	   * @param {Option} option
	   * @private
	   */

	  _registerOption(option) {
	    const matchingOption =
	      (option.short && this._findOption(option.short)) ||
	      (option.long && this._findOption(option.long));
	    if (matchingOption) {
	      const matchingFlag =
	        option.long && this._findOption(option.long)
	          ? option.long
	          : option.short;
	      throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
	    }

	    this._initOptionGroup(option);
	    this.options.push(option);
	  }

	  /**
	   * Check for command name and alias conflicts with existing commands.
	   * Register command if no conflicts found, or throw on conflict.
	   *
	   * @param {Command} command
	   * @private
	   */

	  _registerCommand(command) {
	    const knownBy = (cmd) => {
	      return [cmd.name()].concat(cmd.aliases());
	    };

	    const alreadyUsed = knownBy(command).find((name) =>
	      this._findCommand(name),
	    );
	    if (alreadyUsed) {
	      const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|');
	      const newCmd = knownBy(command).join('|');
	      throw new Error(
	        `cannot add command '${newCmd}' as already have command '${existingCmd}'`,
	      );
	    }

	    this._initCommandGroup(command);
	    this.commands.push(command);
	  }

	  /**
	   * Add an option.
	   *
	   * @param {Option} option
	   * @return {Command} `this` command for chaining
	   */
	  addOption(option) {
	    this._registerOption(option);

	    const oname = option.name();
	    const name = option.attributeName();

	    // store default value
	    if (option.negate) {
	      // --no-foo is special and defaults foo to true, unless a --foo option is already defined
	      const positiveLongFlag = option.long.replace(/^--no-/, '--');
	      if (!this._findOption(positiveLongFlag)) {
	        this.setOptionValueWithSource(
	          name,
	          option.defaultValue === undefined ? true : option.defaultValue,
	          'default',
	        );
	      }
	    } else if (option.defaultValue !== undefined) {
	      this.setOptionValueWithSource(name, option.defaultValue, 'default');
	    }

	    // handler for cli and env supplied values
	    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
	      // val is null for optional option used without an optional-argument.
	      // val is undefined for boolean and negated option.
	      if (val == null && option.presetArg !== undefined) {
	        val = option.presetArg;
	      }

	      // custom processing
	      const oldValue = this.getOptionValue(name);
	      if (val !== null && option.parseArg) {
	        val = this._callParseArg(option, val, oldValue, invalidValueMessage);
	      } else if (val !== null && option.variadic) {
	        val = option._collectValue(val, oldValue);
	      }

	      // Fill-in appropriate missing values. Long winded but easy to follow.
	      if (val == null) {
	        if (option.negate) {
	          val = false;
	        } else if (option.isBoolean() || option.optional) {
	          val = true;
	        } else {
	          val = ''; // not normal, parseArg might have failed or be a mock function for testing
	        }
	      }
	      this.setOptionValueWithSource(name, val, valueSource);
	    };

	    this.on('option:' + oname, (val) => {
	      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
	      handleOptionValue(val, invalidValueMessage, 'cli');
	    });

	    if (option.envVar) {
	      this.on('optionEnv:' + oname, (val) => {
	        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
	        handleOptionValue(val, invalidValueMessage, 'env');
	      });
	    }

	    return this;
	  }

	  /**
	   * Internal implementation shared by .option() and .requiredOption()
	   *
	   * @return {Command} `this` command for chaining
	   * @private
	   */
	  _optionEx(config, flags, description, fn, defaultValue) {
	    if (typeof flags === 'object' && flags instanceof Option) {
	      throw new Error(
	        'To add an Option object use addOption() instead of option() or requiredOption()',
	      );
	    }
	    const option = this.createOption(flags, description);
	    option.makeOptionMandatory(!!config.mandatory);
	    if (typeof fn === 'function') {
	      option.default(defaultValue).argParser(fn);
	    } else if (fn instanceof RegExp) {
	      // deprecated
	      const regex = fn;
	      fn = (val, def) => {
	        const m = regex.exec(val);
	        return m ? m[0] : def;
	      };
	      option.default(defaultValue).argParser(fn);
	    } else {
	      option.default(fn);
	    }

	    return this.addOption(option);
	  }

	  /**
	   * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
	   *
	   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
	   * option-argument is indicated by `<>` and an optional option-argument by `[]`.
	   *
	   * See the README for more details, and see also addOption() and requiredOption().
	   *
	   * @example
	   * program
	   *     .option('-p, --pepper', 'add pepper')
	   *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
	   *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
	   *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
	   *
	   * @param {string} flags
	   * @param {string} [description]
	   * @param {(Function|*)} [parseArg] - custom option processing function or default value
	   * @param {*} [defaultValue]
	   * @return {Command} `this` command for chaining
	   */

	  option(flags, description, parseArg, defaultValue) {
	    return this._optionEx({}, flags, description, parseArg, defaultValue);
	  }

	  /**
	   * Add a required option which must have a value after parsing. This usually means
	   * the option must be specified on the command line. (Otherwise the same as .option().)
	   *
	   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
	   *
	   * @param {string} flags
	   * @param {string} [description]
	   * @param {(Function|*)} [parseArg] - custom option processing function or default value
	   * @param {*} [defaultValue]
	   * @return {Command} `this` command for chaining
	   */

	  requiredOption(flags, description, parseArg, defaultValue) {
	    return this._optionEx(
	      { mandatory: true },
	      flags,
	      description,
	      parseArg,
	      defaultValue,
	    );
	  }

	  /**
	   * Alter parsing of short flags with optional values.
	   *
	   * @example
	   * // for `.option('-f,--flag [value]'):
	   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
	   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
	   *
	   * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
	   * @return {Command} `this` command for chaining
	   */
	  combineFlagAndOptionalValue(combine = true) {
	    this._combineFlagAndOptionalValue = !!combine;
	    return this;
	  }

	  /**
	   * Allow unknown options on the command line.
	   *
	   * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
	   * @return {Command} `this` command for chaining
	   */
	  allowUnknownOption(allowUnknown = true) {
	    this._allowUnknownOption = !!allowUnknown;
	    return this;
	  }

	  /**
	   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
	   *
	   * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
	   * @return {Command} `this` command for chaining
	   */
	  allowExcessArguments(allowExcess = true) {
	    this._allowExcessArguments = !!allowExcess;
	    return this;
	  }

	  /**
	   * Enable positional options. Positional means global options are specified before subcommands which lets
	   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
	   * The default behaviour is non-positional and global options may appear anywhere on the command line.
	   *
	   * @param {boolean} [positional]
	   * @return {Command} `this` command for chaining
	   */
	  enablePositionalOptions(positional = true) {
	    this._enablePositionalOptions = !!positional;
	    return this;
	  }

	  /**
	   * Pass through options that come after command-arguments rather than treat them as command-options,
	   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
	   * positional options to have been enabled on the program (parent commands).
	   * The default behaviour is non-positional and options may appear before or after command-arguments.
	   *
	   * @param {boolean} [passThrough] for unknown options.
	   * @return {Command} `this` command for chaining
	   */
	  passThroughOptions(passThrough = true) {
	    this._passThroughOptions = !!passThrough;
	    this._checkForBrokenPassThrough();
	    return this;
	  }

	  /**
	   * @private
	   */

	  _checkForBrokenPassThrough() {
	    if (
	      this.parent &&
	      this._passThroughOptions &&
	      !this.parent._enablePositionalOptions
	    ) {
	      throw new Error(
	        `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`,
	      );
	    }
	  }

	  /**
	   * Whether to store option values as properties on command object,
	   * or store separately (specify false). In both cases the option values can be accessed using .opts().
	   *
	   * @param {boolean} [storeAsProperties=true]
	   * @return {Command} `this` command for chaining
	   */

	  storeOptionsAsProperties(storeAsProperties = true) {
	    if (this.options.length) {
	      throw new Error('call .storeOptionsAsProperties() before adding options');
	    }
	    if (Object.keys(this._optionValues).length) {
	      throw new Error(
	        'call .storeOptionsAsProperties() before setting option values',
	      );
	    }
	    this._storeOptionsAsProperties = !!storeAsProperties;
	    return this;
	  }

	  /**
	   * Retrieve option value.
	   *
	   * @param {string} key
	   * @return {object} value
	   */

	  getOptionValue(key) {
	    if (this._storeOptionsAsProperties) {
	      return this[key];
	    }
	    return this._optionValues[key];
	  }

	  /**
	   * Store option value.
	   *
	   * @param {string} key
	   * @param {object} value
	   * @return {Command} `this` command for chaining
	   */

	  setOptionValue(key, value) {
	    return this.setOptionValueWithSource(key, value, undefined);
	  }

	  /**
	   * Store option value and where the value came from.
	   *
	   * @param {string} key
	   * @param {object} value
	   * @param {string} source - expected values are default/config/env/cli/implied
	   * @return {Command} `this` command for chaining
	   */

	  setOptionValueWithSource(key, value, source) {
	    if (this._storeOptionsAsProperties) {
	      this[key] = value;
	    } else {
	      this._optionValues[key] = value;
	    }
	    this._optionValueSources[key] = source;
	    return this;
	  }

	  /**
	   * Get source of option value.
	   * Expected values are default | config | env | cli | implied
	   *
	   * @param {string} key
	   * @return {string}
	   */

	  getOptionValueSource(key) {
	    return this._optionValueSources[key];
	  }

	  /**
	   * Get source of option value. See also .optsWithGlobals().
	   * Expected values are default | config | env | cli | implied
	   *
	   * @param {string} key
	   * @return {string}
	   */

	  getOptionValueSourceWithGlobals(key) {
	    // global overwrites local, like optsWithGlobals
	    let source;
	    this._getCommandAndAncestors().forEach((cmd) => {
	      if (cmd.getOptionValueSource(key) !== undefined) {
	        source = cmd.getOptionValueSource(key);
	      }
	    });
	    return source;
	  }

	  /**
	   * Get user arguments from implied or explicit arguments.
	   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
	   *
	   * @private
	   */

	  _prepareUserArgs(argv, parseOptions) {
	    if (argv !== undefined && !Array.isArray(argv)) {
	      throw new Error('first parameter to parse must be array or undefined');
	    }
	    parseOptions = parseOptions || {};

	    // auto-detect argument conventions if nothing supplied
	    if (argv === undefined && parseOptions.from === undefined) {
	      if (process.versions?.electron) {
	        parseOptions.from = 'electron';
	      }
	      // check node specific options for scenarios where user CLI args follow executable without scriptname
	      const execArgv = process.execArgv ?? [];
	      if (
	        execArgv.includes('-e') ||
	        execArgv.includes('--eval') ||
	        execArgv.includes('-p') ||
	        execArgv.includes('--print')
	      ) {
	        parseOptions.from = 'eval'; // internal usage, not documented
	      }
	    }

	    // default to using process.argv
	    if (argv === undefined) {
	      argv = process.argv;
	    }
	    this.rawArgs = argv.slice();

	    // extract the user args and scriptPath
	    let userArgs;
	    switch (parseOptions.from) {
	      case undefined:
	      case 'node':
	        this._scriptPath = argv[1];
	        userArgs = argv.slice(2);
	        break;
	      case 'electron':
	        // @ts-ignore: because defaultApp is an unknown property
	        if (process.defaultApp) {
	          this._scriptPath = argv[1];
	          userArgs = argv.slice(2);
	        } else {
	          userArgs = argv.slice(1);
	        }
	        break;
	      case 'user':
	        userArgs = argv.slice(0);
	        break;
	      case 'eval':
	        userArgs = argv.slice(1);
	        break;
	      default:
	        throw new Error(
	          `unexpected parse option { from: '${parseOptions.from}' }`,
	        );
	    }

	    // Find default name for program from arguments.
	    if (!this._name && this._scriptPath)
	      this.nameFromFilename(this._scriptPath);
	    this._name = this._name || 'program';

	    return userArgs;
	  }

	  /**
	   * Parse `argv`, setting options and invoking commands when defined.
	   *
	   * Use parseAsync instead of parse if any of your action handlers are async.
	   *
	   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
	   *
	   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
	   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
	   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
	   * - `'user'`: just user arguments
	   *
	   * @example
	   * program.parse(); // parse process.argv and auto-detect electron and special node flags
	   * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
	   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
	   *
	   * @param {string[]} [argv] - optional, defaults to process.argv
	   * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
	   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
	   * @return {Command} `this` command for chaining
	   */

	  parse(argv, parseOptions) {
	    this._prepareForParse();
	    const userArgs = this._prepareUserArgs(argv, parseOptions);
	    this._parseCommand([], userArgs);

	    return this;
	  }

	  /**
	   * Parse `argv`, setting options and invoking commands when defined.
	   *
	   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
	   *
	   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
	   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
	   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
	   * - `'user'`: just user arguments
	   *
	   * @example
	   * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
	   * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
	   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
	   *
	   * @param {string[]} [argv]
	   * @param {object} [parseOptions]
	   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
	   * @return {Promise}
	   */

	  async parseAsync(argv, parseOptions) {
	    this._prepareForParse();
	    const userArgs = this._prepareUserArgs(argv, parseOptions);
	    await this._parseCommand([], userArgs);

	    return this;
	  }

	  _prepareForParse() {
	    if (this._savedState === null) {
	      this.saveStateBeforeParse();
	    } else {
	      this.restoreStateBeforeParse();
	    }
	  }

	  /**
	   * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
	   * Not usually called directly, but available for subclasses to save their custom state.
	   *
	   * This is called in a lazy way. Only commands used in parsing chain will have state saved.
	   */
	  saveStateBeforeParse() {
	    this._savedState = {
	      // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
	      _name: this._name,
	      // option values before parse have default values (including false for negated options)
	      // shallow clones
	      _optionValues: { ...this._optionValues },
	      _optionValueSources: { ...this._optionValueSources },
	    };
	  }

	  /**
	   * Restore state before parse for calls after the first.
	   * Not usually called directly, but available for subclasses to save their custom state.
	   *
	   * This is called in a lazy way. Only commands used in parsing chain will have state restored.
	   */
	  restoreStateBeforeParse() {
	    if (this._storeOptionsAsProperties)
	      throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);

	    // clear state from _prepareUserArgs
	    this._name = this._savedState._name;
	    this._scriptPath = null;
	    this.rawArgs = [];
	    // clear state from setOptionValueWithSource
	    this._optionValues = { ...this._savedState._optionValues };
	    this._optionValueSources = { ...this._savedState._optionValueSources };
	    // clear state from _parseCommand
	    this.args = [];
	    // clear state from _processArguments
	    this.processedArgs = [];
	  }

	  /**
	   * Throw if expected executable is missing. Add lots of help for author.
	   *
	   * @param {string} executableFile
	   * @param {string} executableDir
	   * @param {string} subcommandName
	   */
	  _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
	    if (fs.existsSync(executableFile)) return;

	    const executableDirMessage = executableDir
	      ? `searched for local subcommand relative to directory '${executableDir}'`
	      : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
	    const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
	    throw new Error(executableMissing);
	  }

	  /**
	   * Execute a sub-command executable.
	   *
	   * @private
	   */

	  _executeSubCommand(subcommand, args) {
	    args = args.slice();
	    let launchWithNode = false; // Use node for source targets so do not need to get permissions correct, and on Windows.
	    const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];

	    function findFile(baseDir, baseName) {
	      // Look for specified file
	      const localBin = path.resolve(baseDir, baseName);
	      if (fs.existsSync(localBin)) return localBin;

	      // Stop looking if candidate already has an expected extension.
	      if (sourceExt.includes(path.extname(baseName))) return undefined;

	      // Try all the extensions.
	      const foundExt = sourceExt.find((ext) =>
	        fs.existsSync(`${localBin}${ext}`),
	      );
	      if (foundExt) return `${localBin}${foundExt}`;

	      return undefined;
	    }

	    // Not checking for help first. Unlikely to have mandatory and executable, and can't robustly test for help flags in external command.
	    this._checkForMissingMandatoryOptions();
	    this._checkForConflictingOptions();

	    // executableFile and executableDir might be full path, or just a name
	    let executableFile =
	      subcommand._executableFile || `${this._name}-${subcommand._name}`;
	    let executableDir = this._executableDir || '';
	    if (this._scriptPath) {
	      let resolvedScriptPath; // resolve possible symlink for installed npm binary
	      try {
	        resolvedScriptPath = fs.realpathSync(this._scriptPath);
	      } catch {
	        resolvedScriptPath = this._scriptPath;
	      }
	      executableDir = path.resolve(
	        path.dirname(resolvedScriptPath),
	        executableDir,
	      );
	    }

	    // Look for a local file in preference to a command in PATH.
	    if (executableDir) {
	      let localFile = findFile(executableDir, executableFile);

	      // Legacy search using prefix of script name instead of command name
	      if (!localFile && !subcommand._executableFile && this._scriptPath) {
	        const legacyName = path.basename(
	          this._scriptPath,
	          path.extname(this._scriptPath),
	        );
	        if (legacyName !== this._name) {
	          localFile = findFile(
	            executableDir,
	            `${legacyName}-${subcommand._name}`,
	          );
	        }
	      }
	      executableFile = localFile || executableFile;
	    }

	    launchWithNode = sourceExt.includes(path.extname(executableFile));

	    let proc;
	    if (process.platform !== 'win32') {
	      if (launchWithNode) {
	        args.unshift(executableFile);
	        // add executable arguments to spawn
	        args = incrementNodeInspectorPort(process.execArgv).concat(args);

	        proc = childProcess.spawn(process.argv[0], args, { stdio: 'inherit' });
	      } else {
	        proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
	      }
	    } else {
	      this._checkForMissingExecutable(
	        executableFile,
	        executableDir,
	        subcommand._name,
	      );
	      args.unshift(executableFile);
	      // add executable arguments to spawn
	      args = incrementNodeInspectorPort(process.execArgv).concat(args);
	      proc = childProcess.spawn(process.execPath, args, { stdio: 'inherit' });
	    }

	    if (!proc.killed) {
	      // testing mainly to avoid leak warnings during unit tests with mocked spawn
	      const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
	      signals.forEach((signal) => {
	        process.on(signal, () => {
	          if (proc.killed === false && proc.exitCode === null) {
	            // @ts-ignore because signals not typed to known strings
	            proc.kill(signal);
	          }
	        });
	      });
	    }

	    // By default terminate process when spawned process terminates.
	    const exitCallback = this._exitCallback;
	    proc.on('close', (code) => {
	      code = code ?? 1; // code is null if spawned process terminated due to a signal
	      if (!exitCallback) {
	        process.exit(code);
	      } else {
	        exitCallback(
	          new CommanderError(
	            code,
	            'commander.executeSubCommandAsync',
	            '(close)',
	          ),
	        );
	      }
	    });
	    proc.on('error', (err) => {
	      // @ts-ignore: because err.code is an unknown property
	      if (err.code === 'ENOENT') {
	        this._checkForMissingExecutable(
	          executableFile,
	          executableDir,
	          subcommand._name,
	        );
	        // @ts-ignore: because err.code is an unknown property
	      } else if (err.code === 'EACCES') {
	        throw new Error(`'${executableFile}' not executable`);
	      }
	      if (!exitCallback) {
	        process.exit(1);
	      } else {
	        const wrappedError = new CommanderError(
	          1,
	          'commander.executeSubCommandAsync',
	          '(error)',
	        );
	        wrappedError.nestedError = err;
	        exitCallback(wrappedError);
	      }
	    });

	    // Store the reference to the child process
	    this.runningCommand = proc;
	  }

	  /**
	   * @private
	   */

	  _dispatchSubcommand(commandName, operands, unknown) {
	    const subCommand = this._findCommand(commandName);
	    if (!subCommand) this.help({ error: true });

	    subCommand._prepareForParse();
	    let promiseChain;
	    promiseChain = this._chainOrCallSubCommandHook(
	      promiseChain,
	      subCommand,
	      'preSubcommand',
	    );
	    promiseChain = this._chainOrCall(promiseChain, () => {
	      if (subCommand._executableHandler) {
	        this._executeSubCommand(subCommand, operands.concat(unknown));
	      } else {
	        return subCommand._parseCommand(operands, unknown);
	      }
	    });
	    return promiseChain;
	  }

	  /**
	   * Invoke help directly if possible, or dispatch if necessary.
	   * e.g. help foo
	   *
	   * @private
	   */

	  _dispatchHelpCommand(subcommandName) {
	    if (!subcommandName) {
	      this.help();
	    }
	    const subCommand = this._findCommand(subcommandName);
	    if (subCommand && !subCommand._executableHandler) {
	      subCommand.help();
	    }

	    // Fallback to parsing the help flag to invoke the help.
	    return this._dispatchSubcommand(
	      subcommandName,
	      [],
	      [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? '--help'],
	    );
	  }

	  /**
	   * Check this.args against expected this.registeredArguments.
	   *
	   * @private
	   */

	  _checkNumberOfArguments() {
	    // too few
	    this.registeredArguments.forEach((arg, i) => {
	      if (arg.required && this.args[i] == null) {
	        this.missingArgument(arg.name());
	      }
	    });
	    // too many
	    if (
	      this.registeredArguments.length > 0 &&
	      this.registeredArguments[this.registeredArguments.length - 1].variadic
	    ) {
	      return;
	    }
	    if (this.args.length > this.registeredArguments.length) {
	      this._excessArguments(this.args);
	    }
	  }

	  /**
	   * Process this.args using this.registeredArguments and save as this.processedArgs!
	   *
	   * @private
	   */

	  _processArguments() {
	    const myParseArg = (argument, value, previous) => {
	      // Extra processing for nice error message on parsing failure.
	      let parsedValue = value;
	      if (value !== null && argument.parseArg) {
	        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
	        parsedValue = this._callParseArg(
	          argument,
	          value,
	          previous,
	          invalidValueMessage,
	        );
	      }
	      return parsedValue;
	    };

	    this._checkNumberOfArguments();

	    const processedArgs = [];
	    this.registeredArguments.forEach((declaredArg, index) => {
	      let value = declaredArg.defaultValue;
	      if (declaredArg.variadic) {
	        // Collect together remaining arguments for passing together as an array.
	        if (index < this.args.length) {
	          value = this.args.slice(index);
	          if (declaredArg.parseArg) {
	            value = value.reduce((processed, v) => {
	              return myParseArg(declaredArg, v, processed);
	            }, declaredArg.defaultValue);
	          }
	        } else if (value === undefined) {
	          value = [];
	        }
	      } else if (index < this.args.length) {
	        value = this.args[index];
	        if (declaredArg.parseArg) {
	          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
	        }
	      }
	      processedArgs[index] = value;
	    });
	    this.processedArgs = processedArgs;
	  }

	  /**
	   * Once we have a promise we chain, but call synchronously until then.
	   *
	   * @param {(Promise|undefined)} promise
	   * @param {Function} fn
	   * @return {(Promise|undefined)}
	   * @private
	   */

	  _chainOrCall(promise, fn) {
	    // thenable
	    if (promise?.then && typeof promise.then === 'function') {
	      // already have a promise, chain callback
	      return promise.then(() => fn());
	    }
	    // callback might return a promise
	    return fn();
	  }

	  /**
	   *
	   * @param {(Promise|undefined)} promise
	   * @param {string} event
	   * @return {(Promise|undefined)}
	   * @private
	   */

	  _chainOrCallHooks(promise, event) {
	    let result = promise;
	    const hooks = [];
	    this._getCommandAndAncestors()
	      .reverse()
	      .filter((cmd) => cmd._lifeCycleHooks[event] !== undefined)
	      .forEach((hookedCommand) => {
	        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
	          hooks.push({ hookedCommand, callback });
	        });
	      });
	    if (event === 'postAction') {
	      hooks.reverse();
	    }

	    hooks.forEach((hookDetail) => {
	      result = this._chainOrCall(result, () => {
	        return hookDetail.callback(hookDetail.hookedCommand, this);
	      });
	    });
	    return result;
	  }

	  /**
	   *
	   * @param {(Promise|undefined)} promise
	   * @param {Command} subCommand
	   * @param {string} event
	   * @return {(Promise|undefined)}
	   * @private
	   */

	  _chainOrCallSubCommandHook(promise, subCommand, event) {
	    let result = promise;
	    if (this._lifeCycleHooks[event] !== undefined) {
	      this._lifeCycleHooks[event].forEach((hook) => {
	        result = this._chainOrCall(result, () => {
	          return hook(this, subCommand);
	        });
	      });
	    }
	    return result;
	  }

	  /**
	   * Process arguments in context of this command.
	   * Returns action result, in case it is a promise.
	   *
	   * @private
	   */

	  _parseCommand(operands, unknown) {
	    const parsed = this.parseOptions(unknown);
	    this._parseOptionsEnv(); // after cli, so parseArg not called on both cli and env
	    this._parseOptionsImplied();
	    operands = operands.concat(parsed.operands);
	    unknown = parsed.unknown;
	    this.args = operands.concat(unknown);

	    if (operands && this._findCommand(operands[0])) {
	      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
	    }
	    if (
	      this._getHelpCommand() &&
	      operands[0] === this._getHelpCommand().name()
	    ) {
	      return this._dispatchHelpCommand(operands[1]);
	    }
	    if (this._defaultCommandName) {
	      this._outputHelpIfRequested(unknown); // Run the help for default command from parent rather than passing to default command
	      return this._dispatchSubcommand(
	        this._defaultCommandName,
	        operands,
	        unknown,
	      );
	    }
	    if (
	      this.commands.length &&
	      this.args.length === 0 &&
	      !this._actionHandler &&
	      !this._defaultCommandName
	    ) {
	      // probably missing subcommand and no handler, user needs help (and exit)
	      this.help({ error: true });
	    }

	    this._outputHelpIfRequested(parsed.unknown);
	    this._checkForMissingMandatoryOptions();
	    this._checkForConflictingOptions();

	    // We do not always call this check to avoid masking a "better" error, like unknown command.
	    const checkForUnknownOptions = () => {
	      if (parsed.unknown.length > 0) {
	        this.unknownOption(parsed.unknown[0]);
	      }
	    };

	    const commandEvent = `command:${this.name()}`;
	    if (this._actionHandler) {
	      checkForUnknownOptions();
	      this._processArguments();

	      let promiseChain;
	      promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
	      promiseChain = this._chainOrCall(promiseChain, () =>
	        this._actionHandler(this.processedArgs),
	      );
	      if (this.parent) {
	        promiseChain = this._chainOrCall(promiseChain, () => {
	          this.parent.emit(commandEvent, operands, unknown); // legacy
	        });
	      }
	      promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
	      return promiseChain;
	    }
	    if (this.parent?.listenerCount(commandEvent)) {
	      checkForUnknownOptions();
	      this._processArguments();
	      this.parent.emit(commandEvent, operands, unknown); // legacy
	    } else if (operands.length) {
	      if (this._findCommand('*')) {
	        // legacy default command
	        return this._dispatchSubcommand('*', operands, unknown);
	      }
	      if (this.listenerCount('command:*')) {
	        // skip option check, emit event for possible misspelling suggestion
	        this.emit('command:*', operands, unknown);
	      } else if (this.commands.length) {
	        this.unknownCommand();
	      } else {
	        checkForUnknownOptions();
	        this._processArguments();
	      }
	    } else if (this.commands.length) {
	      checkForUnknownOptions();
	      // This command has subcommands and nothing hooked up at this level, so display help (and exit).
	      this.help({ error: true });
	    } else {
	      checkForUnknownOptions();
	      this._processArguments();
	      // fall through for caller to handle after calling .parse()
	    }
	  }

	  /**
	   * Find matching command.
	   *
	   * @private
	   * @return {Command | undefined}
	   */
	  _findCommand(name) {
	    if (!name) return undefined;
	    return this.commands.find(
	      (cmd) => cmd._name === name || cmd._aliases.includes(name),
	    );
	  }

	  /**
	   * Return an option matching `arg` if any.
	   *
	   * @param {string} arg
	   * @return {Option}
	   * @package
	   */

	  _findOption(arg) {
	    return this.options.find((option) => option.is(arg));
	  }

	  /**
	   * Display an error message if a mandatory option does not have a value.
	   * Called after checking for help flags in leaf subcommand.
	   *
	   * @private
	   */

	  _checkForMissingMandatoryOptions() {
	    // Walk up hierarchy so can call in subcommand after checking for displaying help.
	    this._getCommandAndAncestors().forEach((cmd) => {
	      cmd.options.forEach((anOption) => {
	        if (
	          anOption.mandatory &&
	          cmd.getOptionValue(anOption.attributeName()) === undefined
	        ) {
	          cmd.missingMandatoryOptionValue(anOption);
	        }
	      });
	    });
	  }

	  /**
	   * Display an error message if conflicting options are used together in this.
	   *
	   * @private
	   */
	  _checkForConflictingLocalOptions() {
	    const definedNonDefaultOptions = this.options.filter((option) => {
	      const optionKey = option.attributeName();
	      if (this.getOptionValue(optionKey) === undefined) {
	        return false;
	      }
	      return this.getOptionValueSource(optionKey) !== 'default';
	    });

	    const optionsWithConflicting = definedNonDefaultOptions.filter(
	      (option) => option.conflictsWith.length > 0,
	    );

	    optionsWithConflicting.forEach((option) => {
	      const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
	        option.conflictsWith.includes(defined.attributeName()),
	      );
	      if (conflictingAndDefined) {
	        this._conflictingOption(option, conflictingAndDefined);
	      }
	    });
	  }

	  /**
	   * Display an error message if conflicting options are used together.
	   * Called after checking for help flags in leaf subcommand.
	   *
	   * @private
	   */
	  _checkForConflictingOptions() {
	    // Walk up hierarchy so can call in subcommand after checking for displaying help.
	    this._getCommandAndAncestors().forEach((cmd) => {
	      cmd._checkForConflictingLocalOptions();
	    });
	  }

	  /**
	   * Parse options from `argv` removing known options,
	   * and return argv split into operands and unknown arguments.
	   *
	   * Side effects: modifies command by storing options. Does not reset state if called again.
	   *
	   * Examples:
	   *
	   *     argv => operands, unknown
	   *     --known kkk op => [op], []
	   *     op --known kkk => [op], []
	   *     sub --unknown uuu op => [sub], [--unknown uuu op]
	   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
	   *
	   * @param {string[]} args
	   * @return {{operands: string[], unknown: string[]}}
	   */

	  parseOptions(args) {
	    const operands = []; // operands, not options or values
	    const unknown = []; // first unknown option and remaining unknown args
	    let dest = operands;

	    function maybeOption(arg) {
	      return arg.length > 1 && arg[0] === '-';
	    }

	    const negativeNumberArg = (arg) => {
	      // return false if not a negative number
	      if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
	      // negative number is ok unless digit used as an option in command hierarchy
	      return !this._getCommandAndAncestors().some((cmd) =>
	        cmd.options
	          .map((opt) => opt.short)
	          .some((short) => /^-\d$/.test(short)),
	      );
	    };

	    // parse options
	    let activeVariadicOption = null;
	    let activeGroup = null; // working through group of short options, like -abc
	    let i = 0;
	    while (i < args.length || activeGroup) {
	      const arg = activeGroup ?? args[i++];
	      activeGroup = null;

	      // literal
	      if (arg === '--') {
	        if (dest === unknown) dest.push(arg);
	        dest.push(...args.slice(i));
	        break;
	      }

	      if (
	        activeVariadicOption &&
	        (!maybeOption(arg) || negativeNumberArg(arg))
	      ) {
	        this.emit(`option:${activeVariadicOption.name()}`, arg);
	        continue;
	      }
	      activeVariadicOption = null;

	      if (maybeOption(arg)) {
	        const option = this._findOption(arg);
	        // recognised option, call listener to assign value with possible custom processing
	        if (option) {
	          if (option.required) {
	            const value = args[i++];
	            if (value === undefined) this.optionMissingArgument(option);
	            this.emit(`option:${option.name()}`, value);
	          } else if (option.optional) {
	            let value = null;
	            // historical behaviour is optional value is following arg unless an option
	            if (
	              i < args.length &&
	              (!maybeOption(args[i]) || negativeNumberArg(args[i]))
	            ) {
	              value = args[i++];
	            }
	            this.emit(`option:${option.name()}`, value);
	          } else {
	            // boolean flag
	            this.emit(`option:${option.name()}`);
	          }
	          activeVariadicOption = option.variadic ? option : null;
	          continue;
	        }
	      }

	      // Look for combo options following single dash, eat first one if known.
	      if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
	        const option = this._findOption(`-${arg[1]}`);
	        if (option) {
	          if (
	            option.required ||
	            (option.optional && this._combineFlagAndOptionalValue)
	          ) {
	            // option with value following in same argument
	            this.emit(`option:${option.name()}`, arg.slice(2));
	          } else {
	            // boolean option
	            this.emit(`option:${option.name()}`);
	            // remove the processed option and keep processing group
	            activeGroup = `-${arg.slice(2)}`;
	          }
	          continue;
	        }
	      }

	      // Look for known long flag with value, like --foo=bar
	      if (/^--[^=]+=/.test(arg)) {
	        const index = arg.indexOf('=');
	        const option = this._findOption(arg.slice(0, index));
	        if (option && (option.required || option.optional)) {
	          this.emit(`option:${option.name()}`, arg.slice(index + 1));
	          continue;
	        }
	      }

	      // Not a recognised option by this command.
	      // Might be a command-argument, or subcommand option, or unknown option, or help command or option.

	      // An unknown option means further arguments also classified as unknown so can be reprocessed by subcommands.
	      // A negative number in a leaf command is not an unknown option.
	      if (
	        dest === operands &&
	        maybeOption(arg) &&
	        !(this.commands.length === 0 && negativeNumberArg(arg))
	      ) {
	        dest = unknown;
	      }

	      // If using positionalOptions, stop processing our options at subcommand.
	      if (
	        (this._enablePositionalOptions || this._passThroughOptions) &&
	        operands.length === 0 &&
	        unknown.length === 0
	      ) {
	        if (this._findCommand(arg)) {
	          operands.push(arg);
	          unknown.push(...args.slice(i));
	          break;
	        } else if (
	          this._getHelpCommand() &&
	          arg === this._getHelpCommand().name()
	        ) {
	          operands.push(arg, ...args.slice(i));
	          break;
	        } else if (this._defaultCommandName) {
	          unknown.push(arg, ...args.slice(i));
	          break;
	        }
	      }

	      // If using passThroughOptions, stop processing options at first command-argument.
	      if (this._passThroughOptions) {
	        dest.push(arg, ...args.slice(i));
	        break;
	      }

	      // add arg
	      dest.push(arg);
	    }

	    return { operands, unknown };
	  }

	  /**
	   * Return an object containing local option values as key-value pairs.
	   *
	   * @return {object}
	   */
	  opts() {
	    if (this._storeOptionsAsProperties) {
	      // Preserve original behaviour so backwards compatible when still using properties
	      const result = {};
	      const len = this.options.length;

	      for (let i = 0; i < len; i++) {
	        const key = this.options[i].attributeName();
	        result[key] =
	          key === this._versionOptionName ? this._version : this[key];
	      }
	      return result;
	    }

	    return this._optionValues;
	  }

	  /**
	   * Return an object containing merged local and global option values as key-value pairs.
	   *
	   * @return {object}
	   */
	  optsWithGlobals() {
	    // globals overwrite locals
	    return this._getCommandAndAncestors().reduce(
	      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
	      {},
	    );
	  }

	  /**
	   * Display error message and exit (or call exitOverride).
	   *
	   * @param {string} message
	   * @param {object} [errorOptions]
	   * @param {string} [errorOptions.code] - an id string representing the error
	   * @param {number} [errorOptions.exitCode] - used with process.exit
	   */
	  error(message, errorOptions) {
	    // output handling
	    this._outputConfiguration.outputError(
	      `${message}\n`,
	      this._outputConfiguration.writeErr,
	    );
	    if (typeof this._showHelpAfterError === 'string') {
	      this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
	    } else if (this._showHelpAfterError) {
	      this._outputConfiguration.writeErr('\n');
	      this.outputHelp({ error: true });
	    }

	    // exit handling
	    const config = errorOptions || {};
	    const exitCode = config.exitCode || 1;
	    const code = config.code || 'commander.error';
	    this._exit(exitCode, code, message);
	  }

	  /**
	   * Apply any option related environment variables, if option does
	   * not have a value from cli or client code.
	   *
	   * @private
	   */
	  _parseOptionsEnv() {
	    this.options.forEach((option) => {
	      if (option.envVar && option.envVar in process.env) {
	        const optionKey = option.attributeName();
	        // Priority check. Do not overwrite cli or options from unknown source (client-code).
	        if (
	          this.getOptionValue(optionKey) === undefined ||
	          ['default', 'config', 'env'].includes(
	            this.getOptionValueSource(optionKey),
	          )
	        ) {
	          if (option.required || option.optional) {
	            // option can take a value
	            // keep very simple, optional always takes value
	            this.emit(`optionEnv:${option.name()}`, process.env[option.envVar]);
	          } else {
	            // boolean
	            // keep very simple, only care that envVar defined and not the value
	            this.emit(`optionEnv:${option.name()}`);
	          }
	        }
	      }
	    });
	  }

	  /**
	   * Apply any implied option values, if option is undefined or default value.
	   *
	   * @private
	   */
	  _parseOptionsImplied() {
	    const dualHelper = new DualOptions(this.options);
	    const hasCustomOptionValue = (optionKey) => {
	      return (
	        this.getOptionValue(optionKey) !== undefined &&
	        !['default', 'implied'].includes(this.getOptionValueSource(optionKey))
	      );
	    };
	    this.options
	      .filter(
	        (option) =>
	          option.implied !== undefined &&
	          hasCustomOptionValue(option.attributeName()) &&
	          dualHelper.valueFromOption(
	            this.getOptionValue(option.attributeName()),
	            option,
	          ),
	      )
	      .forEach((option) => {
	        Object.keys(option.implied)
	          .filter((impliedKey) => !hasCustomOptionValue(impliedKey))
	          .forEach((impliedKey) => {
	            this.setOptionValueWithSource(
	              impliedKey,
	              option.implied[impliedKey],
	              'implied',
	            );
	          });
	      });
	  }

	  /**
	   * Argument `name` is missing.
	   *
	   * @param {string} name
	   * @private
	   */

	  missingArgument(name) {
	    const message = `error: missing required argument '${name}'`;
	    this.error(message, { code: 'commander.missingArgument' });
	  }

	  /**
	   * `Option` is missing an argument.
	   *
	   * @param {Option} option
	   * @private
	   */

	  optionMissingArgument(option) {
	    const message = `error: option '${option.flags}' argument missing`;
	    this.error(message, { code: 'commander.optionMissingArgument' });
	  }

	  /**
	   * `Option` does not have a value, and is a mandatory option.
	   *
	   * @param {Option} option
	   * @private
	   */

	  missingMandatoryOptionValue(option) {
	    const message = `error: required option '${option.flags}' not specified`;
	    this.error(message, { code: 'commander.missingMandatoryOptionValue' });
	  }

	  /**
	   * `Option` conflicts with another option.
	   *
	   * @param {Option} option
	   * @param {Option} conflictingOption
	   * @private
	   */
	  _conflictingOption(option, conflictingOption) {
	    // The calling code does not know whether a negated option is the source of the
	    // value, so do some work to take an educated guess.
	    const findBestOptionFromValue = (option) => {
	      const optionKey = option.attributeName();
	      const optionValue = this.getOptionValue(optionKey);
	      const negativeOption = this.options.find(
	        (target) => target.negate && optionKey === target.attributeName(),
	      );
	      const positiveOption = this.options.find(
	        (target) => !target.negate && optionKey === target.attributeName(),
	      );
	      if (
	        negativeOption &&
	        ((negativeOption.presetArg === undefined && optionValue === false) ||
	          (negativeOption.presetArg !== undefined &&
	            optionValue === negativeOption.presetArg))
	      ) {
	        return negativeOption;
	      }
	      return positiveOption || option;
	    };

	    const getErrorMessage = (option) => {
	      const bestOption = findBestOptionFromValue(option);
	      const optionKey = bestOption.attributeName();
	      const source = this.getOptionValueSource(optionKey);
	      if (source === 'env') {
	        return `environment variable '${bestOption.envVar}'`;
	      }
	      return `option '${bestOption.flags}'`;
	    };

	    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
	    this.error(message, { code: 'commander.conflictingOption' });
	  }

	  /**
	   * Unknown option `flag`.
	   *
	   * @param {string} flag
	   * @private
	   */

	  unknownOption(flag) {
	    if (this._allowUnknownOption) return;
	    let suggestion = '';

	    if (flag.startsWith('--') && this._showSuggestionAfterError) {
	      // Looping to pick up the global options too
	      let candidateFlags = [];
	      // eslint-disable-next-line @typescript-eslint/no-this-alias
	      let command = this;
	      do {
	        const moreFlags = command
	          .createHelp()
	          .visibleOptions(command)
	          .filter((option) => option.long)
	          .map((option) => option.long);
	        candidateFlags = candidateFlags.concat(moreFlags);
	        command = command.parent;
	      } while (command && !command._enablePositionalOptions);
	      suggestion = suggestSimilar(flag, candidateFlags);
	    }

	    const message = `error: unknown option '${flag}'${suggestion}`;
	    this.error(message, { code: 'commander.unknownOption' });
	  }

	  /**
	   * Excess arguments, more than expected.
	   *
	   * @param {string[]} receivedArgs
	   * @private
	   */

	  _excessArguments(receivedArgs) {
	    if (this._allowExcessArguments) return;

	    const expected = this.registeredArguments.length;
	    const s = expected === 1 ? '' : 's';
	    const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
	    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
	    this.error(message, { code: 'commander.excessArguments' });
	  }

	  /**
	   * Unknown command.
	   *
	   * @private
	   */

	  unknownCommand() {
	    const unknownName = this.args[0];
	    let suggestion = '';

	    if (this._showSuggestionAfterError) {
	      const candidateNames = [];
	      this.createHelp()
	        .visibleCommands(this)
	        .forEach((command) => {
	          candidateNames.push(command.name());
	          // just visible alias
	          if (command.alias()) candidateNames.push(command.alias());
	        });
	      suggestion = suggestSimilar(unknownName, candidateNames);
	    }

	    const message = `error: unknown command '${unknownName}'${suggestion}`;
	    this.error(message, { code: 'commander.unknownCommand' });
	  }

	  /**
	   * Get or set the program version.
	   *
	   * This method auto-registers the "-V, --version" option which will print the version number.
	   *
	   * You can optionally supply the flags and description to override the defaults.
	   *
	   * @param {string} [str]
	   * @param {string} [flags]
	   * @param {string} [description]
	   * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
	   */

	  version(str, flags, description) {
	    if (str === undefined) return this._version;
	    this._version = str;
	    flags = flags || '-V, --version';
	    description = description || 'output the version number';
	    const versionOption = this.createOption(flags, description);
	    this._versionOptionName = versionOption.attributeName();
	    this._registerOption(versionOption);

	    this.on('option:' + versionOption.name(), () => {
	      this._outputConfiguration.writeOut(`${str}\n`);
	      this._exit(0, 'commander.version', str);
	    });
	    return this;
	  }

	  /**
	   * Set the description.
	   *
	   * @param {string} [str]
	   * @param {object} [argsDescription]
	   * @return {(string|Command)}
	   */
	  description(str, argsDescription) {
	    if (str === undefined && argsDescription === undefined)
	      return this._description;
	    this._description = str;
	    if (argsDescription) {
	      this._argsDescription = argsDescription;
	    }
	    return this;
	  }

	  /**
	   * Set the summary. Used when listed as subcommand of parent.
	   *
	   * @param {string} [str]
	   * @return {(string|Command)}
	   */
	  summary(str) {
	    if (str === undefined) return this._summary;
	    this._summary = str;
	    return this;
	  }

	  /**
	   * Set an alias for the command.
	   *
	   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
	   *
	   * @param {string} [alias]
	   * @return {(string|Command)}
	   */

	  alias(alias) {
	    if (alias === undefined) return this._aliases[0]; // just return first, for backwards compatibility

	    /** @type {Command} */
	    // eslint-disable-next-line @typescript-eslint/no-this-alias
	    let command = this;
	    if (
	      this.commands.length !== 0 &&
	      this.commands[this.commands.length - 1]._executableHandler
	    ) {
	      // assume adding alias for last added executable subcommand, rather than this
	      command = this.commands[this.commands.length - 1];
	    }

	    if (alias === command._name)
	      throw new Error("Command alias can't be the same as its name");
	    const matchingCommand = this.parent?._findCommand(alias);
	    if (matchingCommand) {
	      // c.f. _registerCommand
	      const existingCmd = [matchingCommand.name()]
	        .concat(matchingCommand.aliases())
	        .join('|');
	      throw new Error(
	        `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`,
	      );
	    }

	    command._aliases.push(alias);
	    return this;
	  }

	  /**
	   * Set aliases for the command.
	   *
	   * Only the first alias is shown in the auto-generated help.
	   *
	   * @param {string[]} [aliases]
	   * @return {(string[]|Command)}
	   */

	  aliases(aliases) {
	    // Getter for the array of aliases is the main reason for having aliases() in addition to alias().
	    if (aliases === undefined) return this._aliases;

	    aliases.forEach((alias) => this.alias(alias));
	    return this;
	  }

	  /**
	   * Set / get the command usage `str`.
	   *
	   * @param {string} [str]
	   * @return {(string|Command)}
	   */

	  usage(str) {
	    if (str === undefined) {
	      if (this._usage) return this._usage;

	      const args = this.registeredArguments.map((arg) => {
	        return humanReadableArgName(arg);
	      });
	      return []
	        .concat(
	          this.options.length || this._helpOption !== null ? '[options]' : [],
	          this.commands.length ? '[command]' : [],
	          this.registeredArguments.length ? args : [],
	        )
	        .join(' ');
	    }

	    this._usage = str;
	    return this;
	  }

	  /**
	   * Get or set the name of the command.
	   *
	   * @param {string} [str]
	   * @return {(string|Command)}
	   */

	  name(str) {
	    if (str === undefined) return this._name;
	    this._name = str;
	    return this;
	  }

	  /**
	   * Set/get the help group heading for this subcommand in parent command's help.
	   *
	   * @param {string} [heading]
	   * @return {Command | string}
	   */

	  helpGroup(heading) {
	    if (heading === undefined) return this._helpGroupHeading ?? '';
	    this._helpGroupHeading = heading;
	    return this;
	  }

	  /**
	   * Set/get the default help group heading for subcommands added to this command.
	   * (This does not override a group set directly on the subcommand using .helpGroup().)
	   *
	   * @example
	   * program.commandsGroup('Development Commands:);
	   * program.command('watch')...
	   * program.command('lint')...
	   * ...
	   *
	   * @param {string} [heading]
	   * @returns {Command | string}
	   */
	  commandsGroup(heading) {
	    if (heading === undefined) return this._defaultCommandGroup ?? '';
	    this._defaultCommandGroup = heading;
	    return this;
	  }

	  /**
	   * Set/get the default help group heading for options added to this command.
	   * (This does not override a group set directly on the option using .helpGroup().)
	   *
	   * @example
	   * program
	   *   .optionsGroup('Development Options:')
	   *   .option('-d, --debug', 'output extra debugging')
	   *   .option('-p, --profile', 'output profiling information')
	   *
	   * @param {string} [heading]
	   * @returns {Command | string}
	   */
	  optionsGroup(heading) {
	    if (heading === undefined) return this._defaultOptionGroup ?? '';
	    this._defaultOptionGroup = heading;
	    return this;
	  }

	  /**
	   * @param {Option} option
	   * @private
	   */
	  _initOptionGroup(option) {
	    if (this._defaultOptionGroup && !option.helpGroupHeading)
	      option.helpGroup(this._defaultOptionGroup);
	  }

	  /**
	   * @param {Command} cmd
	   * @private
	   */
	  _initCommandGroup(cmd) {
	    if (this._defaultCommandGroup && !cmd.helpGroup())
	      cmd.helpGroup(this._defaultCommandGroup);
	  }

	  /**
	   * Set the name of the command from script filename, such as process.argv[1],
	   * or require.main.filename, or __filename.
	   *
	   * (Used internally and public although not documented in README.)
	   *
	   * @example
	   * program.nameFromFilename(require.main.filename);
	   *
	   * @param {string} filename
	   * @return {Command}
	   */

	  nameFromFilename(filename) {
	    this._name = path.basename(filename, path.extname(filename));

	    return this;
	  }

	  /**
	   * Get or set the directory for searching for executable subcommands of this command.
	   *
	   * @example
	   * program.executableDir(__dirname);
	   * // or
	   * program.executableDir('subcommands');
	   *
	   * @param {string} [path]
	   * @return {(string|null|Command)}
	   */

	  executableDir(path) {
	    if (path === undefined) return this._executableDir;
	    this._executableDir = path;
	    return this;
	  }

	  /**
	   * Return program help documentation.
	   *
	   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
	   * @return {string}
	   */

	  helpInformation(contextOptions) {
	    const helper = this.createHelp();
	    const context = this._getOutputContext(contextOptions);
	    helper.prepareContext({
	      error: context.error,
	      helpWidth: context.helpWidth,
	      outputHasColors: context.hasColors,
	    });
	    const text = helper.formatHelp(this, helper);
	    if (context.hasColors) return text;
	    return this._outputConfiguration.stripColor(text);
	  }

	  /**
	   * @typedef HelpContext
	   * @type {object}
	   * @property {boolean} error
	   * @property {number} helpWidth
	   * @property {boolean} hasColors
	   * @property {function} write - includes stripColor if needed
	   *
	   * @returns {HelpContext}
	   * @private
	   */

	  _getOutputContext(contextOptions) {
	    contextOptions = contextOptions || {};
	    const error = !!contextOptions.error;
	    let baseWrite;
	    let hasColors;
	    let helpWidth;
	    if (error) {
	      baseWrite = (str) => this._outputConfiguration.writeErr(str);
	      hasColors = this._outputConfiguration.getErrHasColors();
	      helpWidth = this._outputConfiguration.getErrHelpWidth();
	    } else {
	      baseWrite = (str) => this._outputConfiguration.writeOut(str);
	      hasColors = this._outputConfiguration.getOutHasColors();
	      helpWidth = this._outputConfiguration.getOutHelpWidth();
	    }
	    const write = (str) => {
	      if (!hasColors) str = this._outputConfiguration.stripColor(str);
	      return baseWrite(str);
	    };
	    return { error, write, hasColors, helpWidth };
	  }

	  /**
	   * Output help information for this command.
	   *
	   * Outputs built-in help, and custom text added using `.addHelpText()`.
	   *
	   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
	   */

	  outputHelp(contextOptions) {
	    let deprecatedCallback;
	    if (typeof contextOptions === 'function') {
	      deprecatedCallback = contextOptions;
	      contextOptions = undefined;
	    }

	    const outputContext = this._getOutputContext(contextOptions);
	    /** @type {HelpTextEventContext} */
	    const eventContext = {
	      error: outputContext.error,
	      write: outputContext.write,
	      command: this,
	    };

	    this._getCommandAndAncestors()
	      .reverse()
	      .forEach((command) => command.emit('beforeAllHelp', eventContext));
	    this.emit('beforeHelp', eventContext);

	    let helpInformation = this.helpInformation({ error: outputContext.error });
	    if (deprecatedCallback) {
	      helpInformation = deprecatedCallback(helpInformation);
	      if (
	        typeof helpInformation !== 'string' &&
	        !Buffer.isBuffer(helpInformation)
	      ) {
	        throw new Error('outputHelp callback must return a string or a Buffer');
	      }
	    }
	    outputContext.write(helpInformation);

	    if (this._getHelpOption()?.long) {
	      this.emit(this._getHelpOption().long); // deprecated
	    }
	    this.emit('afterHelp', eventContext);
	    this._getCommandAndAncestors().forEach((command) =>
	      command.emit('afterAllHelp', eventContext),
	    );
	  }

	  /**
	   * You can pass in flags and a description to customise the built-in help option.
	   * Pass in false to disable the built-in help option.
	   *
	   * @example
	   * program.helpOption('-?, --help' 'show help'); // customise
	   * program.helpOption(false); // disable
	   *
	   * @param {(string | boolean)} flags
	   * @param {string} [description]
	   * @return {Command} `this` command for chaining
	   */

	  helpOption(flags, description) {
	    // Support enabling/disabling built-in help option.
	    if (typeof flags === 'boolean') {
	      if (flags) {
	        if (this._helpOption === null) this._helpOption = undefined; // reenable
	        if (this._defaultOptionGroup) {
	          // make the option to store the group
	          this._initOptionGroup(this._getHelpOption());
	        }
	      } else {
	        this._helpOption = null; // disable
	      }
	      return this;
	    }

	    // Customise flags and description.
	    this._helpOption = this.createOption(
	      flags ?? '-h, --help',
	      description ?? 'display help for command',
	    );
	    // init group unless lazy create
	    if (flags || description) this._initOptionGroup(this._helpOption);

	    return this;
	  }

	  /**
	   * Lazy create help option.
	   * Returns null if has been disabled with .helpOption(false).
	   *
	   * @returns {(Option | null)} the help option
	   * @package
	   */
	  _getHelpOption() {
	    // Lazy create help option on demand.
	    if (this._helpOption === undefined) {
	      this.helpOption(undefined, undefined);
	    }
	    return this._helpOption;
	  }

	  /**
	   * Supply your own option to use for the built-in help option.
	   * This is an alternative to using helpOption() to customise the flags and description etc.
	   *
	   * @param {Option} option
	   * @return {Command} `this` command for chaining
	   */
	  addHelpOption(option) {
	    this._helpOption = option;
	    this._initOptionGroup(option);
	    return this;
	  }

	  /**
	   * Output help information and exit.
	   *
	   * Outputs built-in help, and custom text added using `.addHelpText()`.
	   *
	   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
	   */

	  help(contextOptions) {
	    this.outputHelp(contextOptions);
	    let exitCode = Number(process.exitCode ?? 0); // process.exitCode does allow a string or an integer, but we prefer just a number
	    if (
	      exitCode === 0 &&
	      contextOptions &&
	      typeof contextOptions !== 'function' &&
	      contextOptions.error
	    ) {
	      exitCode = 1;
	    }
	    // message: do not have all displayed text available so only passing placeholder.
	    this._exit(exitCode, 'commander.help', '(outputHelp)');
	  }

	  /**
	   * // Do a little typing to coordinate emit and listener for the help text events.
	   * @typedef HelpTextEventContext
	   * @type {object}
	   * @property {boolean} error
	   * @property {Command} command
	   * @property {function} write
	   */

	  /**
	   * Add additional text to be displayed with the built-in help.
	   *
	   * Position is 'before' or 'after' to affect just this command,
	   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
	   *
	   * @param {string} position - before or after built-in help
	   * @param {(string | Function)} text - string to add, or a function returning a string
	   * @return {Command} `this` command for chaining
	   */

	  addHelpText(position, text) {
	    const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
	    if (!allowedValues.includes(position)) {
	      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
	    }

	    const helpEvent = `${position}Help`;
	    this.on(helpEvent, (/** @type {HelpTextEventContext} */ context) => {
	      let helpStr;
	      if (typeof text === 'function') {
	        helpStr = text({ error: context.error, command: context.command });
	      } else {
	        helpStr = text;
	      }
	      // Ignore falsy value when nothing to output.
	      if (helpStr) {
	        context.write(`${helpStr}\n`);
	      }
	    });
	    return this;
	  }

	  /**
	   * Output help information if help flags specified
	   *
	   * @param {Array} args - array of options to search for help flags
	   * @private
	   */

	  _outputHelpIfRequested(args) {
	    const helpOption = this._getHelpOption();
	    const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
	    if (helpRequested) {
	      this.outputHelp();
	      // (Do not have all displayed text available so only passing placeholder.)
	      this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
	    }
	  }
	}

	/**
	 * Scan arguments and increment port number for inspect calls (to avoid conflicts when spawning new command).
	 *
	 * @param {string[]} args - array of arguments from node.execArgv
	 * @returns {string[]}
	 * @private
	 */

	function incrementNodeInspectorPort(args) {
	  // Testing for these options:
	  //  --inspect[=[host:]port]
	  //  --inspect-brk[=[host:]port]
	  //  --inspect-port=[host:]port
	  return args.map((arg) => {
	    if (!arg.startsWith('--inspect')) {
	      return arg;
	    }
	    let debugOption;
	    let debugHost = '127.0.0.1';
	    let debugPort = '9229';
	    let match;
	    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
	      // e.g. --inspect
	      debugOption = match[1];
	    } else if (
	      (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null
	    ) {
	      debugOption = match[1];
	      if (/^\d+$/.test(match[3])) {
	        // e.g. --inspect=1234
	        debugPort = match[3];
	      } else {
	        // e.g. --inspect=localhost
	        debugHost = match[3];
	      }
	    } else if (
	      (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null
	    ) {
	      // e.g. --inspect=localhost:1234
	      debugOption = match[1];
	      debugHost = match[3];
	      debugPort = match[4];
	    }

	    if (debugOption && debugPort !== '0') {
	      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
	    }
	    return arg;
	  });
	}

	/**
	 * @returns {boolean | undefined}
	 * @package
	 */
	function useColor() {
	  // Test for common conventions.
	  // NB: the observed behaviour is in combination with how author adds color! For example:
	  //   - we do not test NODE_DISABLE_COLORS, but util:styletext does
	  //   - we do test NO_COLOR, but Chalk does not
	  //
	  // References:
	  // https://no-color.org
	  // https://bixense.com/clicolors/
	  // https://github.com/nodejs/node/blob/0a00217a5f67ef4a22384cfc80eb6dd9a917fdc1/lib/internal/tty.js#L109
	  // https://github.com/chalk/supports-color/blob/c214314a14bcb174b12b3014b2b0a8de375029ae/index.js#L33
	  // (https://force-color.org recent web page from 2023, does not match major javascript implementations)

	  if (
	    process.env.NO_COLOR ||
	    process.env.FORCE_COLOR === '0' ||
	    process.env.FORCE_COLOR === 'false'
	  )
	    return false;
	  if (process.env.FORCE_COLOR || process.env.CLICOLOR_FORCE !== undefined)
	    return true;
	  return undefined;
	}

	command.Command = Command;
	command.useColor = useColor; // exporting for tests
	return command;
}

var hasRequiredCommander;

function requireCommander () {
	if (hasRequiredCommander) return commander$1;
	hasRequiredCommander = 1;
	const { Argument } = requireArgument();
	const { Command } = requireCommand();
	const { CommanderError, InvalidArgumentError } = requireError();
	const { Help } = requireHelp();
	const { Option } = requireOption();

	commander$1.program = new Command();

	commander$1.createCommand = (name) => new Command(name);
	commander$1.createOption = (flags, description) => new Option(flags, description);
	commander$1.createArgument = (name, description) => new Argument(name, description);

	/**
	 * Expose classes
	 */

	commander$1.Command = Command;
	commander$1.Option = Option;
	commander$1.Argument = Argument;
	commander$1.Help = Help;

	commander$1.CommanderError = CommanderError;
	commander$1.InvalidArgumentError = InvalidArgumentError;
	commander$1.InvalidOptionArgumentError = InvalidArgumentError; // Deprecated
	return commander$1;
}

var commanderExports = requireCommander();
var commander = /*@__PURE__*/getDefaultExportFromCjs(commanderExports);

// wrapper to provide named exports for ESM.
const {
  program: program$1,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError, // deprecated old name
  Command,
  Argument,
  Option,
  Help,
} = commander;

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
 * Collection of nature-themed color palettes
 * Includes palettes inspired by natural elements like forests, gardens, flowers, skies, and more
 * Each palette has light and dark variants for different backgrounds
 */
const naturePalettes = {
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
            weakset: '#FFAAEE',
            date: '#88EEFF',
            regexp: '#FF88FF',
            error: '#FF99AA',
            circularReference: '#D5D5E5',
            propertyKey: '#F5F5FF',
            punctuation: '#E5E5F5'
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

/**
 * Reds Color Range Palette Collection
 *
 * This file contains color palettes that combine reds with other colors across the spectrum.
 * Each palette uses reds more heavily (60-70%) than the secondary color (30-40%).
 * Both light and dark variants are provided for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
const redsColorRangePalettes = {
    redsAndOranges: {
        light: {
            null: '#8A3A3A',
            undefined: '#9A4A4A',
            boolean: '#AA2A2A',
            number: '#CC4422',
            string: '#BB3333',
            symbol: '#AA4433',
            function: '#CC5533',
            object: '#993333',
            array: '#AA3322',
            map: '#BB4422',
            set: '#994422',
            weakmap: '#CC6633',
            weakset: '#883322',
            date: '#BB5533',
            regexp: '#992222',
            error: '#DD2222',
            circularReference: '#7A3A3A',
            propertyKey: '#663333',
            punctuation: '#774444'
        },
        dark: {
            null: '#FFBBBB',
            undefined: '#FFCCCC',
            boolean: '#FF9999',
            number: '#FFAA77',
            string: '#FFAAAA',
            symbol: '#FFBB99',
            function: '#FFCC99',
            object: '#FF8888',
            array: '#FF9977',
            map: '#FFBB88',
            set: '#FFAA66',
            weakmap: '#FFDD99',
            weakset: '#FF7766',
            date: '#FFCC88',
            regexp: '#FF7777',
            error: '#FF6666',
            circularReference: '#EEAAAA',
            propertyKey: '#FFDDDD',
            punctuation: '#FFCCCC'
        }
    },
    redsAndYellows: {
        light: {
            null: '#8A4A3A',
            undefined: '#9A5A4A',
            boolean: '#AA2A1A',
            number: '#BB6622',
            string: '#BB3322',
            symbol: '#AA5533',
            function: '#CC7733',
            object: '#993322',
            array: '#AA3311',
            map: '#BB7744',
            set: '#994411',
            weakmap: '#CC8844',
            weakset: '#883311',
            date: '#BB8833',
            regexp: '#991111',
            error: '#DD1111',
            circularReference: '#7A4A3A',
            propertyKey: '#663322',
            punctuation: '#774433'
        },
        dark: {
            null: '#FFCCAA',
            undefined: '#FFDDBB',
            boolean: '#FF9988',
            number: '#FFDD99',
            string: '#FFAA99',
            symbol: '#FFCC99',
            function: '#FFEE99',
            object: '#FF9988',
            array: '#FF8866',
            map: '#FFDDAA',
            set: '#FF9955',
            weakmap: '#FFFFAA',
            weakset: '#FF7755',
            date: '#FFEEAA',
            regexp: '#FF6666',
            error: '#FF5555',
            circularReference: '#EEBBAA',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDDD'
        }
    },
    redsAndGreens: {
        light: {
            null: '#7A4A3A',
            undefined: '#8A5A4A',
            boolean: '#AA2A2A',
            number: '#CC3333',
            string: '#447733',
            symbol: '#993333',
            function: '#BB3322',
            object: '#994433',
            array: '#AA2211',
            map: '#558844',
            set: '#336633',
            weakmap: '#CC4422',
            weakset: '#882211',
            date: '#669955',
            regexp: '#991111',
            error: '#DD2222',
            circularReference: '#6A4A3A',
            propertyKey: '#664433',
            punctuation: '#775544'
        },
        dark: {
            null: '#EECCBB',
            undefined: '#FFDDCC',
            boolean: '#FF9999',
            number: '#FFAAAA',
            string: '#AADDAA',
            symbol: '#FFAAAA',
            function: '#FFAA88',
            object: '#FFBB99',
            array: '#FF8866',
            map: '#BBEEAA',
            set: '#99DD99',
            weakmap: '#FFBB77',
            weakset: '#FF7755',
            date: '#CCFFAA',
            regexp: '#FF6666',
            error: '#FF7777',
            circularReference: '#DDBBAA',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDDD'
        }
    },
    redsAndBlues: {
        light: {
            null: '#6A3A4A',
            undefined: '#7A4A5A',
            boolean: '#AA2A4A',
            number: '#CC3344',
            string: '#334488',
            symbol: '#992255',
            function: '#BB3355',
            object: '#883366',
            array: '#335599',
            map: '#AA2266',
            set: '#2255AA',
            weakmap: '#CC4466',
            weakset: '#771144',
            date: '#3366CC',
            regexp: '#991144',
            error: '#DD2244',
            circularReference: '#5A3A4A',
            propertyKey: '#553344',
            punctuation: '#664455'
        },
        dark: {
            null: '#EECCDD',
            undefined: '#FFDDEE',
            boolean: '#FF99BB',
            number: '#FFAACC',
            string: '#99BBFF',
            symbol: '#FFAADD',
            function: '#FFAABB',
            object: '#EECCFF',
            array: '#AACCFF',
            map: '#FF99DD',
            set: '#88BBFF',
            weakmap: '#FFBBCC',
            weakset: '#FF88AA',
            date: '#99DDFF',
            regexp: '#FF8899',
            error: '#FF7799',
            circularReference: '#DDBBCC',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    redsAndPurples: {
        light: {
            null: '#7A3A5A',
            undefined: '#8A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3355',
            string: '#662288',
            symbol: '#992266',
            function: '#BB3366',
            object: '#883377',
            array: '#AA2266',
            map: '#662299',
            set: '#772299',
            weakmap: '#CC4477',
            weakset: '#771155',
            date: '#883399',
            regexp: '#991155',
            error: '#DD2255',
            circularReference: '#6A3A5A',
            propertyKey: '#553355',
            punctuation: '#664466'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAACC',
            string: '#CCAAFF',
            symbol: '#FFAAEE',
            function: '#FFAABB',
            object: '#EECCFF',
            array: '#FF99DD',
            map: '#CCAAFF',
            set: '#DDAAFF',
            weakmap: '#FFBBCC',
            weakset: '#FF88BB',
            date: '#EEBBFF',
            regexp: '#FF88BB',
            error: '#FF77AA',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    redsAndBrowns: {
        light: {
            null: '#6A3A2A',
            undefined: '#7A4A3A',
            boolean: '#AA2A1A',
            number: '#CC3322',
            string: '#664422',
            symbol: '#993322',
            function: '#BB3311',
            object: '#775533',
            array: '#AA2200',
            map: '#886644',
            set: '#553311',
            weakmap: '#CC4433',
            weakset: '#882200',
            date: '#997755',
            regexp: '#991100',
            error: '#DD2211',
            circularReference: '#5A3A2A',
            propertyKey: '#553322',
            punctuation: '#664433'
        },
        dark: {
            null: '#EECCBB',
            undefined: '#FFDDCC',
            boolean: '#FF9988',
            number: '#FFAAAA',
            string: '#DDBB99',
            symbol: '#FFAA99',
            function: '#FFAA77',
            object: '#EECCAA',
            array: '#FF8866',
            map: '#FFDDBB',
            set: '#CCAA77',
            weakmap: '#FFBB99',
            weakset: '#FF7755',
            date: '#FFEEBB',
            regexp: '#FF6655',
            error: '#FF7766',
            circularReference: '#DDBBAA',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDCC'
        }
    },
    redsAndGreys: {
        light: {
            null: '#6A3A3A',
            undefined: '#7A4A4A',
            boolean: '#AA2A2A',
            number: '#CC3333',
            string: '#555555',
            symbol: '#993333',
            function: '#BB3333',
            object: '#666666',
            array: '#AA2222',
            map: '#777777',
            set: '#444444',
            weakmap: '#CC4444',
            weakset: '#882222',
            date: '#888888',
            regexp: '#991111',
            error: '#DD2222',
            circularReference: '#5A3A3A',
            propertyKey: '#444444',
            punctuation: '#555555'
        },
        dark: {
            null: '#EECCCC',
            undefined: '#FFDDDD',
            boolean: '#FF9999',
            number: '#FFAAAA',
            string: '#CCCCCC',
            symbol: '#FFAAAA',
            function: '#FFAAAA',
            object: '#DDDDDD',
            array: '#FF8888',
            map: '#EEEEEE',
            set: '#BBBBBB',
            weakmap: '#FFBBBB',
            weakset: '#FF7777',
            date: '#F5F5F5',
            regexp: '#FF6666',
            error: '#FF7777',
            circularReference: '#DDCCCC',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDDD'
        }
    },
    redsAndCharcoals: {
        light: {
            null: '#5A2A2A',
            undefined: '#6A3A3A',
            boolean: '#AA1A1A',
            number: '#CC2222',
            string: '#2A2A2A',
            symbol: '#992222',
            function: '#BB2222',
            object: '#3A3A3A',
            array: '#AA1111',
            map: '#4A4A4A',
            set: '#1A1A1A',
            weakmap: '#CC3333',
            weakset: '#881111',
            date: '#555555',
            regexp: '#990000',
            error: '#DD1111',
            circularReference: '#4A2A2A',
            propertyKey: '#333333',
            punctuation: '#444444'
        },
        dark: {
            null: '#DDBBBB',
            undefined: '#EECCCC',
            boolean: '#FF8888',
            number: '#FF9999',
            string: '#C5C5C5',
            symbol: '#FF9999',
            function: '#FF9999',
            object: '#D5D5D5',
            array: '#FF7777',
            map: '#E5E5E5',
            set: '#B5B5B5',
            weakmap: '#FFAAAA',
            weakset: '#FF6666',
            date: '#EEEEEE',
            regexp: '#FF5555',
            error: '#FF6666',
            circularReference: '#CCBBBB',
            propertyKey: '#FFDDDD',
            punctuation: '#EECCCC'
        }
    },
    redsAndCyans: {
        light: {
            null: '#6A3A4A',
            undefined: '#7A4A5A',
            boolean: '#AA2A3A',
            number: '#CC3344',
            string: '#2A6677',
            symbol: '#992244',
            function: '#BB3344',
            object: '#337788',
            array: '#AA2233',
            map: '#338899',
            set: '#1A5566',
            weakmap: '#CC4455',
            weakset: '#881133',
            date: '#44AABB',
            regexp: '#991122',
            error: '#DD2233',
            circularReference: '#5A3A4A',
            propertyKey: '#553344',
            punctuation: '#664455'
        },
        dark: {
            null: '#EECCDD',
            undefined: '#FFDDEE',
            boolean: '#FF99AA',
            number: '#FFAACC',
            string: '#99EEFF',
            symbol: '#FFAACC',
            function: '#FFAAAA',
            object: '#AAFFFF',
            array: '#FF8899',
            map: '#AAFFFF',
            set: '#77DDEE',
            weakmap: '#FFBBCC',
            weakset: '#FF7788',
            date: '#BBFFFF',
            regexp: '#FF7799',
            error: '#FF7799',
            circularReference: '#DDCCDD',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    redsAndMagentas: {
        light: {
            null: '#7A3A5A',
            undefined: '#8A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3366',
            string: '#882288',
            symbol: '#992266',
            function: '#BB3377',
            object: '#883388',
            array: '#AA2255',
            map: '#772299',
            set: '#662277',
            weakmap: '#CC4488',
            weakset: '#771155',
            date: '#9933AA',
            regexp: '#991166',
            error: '#DD2266',
            circularReference: '#6A3A5A',
            propertyKey: '#553355',
            punctuation: '#664466'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#EEAAFF',
            symbol: '#FFAADD',
            function: '#FFAAEE',
            object: '#FFAAFF',
            array: '#FF99CC',
            map: '#DDAAFF',
            set: '#CCAAEE',
            weakmap: '#FFBBEE',
            weakset: '#FF88BB',
            date: '#FFAAFF',
            regexp: '#FF88CC',
            error: '#FF77AA',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    redsAndLightGrays: {
        light: {
            null: '#7A4A4A',
            undefined: '#8A5A5A',
            boolean: '#AA3A3A',
            number: '#CC4444',
            string: '#6A6A6A',
            symbol: '#994444',
            function: '#BB4444',
            object: '#7A7A7A',
            array: '#AA3333',
            map: '#8A8A8A',
            set: '#5A5A5A',
            weakmap: '#CC5555',
            weakset: '#883333',
            date: '#9A9A9A',
            regexp: '#992222',
            error: '#DD3333',
            circularReference: '#6A4A4A',
            propertyKey: '#555555',
            punctuation: '#666666'
        },
        dark: {
            null: '#FFDDDD',
            undefined: '#FFEEEE',
            boolean: '#FFAAAA',
            number: '#FFBBBB',
            string: '#E5E5E5',
            symbol: '#FFBBBB',
            function: '#FFBBBB',
            object: '#F5F5F5',
            array: '#FF9999',
            map: '#FFFFFF',
            set: '#D5D5D5',
            weakmap: '#FFCCCC',
            weakset: '#FF8888',
            date: '#FFFFFF',
            regexp: '#FF7777',
            error: '#FF8888',
            circularReference: '#EEDDDD',
            propertyKey: '#FFFFFF',
            punctuation: '#FFEEEE'
        }
    }
};

/**
 * Oranges Color Range Palette Collection
 *
 * This file contains color palettes that combine orange as the primary color (60-70%)
 * with various secondary colors (30-40%). Each palette includes both light and dark variants
 * to ensure optimal visibility on different backgrounds.
 *
 * The collection includes 11 palettes combining oranges with:
 * - Reds, Yellows, Greens, Blues, Purples, Browns, Greys, Charcoals, Cyans, Magentas, and Light Grays
 */
const orangesColorRangePalettes = {
    orangesAndReds: {
        light: {
            null: '#8A4A2A',
            undefined: '#9A5A3A',
            boolean: '#CC5500',
            number: '#AA2200',
            string: '#DD7722',
            symbol: '#BB3311',
            function: '#EE8833',
            object: '#CC4411',
            array: '#DD6611',
            map: '#BB6633',
            set: '#CC7744',
            weakmap: '#AA5522',
            weakset: '#992200',
            date: '#EE9944',
            regexp: '#BB4422',
            error: '#CC2200',
            circularReference: '#8A4A2A',
            propertyKey: '#6A3A1A',
            punctuation: '#7A4A2A'
        },
        dark: {
            null: '#FFBB88',
            undefined: '#FFCC99',
            boolean: '#FFAA55',
            number: '#FF7744',
            string: '#FFDD99',
            symbol: '#FF8855',
            function: '#FFEEAA',
            object: '#FF9966',
            array: '#FFCC77',
            map: '#FFDDAA',
            set: '#FFEEBB',
            weakmap: '#FFBB77',
            weakset: '#FF6633',
            date: '#FFFFCC',
            regexp: '#FFAA66',
            error: '#FF5533',
            circularReference: '#FFBB88',
            propertyKey: '#FFF5DD',
            punctuation: '#FFDDAA'
        }
    },
    orangesAndYellows: {
        light: {
            null: '#8A6A2A',
            undefined: '#9A7A3A',
            boolean: '#CC8800',
            number: '#CCAA00',
            string: '#DD7700',
            symbol: '#AA8800',
            function: '#EEAA11',
            object: '#BB7700',
            array: '#DD9911',
            map: '#CC9922',
            set: '#EEAA22',
            weakmap: '#BB8811',
            weakset: '#AA7700',
            date: '#FFBB33',
            regexp: '#CC8811',
            error: '#BB6600',
            circularReference: '#8A6A2A',
            propertyKey: '#6A4A1A',
            punctuation: '#7A5A2A'
        },
        dark: {
            null: '#FFCC88',
            undefined: '#FFDD99',
            boolean: '#FFBB66',
            number: '#FFEE77',
            string: '#FFAA55',
            symbol: '#FFCC66',
            function: '#FFFF99',
            object: '#FFBB55',
            array: '#FFDD88',
            map: '#FFEE99',
            set: '#FFFFAA',
            weakmap: '#FFCC77',
            weakset: '#FFAA44',
            date: '#FFFFBB',
            regexp: '#FFBB66',
            error: '#FFAA33',
            circularReference: '#FFCC88',
            propertyKey: '#FFF5DD',
            punctuation: '#FFEEBB'
        }
    },
    orangesAndGreens: {
        light: {
            null: '#6A5A3A',
            undefined: '#7A6A4A',
            boolean: '#CC6600',
            number: '#448822',
            string: '#DD7711',
            symbol: '#558833',
            function: '#EE8822',
            object: '#669944',
            array: '#DD9933',
            map: '#77AA55',
            set: '#CC7722',
            weakmap: '#88BB66',
            weakset: '#556633',
            date: '#EEAA44',
            regexp: '#669944',
            error: '#CC5500',
            circularReference: '#6A5A3A',
            propertyKey: '#4A3A2A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#DDCC99',
            undefined: '#EEDDAA',
            boolean: '#FFAA44',
            number: '#99DD77',
            string: '#FFBB55',
            symbol: '#AAEE88',
            function: '#FFCC66',
            object: '#BBFF99',
            array: '#FFDD88',
            map: '#CCFFAA',
            set: '#FFCC77',
            weakmap: '#DDFFBB',
            weakset: '#AABB88',
            date: '#FFEEAA',
            regexp: '#BBFF99',
            error: '#FFAA33',
            circularReference: '#DDCC99',
            propertyKey: '#FFF5DD',
            punctuation: '#EEDDAA'
        }
    },
    orangesAndBlues: {
        light: {
            null: '#5A4A5A',
            undefined: '#6A5A6A',
            boolean: '#CC6600',
            number: '#3366AA',
            string: '#DD7711',
            symbol: '#4477BB',
            function: '#EE8822',
            object: '#5588CC',
            array: '#DD9933',
            map: '#6699DD',
            set: '#CC7722',
            weakmap: '#77AAEE',
            weakset: '#4466AA',
            date: '#EEAA44',
            regexp: '#5577BB',
            error: '#CC5500',
            circularReference: '#5A4A5A',
            propertyKey: '#3A2A3A',
            punctuation: '#4A3A4A'
        },
        dark: {
            null: '#DDCCCC',
            undefined: '#EEDDDD',
            boolean: '#FFAA44',
            number: '#88BBFF',
            string: '#FFBB55',
            symbol: '#99CCFF',
            function: '#FFCC66',
            object: '#AADDFF',
            array: '#FFDD88',
            map: '#BBEEFF',
            set: '#FFCC77',
            weakmap: '#CCFFFF',
            weakset: '#8899CC',
            date: '#FFEEAA',
            regexp: '#AADDFF',
            error: '#FFAA33',
            circularReference: '#DDCCCC',
            propertyKey: '#FFF5EE',
            punctuation: '#EEDDDD'
        }
    },
    orangesAndPurples: {
        light: {
            null: '#6A4A6A',
            undefined: '#7A5A7A',
            boolean: '#CC6600',
            number: '#7733AA',
            string: '#DD7711',
            symbol: '#8844BB',
            function: '#EE8822',
            object: '#9955CC',
            array: '#DD9933',
            map: '#AA66DD',
            set: '#CC7722',
            weakmap: '#BB77EE',
            weakset: '#6633AA',
            date: '#EEAA44',
            regexp: '#8844BB',
            error: '#CC5500',
            circularReference: '#6A4A6A',
            propertyKey: '#4A2A4A',
            punctuation: '#5A3A5A'
        },
        dark: {
            null: '#EECCDD',
            undefined: '#FFDDEE',
            boolean: '#FFAA44',
            number: '#CC99FF',
            string: '#FFBB55',
            symbol: '#DDAAFF',
            function: '#FFCC66',
            object: '#EEBBFF',
            array: '#FFDD88',
            map: '#FFCCFF',
            set: '#FFCC77',
            weakmap: '#FFDDFF',
            weakset: '#BB99DD',
            date: '#FFEEAA',
            regexp: '#DDAAFF',
            error: '#FFAA33',
            circularReference: '#EECCDD',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    orangesAndBrowns: {
        light: {
            null: '#6A4A2A',
            undefined: '#7A5A3A',
            boolean: '#CC6600',
            number: '#663311',
            string: '#DD7711',
            symbol: '#774422',
            function: '#EE8822',
            object: '#885533',
            array: '#DD9933',
            map: '#996644',
            set: '#CC7722',
            weakmap: '#AA7755',
            weakset: '#554422',
            date: '#EEAA44',
            regexp: '#775533',
            error: '#CC5500',
            circularReference: '#6A4A2A',
            propertyKey: '#4A2A1A',
            punctuation: '#5A3A2A'
        },
        dark: {
            null: '#DDBB99',
            undefined: '#EECCAA',
            boolean: '#FFAA44',
            number: '#CC9977',
            string: '#FFBB55',
            symbol: '#DDAA88',
            function: '#FFCC66',
            object: '#EEBB99',
            array: '#FFDD88',
            map: '#FFCCAA',
            set: '#FFCC77',
            weakmap: '#FFDDBB',
            weakset: '#BBAA88',
            date: '#FFEEAA',
            regexp: '#EEBB99',
            error: '#FFAA33',
            circularReference: '#DDBB99',
            propertyKey: '#FFF5DD',
            punctuation: '#EECCAA'
        }
    },
    orangesAndGreys: {
        light: {
            null: '#6A5A4A',
            undefined: '#7A6A5A',
            boolean: '#CC6600',
            number: '#555555',
            string: '#DD7711',
            symbol: '#666666',
            function: '#EE8822',
            object: '#777777',
            array: '#DD9933',
            map: '#888888',
            set: '#CC7722',
            weakmap: '#999999',
            weakset: '#444444',
            date: '#EEAA44',
            regexp: '#666666',
            error: '#CC5500',
            circularReference: '#6A5A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#DDCCBB',
            undefined: '#EEDDCC',
            boolean: '#FFAA44',
            number: '#BBBBBB',
            string: '#FFBB55',
            symbol: '#CCCCCC',
            function: '#FFCC66',
            object: '#DDDDDD',
            array: '#FFDD88',
            map: '#EEEEEE',
            set: '#FFCC77',
            weakmap: '#F5F5F5',
            weakset: '#AAAAAA',
            date: '#FFEEAA',
            regexp: '#CCCCCC',
            error: '#FFAA33',
            circularReference: '#DDCCBB',
            propertyKey: '#FFFFFF',
            punctuation: '#EEDDCC'
        }
    },
    orangesAndCharcoals: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#CC6600',
            number: '#2A2A2A',
            string: '#DD7711',
            symbol: '#3A3A3A',
            function: '#EE8822',
            object: '#4A4A4A',
            array: '#DD9933',
            map: '#5A5A5A',
            set: '#CC7722',
            weakmap: '#6A6A6A',
            weakset: '#1A1A1A',
            date: '#EEAA44',
            regexp: '#3A3A3A',
            error: '#CC5500',
            circularReference: '#4A3A2A',
            propertyKey: '#2A1A1A',
            punctuation: '#3A2A2A'
        },
        dark: {
            null: '#CCBB99',
            undefined: '#DDCCAA',
            boolean: '#FFAA44',
            number: '#999999',
            string: '#FFBB55',
            symbol: '#AAAAAA',
            function: '#FFCC66',
            object: '#BBBBBB',
            array: '#FFDD88',
            map: '#CCCCCC',
            set: '#FFCC77',
            weakmap: '#DDDDDD',
            weakset: '#888888',
            date: '#FFEEAA',
            regexp: '#AAAAAA',
            error: '#FFAA33',
            circularReference: '#CCBB99',
            propertyKey: '#F5F5F5',
            punctuation: '#DDCCAA'
        }
    },
    orangesAndCyans: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#CC6600',
            number: '#008899',
            string: '#DD7711',
            symbol: '#0099AA',
            function: '#EE8822',
            object: '#00AABB',
            array: '#DD9933',
            map: '#00BBCC',
            set: '#CC7722',
            weakmap: '#00CCDD',
            weakset: '#007788',
            date: '#EEAA44',
            regexp: '#0099AA',
            error: '#CC5500',
            circularReference: '#5A5A5A',
            propertyKey: '#3A3A3A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#DDDDDD',
            undefined: '#EEEEEE',
            boolean: '#FFAA44',
            number: '#66EEFF',
            string: '#FFBB55',
            symbol: '#77FFFF',
            function: '#FFCC66',
            object: '#88FFFF',
            array: '#FFDD88',
            map: '#99FFFF',
            set: '#FFCC77',
            weakmap: '#AAFFFF',
            weakset: '#55DDEE',
            date: '#FFEEAA',
            regexp: '#77FFFF',
            error: '#FFAA33',
            circularReference: '#DDDDDD',
            propertyKey: '#FFFFFF',
            punctuation: '#EEEEEE'
        }
    },
    orangesAndMagentas: {
        light: {
            null: '#6A4A5A',
            undefined: '#7A5A6A',
            boolean: '#CC6600',
            number: '#AA2277',
            string: '#DD7711',
            symbol: '#BB3388',
            function: '#EE8822',
            object: '#CC4499',
            array: '#DD9933',
            map: '#DD55AA',
            set: '#CC7722',
            weakmap: '#EE66BB',
            weakset: '#991166',
            date: '#EEAA44',
            regexp: '#BB3388',
            error: '#CC5500',
            circularReference: '#6A4A5A',
            propertyKey: '#4A2A3A',
            punctuation: '#5A3A4A'
        },
        dark: {
            null: '#EECCDD',
            undefined: '#FFDDEE',
            boolean: '#FFAA44',
            number: '#FF88CC',
            string: '#FFBB55',
            symbol: '#FF99DD',
            function: '#FFCC66',
            object: '#FFAAEE',
            array: '#FFDD88',
            map: '#FFBBFF',
            set: '#FFCC77',
            weakmap: '#FFCCFF',
            weakset: '#EE77BB',
            date: '#FFEEAA',
            regexp: '#FF99DD',
            error: '#FFAA33',
            circularReference: '#EECCDD',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    orangesAndLightGrays: {
        light: {
            null: '#7A6A5A',
            undefined: '#8A7A6A',
            boolean: '#CC6600',
            number: '#999999',
            string: '#DD7711',
            symbol: '#AAAAAA',
            function: '#EE8822',
            object: '#BBBBBB',
            array: '#DD9933',
            map: '#CCCCCC',
            set: '#CC7722',
            weakmap: '#DDDDDD',
            weakset: '#888888',
            date: '#EEAA44',
            regexp: '#AAAAAA',
            error: '#CC5500',
            circularReference: '#7A6A5A',
            propertyKey: '#5A4A3A',
            punctuation: '#6A5A4A'
        },
        dark: {
            null: '#EEDDCC',
            undefined: '#FFEEEE',
            boolean: '#FFAA44',
            number: '#EEEEEE',
            string: '#FFBB55',
            symbol: '#F5F5F5',
            function: '#FFCC66',
            object: '#FFFFFF',
            array: '#FFDD88',
            map: '#FFFFFF',
            set: '#FFCC77',
            weakmap: '#FFFFFF',
            weakset: '#DDDDDD',
            date: '#FFEEAA',
            regexp: '#F5F5F5',
            error: '#FFAA33',
            circularReference: '#EEDDCC',
            propertyKey: '#FFFFFF',
            punctuation: '#FFEEEE'
        }
    }
};

/**
 * Yellows Color Range Palette Collection
 *
 * This file contains color palettes that combine yellows (60-70%) with other colors (30-40%).
 * Each palette includes light and dark variants for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
/**
 * Collection of yellows-based color range palettes
 * Combines yellows heavily with complementary colors
 */
const yellowsColorRangePalettes = {
    /**
     * Yellows and Reds palette
     * Warm palette combining yellows (majority) with reds
     */
    yellowsAndReds: {
        light: {
            null: '#7A6A1A',
            undefined: '#8A7A2A',
            boolean: '#9A7A1A',
            number: '#AA8A2A',
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
            punctuation: '#7A6A2A'
        },
        dark: {
            null: '#FFEE99',
            undefined: '#FFFF88',
            boolean: '#FFEE77',
            number: '#FFDD66',
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
            punctuation: '#FFEE99'
        }
    },
    /**
     * Yellows and Oranges palette
     * Warm palette combining yellows (majority) with oranges
     */
    yellowsAndOranges: {
        light: {
            null: '#8A7A2A',
            undefined: '#9A8A3A',
            boolean: '#AA8A1A',
            number: '#BA9A2A',
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
            punctuation: '#8A7A3A'
        },
        dark: {
            null: '#FFEE88',
            undefined: '#FFFFAA',
            boolean: '#FFEE66',
            number: '#FFDD77',
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
            punctuation: '#FFEE99'
        }
    },
    /**
     * Yellows and Greens palette
     * Natural palette combining yellows (majority) with greens
     */
    yellowsAndGreens: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#8A9A1A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#EEFF77',
            number: '#FFFF99',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Blues palette
     * Contrasting palette combining yellows (majority) with blues
     */
    yellowsAndBlues: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#7A8A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#DDEE99',
            number: '#FFFF99',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Purples palette
     * Vibrant palette combining yellows (majority) with purples
     */
    yellowsAndPurples: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#8A7A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#EEEE99',
            number: '#FFFF99',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Browns palette
     * Earthy palette combining yellows (majority) with browns
     */
    yellowsAndBrowns: {
        light: {
            null: '#8A7A1A',
            undefined: '#9A8A2A',
            boolean: '#9A8A3A',
            number: '#AA9A2A',
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
            punctuation: '#8A7A2A'
        },
        dark: {
            null: '#FFEE88',
            undefined: '#FFFFAA',
            boolean: '#FFEE99',
            number: '#FFEE77',
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
            punctuation: '#FFEE99'
        }
    },
    /**
     * Yellows and Greys palette
     * Neutral palette combining yellows (majority) with greys
     */
    yellowsAndGreys: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#9A9A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#FFFF99',
            number: '#FFFF77',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Charcoals palette
     * High contrast palette combining yellows (majority) with charcoals
     */
    yellowsAndCharcoals: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#9A9A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#FFFF99',
            number: '#FFFF77',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Cyans palette
     * Cool-warm palette combining yellows (majority) with cyans
     */
    yellowsAndCyans: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#8A9A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#EEFF99',
            number: '#FFFF99',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Magentas palette
     * Bold palette combining yellows (majority) with magentas
     */
    yellowsAndMagentas: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#9A8A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#FFEE99',
            number: '#FFFF99',
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
            punctuation: '#FFFF99'
        }
    },
    /**
     * Yellows and Light Grays palette
     * Soft palette combining yellows (majority) with light grays
     */
    yellowsAndLightGrays: {
        light: {
            null: '#8A8A1A',
            undefined: '#9A9A2A',
            boolean: '#9A9A3A',
            number: '#AAAA2A',
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
            punctuation: '#8A8A2A'
        },
        dark: {
            null: '#FFFF88',
            undefined: '#FFFFAA',
            boolean: '#FFFF99',
            number: '#FFFF77',
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
            punctuation: '#FFFF99'
        }
    }
};

/**
 * Greens Color Range Palette Collection
 *
 * This module provides color palettes that combine greens (60-70%) with various other colors (30-40%).
 * Each palette includes both light and dark variants for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
/**
 * Greens and Reds Color Palette
 * Combines predominantly green tones with red accents
 */
const greensAndReds = {
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
    },
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
    }
};
/**
 * Greens and Oranges Color Palette
 * Combines predominantly green tones with orange accents
 */
const greensAndOranges = {
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
    },
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
    }
};
/**
 * Greens and Yellows Color Palette
 * Combines predominantly green tones with yellow accents
 */
const greensAndYellows = {
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
    },
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
    }
};
/**
 * Greens and Blues Color Palette
 * Combines predominantly green tones with blue accents
 */
const greensAndBlues = {
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
    },
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
    }
};
/**
 * Greens and Purples Color Palette
 * Combines predominantly green tones with purple accents
 */
const greensAndPurples = {
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
    },
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
    }
};
/**
 * Greens and Browns Color Palette
 * Combines predominantly green tones with brown accents
 */
const greensAndBrowns = {
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
    },
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
    }
};
/**
 * Greens and Greys Color Palette
 * Combines predominantly green tones with grey accents
 */
const greensAndGreys = {
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
    },
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
    }
};
/**
 * Greens and Charcoals Color Palette
 * Combines predominantly green tones with dark charcoal accents
 */
const greensAndCharcoals = {
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
    },
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
    }
};
/**
 * Greens and Cyans Color Palette
 * Combines predominantly green tones with cyan accents
 */
const greensAndCyans = {
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
    },
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
    }
};
/**
 * Greens and Magentas Color Palette
 * Combines predominantly green tones with magenta accents
 */
const greensAndMagentas = {
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
    },
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
    }
};
/**
 * Greens and Light Grays Color Palette
 * Combines predominantly green tones with light gray accents
 */
const greensAndLightGrays = {
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
    },
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
    }
};
/**
 * Collection of all greens color range palettes
 */
const greensColorRangePalettes = {
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
};

/**
 * Blues color range palette collection
 *
 * This file contains color palettes that combine blues (60-70%) with other colors (30-40%).
 * Each palette includes both light and dark variants for different background themes.
 * Blues dominates to maintain a consistent blue-themed aesthetic while adding accent colors.
 */
const bluesColorRangePalettes = {
    bluesAndReds: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#7A2A3A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#8A3A4A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#7A3A3A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#FF8899',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#FF99AA',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#FF7788',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndOranges: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#AA5A2A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#BB6A3A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#AA6A3A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#FFBB77',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#FFCC88',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#FFAA66',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndYellows: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#9A8A2A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#AA9A3A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#8A7A2A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#FFEE88',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#FFFF99',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#FFDD77',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndGreens: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#2A6A3A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#3A7A4A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#2A5A3A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#88FFAA',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#99FFBB',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#77FF99',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndPurples: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#6A2A7A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#7A3A8A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#5A2A6A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#DD88FF',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#EE99FF',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#CC77EE',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndBrowns: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#6A4A2A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#7A5A3A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#5A3A2A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#DDBB88',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#EECCAA',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#CCAA77',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndGreys: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#4A4A4A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#5A5A5A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#3A3A3A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#CCCCCC',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#DDDDDD',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#BBBBBB',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndCharcoals: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#2A2A2A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#3A3A3A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#1A1A1A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#AAAAAA',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#BBBBBB',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#999999',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndCyans: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#1A6A6A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#2A7A7A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#0A5A5A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#88FFFF',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#99FFFF',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#77FFFF',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndMagentas: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#8A2A6A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#9A3A7A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#7A2A5A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#FF88DD',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#FF99EE',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#EE77CC',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    },
    bluesAndLightGrays: {
        light: {
            null: '#1A3A5A',
            undefined: '#2A4A6A',
            boolean: '#0A4A7A',
            number: '#6A6A6A',
            string: '#1A5A8A',
            symbol: '#2A4A8A',
            function: '#7A7A7A',
            object: '#1A4A6A',
            array: '#0A3A6A',
            map: '#2A5A7A',
            set: '#1A5A7A',
            weakmap: '#3A5A6A',
            weakset: '#2A4A5A',
            date: '#3A6A7A',
            regexp: '#1A4A7A',
            error: '#5A5A5A',
            circularReference: '#1A3A5A',
            propertyKey: '#0A2A4A',
            punctuation: '#2A4A6A'
        },
        dark: {
            null: '#88CCFF',
            undefined: '#99DDFF',
            boolean: '#66DDFF',
            number: '#EEEEEE',
            string: '#88EEFF',
            symbol: '#99EEFF',
            function: '#F5F5F5',
            object: '#88DDFF',
            array: '#77CCFF',
            map: '#99EEFF',
            set: '#88EEFF',
            weakmap: '#AADDEE',
            weakset: '#99CCEE',
            date: '#BBDDFF',
            regexp: '#88DDEE',
            error: '#DDDDDD',
            circularReference: '#88CCFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99DDFF'
        }
    }
};

/**
 * Purples Color Range Palette Collection
 *
 * This module exports color palettes that combine purples with other colors.
 * Each palette uses purples more heavily (60-70%) than the secondary color (30-40%).
 *
 * All palettes include both light and dark variants:
 * - Light variant: Dark colors suitable for light backgrounds
 * - Dark variant: Light colors suitable for dark backgrounds
 *
 * Supported color combinations:
 * - purplesAndReds
 * - purplesAndOranges
 * - purplesAndYellows
 * - purplesAndGreens
 * - purplesAndBlues
 * - purplesAndBrowns
 * - purplesAndGreys
 * - purplesAndCharcoals
 * - purplesAndCyans
 * - purplesAndMagentas
 * - purplesAndLightGrays
 */
const purplesColorRangePalettes = {
    purplesAndReds: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#8A2A3A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#9A3A4A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#AA4A5A',
            weakset: '#9A2A4A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#AA2A3A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#FF99AA',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#FFAACC',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFCCDD',
            weakset: '#FF88AA',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#FF88AA',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndOranges: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#AA5A2A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#CC6A3A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#DD7A4A',
            weakset: '#BB5A2A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#AA4A1A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#FFBB77',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#FFCC88',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFDD99',
            weakset: '#FFAA66',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#FFAA55',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndYellows: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#9A7A2A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#AA8A3A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#BB9A4A',
            weakset: '#AA7A2A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#9A6A1A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#FFEE99',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#FFFFAA',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFFFCC',
            weakset: '#FFDD88',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#FFCC77',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndGreens: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#2A6A3A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#3A7A4A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#4A8A5A',
            weakset: '#2A5A3A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#1A5A2A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#99EEBB',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#AAFFCC',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#BBFFDD',
            weakset: '#88EE99',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#77DD88',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndBlues: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#2A4A7A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#3A5A8A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#4A6A9A',
            weakset: '#2A3A6A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#1A3A6A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#99CCFF',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#AADDFF',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#BBEEFF',
            weakset: '#88BBEE',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#77AADD',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndBrowns: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#6A4A2A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#7A5A3A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#8A6A4A',
            weakset: '#5A3A1A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#5A2A0A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#DDBB88',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#EECCAA',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFDDBB',
            weakset: '#CCAA77',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#BB9966',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndGreys: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#5A5A5A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#6A6A6A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#7A7A7A',
            weakset: '#4A4A4A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#3A3A3A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#CCCCCC',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#DDDDDD',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#EEEEEE',
            weakset: '#BBBBBB',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#AAAAAA',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndCharcoals: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#3A3A3A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#4A4A4A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#5A5A5A',
            weakset: '#2A2A2A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#1A1A1A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#B5B5B5',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#C5C5C5',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#D5D5D5',
            weakset: '#999999',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#888888',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndCyans: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#2A6A6A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#3A7A7A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#4A8A8A',
            weakset: '#2A5A5A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#1A5A5A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#99EEDD',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#AAFFEE',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#BBFFFF',
            weakset: '#88DDDD',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#77CCCC',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndMagentas: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#8A2A6A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#9A3A7A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#AA4A8A',
            weakset: '#8A1A5A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#9A1A6A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#FF99DD',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#FFAAEE',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFCCFF',
            weakset: '#FF88CC',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#FF77DD',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    },
    purplesAndLightGrays: {
        light: {
            null: '#5A3A6A',
            undefined: '#6A4A7A',
            boolean: '#7A4A8A',
            number: '#7A7A7A',
            string: '#6A3A7A',
            symbol: '#7A3A6A',
            function: '#8A8A8A',
            object: '#5A2A5A',
            array: '#8A4A9A',
            map: '#6A4A8A',
            set: '#7A5A9A',
            weakmap: '#9A9A9A',
            weakset: '#6A6A6A',
            date: '#6A3A6A',
            regexp: '#8A3A7A',
            error: '#5A5A5A',
            circularReference: '#5A3A5A',
            propertyKey: '#4A2A4A',
            punctuation: '#6A4A6A'
        },
        dark: {
            null: '#D5C5E5',
            undefined: '#E5D5F5',
            boolean: '#EE99FF',
            number: '#E5E5E5',
            string: '#E5AAFF',
            symbol: '#DD88EE',
            function: '#F5F5F5',
            object: '#CC99DD',
            array: '#EEAAFF',
            map: '#E5CCFF',
            set: '#EECCFF',
            weakmap: '#FFFFFF',
            weakset: '#DDDDDD',
            date: '#D5AADD',
            regexp: '#EECCEE',
            error: '#CCCCCC',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5FF',
            punctuation: '#E5D5E5'
        }
    }
};

/**
 * Browns Color Range Palette Collection
 *
 * This module contains color palettes that combine brown tones with various color ranges.
 * Each palette uses browns heavily (60-70%) combined with a secondary color (30-40%).
 *
 * All palettes include both light and dark variants:
 * - Light variant: Uses darker colors suitable for light backgrounds
 * - Dark variant: Uses lighter colors suitable for dark backgrounds
 *
 * Available palettes:
 * - brownsAndReds: Browns combined with red tones
 * - brownsAndOranges: Browns combined with orange tones
 * - brownsAndYellows: Browns combined with yellow tones
 * - brownsAndGreens: Browns combined with green tones
 * - brownsAndBlues: Browns combined with blue tones
 * - brownsAndPurples: Browns combined with purple tones
 * - brownsAndGreys: Browns combined with grey tones
 * - brownsAndCharcoals: Browns combined with charcoal tones
 * - brownsAndCyans: Browns combined with cyan tones
 * - brownsAndMagentas: Browns combined with magenta tones
 * - brownsAndLightGrays: Browns combined with light gray tones
 */
const brownsColorRangePalettes = {
    brownsAndReds: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#6A2A2A',
            number: '#7A3A2A',
            string: '#5A3A2A',
            symbol: '#6A3A2A',
            function: '#8A4A3A',
            object: '#5A2A2A',
            array: '#7A4A3A',
            map: '#6A4A3A',
            set: '#7A3A3A',
            weakmap: '#8A5A4A',
            weakset: '#6A4A2A',
            date: '#9A5A4A',
            regexp: '#7A5A3A',
            error: '#8A3A2A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#D5C5B5',
            undefined: '#E5D5C5',
            boolean: '#F5A5A5',
            number: '#FFBBAA',
            string: '#E5C5B5',
            symbol: '#F5B5AA',
            function: '#FFDDC5',
            object: '#F5AAAA',
            array: '#FFD5C5',
            map: '#F5D5C5',
            set: '#FFCCBB',
            weakmap: '#FFE5D5',
            weakset: '#F5D5C5',
            date: '#FFEEDD',
            regexp: '#FFE5D5',
            error: '#FFBBAA',
            circularReference: '#D5C5B5',
            propertyKey: '#F5E5D5',
            punctuation: '#E5D5C5'
        }
    },
    brownsAndOranges: {
        light: {
            null: '#4A3A2A',
            undefined: '#5A4A3A',
            boolean: '#7A4A2A',
            number: '#8A5A2A',
            string: '#5A3A2A',
            symbol: '#6A4A2A',
            function: '#9A6A3A',
            object: '#6A3A2A',
            array: '#8A5A3A',
            map: '#7A5A3A',
            set: '#8A6A3A',
            weakmap: '#AA7A4A',
            weakset: '#7A5A3A',
            date: '#BB8A5A',
            regexp: '#8A6A4A',
            error: '#9A5A2A',
            circularReference: '#4A3A2A',
            propertyKey: '#3A2A1A',
            punctuation: '#5A4A3A'
        },
        dark: {
            null: '#D5C5B5',
            undefined: '#E5D5C5',
            boolean: '#FFCC99',
            number: '#FFD5AA',
            string: '#E5C5B5',
            symbol: '#F5CCAA',
            function: '#FFDDBB',
            object: '#F5C5AA',
            array: '#FFD5BB',
            map: '#FFD5B5',
            set: '#FFDDBB',
            weakmap: '#FFEEDD',
            weakset: '#FFD5BB',
            date: '#FFF5DD',
            regexp: '#FFEECC',
            error: '#FFD5AA',
            circularReference: '#D5C5B5',
            propertyKey: '#F5E5D5',
            punctuation: '#E5D5C5'
        }
    },
    brownsAndYellows: {
        light: {
            null: '#4A4A2A',
            undefined: '#5A5A3A',
            boolean: '#7A6A2A',
            number: '#8A7A2A',
            string: '#5A4A2A',
            symbol: '#6A5A2A',
            function: '#9A8A3A',
            object: '#6A5A2A',
            array: '#8A7A3A',
            map: '#7A6A3A',
            set: '#8A8A3A',
            weakmap: '#AA9A4A',
            weakset: '#7A6A3A',
            date: '#BB9A5A',
            regexp: '#8A7A4A',
            error: '#9A7A2A',
            circularReference: '#4A4A2A',
            propertyKey: '#3A3A1A',
            punctuation: '#5A5A3A'
        },
        dark: {
            null: '#D5D5B5',
            undefined: '#E5E5C5',
            boolean: '#FFEEAA',
            number: '#FFEE99',
            string: '#E5D5B5',
            symbol: '#F5EEAA',
            function: '#FFFFBB',
            object: '#F5E5AA',
            array: '#FFFFCC',
            map: '#FFF5BB',
            set: '#FFFFDD',
            weakmap: '#FFFEDD',
            weakset: '#FFF5CC',
            date: '#FFFFEE',
            regexp: '#FFFDD5',
            error: '#FFEEAA',
            circularReference: '#D5D5B5',
            propertyKey: '#F5F5D5',
            punctuation: '#E5E5C5'
        }
    },
    brownsAndGreens: {
        light: {
            null: '#3A4A2A',
            undefined: '#4A5A3A',
            boolean: '#3A5A2A',
            number: '#5A6A3A',
            string: '#2A5A2A',
            symbol: '#4A5A2A',
            function: '#6A7A4A',
            object: '#4A5A2A',
            array: '#5A6A3A',
            map: '#4A6A3A',
            set: '#3A7A3A',
            weakmap: '#7A8A5A',
            weakset: '#5A6A3A',
            date: '#8A9A6A',
            regexp: '#6A7A4A',
            error: '#5A6A2A',
            circularReference: '#3A4A2A',
            propertyKey: '#2A3A1A',
            punctuation: '#4A5A3A'
        },
        dark: {
            null: '#C5D5B5',
            undefined: '#D5E5C5',
            boolean: '#B5E5A5',
            number: '#D5F5C5',
            string: '#A5E5A5',
            symbol: '#C5E5B5',
            function: '#E5FFD5',
            object: '#C5E5B5',
            array: '#D5F5C5',
            map: '#C5F5C5',
            set: '#B5FFBB',
            weakmap: '#EFFFDD',
            weakset: '#D5F5C5',
            date: '#F5FFEE',
            regexp: '#E5FFD5',
            error: '#D5F5B5',
            circularReference: '#C5D5B5',
            propertyKey: '#E5F5D5',
            punctuation: '#D5E5C5'
        }
    },
    brownsAndBlues: {
        light: {
            null: '#3A3A4A',
            undefined: '#4A4A5A',
            boolean: '#2A4A5A',
            number: '#4A5A6A',
            string: '#3A4A5A',
            symbol: '#3A5A6A',
            function: '#5A6A7A',
            object: '#4A4A5A',
            array: '#3A5A6A',
            map: '#4A5A7A',
            set: '#2A6A7A',
            weakmap: '#6A7A8A',
            weakset: '#4A5A6A',
            date: '#7A8A9A',
            regexp: '#5A6A7A',
            error: '#4A5A6A',
            circularReference: '#3A3A4A',
            propertyKey: '#2A2A3A',
            punctuation: '#4A4A5A'
        },
        dark: {
            null: '#C5C5D5',
            undefined: '#D5D5E5',
            boolean: '#A5CCDD',
            number: '#C5DDEE',
            string: '#B5D5E5',
            symbol: '#B5DDEE',
            function: '#D5EEFF',
            object: '#C5D5E5',
            array: '#B5DDEE',
            map: '#C5DDFF',
            set: '#A5EEFF',
            weakmap: '#EEFFFF',
            weakset: '#C5DDEE',
            date: '#F5FFFF',
            regexp: '#D5EEFF',
            error: '#C5DDEE',
            circularReference: '#C5C5D5',
            propertyKey: '#E5E5F5',
            punctuation: '#D5D5E5'
        }
    },
    brownsAndPurples: {
        light: {
            null: '#4A3A4A',
            undefined: '#5A4A5A',
            boolean: '#5A2A5A',
            number: '#6A4A6A',
            string: '#4A3A5A',
            symbol: '#6A3A6A',
            function: '#7A5A7A',
            object: '#5A3A5A',
            array: '#6A4A7A',
            map: '#5A4A6A',
            set: '#7A4A7A',
            weakmap: '#8A6A8A',
            weakset: '#6A4A6A',
            date: '#9A7A9A',
            regexp: '#7A5A7A',
            error: '#7A4A6A',
            circularReference: '#4A3A4A',
            propertyKey: '#3A2A3A',
            punctuation: '#5A4A5A'
        },
        dark: {
            null: '#D5C5D5',
            undefined: '#E5D5E5',
            boolean: '#EEAAEE',
            number: '#F5CCF5',
            string: '#E5C5E5',
            symbol: '#F5BBF5',
            function: '#FFDDFF',
            object: '#EEB5EE',
            array: '#F5CCFF',
            map: '#EEC5EE',
            set: '#FFBBFF',
            weakmap: '#FFEEFF',
            weakset: '#F5CCF5',
            date: '#FFDDFF',
            regexp: '#FFDDFF',
            error: '#FFCCEE',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5F5',
            punctuation: '#E5D5E5'
        }
    },
    brownsAndGreys: {
        light: {
            null: '#4A4A4A',
            undefined: '#5A5A5A',
            boolean: '#3A4A4A',
            number: '#5A5A5A',
            string: '#4A4A4A',
            symbol: '#4A5A5A',
            function: '#6A6A6A',
            object: '#4A4A4A',
            array: '#5A5A5A',
            map: '#5A6A6A',
            set: '#4A6A6A',
            weakmap: '#7A7A7A',
            weakset: '#5A5A5A',
            date: '#8A8A8A',
            regexp: '#6A6A6A',
            error: '#5A5A5A',
            circularReference: '#4A4A4A',
            propertyKey: '#3A3A3A',
            punctuation: '#5A5A5A'
        },
        dark: {
            null: '#D5D5D5',
            undefined: '#E5E5E5',
            boolean: '#C5D5D5',
            number: '#E5E5E5',
            string: '#D5D5D5',
            symbol: '#D5E5E5',
            function: '#F5F5F5',
            object: '#D5D5D5',
            array: '#E5E5E5',
            map: '#E5F5F5',
            set: '#D5F5F5',
            weakmap: '#FFFFFF',
            weakset: '#E5E5E5',
            date: '#FFFFFF',
            regexp: '#F5F5F5',
            error: '#E5E5E5',
            circularReference: '#D5D5D5',
            propertyKey: '#F5F5F5',
            punctuation: '#E5E5E5'
        }
    },
    brownsAndCharcoals: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#2A3A3A',
            number: '#4A4A4A',
            string: '#3A3A3A',
            symbol: '#3A4A4A',
            function: '#5A5A5A',
            object: '#3A3A3A',
            array: '#4A4A4A',
            map: '#4A5A5A',
            set: '#3A5A5A',
            weakmap: '#6A6A6A',
            weakset: '#4A4A4A',
            date: '#7A7A7A',
            regexp: '#5A5A5A',
            error: '#4A4A4A',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#B5C5C5',
            number: '#D5D5D5',
            string: '#C5C5C5',
            symbol: '#C5D5D5',
            function: '#E5E5E5',
            object: '#C5C5C5',
            array: '#D5D5D5',
            map: '#D5E5E5',
            set: '#C5E5E5',
            weakmap: '#F5F5F5',
            weakset: '#D5D5D5',
            date: '#FFFFFF',
            regexp: '#E5E5E5',
            error: '#D5D5D5',
            circularReference: '#C5C5C5',
            propertyKey: '#E5E5E5',
            punctuation: '#D5D5D5'
        }
    },
    brownsAndCyans: {
        light: {
            null: '#3A4A4A',
            undefined: '#4A5A5A',
            boolean: '#2A5A5A',
            number: '#4A6A6A',
            string: '#3A5A5A',
            symbol: '#3A6A6A',
            function: '#5A7A7A',
            object: '#4A5A5A',
            array: '#3A6A6A',
            map: '#4A6A7A',
            set: '#2A7A7A',
            weakmap: '#6A8A8A',
            weakset: '#4A6A6A',
            date: '#7A9A9A',
            regexp: '#5A7A7A',
            error: '#4A6A6A',
            circularReference: '#3A4A4A',
            propertyKey: '#2A3A3A',
            punctuation: '#4A5A5A'
        },
        dark: {
            null: '#C5D5D5',
            undefined: '#D5E5E5',
            boolean: '#A5EEDD',
            number: '#C5F5EE',
            string: '#B5E5DD',
            symbol: '#B5F5EE',
            function: '#D5FFEE',
            object: '#C5E5DD',
            array: '#B5F5EE',
            map: '#C5F5FF',
            set: '#A5FFEE',
            weakmap: '#EFFFFF',
            weakset: '#C5F5EE',
            date: '#F5FFFF',
            regexp: '#D5FFEE',
            error: '#C5F5EE',
            circularReference: '#C5D5D5',
            propertyKey: '#E5F5F5',
            punctuation: '#D5E5E5'
        }
    },
    brownsAndMagentas: {
        light: {
            null: '#4A3A4A',
            undefined: '#5A4A5A',
            boolean: '#6A2A5A',
            number: '#7A4A6A',
            string: '#5A3A5A',
            symbol: '#7A3A6A',
            function: '#8A5A7A',
            object: '#6A3A5A',
            array: '#7A4A6A',
            map: '#6A4A7A',
            set: '#8A3A7A',
            weakmap: '#9A6A8A',
            weakset: '#7A4A6A',
            date: '#AA7A9A',
            regexp: '#8A5A7A',
            error: '#8A4A6A',
            circularReference: '#4A3A4A',
            propertyKey: '#3A2A3A',
            punctuation: '#5A4A5A'
        },
        dark: {
            null: '#D5C5D5',
            undefined: '#E5D5E5',
            boolean: '#FFAADD',
            number: '#FFCCEE',
            string: '#E5C5DD',
            symbol: '#FFBBEE',
            function: '#FFDDEE',
            object: '#F5BBDD',
            array: '#FFCCEE',
            map: '#F5CCFF',
            set: '#FFAAFF',
            weakmap: '#FFEEFF',
            weakset: '#FFCCEE',
            date: '#FFDDF5',
            regexp: '#FFDDEE',
            error: '#FFCCDD',
            circularReference: '#D5C5D5',
            propertyKey: '#F5E5F5',
            punctuation: '#E5D5E5'
        }
    },
    brownsAndLightGrays: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A5A5A',
            number: '#6A6A6A',
            string: '#5A5A5A',
            symbol: '#5A6A6A',
            function: '#7A7A7A',
            object: '#5A5A5A',
            array: '#6A6A6A',
            map: '#6A7A7A',
            set: '#5A7A7A',
            weakmap: '#8A8A8A',
            weakset: '#6A6A6A',
            date: '#9A9A9A',
            regexp: '#7A7A7A',
            error: '#6A6A6A',
            circularReference: '#5A5A5A',
            propertyKey: '#4A4A4A',
            punctuation: '#6A6A6A'
        },
        dark: {
            null: '#E5E5E5',
            undefined: '#F5F5F5',
            boolean: '#D5E5E5',
            number: '#F5F5F5',
            string: '#E5E5E5',
            symbol: '#E5F5F5',
            function: '#FFFFFF',
            object: '#E5E5E5',
            array: '#F5F5F5',
            map: '#F5FFFF',
            set: '#E5FFFF',
            weakmap: '#FFFFFF',
            weakset: '#F5F5F5',
            date: '#FFFFFF',
            regexp: '#FFFFFF',
            error: '#F5F5F5',
            circularReference: '#E5E5E5',
            propertyKey: '#FFFFFF',
            punctuation: '#F5F5F5'
        }
    }
};

/**
 * Greys Color Range Palettes Collection
 *
 * This collection contains 11 color palettes that heavily feature grey tones (60-70%)
 * combined with accent colors from various color ranges (30-40%). Each palette includes
 * both light and dark variants for different background preferences.
 *
 * Palettes included:
 * - greysAndReds: Grey tones with red accents
 * - greysAndOranges: Grey tones with orange accents
 * - greysAndYellows: Grey tones with yellow accents
 * - greysAndGreens: Grey tones with green accents
 * - greysAndBlues: Grey tones with blue accents
 * - greysAndPurples: Grey tones with purple accents
 * - greysAndBrowns: Grey tones with brown accents
 * - greysAndCharcoals: Grey tones with charcoal/darker grey accents
 * - greysAndCyans: Grey tones with cyan accents
 * - greysAndMagentas: Grey tones with magenta accents
 * - greysAndLightGrays: Grey tones with lighter grey accents
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
const greysColorRangePalettes = {
    greysAndReds: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#AA3333',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#BB4444',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#CC5555',
            weakset: '#5A5A5A',
            date: '#AA3333',
            regexp: '#4A4A4A',
            error: '#DD4444',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#FF8888',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#FFAAAA',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFCCCC',
            weakset: '#AAAAAA',
            date: '#FF8888',
            regexp: '#C5C5C5',
            error: '#FFBBBB',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndOranges: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#CC6633',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#DD7744',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#EE8855',
            weakset: '#5A5A5A',
            date: '#CC6633',
            regexp: '#4A4A4A',
            error: '#DD7744',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#FFAA77',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#FFBB88',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFCCAA',
            weakset: '#AAAAAA',
            date: '#FFAA77',
            regexp: '#C5C5C5',
            error: '#FFBB88',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndYellows: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#AA9933',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#BBAA44',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#CCBB55',
            weakset: '#5A5A5A',
            date: '#AA9933',
            regexp: '#4A4A4A',
            error: '#BBAA44',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#FFEE77',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#FFFF88',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFFFAA',
            weakset: '#AAAAAA',
            date: '#FFEE77',
            regexp: '#C5C5C5',
            error: '#FFFF88',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndGreens: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#338833',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#449944',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#55AA55',
            weakset: '#5A5A5A',
            date: '#338833',
            regexp: '#4A4A4A',
            error: '#449944',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#88EE88',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#99FF99',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#AAFFAA',
            weakset: '#AAAAAA',
            date: '#88EE88',
            regexp: '#C5C5C5',
            error: '#99FF99',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndBlues: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#3366AA',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#4477BB',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#5588CC',
            weakset: '#5A5A5A',
            date: '#3366AA',
            regexp: '#4A4A4A',
            error: '#4477BB',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#88AAFF',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#99BBFF',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#AACCFF',
            weakset: '#AAAAAA',
            date: '#88AAFF',
            regexp: '#C5C5C5',
            error: '#99BBFF',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndPurples: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#7733AA',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#8844BB',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#9955CC',
            weakset: '#5A5A5A',
            date: '#7733AA',
            regexp: '#4A4A4A',
            error: '#8844BB',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#CC88FF',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#DD99FF',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#EEAAFF',
            weakset: '#AAAAAA',
            date: '#CC88FF',
            regexp: '#C5C5C5',
            error: '#DD99FF',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndBrowns: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#885533',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#996644',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#AA7755',
            weakset: '#5A5A5A',
            date: '#885533',
            regexp: '#4A4A4A',
            error: '#996644',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#DDAA88',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#EEBB99',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFCCAA',
            weakset: '#AAAAAA',
            date: '#DDAA88',
            regexp: '#C5C5C5',
            error: '#EEBB99',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndCharcoals: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#2A2A2A',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#3A3A3A',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#1A1A1A',
            weakset: '#5A5A5A',
            date: '#2A2A2A',
            regexp: '#4A4A4A',
            error: '#3A3A3A',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#888888',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#999999',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#777777',
            weakset: '#AAAAAA',
            date: '#888888',
            regexp: '#C5C5C5',
            error: '#999999',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndCyans: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#3388AA',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#4499BB',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#55AACC',
            weakset: '#5A5A5A',
            date: '#3388AA',
            regexp: '#4A4A4A',
            error: '#4499BB',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#88EEFF',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#99FFFF',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#AAFFFF',
            weakset: '#AAAAAA',
            date: '#88EEFF',
            regexp: '#C5C5C5',
            error: '#99FFFF',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndMagentas: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#AA3388',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#BB4499',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#CC55AA',
            weakset: '#5A5A5A',
            date: '#AA3388',
            regexp: '#4A4A4A',
            error: '#BB4499',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#FF88EE',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#FF99FF',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFAAFF',
            weakset: '#AAAAAA',
            date: '#FF88EE',
            regexp: '#C5C5C5',
            error: '#FF99FF',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    },
    greysAndLightGrays: {
        light: {
            null: '#5A5A5A',
            undefined: '#6A6A6A',
            boolean: '#4A4A4A',
            number: '#8A8A8A',
            string: '#555555',
            symbol: '#6A6A6A',
            function: '#9A9A9A',
            object: '#5A5A5A',
            array: '#4A4A4A',
            map: '#6A6A6A',
            set: '#555555',
            weakmap: '#AAAAAA',
            weakset: '#5A5A5A',
            date: '#8A8A8A',
            regexp: '#4A4A4A',
            error: '#9A9A9A',
            circularReference: '#6A6A6A',
            propertyKey: '#3A3A3A',
            punctuation: '#555555'
        },
        dark: {
            null: '#AAAAAA',
            undefined: '#BABABA',
            boolean: '#C5C5C5',
            number: '#EEEEEE',
            string: '#B5B5B5',
            symbol: '#BABABA',
            function: '#F5F5F5',
            object: '#AAAAAA',
            array: '#C5C5C5',
            map: '#BABABA',
            set: '#B5B5B5',
            weakmap: '#FFFFFF',
            weakset: '#AAAAAA',
            date: '#EEEEEE',
            regexp: '#C5C5C5',
            error: '#F5F5F5',
            circularReference: '#BABABA',
            propertyKey: '#D5D5D5',
            punctuation: '#B5B5B5'
        }
    }
};

/**
 * Charcoals Color Range Palettes Collection
 *
 * This file contains a collection of color palettes that combine charcoal tones (grays and dark neutrals)
 * with various color ranges. Each palette emphasizes charcoals (60-70%) over the secondary color (30-40%),
 * creating sophisticated, muted color schemes suitable for syntax highlighting.
 *
 * Each palette includes both light and dark variants:
 * - Light variant: Uses darker colors for visibility on light backgrounds
 * - Dark variant: Uses lighter colors for visibility on dark backgrounds
 */
const charcoalsColorRangePalettes = {
    charcoalsAndReds: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#884444',
            string: '#555555',
            symbol: '#775555',
            function: '#994444',
            object: '#2A2A2A',
            array: '#656565',
            map: '#665555',
            set: '#666666',
            weakmap: '#AA5555',
            weakset: '#444444',
            date: '#885555',
            regexp: '#505050',
            error: '#AA4444',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#FFAAAA',
            string: '#CACACA',
            symbol: '#FFBBBB',
            function: '#FF9999',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#FFCCCC',
            set: '#E0E0E0',
            weakmap: '#FFDDDD',
            weakset: '#CCCCCC',
            date: '#FFBBBB',
            regexp: '#D0D0D0',
            error: '#FF8888',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndOranges: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#AA6644',
            string: '#555555',
            symbol: '#996655',
            function: '#BB7744',
            object: '#2A2A2A',
            array: '#656565',
            map: '#886644',
            set: '#666666',
            weakmap: '#CC7755',
            weakset: '#444444',
            date: '#AA7755',
            regexp: '#505050',
            error: '#BB6633',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#FFCC99',
            string: '#CACACA',
            symbol: '#FFDDAA',
            function: '#FFBB88',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#FFDDBB',
            set: '#E0E0E0',
            weakmap: '#FFEEDD',
            weakset: '#CCCCCC',
            date: '#FFDDBB',
            regexp: '#D0D0D0',
            error: '#FFAA77',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndYellows: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#998844',
            string: '#555555',
            symbol: '#887744',
            function: '#AA9944',
            object: '#2A2A2A',
            array: '#656565',
            map: '#998855',
            set: '#666666',
            weakmap: '#BBAA55',
            weakset: '#444444',
            date: '#AA9955',
            regexp: '#505050',
            error: '#AA9944',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#FFEE99',
            string: '#CACACA',
            symbol: '#FFFFAA',
            function: '#FFDD88',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#FFFFBB',
            set: '#E0E0E0',
            weakmap: '#FFFFCC',
            weakset: '#CCCCCC',
            date: '#FFFFBB',
            regexp: '#D0D0D0',
            error: '#FFDD77',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndGreens: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#557744',
            string: '#555555',
            symbol: '#668855',
            function: '#558844',
            object: '#2A2A2A',
            array: '#656565',
            map: '#669955',
            set: '#666666',
            weakmap: '#77AA55',
            weakset: '#444444',
            date: '#669955',
            regexp: '#505050',
            error: '#669944',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#AAFFAA',
            string: '#CACACA',
            symbol: '#BBFFBB',
            function: '#99FF99',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#CCFFCC',
            set: '#E0E0E0',
            weakmap: '#DDFFDD',
            weakset: '#CCCCCC',
            date: '#CCFFBB',
            regexp: '#D0D0D0',
            error: '#BBFF99',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndBlues: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#446688',
            string: '#555555',
            symbol: '#557799',
            function: '#5588AA',
            object: '#2A2A2A',
            array: '#656565',
            map: '#5599BB',
            set: '#666666',
            weakmap: '#66AACC',
            weakset: '#444444',
            date: '#5599AA',
            regexp: '#505050',
            error: '#4477AA',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#99CCFF',
            string: '#CACACA',
            symbol: '#AADDFF',
            function: '#88BBFF',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#BBEEFF',
            set: '#E0E0E0',
            weakmap: '#CCFFFF',
            weakset: '#CCCCCC',
            date: '#BBDDFF',
            regexp: '#D0D0D0',
            error: '#88AAFF',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndPurples: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#775588',
            string: '#555555',
            symbol: '#886699',
            function: '#9966AA',
            object: '#2A2A2A',
            array: '#656565',
            map: '#8877AA',
            set: '#666666',
            weakmap: '#AA77BB',
            weakset: '#444444',
            date: '#9977AA',
            regexp: '#505050',
            error: '#9955AA',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#DDAAFF',
            string: '#CACACA',
            symbol: '#EECCFF',
            function: '#CC99FF',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#EEDDFF',
            set: '#E0E0E0',
            weakmap: '#FFEEFF',
            weakset: '#CCCCCC',
            date: '#DDBBFF',
            regexp: '#D0D0D0',
            error: '#CC88FF',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndBrowns: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#775533',
            string: '#555555',
            symbol: '#886644',
            function: '#996655',
            object: '#2A2A2A',
            array: '#656565',
            map: '#887755',
            set: '#666666',
            weakmap: '#AA8866',
            weakset: '#444444',
            date: '#998866',
            regexp: '#505050',
            error: '#AA7744',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#DDBB99',
            string: '#CACACA',
            symbol: '#EECCAA',
            function: '#FFDDBB',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#EEDDBB',
            set: '#E0E0E0',
            weakmap: '#FFEEDD',
            weakset: '#CCCCCC',
            date: '#FFDDCC',
            regexp: '#D0D0D0',
            error: '#FFCCAA',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndGreys: {
        light: {
            null: '#2A2A2A',
            undefined: '#3A3A3A',
            boolean: '#4A4A4A',
            number: '#5A5A5A',
            string: '#333333',
            symbol: '#4D4D4D',
            function: '#666666',
            object: '#1A1A1A',
            array: '#555555',
            map: '#606060',
            set: '#575757',
            weakmap: '#6A6A6A',
            weakset: '#404040',
            date: '#626262',
            regexp: '#484848',
            error: '#676767',
            circularReference: '#2A2A2A',
            propertyKey: '#1A1A1A',
            punctuation: '#3A3A3A'
        },
        dark: {
            null: '#B5B5B5',
            undefined: '#C5C5C5',
            boolean: '#D5D5D5',
            number: '#E5E5E5',
            string: '#BABABA',
            symbol: '#CFCFCF',
            function: '#F0F0F0',
            object: '#A5A5A5',
            array: '#CCCCCC',
            map: '#DADADA',
            set: '#D8D8D8',
            weakmap: '#F5F5F5',
            weakset: '#C0C0C0',
            date: '#E0E0E0',
            regexp: '#CDCDCD',
            error: '#EFEFEF',
            circularReference: '#B5B5B5',
            propertyKey: '#DDDDDD',
            punctuation: '#C5C5C5'
        }
    },
    charcoalsAndCyans: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#447788',
            string: '#555555',
            symbol: '#558899',
            function: '#5599AA',
            object: '#2A2A2A',
            array: '#656565',
            map: '#55AAAA',
            set: '#666666',
            weakmap: '#66BBBB',
            weakset: '#444444',
            date: '#66AAAA',
            regexp: '#505050',
            error: '#5599AA',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#99EEFF',
            string: '#CACACA',
            symbol: '#AAFFFF',
            function: '#88DDFF',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#CCFFFF',
            set: '#E0E0E0',
            weakmap: '#DDFFFF',
            weakset: '#CCCCCC',
            date: '#BBFFFF',
            regexp: '#D0D0D0',
            error: '#88EEFF',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndMagentas: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#884477',
            string: '#555555',
            symbol: '#995588',
            function: '#AA5599',
            object: '#2A2A2A',
            array: '#656565',
            map: '#AA66AA',
            set: '#666666',
            weakmap: '#BB77BB',
            weakset: '#444444',
            date: '#AA77AA',
            regexp: '#505050',
            error: '#BB5599',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#FFAADD',
            string: '#CACACA',
            symbol: '#FFBBEE',
            function: '#FF99DD',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#FFCCFF',
            set: '#E0E0E0',
            weakmap: '#FFDDFF',
            weakset: '#CCCCCC',
            date: '#FFCCEE',
            regexp: '#D0D0D0',
            error: '#FF88CC',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    },
    charcoalsAndLightGrays: {
        light: {
            null: '#3A3A3A',
            undefined: '#4A4A4A',
            boolean: '#5A5A5A',
            number: '#707070',
            string: '#555555',
            symbol: '#787878',
            function: '#808080',
            object: '#2A2A2A',
            array: '#656565',
            map: '#858585',
            set: '#666666',
            weakmap: '#909090',
            weakset: '#444444',
            date: '#888888',
            regexp: '#505050',
            error: '#7A7A7A',
            circularReference: '#3A3A3A',
            propertyKey: '#2A2A2A',
            punctuation: '#4A4A4A'
        },
        dark: {
            null: '#C5C5C5',
            undefined: '#D5D5D5',
            boolean: '#E5E5E5',
            number: '#F8F8F8',
            string: '#CACACA',
            symbol: '#FDFDFD',
            function: '#FFFFFF',
            object: '#B5B5B5',
            array: '#DFDFDF',
            map: '#FAFAFA',
            set: '#E0E0E0',
            weakmap: '#FFFFFF',
            weakset: '#CCCCCC',
            date: '#F5F5F5',
            regexp: '#D0D0D0',
            error: '#F0F0F0',
            circularReference: '#C5C5C5',
            propertyKey: '#EEEEEE',
            punctuation: '#D5D5D5'
        }
    }
};

/**
 * Cyans Color Range Palette Collection
 *
 * This module contains color palettes that heavily emphasize cyan colors (60-70%)
 * while incorporating complementary colors (30-40%) for variety and visual interest.
 *
 * Each palette includes both light and dark variants:
 * - Light variants use darker colors suitable for light backgrounds
 * - Dark variants use lighter colors suitable for dark backgrounds
 *
 * Available palettes:
 * - cyansAndReds: Cyan-dominant with red accents
 * - cyansAndOranges: Cyan-dominant with orange accents
 * - cyansAndYellows: Cyan-dominant with yellow accents
 * - cyansAndGreens: Cyan-dominant with green accents
 * - cyansAndBlues: Cyan-dominant with blue accents
 * - cyansAndPurples: Cyan-dominant with purple accents
 * - cyansAndBrowns: Cyan-dominant with brown accents
 * - cyansAndGreys: Cyan-dominant with grey accents
 * - cyansAndCharcoals: Cyan-dominant with charcoal accents
 * - cyansAndMagentas: Cyan-dominant with magenta accents
 * - cyansAndLightGrays: Cyan-dominant with light gray accents
 */
const cyansColorRangePalettes = {
    cyansAndReds: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#7A2A2A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#8A3A3A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#9A4A4A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#AA5A5A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#FF9999',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#FFAAAA',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFBBBB',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFCCCC',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndOranges: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#AA5A1A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#BB6A2A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#CC7A3A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#DD8A4A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#FFBB66',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#FFCC77',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFDD88',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFEE99',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndYellows: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#AA9A1A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#BBAA2A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#CCBB3A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#DDCC4A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#FFEE66',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#FFFF77',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFFF88',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFFF99',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndGreens: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#2A7A2A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#3A8A3A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#4A9A4A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#5AAA5A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#99FF99',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#AAFFAA',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#BBFFBB',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#CCFFCC',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndBlues: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#1A2A8A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#2A3A9A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#3A4AAA',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#4A5ABA',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#8899FF',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#99AAFF',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#AABBFF',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#BBCCFF',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndPurples: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#6A2A8A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#7A3A9A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#8A4AAA',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#9A5ABA',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#DD99FF',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#EEAAFF',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFBBFF',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFCCFF',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndBrowns: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#6A4A2A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#7A5A3A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#8A6A4A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#9A7A5A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#DDBB99',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#EECCAA',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFDDBB',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFEECC',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndGreys: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#4A4A4A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#5A5A5A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#6A6A6A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#7A7A7A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#BBBBBB',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#CCCCCC',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#DDDDDD',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#EEEEEE',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndCharcoals: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#2A2A2A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#3A3A3A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#4A4A4A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#5A5A5A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#AAAAAA',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#BBBBBB',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#CCCCCC',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#DDDDDD',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndMagentas: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#8A2A6A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#9A3A7A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#AA4A8A',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#BA5A9A',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#FF99DD',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#FFAAEE',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFBBFF',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFCCFF',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    },
    cyansAndLightGrays: {
        light: {
            null: '#1A4A5A',
            undefined: '#2A5A6A',
            boolean: '#0A5A7A',
            number: '#8A8A8A',
            string: '#1A6A8A',
            symbol: '#2A5A8A',
            function: '#9A9A9A',
            object: '#1A5A7A',
            array: '#0A4A6A',
            map: '#2A6A9A',
            set: '#1A6AAA',
            weakmap: '#AAAAAA',
            weakset: '#3A5A7A',
            date: '#2A7AAA',
            regexp: '#1A5A8A',
            error: '#BABABA',
            circularReference: '#1A4A5A',
            propertyKey: '#0A3A4A',
            punctuation: '#2A5A6A'
        },
        dark: {
            null: '#88DDFF',
            undefined: '#99EEFF',
            boolean: '#66EEFF',
            number: '#EEEEEE',
            string: '#88FFFF',
            symbol: '#99EEFF',
            function: '#F5F5F5',
            object: '#88EEFF',
            array: '#77DDFF',
            map: '#99FFFF',
            set: '#88FFFF',
            weakmap: '#FFFFFF',
            weakset: '#AAEEFF',
            date: '#AAFFFF',
            regexp: '#88EEFF',
            error: '#FFFFFF',
            circularReference: '#88DDFF',
            propertyKey: '#CCFFFF',
            punctuation: '#99EEFF'
        }
    }
};

/**
 * Magentas Color Range Palette Collection
 *
 * This file contains color palettes that combine magentas with other colors across the spectrum.
 * Each palette uses magentas more heavily (60-70%) than the secondary color (30-40%).
 * Both light and dark variants are provided for different background contexts.
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
const magentasColorRangePalettes = {
    magentasAndReds: {
        light: {
            null: '#7A3A5A',
            undefined: '#8A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3366',
            string: '#AA2244',
            symbol: '#992266',
            function: '#BB3377',
            object: '#CC2255',
            array: '#AA2255',
            map: '#993355',
            set: '#882266',
            weakmap: '#CC4488',
            weakset: '#771155',
            date: '#BB2266',
            regexp: '#991166',
            error: '#DD2266',
            circularReference: '#6A3A5A',
            propertyKey: '#553355',
            punctuation: '#664466'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#FF99CC',
            symbol: '#FFAADD',
            function: '#FFBBEE',
            object: '#FF99DD',
            array: '#FF99CC',
            map: '#FFAAEE',
            set: '#EEAADD',
            weakmap: '#FFBBEE',
            weakset: '#FF88BB',
            date: '#FF99DD',
            regexp: '#FF88CC',
            error: '#FF77AA',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndOranges: {
        light: {
            null: '#7A3A4A',
            undefined: '#8A4A5A',
            boolean: '#AA2A5A',
            number: '#CC4455',
            string: '#BB4422',
            symbol: '#992266',
            function: '#BB3366',
            object: '#CC5533',
            array: '#AA2255',
            map: '#CC6644',
            set: '#883355',
            weakmap: '#CC4488',
            weakset: '#771144',
            date: '#DD7755',
            regexp: '#991155',
            error: '#DD2255',
            circularReference: '#6A3A4A',
            propertyKey: '#554444',
            punctuation: '#665555'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFBBCC',
            string: '#FFCC99',
            symbol: '#FFAADD',
            function: '#FFAACC',
            object: '#FFDDAA',
            array: '#FF99CC',
            map: '#FFEEAA',
            set: '#EEAADD',
            weakmap: '#FFBBEE',
            weakset: '#FF88BB',
            date: '#FFFFBB',
            regexp: '#FF88BB',
            error: '#FF77AA',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    magentasAndYellows: {
        light: {
            null: '#7A3A5A',
            undefined: '#8A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3377',
            string: '#AA7733',
            symbol: '#992277',
            function: '#BB3388',
            object: '#BB8844',
            array: '#AA2266',
            map: '#CC9955',
            set: '#883366',
            weakmap: '#CC4499',
            weakset: '#771166',
            date: '#DDAA66',
            regexp: '#991177',
            error: '#DD2277',
            circularReference: '#6A3A5A',
            propertyKey: '#554455',
            punctuation: '#665566'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#FFEEAA',
            symbol: '#FFAAEE',
            function: '#FFBBFF',
            object: '#FFFFBB',
            array: '#FF99DD',
            map: '#FFFFCC',
            set: '#EEAAEE',
            weakmap: '#FFBBFF',
            weakset: '#FF88CC',
            date: '#FFFFDD',
            regexp: '#FF88DD',
            error: '#FF77BB',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDEE'
        }
    },
    magentasAndGreens: {
        light: {
            null: '#7A3A5A',
            undefined: '#8A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3377',
            string: '#447733',
            symbol: '#992277',
            function: '#BB3388',
            object: '#558844',
            array: '#AA2266',
            map: '#669955',
            set: '#336633',
            weakmap: '#CC4499',
            weakset: '#771166',
            date: '#77AA66',
            regexp: '#991177',
            error: '#DD2277',
            circularReference: '#6A3A5A',
            propertyKey: '#554466',
            punctuation: '#665577'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#BBFFAA',
            symbol: '#FFAAEE',
            function: '#FFBBFF',
            object: '#CCFFBB',
            array: '#FF99DD',
            map: '#DDFFCC',
            set: '#AADDAA',
            weakmap: '#FFBBFF',
            weakset: '#FF88CC',
            date: '#EEFFDD',
            regexp: '#FF88DD',
            error: '#FF77BB',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndBlues: {
        light: {
            null: '#6A3A5A',
            undefined: '#7A4A6A',
            boolean: '#AA2A6A',
            number: '#CC3388',
            string: '#334488',
            symbol: '#992288',
            function: '#BB3399',
            object: '#4455AA',
            array: '#AA2277',
            map: '#5566CC',
            set: '#2244AA',
            weakmap: '#CC44AA',
            weakset: '#771188',
            date: '#6677DD',
            regexp: '#991188',
            error: '#DD2288',
            circularReference: '#5A3A5A',
            propertyKey: '#554477',
            punctuation: '#665588'
        },
        dark: {
            null: '#FFCCFF',
            undefined: '#FFDDFF',
            boolean: '#FF99EE',
            number: '#FFBBFF',
            string: '#AACCFF',
            symbol: '#FFAAFF',
            function: '#FFCCFF',
            object: '#BBDDFF',
            array: '#FF99EE',
            map: '#CCEEFF',
            set: '#99BBFF',
            weakmap: '#FFBBFF',
            weakset: '#FF88DD',
            date: '#DDEEFF',
            regexp: '#FF88EE',
            error: '#FF77CC',
            circularReference: '#EECCFF',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndPurples: {
        light: {
            null: '#6A3A6A',
            undefined: '#7A4A7A',
            boolean: '#AA2A7A',
            number: '#CC3399',
            string: '#662288',
            symbol: '#992299',
            function: '#BB33AA',
            object: '#7733AA',
            array: '#AA2288',
            map: '#8844BB',
            set: '#5522AA',
            weakmap: '#CC44BB',
            weakset: '#771199',
            date: '#9955CC',
            regexp: '#991199',
            error: '#DD2299',
            circularReference: '#5A3A6A',
            propertyKey: '#554488',
            punctuation: '#665599'
        },
        dark: {
            null: '#FFDDFF',
            undefined: '#FFEEFF',
            boolean: '#FFAAFF',
            number: '#FFCCFF',
            string: '#DDAAFF',
            symbol: '#FFBBFF',
            function: '#FFDDFF',
            object: '#EECCFF',
            array: '#FFAAFF',
            map: '#FFDDFF',
            set: '#CCAAFF',
            weakmap: '#FFCCFF',
            weakset: '#FF99EE',
            date: '#FFBBFF',
            regexp: '#FF99FF',
            error: '#FF88DD',
            circularReference: '#EEDDFF',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndBrowns: {
        light: {
            null: '#6A3A5A',
            undefined: '#7A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3377',
            string: '#664422',
            symbol: '#992277',
            function: '#BB3388',
            object: '#775533',
            array: '#AA2266',
            map: '#886644',
            set: '#553311',
            weakmap: '#CC4499',
            weakset: '#771166',
            date: '#997755',
            regexp: '#991177',
            error: '#DD2277',
            circularReference: '#5A3A5A',
            propertyKey: '#554466',
            punctuation: '#665577'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#DDBB99',
            symbol: '#FFAAEE',
            function: '#FFBBFF',
            object: '#EECCAA',
            array: '#FF99DD',
            map: '#FFDDBB',
            set: '#CCAA77',
            weakmap: '#FFBBFF',
            weakset: '#FF88CC',
            date: '#FFEEBB',
            regexp: '#FF88DD',
            error: '#FF77BB',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndGreys: {
        light: {
            null: '#6A3A5A',
            undefined: '#7A4A6A',
            boolean: '#AA2A5A',
            number: '#CC3377',
            string: '#555555',
            symbol: '#992277',
            function: '#BB3388',
            object: '#666666',
            array: '#AA2266',
            map: '#777777',
            set: '#444444',
            weakmap: '#CC4499',
            weakset: '#771166',
            date: '#888888',
            regexp: '#991177',
            error: '#DD2277',
            circularReference: '#5A3A5A',
            propertyKey: '#444455',
            punctuation: '#555566'
        },
        dark: {
            null: '#FFCCEE',
            undefined: '#FFDDFF',
            boolean: '#FF99DD',
            number: '#FFAAEE',
            string: '#CCCCCC',
            symbol: '#FFAAEE',
            function: '#FFBBFF',
            object: '#DDDDDD',
            array: '#FF99DD',
            map: '#EEEEEE',
            set: '#BBBBBB',
            weakmap: '#FFBBFF',
            weakset: '#FF88CC',
            date: '#F5F5F5',
            regexp: '#FF88DD',
            error: '#FF77BB',
            circularReference: '#EECCEE',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndCharcoals: {
        light: {
            null: '#5A2A5A',
            undefined: '#6A3A6A',
            boolean: '#AA1A5A',
            number: '#CC2277',
            string: '#2A2A2A',
            symbol: '#992277',
            function: '#BB2288',
            object: '#3A3A3A',
            array: '#AA1166',
            map: '#4A4A4A',
            set: '#1A1A1A',
            weakmap: '#CC3399',
            weakset: '#881166',
            date: '#555555',
            regexp: '#990077',
            error: '#DD1177',
            circularReference: '#4A2A5A',
            propertyKey: '#333344',
            punctuation: '#444455'
        },
        dark: {
            null: '#DDBBEE',
            undefined: '#EECCFF',
            boolean: '#FF88DD',
            number: '#FF99EE',
            string: '#C5C5C5',
            symbol: '#FF99EE',
            function: '#FF99FF',
            object: '#D5D5D5',
            array: '#FF77DD',
            map: '#E5E5E5',
            set: '#B5B5B5',
            weakmap: '#FFAAFF',
            weakset: '#FF66CC',
            date: '#EEEEEE',
            regexp: '#FF55CC',
            error: '#FF66BB',
            circularReference: '#CCBBEE',
            propertyKey: '#FFDDEE',
            punctuation: '#EECCFF'
        }
    },
    magentasAndCyans: {
        light: {
            null: '#6A3A5A',
            undefined: '#7A4A6A',
            boolean: '#AA2A6A',
            number: '#CC3388',
            string: '#2A6677',
            symbol: '#992288',
            function: '#BB3399',
            object: '#337788',
            array: '#AA2277',
            map: '#338899',
            set: '#1A5566',
            weakmap: '#CC44AA',
            weakset: '#771188',
            date: '#44AABB',
            regexp: '#991188',
            error: '#DD2288',
            circularReference: '#5A3A5A',
            propertyKey: '#553377',
            punctuation: '#664488'
        },
        dark: {
            null: '#FFCCFF',
            undefined: '#FFDDFF',
            boolean: '#FF99EE',
            number: '#FFBBFF',
            string: '#99EEFF',
            symbol: '#FFAAFF',
            function: '#FFCCFF',
            object: '#AAFFFF',
            array: '#FF99EE',
            map: '#AAFFFF',
            set: '#77DDEE',
            weakmap: '#FFBBFF',
            weakset: '#FF88DD',
            date: '#BBFFFF',
            regexp: '#FF88EE',
            error: '#FF77CC',
            circularReference: '#EECCFF',
            propertyKey: '#FFEEEE',
            punctuation: '#FFDDFF'
        }
    },
    magentasAndLightGrays: {
        light: {
            null: '#7A4A6A',
            undefined: '#8A5A7A',
            boolean: '#AA3A6A',
            number: '#CC4488',
            string: '#6A6A6A',
            symbol: '#994488',
            function: '#BB4499',
            object: '#7A7A7A',
            array: '#AA3377',
            map: '#8A8A8A',
            set: '#5A5A5A',
            weakmap: '#CC55AA',
            weakset: '#883377',
            date: '#9A9A9A',
            regexp: '#992288',
            error: '#DD3388',
            circularReference: '#6A4A6A',
            propertyKey: '#555566',
            punctuation: '#666677'
        },
        dark: {
            null: '#FFDDFF',
            undefined: '#FFEEFF',
            boolean: '#FFAAEE',
            number: '#FFBBFF',
            string: '#E5E5E5',
            symbol: '#FFBBEE',
            function: '#FFCCFF',
            object: '#F5F5F5',
            array: '#FF99DD',
            map: '#FFFFFF',
            set: '#D5D5D5',
            weakmap: '#FFCCFF',
            weakset: '#FF88CC',
            date: '#FFFFFF',
            regexp: '#FF77DD',
            error: '#FF88CC',
            circularReference: '#EEDDFF',
            propertyKey: '#FFFFFF',
            punctuation: '#FFEEEE'
        }
    }
};

/**
 * Light Grays Color Range Palettes Collection
 *
 * This collection contains 11 color palettes that heavily feature light gray tones (60-70%)
 * combined with accent colors from various color ranges (30-40%). Each palette includes
 * both light and dark variants for different background preferences.
 *
 * Palettes included:
 * - lightGraysAndReds: Light gray tones with red accents
 * - lightGraysAndOranges: Light gray tones with orange accents
 * - lightGraysAndYellows: Light gray tones with yellow accents
 * - lightGraysAndGreens: Light gray tones with green accents
 * - lightGraysAndBlues: Light gray tones with blue accents
 * - lightGraysAndPurples: Light gray tones with purple accents
 * - lightGraysAndBrowns: Light gray tones with brown accents
 * - lightGraysAndGreys: Light gray tones with medium grey accents
 * - lightGraysAndCharcoals: Light gray tones with charcoal/darker accents
 * - lightGraysAndCyans: Light gray tones with cyan accents
 * - lightGraysAndMagentas: Light gray tones with magenta accents
 *
 * Light variants use darker colors suitable for light backgrounds.
 * Dark variants use lighter colors suitable for dark backgrounds.
 */
const lightGraysColorRangePalettes = {
    lightGraysAndReds: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#AA3333',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#BB4444',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#CC5555',
            weakset: '#8A8A8A',
            date: '#AA3333',
            regexp: '#7A7A7A',
            error: '#DD4444',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#FF8888',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#FFAAAA',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#FFCCCC',
            weakset: '#DADADA',
            date: '#FF8888',
            regexp: '#F5F5F5',
            error: '#FFBBBB',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndOranges: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#CC6633',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#DD7744',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#EE8855',
            weakset: '#8A8A8A',
            date: '#CC6633',
            regexp: '#7A7A7A',
            error: '#DD7744',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#FFAA77',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#FFBB88',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#FFCCAA',
            weakset: '#DADADA',
            date: '#FFAA77',
            regexp: '#F5F5F5',
            error: '#FFBB88',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndYellows: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#AA9933',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#BBAA44',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#CCBB55',
            weakset: '#8A8A8A',
            date: '#AA9933',
            regexp: '#7A7A7A',
            error: '#BBAA44',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#FFEE77',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#FFFF88',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#FFFFAA',
            weakset: '#DADADA',
            date: '#FFEE77',
            regexp: '#F5F5F5',
            error: '#FFFF88',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndGreens: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#338833',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#449944',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#55AA55',
            weakset: '#8A8A8A',
            date: '#338833',
            regexp: '#7A7A7A',
            error: '#449944',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#88EE88',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#99FF99',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#AAFFAA',
            weakset: '#DADADA',
            date: '#88EE88',
            regexp: '#F5F5F5',
            error: '#99FF99',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndBlues: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#3366AA',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#4477BB',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#5588CC',
            weakset: '#8A8A8A',
            date: '#3366AA',
            regexp: '#7A7A7A',
            error: '#4477BB',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#88AAFF',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#99BBFF',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#AACCFF',
            weakset: '#DADADA',
            date: '#88AAFF',
            regexp: '#F5F5F5',
            error: '#99BBFF',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndPurples: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#7733AA',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#8844BB',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#9955CC',
            weakset: '#8A8A8A',
            date: '#7733AA',
            regexp: '#7A7A7A',
            error: '#8844BB',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#CC88FF',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#DD99FF',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#EEAAFF',
            weakset: '#DADADA',
            date: '#CC88FF',
            regexp: '#F5F5F5',
            error: '#DD99FF',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndBrowns: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#885533',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#996644',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#AA7755',
            weakset: '#8A8A8A',
            date: '#885533',
            regexp: '#7A7A7A',
            error: '#996644',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#DDAA88',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#EEBB99',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#FFCCAA',
            weakset: '#DADADA',
            date: '#DDAA88',
            regexp: '#F5F5F5',
            error: '#EEBB99',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndGreys: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#5A5A5A',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#6A6A6A',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#4A4A4A',
            weakset: '#8A8A8A',
            date: '#5A5A5A',
            regexp: '#7A7A7A',
            error: '#6A6A6A',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#AAAAAA',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#BABABA',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#999999',
            weakset: '#DADADA',
            date: '#AAAAAA',
            regexp: '#F5F5F5',
            error: '#BABABA',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndCharcoals: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#2A2A2A',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#3A3A3A',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#1A1A1A',
            weakset: '#8A8A8A',
            date: '#2A2A2A',
            regexp: '#7A7A7A',
            error: '#3A3A3A',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#888888',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#999999',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#777777',
            weakset: '#DADADA',
            date: '#888888',
            regexp: '#F5F5F5',
            error: '#999999',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndCyans: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#3388AA',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#4499BB',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#55AACC',
            weakset: '#8A8A8A',
            date: '#3388AA',
            regexp: '#7A7A7A',
            error: '#4499BB',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#88EEFF',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#99FFFF',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#AAFFFF',
            weakset: '#DADADA',
            date: '#88EEFF',
            regexp: '#F5F5F5',
            error: '#99FFFF',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
        }
    },
    lightGraysAndMagentas: {
        light: {
            null: '#8A8A8A',
            undefined: '#9A9A9A',
            boolean: '#7A7A7A',
            number: '#AA3388',
            string: '#858585',
            symbol: '#9A9A9A',
            function: '#BB4499',
            object: '#8A8A8A',
            array: '#7A7A7A',
            map: '#9A9A9A',
            set: '#858585',
            weakmap: '#CC55AA',
            weakset: '#8A8A8A',
            date: '#AA3388',
            regexp: '#7A7A7A',
            error: '#BB4499',
            circularReference: '#9A9A9A',
            propertyKey: '#6A6A6A',
            punctuation: '#858585'
        },
        dark: {
            null: '#DADADA',
            undefined: '#EAEAEA',
            boolean: '#F5F5F5',
            number: '#FF88EE',
            string: '#E5E5E5',
            symbol: '#EAEAEA',
            function: '#FF99FF',
            object: '#DADADA',
            array: '#F5F5F5',
            map: '#EAEAEA',
            set: '#E5E5E5',
            weakmap: '#FFAAFF',
            weakset: '#DADADA',
            date: '#FF88EE',
            regexp: '#F5F5F5',
            error: '#FF99FF',
            circularReference: '#EAEAEA',
            propertyKey: '#FFFFFF',
            punctuation: '#E5E5E5'
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
        end: '>)'
    },
    weakset: {
        start: '((',
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
({
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
    // Circular reference example (will be detected by parse_value)
    circular: (() => {
        const obj = {
            name: 'circular',
            value: 123
        };
        obj.self = obj;
        return obj;
    })()
});
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
    containers: defaultContainers};
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
 * CLI for Kyrie - JavaScript/TypeScript/JSON syntax highlighter
 */
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
/**
 * Get palette from options
 */
function getPalette(paletteName, theme) {
    const paletteObj = allPalettes[paletteName];
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
function validateOutputMode(mode) {
    const validOutputModes = ['ansi', 'html', 'chrome-console', 'logger'];
    if (!validOutputModes.includes(mode)) {
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
function processInput(input, options) {
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
    const highlightOptions = {
        palette: paletteResult.palette,
        maxWidth: options.maxWidth,
        outputMode: options.outputMode
    };
    // Highlight and return
    try {
        const highlighted = highlight_string(input, highlightOptions);
        return { success: true, output: highlighted };
    }
    catch (error) {
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
    .action((file, options) => {
    let input = '';
    // Read input from file or stdin
    if (file) {
        try {
            input = fs.readFileSync(file, 'utf-8');
        }
        catch (error) {
            console.error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    else {
        // Read from stdin
        input = fs.readFileSync(0, 'utf-8');
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
// Only run CLI when not in test environment
if (process.env['NODE_ENV'] !== 'test' && process.env['VITEST'] !== 'true') {
    program.parse();
}

exports.allPalettes = allPalettes;
exports.getPalette = getPalette;
exports.processInput = processInput;
exports.validateOutputMode = validateOutputMode;
