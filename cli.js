#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../../node_modules/sisteransi/src/index.js
var require_src = __commonJS((exports, module) => {
  var ESC = "\x1B";
  var CSI = `${ESC}[`;
  var beep = "\x07";
  var cursor = {
    to(x, y) {
      if (!y)
        return `${CSI}${x + 1}G`;
      return `${CSI}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI}${-x}D`;
      else if (x > 0)
        ret += `${CSI}${x}C`;
      if (y < 0)
        ret += `${CSI}${-y}A`;
      else if (y > 0)
        ret += `${CSI}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// ../../node_modules/@stricli/core/dist/index.js
function checkEnvironmentVariable(process2, varName) {
  const value = process2.env?.[varName];
  return typeof value === "string" && value !== "0";
}
var ExitCode = {
  UnknownCommand: -5,
  InvalidArgument: -4,
  ContextLoadError: -3,
  CommandLoadError: -2,
  InternalError: -1,
  Success: 0,
  CommandRunError: 1
};
function convertKebabCaseToCamelCase(str) {
  return str.replace(/-./g, (match) => match[1].toUpperCase());
}
function convertCamelCaseToKebabCase(name) {
  return Array.from(name).map((char, i) => {
    const upper = char.toUpperCase();
    const lower = char.toLowerCase();
    if (i === 0 || upper !== char || upper === lower) {
      return char;
    }
    return `-${lower}`;
  }).join("");
}
function newSparseMatrix(defaultValue) {
  const values = /* @__PURE__ */ new Map;
  return {
    get: (...args) => {
      return values.get(args.join(",")) ?? defaultValue;
    },
    set: (value, ...args) => {
      values.set(args.join(","), value);
    }
  };
}
function damerauLevenshtein(a, b, options) {
  const { threshold, weights } = options;
  if (a === b) {
    return 0;
  }
  const lengthDiff = Math.abs(a.length - b.length);
  if (typeof threshold === "number" && lengthDiff > threshold) {
    return Infinity;
  }
  const matrix = newSparseMatrix(Infinity);
  matrix.set(0, -1, -1);
  for (let j = 0;j < b.length; ++j) {
    matrix.set((j + 1) * weights.insertion, -1, j);
  }
  for (let i = 0;i < a.length; ++i) {
    matrix.set((i + 1) * weights.deletion, i, -1);
  }
  let prevRowMinDistance = -Infinity;
  for (let i = 0;i < a.length; ++i) {
    let rowMinDistance = Infinity;
    for (let j = 0;j <= b.length - 1; ++j) {
      const cost = a[i] === b[j] ? 0 : 1;
      const distances = [
        matrix.get(i - 1, j) + weights.deletion,
        matrix.get(i, j - 1) + weights.insertion,
        matrix.get(i - 1, j - 1) + cost * weights.substitution
      ];
      if (a[i] === b[j - 1] && a[i - 1] === b[j]) {
        distances.push(matrix.get(i - 2, j - 2) + cost * weights.transposition);
      }
      const minDistance = Math.min(...distances);
      matrix.set(minDistance, i, j);
      if (minDistance < rowMinDistance) {
        rowMinDistance = minDistance;
      }
    }
    if (rowMinDistance > threshold) {
      if (prevRowMinDistance > threshold) {
        return Infinity;
      }
      prevRowMinDistance = rowMinDistance;
    } else {
      prevRowMinDistance = -Infinity;
    }
  }
  const distance = matrix.get(a.length - 1, b.length - 1);
  if (distance > threshold) {
    return Infinity;
  }
  return distance;
}
function compareAlternatives(a, b, target) {
  const cmp = a[1] - b[1];
  if (cmp !== 0) {
    return cmp;
  }
  const aStartsWith = a[0].startsWith(target);
  const bStartsWith = b[0].startsWith(target);
  if (aStartsWith && !bStartsWith) {
    return -1;
  } else if (!aStartsWith && bStartsWith) {
    return 1;
  }
  return a[0].localeCompare(b[0]);
}
function filterClosestAlternatives(target, alternatives, options) {
  const validAlternatives = alternatives.map((alt) => [alt, damerauLevenshtein(target, alt, options)]).filter(([, dist]) => dist <= options.threshold);
  const minDistance = Math.min(...validAlternatives.map(([, dist]) => dist));
  return validAlternatives.filter(([, dist]) => dist === minDistance).sort((a, b) => compareAlternatives(a, b, target)).map(([alt]) => alt);
}
var InternalError = class extends Error {
};
function formatException(exc) {
  if (exc instanceof Error) {
    return exc.stack ?? String(exc);
  }
  return String(exc);
}
function maximum(arr1, arr2) {
  const maxValues = [];
  const maxLength = Math.max(arr1.length, arr2.length);
  for (let i = 0;i < maxLength; ++i) {
    maxValues[i] = Math.max(arr1[i], arr2[i]);
  }
  return maxValues;
}
function formatRowsWithColumns(cells, separators) {
  if (cells.length === 0) {
    return [];
  }
  const startingLengths = Array(Math.max(...cells.map((cellRow) => cellRow.length))).fill(0, 0);
  const maxLengths = cells.reduce((acc, cellRow) => {
    const lengths = cellRow.map((cell) => cell.length);
    return maximum(acc, lengths);
  }, startingLengths);
  return cells.map((cellRow) => {
    const firstCell = (cellRow[0] ?? "").padEnd(maxLengths[0]);
    return cellRow.slice(1).reduce((parts, str, i, arr) => {
      const paddedStr = arr.length === i + 1 ? str : str.padEnd(maxLengths[i + 1]);
      return [...parts, separators?.[i] ?? " ", paddedStr];
    }, [firstCell]).join("").trimEnd();
  });
}
function joinWithGrammar(parts, grammar) {
  if (parts.length <= 1) {
    return parts[0] ?? "";
  }
  if (parts.length === 2) {
    return parts.join(` ${grammar.conjunction} `);
  }
  let allButLast = parts.slice(0, parts.length - 1).join(", ");
  if (grammar.serialComma) {
    allButLast += ",";
  }
  return [allButLast, grammar.conjunction, parts[parts.length - 1]].join(" ");
}
function group(array, callback) {
  return array.reduce((groupings, item) => {
    const key = callback(item);
    const groupItems = groupings[key] ?? [];
    groupItems.push(item);
    groupings[key] = groupItems;
    return groupings;
  }, {});
}
function groupBy(array, selector) {
  return group(array, (item) => item[selector]);
}
async function allSettledOrElse(values) {
  const results = await Promise.allSettled(values);
  const grouped = groupBy(results, "status");
  if (grouped.rejected && grouped.rejected.length > 0) {
    return { status: "rejected", reasons: grouped.rejected.map((result) => result.reason) };
  }
  return { status: "fulfilled", value: grouped.fulfilled?.map((result) => result.value) ?? [] };
}
var TRUTHY_VALUES = /* @__PURE__ */ new Set(["true", "t", "yes", "y", "on", "1"]);
var FALSY_VALUES = /* @__PURE__ */ new Set(["false", "f", "no", "n", "off", "0"]);
var looseBooleanParser = (input) => {
  const value = input.toLowerCase();
  if (TRUTHY_VALUES.has(value)) {
    return true;
  }
  if (FALSY_VALUES.has(value)) {
    return false;
  }
  throw new SyntaxError(`Cannot convert ${input} to a boolean`);
};
var numberParser = (input) => {
  const value = Number(input);
  if (Number.isNaN(value)) {
    throw new SyntaxError(`Cannot convert ${input} to a number`);
  }
  return value;
};
var ArgumentScannerError = class extends InternalError {
  _brand;
};
function formatMessageForArgumentScannerError(error, formatter) {
  const errorType = error.constructor.name;
  const formatError = formatter[errorType];
  if (formatError) {
    return formatError(error);
  }
  return error.message;
}
function resolveAliases(flags, aliases, scannerCaseStyle) {
  return Object.fromEntries(Object.entries(aliases).map(([alias, internalFlagName_]) => {
    const internalFlagName = internalFlagName_;
    const flag = flags[internalFlagName];
    if (!flag) {
      const externalFlagName = asExternal(internalFlagName, scannerCaseStyle);
      throw new FlagNotFoundError(externalFlagName, [], alias);
    }
    return [alias, [internalFlagName, flag]];
  }));
}
var FlagNotFoundError = class extends ArgumentScannerError {
  input;
  corrections;
  aliasName;
  constructor(input, corrections, aliasName) {
    let message = `No flag registered for --${input}`;
    if (aliasName) {
      message += ` (aliased from -${aliasName})`;
    } else if (corrections.length > 0) {
      const formattedCorrections = joinWithGrammar(corrections.map((correction) => `--${correction}`), {
        kind: "conjunctive",
        conjunction: "or",
        serialComma: true
      });
      message += `, did you mean ${formattedCorrections}?`;
    }
    super(message);
    this.input = input;
    this.corrections = corrections;
    this.aliasName = aliasName;
  }
};
var AliasNotFoundError = class extends ArgumentScannerError {
  input;
  constructor(input) {
    super(`No alias registered for -${input}`);
    this.input = input;
  }
};
function getPlaceholder(param, index) {
  if (param.placeholder) {
    return param.placeholder;
  }
  return typeof index === "number" ? `arg${index}` : "args";
}
function asExternal(internal, scannerCaseStyle) {
  return scannerCaseStyle === "allow-kebab-for-camel" ? convertCamelCaseToKebabCase(internal) : internal;
}
var ArgumentParseError = class extends ArgumentScannerError {
  externalFlagNameOrPlaceholder;
  input;
  exception;
  constructor(externalFlagNameOrPlaceholder, input, exception) {
    super(`Failed to parse "${input}" for ${externalFlagNameOrPlaceholder}: ${exception instanceof Error ? exception.message : String(exception)}`);
    this.externalFlagNameOrPlaceholder = externalFlagNameOrPlaceholder;
    this.input = input;
    this.exception = exception;
  }
};
function parseInput(externalFlagNameOrPlaceholder, parameter, input, context) {
  try {
    return parameter.parse.call(context, input);
  } catch (exc) {
    throw new ArgumentParseError(externalFlagNameOrPlaceholder, input, exc);
  }
}
var EnumValidationError = class extends ArgumentScannerError {
  externalFlagName;
  input;
  values;
  constructor(externalFlagName, input, values, corrections) {
    let message = `Expected "${input}" to be one of (${values.join("|")})`;
    if (corrections.length > 0) {
      const formattedCorrections = joinWithGrammar(corrections.map((str) => `"${str}"`), {
        kind: "conjunctive",
        conjunction: "or",
        serialComma: true
      });
      message += `, did you mean ${formattedCorrections}?`;
    }
    super(message);
    this.externalFlagName = externalFlagName;
    this.input = input;
    this.values = values;
  }
};
var UnsatisfiedFlagError = class extends ArgumentScannerError {
  externalFlagName;
  nextFlagName;
  constructor(externalFlagName, nextFlagName) {
    let message = `Expected input for flag --${externalFlagName}`;
    if (nextFlagName) {
      message += ` but encountered --${nextFlagName} instead`;
    }
    super(message);
    this.externalFlagName = externalFlagName;
    this.nextFlagName = nextFlagName;
  }
};
var UnexpectedPositionalError = class extends ArgumentScannerError {
  expectedCount;
  input;
  constructor(expectedCount, input) {
    super(`Too many arguments, expected ${expectedCount} but encountered "${input}"`);
    this.expectedCount = expectedCount;
    this.input = input;
  }
};
var UnsatisfiedPositionalError = class extends ArgumentScannerError {
  placeholder;
  limit;
  constructor(placeholder, limit) {
    let message;
    if (limit) {
      message = `Expected at least ${limit[0]} argument(s) for ${placeholder}`;
      if (limit[1] === 0) {
        message += " but found none";
      } else {
        message += ` but only found ${limit[1]}`;
      }
    } else {
      message = `Expected argument for ${placeholder}`;
    }
    super(message);
    this.placeholder = placeholder;
    this.limit = limit;
  }
};
function undoNegation(flagName) {
  if (flagName.startsWith("no") && flagName.length > 2) {
    if (flagName[2] === "-") {
      return flagName.slice(4);
    }
    const firstChar = flagName[2];
    const firstUpper = firstChar.toUpperCase();
    if (firstChar !== firstUpper) {
      return;
    }
    const firstLower = firstChar.toLowerCase();
    return firstLower + flagName.slice(3);
  }
}
function findInternalFlagMatch(externalFlagName, flags, config) {
  const internalFlagName = externalFlagName;
  let flag = flags[internalFlagName];
  let foundFlagWithNegatedFalse;
  let foundFlagWithNegatedFalseFromKebabConversion = false;
  if (!flag) {
    const internalWithoutNegation = undoNegation(internalFlagName);
    if (internalWithoutNegation) {
      flag = flags[internalWithoutNegation];
      if (flag && flag.kind == "boolean") {
        if (flag.withNegated !== false) {
          return { namedFlag: [internalWithoutNegation, flag], negated: true };
        } else {
          foundFlagWithNegatedFalse = internalWithoutNegation;
          flag = undefined;
        }
      }
    }
  }
  const camelCaseFlagName = convertKebabCaseToCamelCase(externalFlagName);
  if (config.caseStyle === "allow-kebab-for-camel" && !flag) {
    flag = flags[camelCaseFlagName];
    if (flag) {
      return { namedFlag: [camelCaseFlagName, flag] };
    }
    const camelCaseWithoutNegation = undoNegation(camelCaseFlagName);
    if (camelCaseWithoutNegation) {
      flag = flags[camelCaseWithoutNegation];
      if (flag && flag.kind == "boolean") {
        if (flag.withNegated !== false) {
          return { namedFlag: [camelCaseWithoutNegation, flag], negated: true };
        } else {
          foundFlagWithNegatedFalse = camelCaseWithoutNegation;
          foundFlagWithNegatedFalseFromKebabConversion = true;
          flag = undefined;
        }
      }
    }
  }
  if (!flag) {
    if (foundFlagWithNegatedFalse) {
      let correction = foundFlagWithNegatedFalse;
      if (foundFlagWithNegatedFalseFromKebabConversion && externalFlagName.includes("-")) {
        correction = convertCamelCaseToKebabCase(foundFlagWithNegatedFalse);
      }
      throw new FlagNotFoundError(externalFlagName, [correction]);
    }
    if (camelCaseFlagName in flags) {
      throw new FlagNotFoundError(externalFlagName, [camelCaseFlagName]);
    }
    const kebabCaseFlagName = convertCamelCaseToKebabCase(externalFlagName);
    if (kebabCaseFlagName in flags) {
      throw new FlagNotFoundError(externalFlagName, [kebabCaseFlagName]);
    }
    const corrections = filterClosestAlternatives(internalFlagName, Object.keys(flags), config.distanceOptions);
    throw new FlagNotFoundError(externalFlagName, corrections);
  }
  return { namedFlag: [internalFlagName, flag] };
}
function isNiladic(namedFlagWithNegation) {
  if (namedFlagWithNegation.namedFlag[1].kind === "boolean" || namedFlagWithNegation.namedFlag[1].kind === "counter") {
    return true;
  }
  return false;
}
var FLAG_SHORTHAND_PATTERN = /^-([a-z]+)$/i;
var FLAG_NAME_PATTERN = /^--([a-z][a-z-.\d_]+)$/i;
function findFlagsByArgument(arg, flags, resolvedAliases, config) {
  const shorthandMatch = FLAG_SHORTHAND_PATTERN.exec(arg);
  if (shorthandMatch) {
    const batch = shorthandMatch[1];
    return Array.from(batch).map((alias) => {
      const aliasName = alias;
      const namedFlag = resolvedAliases[aliasName];
      if (!namedFlag) {
        throw new AliasNotFoundError(aliasName);
      }
      return { namedFlag };
    });
  }
  const flagNameMatch = FLAG_NAME_PATTERN.exec(arg);
  if (flagNameMatch) {
    const externalFlagName = flagNameMatch[1];
    return [findInternalFlagMatch(externalFlagName, flags, config)];
  }
  return [];
}
var FLAG_NAME_VALUE_PATTERN = /^--([a-z][a-z-.\d_]+)=(.+)$/i;
var ALIAS_VALUE_PATTERN = /^-([a-z])=(.+)$/i;
var InvalidNegatedFlagSyntaxError = class extends ArgumentScannerError {
  externalFlagName;
  valueText;
  constructor(externalFlagName, valueText) {
    super(`Cannot negate flag --${externalFlagName} and pass "${valueText}" as value`);
    this.externalFlagName = externalFlagName;
    this.valueText = valueText;
  }
};
function findFlagByArgumentWithInput(arg, flags, resolvedAliases, config) {
  const flagsNameMatch = FLAG_NAME_VALUE_PATTERN.exec(arg);
  if (flagsNameMatch) {
    const externalFlagName = flagsNameMatch[1];
    const { namedFlag: flagMatch, negated } = findInternalFlagMatch(externalFlagName, flags, config);
    const valueText = flagsNameMatch[2];
    if (negated) {
      throw new InvalidNegatedFlagSyntaxError(externalFlagName, valueText);
    }
    return [flagMatch, valueText];
  }
  const aliasValueMatch = ALIAS_VALUE_PATTERN.exec(arg);
  if (aliasValueMatch) {
    const aliasName = aliasValueMatch[1];
    const namedFlag = resolvedAliases[aliasName];
    if (!namedFlag) {
      throw new AliasNotFoundError(aliasName);
    }
    const valueText = aliasValueMatch[2];
    return [namedFlag, valueText];
  }
}
async function parseInputsForFlag(externalFlagName, flag, inputs, config, context) {
  if (!inputs) {
    if ("default" in flag && typeof flag.default !== "undefined") {
      if (flag.kind === "boolean") {
        return flag.default;
      }
      if (flag.kind === "enum") {
        if ("variadic" in flag && flag.variadic && Array.isArray(flag.default)) {
          const defaultArray = flag.default;
          for (const value of defaultArray) {
            if (!flag.values.includes(value)) {
              const corrections = filterClosestAlternatives(value, flag.values, config.distanceOptions);
              throw new EnumValidationError(externalFlagName, value, flag.values, corrections);
            }
          }
          return flag.default;
        }
        return flag.default;
      }
      if ("variadic" in flag && flag.variadic && Array.isArray(flag.default)) {
        const defaultArray = flag.default;
        return Promise.all(defaultArray.map((input2) => parseInput(externalFlagName, flag, input2, context)));
      }
      return parseInput(externalFlagName, flag, flag.default, context);
    }
    if (flag.optional) {
      return;
    }
    if (flag.kind === "boolean") {
      return false;
    } else if (flag.kind === "counter") {
      return 0;
    }
    throw new UnsatisfiedFlagError(externalFlagName);
  }
  if (flag.kind === "counter") {
    return inputs.reduce((total, input2) => {
      try {
        return total + numberParser.call(context, input2);
      } catch (exc) {
        throw new ArgumentParseError(externalFlagName, input2, exc);
      }
    }, 0);
  }
  if ("variadic" in flag && flag.variadic) {
    if (flag.kind === "enum") {
      for (const input2 of inputs) {
        if (!flag.values.includes(input2)) {
          const corrections = filterClosestAlternatives(input2, flag.values, config.distanceOptions);
          throw new EnumValidationError(externalFlagName, input2, flag.values, corrections);
        }
      }
      return inputs;
    }
    return Promise.all(inputs.map((input2) => parseInput(externalFlagName, flag, input2, context)));
  }
  const input = inputs[0];
  if (flag.kind === "boolean") {
    try {
      return looseBooleanParser.call(context, input);
    } catch (exc) {
      throw new ArgumentParseError(externalFlagName, input, exc);
    }
  }
  if (flag.kind === "enum") {
    if (!flag.values.includes(input)) {
      const corrections = filterClosestAlternatives(input, flag.values, config.distanceOptions);
      throw new EnumValidationError(externalFlagName, input, flag.values, corrections);
    }
    return input;
  }
  return parseInput(externalFlagName, flag, input, context);
}
var UnexpectedFlagError = class extends ArgumentScannerError {
  externalFlagName;
  previousInput;
  input;
  constructor(externalFlagName, previousInput, input) {
    super(`Too many arguments for --${externalFlagName}, encountered "${input}" after "${previousInput}"`);
    this.externalFlagName = externalFlagName;
    this.previousInput = previousInput;
    this.input = input;
  }
};
function isVariadicFlag(flag) {
  if (flag.kind === "counter") {
    return true;
  }
  if ("variadic" in flag) {
    return Boolean(flag.variadic);
  }
  return false;
}
function storeInput(flagInputs, scannerCaseStyle, [internalFlagName, flag], input) {
  const inputs = flagInputs.get(internalFlagName) ?? [];
  if (inputs.length > 0 && !isVariadicFlag(flag)) {
    const externalFlagName = asExternal(internalFlagName, scannerCaseStyle);
    throw new UnexpectedFlagError(externalFlagName, inputs[0], input);
  }
  if ("variadic" in flag && typeof flag.variadic === "string") {
    const multipleInputs = input.split(flag.variadic);
    flagInputs.set(internalFlagName, [...inputs, ...multipleInputs]);
  } else {
    flagInputs.set(internalFlagName, [...inputs, input]);
  }
}
function isFlagSatisfiedByInputs(flags, flagInputs, key) {
  const inputs = flagInputs.get(key);
  if (inputs) {
    const flag = flags[key];
    if (isVariadicFlag(flag)) {
      return false;
    }
    return true;
  }
  return false;
}
function buildArgumentScanner(parameters, config) {
  const { flags = {}, aliases = {}, positional = { kind: "tuple", parameters: [] } } = parameters;
  const resolvedAliases = resolveAliases(flags, aliases, config.caseStyle);
  const positionalInputs = [];
  const flagInputs = /* @__PURE__ */ new Map;
  let positionalIndex = 0;
  let activeFlag;
  let treatInputsAsArguments = false;
  return {
    next: (input) => {
      if (!treatInputsAsArguments && config.allowArgumentEscapeSequence && input === "--") {
        if (activeFlag) {
          if (activeFlag[1].kind === "parsed" && activeFlag[1].inferEmpty) {
            storeInput(flagInputs, config.caseStyle, activeFlag, "");
            activeFlag = undefined;
          } else {
            const externalFlagName = asExternal(activeFlag[0], config.caseStyle);
            throw new UnsatisfiedFlagError(externalFlagName);
          }
        }
        treatInputsAsArguments = true;
        return;
      }
      if (!treatInputsAsArguments) {
        const flagInput = findFlagByArgumentWithInput(input, flags, resolvedAliases, config);
        if (flagInput) {
          if (activeFlag) {
            if (activeFlag[1].kind === "parsed" && activeFlag[1].inferEmpty) {
              storeInput(flagInputs, config.caseStyle, activeFlag, "");
              activeFlag = undefined;
            } else {
              const externalFlagName = asExternal(activeFlag[0], config.caseStyle);
              const nextExternalFlagName = asExternal(flagInput[0][0], config.caseStyle);
              throw new UnsatisfiedFlagError(externalFlagName, nextExternalFlagName);
            }
          }
          storeInput(flagInputs, config.caseStyle, ...flagInput);
          return;
        }
        const nextFlags = findFlagsByArgument(input, flags, resolvedAliases, config);
        if (nextFlags.length > 0) {
          if (activeFlag) {
            if (activeFlag[1].kind === "parsed" && activeFlag[1].inferEmpty) {
              storeInput(flagInputs, config.caseStyle, activeFlag, "");
              activeFlag = undefined;
            } else {
              const externalFlagName = asExternal(activeFlag[0], config.caseStyle);
              const nextFlagName = asExternal(nextFlags[0].namedFlag[0], config.caseStyle);
              throw new UnsatisfiedFlagError(externalFlagName, nextFlagName);
            }
          }
          if (nextFlags.every(isNiladic)) {
            for (const nextFlag of nextFlags) {
              if (nextFlag.namedFlag[1].kind === "boolean") {
                storeInput(flagInputs, config.caseStyle, nextFlag.namedFlag, nextFlag.negated ? "false" : "true");
              } else {
                storeInput(flagInputs, config.caseStyle, nextFlag.namedFlag, "1");
              }
            }
          } else if (nextFlags.length > 1) {
            const nextFlagExpectingArg = nextFlags.find((nextFlag) => !isNiladic(nextFlag));
            const externalFlagName = asExternal(nextFlagExpectingArg.namedFlag[0], config.caseStyle);
            throw new UnsatisfiedFlagError(externalFlagName);
          } else {
            activeFlag = nextFlags[0].namedFlag;
          }
          return;
        }
      }
      if (activeFlag) {
        storeInput(flagInputs, config.caseStyle, activeFlag, input);
        activeFlag = undefined;
      } else {
        if (positional.kind === "tuple") {
          if (positionalIndex >= positional.parameters.length) {
            throw new UnexpectedPositionalError(positional.parameters.length, input);
          }
        } else {
          if (typeof positional.maximum === "number" && positionalIndex >= positional.maximum) {
            throw new UnexpectedPositionalError(positional.maximum, input);
          }
        }
        positionalInputs[positionalIndex] = input;
        ++positionalIndex;
      }
    },
    parseArguments: async (context) => {
      const errors = [];
      let positionalValues_p;
      if (positional.kind === "array") {
        if (typeof positional.minimum === "number" && positionalIndex < positional.minimum) {
          errors.push(new UnsatisfiedPositionalError(getPlaceholder(positional.parameter), [
            positional.minimum,
            positionalIndex
          ]));
        }
        positionalValues_p = allSettledOrElse(positionalInputs.map(async (input, i) => {
          const placeholder = getPlaceholder(positional.parameter, i + 1);
          return parseInput(placeholder, positional.parameter, input, context);
        }));
      } else {
        positionalValues_p = allSettledOrElse(positional.parameters.map(async (param, i) => {
          const placeholder = getPlaceholder(param, i + 1);
          const input = positionalInputs[i];
          if (typeof input !== "string") {
            if (typeof param.default === "string") {
              return parseInput(placeholder, param, param.default, context);
            }
            if (param.optional) {
              return;
            }
            throw new UnsatisfiedPositionalError(placeholder);
          }
          return parseInput(placeholder, param, input, context);
        }));
      }
      if (activeFlag && activeFlag[1].kind === "parsed" && activeFlag[1].inferEmpty) {
        storeInput(flagInputs, config.caseStyle, activeFlag, "");
        activeFlag = undefined;
      }
      const flagEntries_p = allSettledOrElse(Object.entries(flags).map(async (entry) => {
        const [internalFlagName, flag] = entry;
        const externalFlagName = asExternal(internalFlagName, config.caseStyle);
        if (activeFlag && activeFlag[0] === internalFlagName) {
          throw new UnsatisfiedFlagError(externalFlagName);
        }
        const inputs = flagInputs.get(internalFlagName);
        const value = await parseInputsForFlag(externalFlagName, flag, inputs, config, context);
        return [internalFlagName, value];
      }));
      const [positionalValuesResult, flagEntriesResult] = await Promise.all([positionalValues_p, flagEntries_p]);
      if (positionalValuesResult.status === "rejected") {
        for (const reason of positionalValuesResult.reasons) {
          errors.push(reason);
        }
      }
      if (flagEntriesResult.status === "rejected") {
        for (const reason of flagEntriesResult.reasons) {
          errors.push(reason);
        }
      }
      if (errors.length > 0) {
        return { success: false, errors };
      }
      if (positionalValuesResult.status === "rejected") {
        throw new InternalError("Unknown failure while scanning positional arguments");
      }
      if (flagEntriesResult.status === "rejected") {
        throw new InternalError("Unknown failure while scanning flag arguments");
      }
      const parsedFlags = Object.fromEntries(flagEntriesResult.value);
      return { success: true, arguments: [parsedFlags, ...positionalValuesResult.value] };
    },
    proposeCompletions: async ({ partial, completionConfig, text, context, includeVersionFlag }) => {
      if (activeFlag) {
        return proposeFlagCompletionsForPartialInput(activeFlag[1], context, partial);
      }
      const completions = [];
      if (!treatInputsAsArguments) {
        const shorthandMatch = FLAG_SHORTHAND_PATTERN.exec(partial);
        if (completionConfig.includeAliases) {
          if (partial === "" || partial === "-") {
            const incompleteAliases = Object.entries(aliases).filter((entry) => !isFlagSatisfiedByInputs(flags, flagInputs, entry[1]));
            for (const [alias] of incompleteAliases) {
              const flag = resolvedAliases[alias];
              if (flag) {
                completions.push({
                  kind: "argument:flag",
                  completion: `-${alias}`,
                  brief: flag[1].brief
                });
              }
            }
          } else if (shorthandMatch) {
            const partialAliases = Array.from(shorthandMatch[1]);
            if (partialAliases.includes("h")) {
              return [];
            }
            if (includeVersionFlag && partialAliases.includes("v")) {
              return [];
            }
            const flagInputsIncludingPartial = new Map(flagInputs);
            for (const alias of partialAliases) {
              const namedFlag = resolvedAliases[alias];
              if (!namedFlag) {
                throw new AliasNotFoundError(alias);
              }
              storeInput(flagInputsIncludingPartial, config.caseStyle, namedFlag, namedFlag[1].kind === "boolean" ? "true" : "1");
            }
            const lastAlias = partialAliases[partialAliases.length - 1];
            if (lastAlias) {
              const namedFlag = resolvedAliases[lastAlias];
              if (namedFlag) {
                completions.push({
                  kind: "argument:flag",
                  completion: partial,
                  brief: namedFlag[1].brief
                });
              }
            }
            const incompleteAliases = Object.entries(aliases).filter((entry) => !isFlagSatisfiedByInputs(flags, flagInputsIncludingPartial, entry[1]));
            for (const [alias] of incompleteAliases) {
              const flag = resolvedAliases[alias];
              if (flag) {
                completions.push({
                  kind: "argument:flag",
                  completion: `${partial}${alias}`,
                  brief: flag[1].brief
                });
              }
            }
          }
        }
        if (partial === "" || partial === "-" || partial.startsWith("--")) {
          if (config.allowArgumentEscapeSequence) {
            completions.push({
              kind: "argument:flag",
              completion: "--",
              brief: text.briefs.argumentEscapeSequence
            });
          }
          let incompleteFlags = Object.entries(flags).filter(([flagName]) => !isFlagSatisfiedByInputs(flags, flagInputs, flagName));
          if (config.caseStyle === "allow-kebab-for-camel") {
            incompleteFlags = incompleteFlags.map(([flagName, param]) => {
              return [convertCamelCaseToKebabCase(flagName), param];
            });
          }
          const possibleFlags = incompleteFlags.map(([flagName, param]) => [`--${flagName}`, param]).filter(([flagName]) => flagName.startsWith(partial));
          completions.push(...possibleFlags.map(([name, param]) => {
            return {
              kind: "argument:flag",
              completion: name,
              brief: param.brief
            };
          }));
        }
      }
      if (positional.kind === "array") {
        if (positional.parameter.proposeCompletions) {
          if (typeof positional.maximum !== "number" || positionalIndex < positional.maximum) {
            const positionalCompletions = await positional.parameter.proposeCompletions.call(context, partial);
            completions.push(...positionalCompletions.map((value) => {
              return {
                kind: "argument:value",
                completion: value,
                brief: positional.parameter.brief
              };
            }));
          }
        }
      } else {
        const nextPositional = positional.parameters[positionalIndex];
        if (nextPositional?.proposeCompletions) {
          const positionalCompletions = await nextPositional.proposeCompletions.call(context, partial);
          completions.push(...positionalCompletions.map((value) => {
            return {
              kind: "argument:value",
              completion: value,
              brief: nextPositional.brief
            };
          }));
        }
      }
      return completions.filter(({ completion }) => completion.startsWith(partial));
    }
  };
}
async function proposeFlagCompletionsForPartialInput(flag, context, partial) {
  if (typeof flag.variadic === "string") {
    if (partial.endsWith(flag.variadic)) {
      return proposeFlagCompletionsForPartialInput(flag, context, "");
    }
  }
  let values;
  if (flag.kind === "enum") {
    values = flag.values;
  } else if (flag.proposeCompletions) {
    values = await flag.proposeCompletions.call(context, partial);
  } else {
    values = [];
  }
  return values.map((value) => {
    return {
      kind: "argument:value",
      completion: value,
      brief: flag.brief
    };
  }).filter(({ completion }) => completion.startsWith(partial));
}
function listAllRouteNamesAndAliasesForScan(routeMap, scannerCaseStyle, config) {
  const displayCaseStyle = scannerCaseStyle === "allow-kebab-for-camel" ? "convert-camel-to-kebab" : scannerCaseStyle;
  let entries = routeMap.getAllEntries();
  if (!config.includeHiddenRoutes) {
    entries = entries.filter((entry) => !entry.hidden);
  }
  return entries.flatMap((entry) => {
    const routeName = entry.name[displayCaseStyle];
    if (config.includeAliases) {
      return [routeName, ...entry.aliases];
    }
    return [routeName];
  });
}
var text_en = {
  headers: {
    usage: "USAGE",
    aliases: "ALIASES",
    commands: "COMMANDS",
    flags: "FLAGS",
    arguments: "ARGUMENTS"
  },
  keywords: {
    default: "default =",
    separator: "separator ="
  },
  briefs: {
    help: "Print help information and exit",
    helpAll: "Print help information (including hidden commands/flags) and exit",
    version: "Print version information and exit",
    argumentEscapeSequence: "All subsequent inputs should be interpreted as arguments"
  },
  noCommandRegisteredForInput: ({ input, corrections }) => {
    const errorMessage = `No command registered for \`${input}\``;
    if (corrections.length > 0) {
      const formattedCorrections = joinWithGrammar(corrections, {
        kind: "conjunctive",
        conjunction: "or",
        serialComma: true
      });
      return `${errorMessage}, did you mean ${formattedCorrections}?`;
    } else {
      return errorMessage;
    }
  },
  noTextAvailableForLocale: ({ requestedLocale, defaultLocale }) => {
    return `Application does not support "${requestedLocale}" locale, defaulting to "${defaultLocale}"`;
  },
  exceptionWhileParsingArguments: (exc) => {
    if (exc instanceof ArgumentScannerError) {
      return formatMessageForArgumentScannerError(exc, {});
    }
    return `Unable to parse arguments, ${formatException(exc)}`;
  },
  exceptionWhileLoadingCommandFunction: (exc) => {
    return `Unable to load command function, ${formatException(exc)}`;
  },
  exceptionWhileLoadingCommandContext: (exc) => {
    return `Unable to load command context, ${formatException(exc)}`;
  },
  exceptionWhileRunningCommand: (exc) => {
    return `Command failed, ${formatException(exc)}`;
  },
  commandErrorResult: (err) => {
    return err.message;
  },
  currentVersionIsNotLatest: ({ currentVersion, latestVersion, upgradeCommand }) => {
    if (upgradeCommand) {
      return `Latest available version is ${latestVersion} (currently running ${currentVersion}), upgrade with "${upgradeCommand}"`;
    }
    return `Latest available version is ${latestVersion} (currently running ${currentVersion})`;
  }
};
function defaultTextLoader(locale) {
  if (locale.startsWith("en")) {
    return text_en;
  }
}
function shouldUseAnsiColor(process2, stream, config) {
  return !config.disableAnsiColor && !checkEnvironmentVariable(process2, "STRICLI_NO_COLOR") && (stream.getColorDepth?.(process2.env) ?? 1) >= 4;
}
async function runCommand({ loader, parameters }, {
  context,
  inputs,
  scannerConfig,
  errorFormatting,
  documentationConfig,
  determineExitCode
}) {
  let parsedArguments;
  try {
    const scanner = buildArgumentScanner(parameters, scannerConfig);
    for (const input of inputs) {
      scanner.next(input);
    }
    const result = await scanner.parseArguments(context);
    if (result.success) {
      parsedArguments = result.arguments;
    } else {
      const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, documentationConfig);
      for (const error of result.errors) {
        const errorMessage = errorFormatting.exceptionWhileParsingArguments(error, ansiColor);
        context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
      }
      return ExitCode.InvalidArgument;
    }
  } catch (exc) {
    const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, documentationConfig);
    const errorMessage = errorFormatting.exceptionWhileParsingArguments(exc, ansiColor);
    context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
    return ExitCode.InvalidArgument;
  }
  let commandFunction;
  try {
    const loaded = await loader();
    if (typeof loaded === "function") {
      commandFunction = loaded;
    } else {
      commandFunction = loaded.default;
    }
  } catch (exc) {
    const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, documentationConfig);
    const errorMessage = errorFormatting.exceptionWhileLoadingCommandFunction(exc, ansiColor);
    context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
    return ExitCode.CommandLoadError;
  }
  try {
    const result = await commandFunction.call(context, ...parsedArguments);
    if (result instanceof Error) {
      const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, documentationConfig);
      const errorMessage = errorFormatting.commandErrorResult(result, ansiColor);
      context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
      if (determineExitCode) {
        return determineExitCode(result);
      }
      return ExitCode.CommandRunError;
    }
  } catch (exc) {
    const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, documentationConfig);
    const errorMessage = errorFormatting.exceptionWhileRunningCommand(exc, ansiColor);
    context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
    if (determineExitCode) {
      return determineExitCode(exc);
    }
    return ExitCode.CommandRunError;
  }
  return ExitCode.Success;
}
var RouteMapSymbol = Symbol("RouteMap");
var CommandSymbol = Symbol("Command");
function buildRouteScanner(root, config, startingPrefix) {
  const prefix = [...startingPrefix];
  const unprocessedInputs = [];
  let parent;
  let current = root;
  let target;
  let rootLevel = true;
  let helpRequested = false;
  return {
    next: (input) => {
      if (input === "--help" || input === "-h") {
        helpRequested = true;
        if (!target) {
          target = current;
        }
        return;
      } else if (input === "--helpAll" || input === "--help-all" || input === "-H") {
        helpRequested = "all";
        if (!target) {
          target = current;
        }
        return;
      }
      if (target) {
        unprocessedInputs.push(input);
        return;
      }
      if (current.kind === CommandSymbol) {
        target = current;
        unprocessedInputs.push(input);
        return;
      }
      const camelCaseRouteName = convertKebabCaseToCamelCase(input);
      let internalRouteName = input;
      let next = current.getRoutingTargetForInput(internalRouteName);
      if (config.caseStyle === "allow-kebab-for-camel" && !next) {
        next = current.getRoutingTargetForInput(camelCaseRouteName);
        if (next) {
          internalRouteName = camelCaseRouteName;
        }
      }
      if (!next) {
        const defaultCommand = current.getDefaultCommand();
        if (defaultCommand) {
          rootLevel = false;
          parent = [current, ""];
          unprocessedInputs.push(input);
          current = defaultCommand;
          return;
        }
        return { input, routeMap: current };
      }
      rootLevel = false;
      parent = [current, input];
      current = next;
      prefix.push(input);
    },
    finish: () => {
      target = target ?? current;
      if (target.kind === RouteMapSymbol && !helpRequested) {
        const defaultCommand = target.getDefaultCommand();
        if (defaultCommand) {
          parent = [target, ""];
          target = defaultCommand;
          rootLevel = false;
        }
      }
      const aliases = parent ? parent[0].getOtherAliasesForInput(parent[1], config.caseStyle) : { original: [], "convert-camel-to-kebab": [] };
      return {
        target,
        unprocessedInputs,
        helpRequested,
        prefix,
        rootLevel,
        aliases
      };
    }
  };
}
async function runApplication({ root, defaultText, config }, rawInputs, context) {
  let text = defaultText;
  if (context.locale) {
    const localeText = config.localization.loadText(context.locale);
    if (localeText) {
      text = localeText;
    } else {
      const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, config.documentation);
      const warningMessage = text.noTextAvailableForLocale({
        requestedLocale: context.locale,
        defaultLocale: config.localization.defaultLocale,
        ansiColor
      });
      context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[33m${warningMessage}\x1B[39m\x1B[22m
` : `${warningMessage}
`);
    }
  }
  if (config.versionInfo?.getLatestVersion && !checkEnvironmentVariable(context.process, "STRICLI_SKIP_VERSION_CHECK")) {
    let currentVersion;
    if ("currentVersion" in config.versionInfo) {
      currentVersion = config.versionInfo.currentVersion;
    } else {
      currentVersion = await config.versionInfo.getCurrentVersion.call(context);
    }
    const latestVersion = await config.versionInfo.getLatestVersion.call(context, currentVersion);
    if (latestVersion && currentVersion !== latestVersion) {
      const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, config.documentation);
      const warningMessage = text.currentVersionIsNotLatest({
        currentVersion,
        latestVersion,
        upgradeCommand: config.versionInfo.upgradeCommand,
        ansiColor
      });
      context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[33m${warningMessage}\x1B[39m\x1B[22m
` : `${warningMessage}
`);
    }
  }
  const inputs = rawInputs.slice();
  if (config.versionInfo && (inputs[0] === "--version" || inputs[0] === "-v")) {
    let currentVersion;
    if ("currentVersion" in config.versionInfo) {
      currentVersion = config.versionInfo.currentVersion;
    } else {
      currentVersion = await config.versionInfo.getCurrentVersion.call(context);
    }
    context.process.stdout.write(currentVersion + `
`);
    return ExitCode.Success;
  }
  const scanner = buildRouteScanner(root, config.scanner, [config.name]);
  let error;
  while (inputs.length > 0 && !error) {
    const arg = inputs.shift();
    error = scanner.next(arg);
  }
  if (error) {
    const routeNames = listAllRouteNamesAndAliasesForScan(error.routeMap, config.scanner.caseStyle, config.completion);
    const corrections = filterClosestAlternatives(error.input, routeNames, config.scanner.distanceOptions).map((str) => `\`${str}\``);
    const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, config.documentation);
    const errorMessage = text.noCommandRegisteredForInput({ input: error.input, corrections, ansiColor });
    context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m
` : `${errorMessage}
`);
    return ExitCode.UnknownCommand;
  }
  const result = scanner.finish();
  if (result.helpRequested || result.target.kind === RouteMapSymbol) {
    const ansiColor = shouldUseAnsiColor(context.process, context.process.stdout, config.documentation);
    context.process.stdout.write(result.target.formatHelp({
      prefix: result.prefix,
      includeVersionFlag: Boolean(config.versionInfo) && result.rootLevel,
      includeArgumentEscapeSequenceFlag: config.scanner.allowArgumentEscapeSequence,
      includeHelpAllFlag: result.helpRequested === "all" || config.documentation.alwaysShowHelpAllFlag,
      includeHidden: result.helpRequested === "all",
      config: config.documentation,
      aliases: result.aliases[config.documentation.caseStyle],
      text,
      ansiColor
    }));
    return ExitCode.Success;
  }
  let commandContext;
  if ("forCommand" in context) {
    try {
      commandContext = await context.forCommand({ prefix: result.prefix });
    } catch (exc) {
      const ansiColor = shouldUseAnsiColor(context.process, context.process.stderr, config.documentation);
      const errorMessage = text.exceptionWhileLoadingCommandContext(exc, ansiColor);
      context.process.stderr.write(ansiColor ? `\x1B[1m\x1B[31m${errorMessage}\x1B[39m\x1B[22m` : errorMessage);
      return ExitCode.ContextLoadError;
    }
  } else {
    commandContext = context;
  }
  return runCommand(result.target, {
    context: commandContext,
    inputs: result.unprocessedInputs,
    scannerConfig: config.scanner,
    documentationConfig: config.documentation,
    errorFormatting: text,
    determineExitCode: config.determineExitCode
  });
}
function formatForDisplay(flagName, displayCaseStyle) {
  if (displayCaseStyle === "convert-camel-to-kebab") {
    return convertCamelCaseToKebabCase(flagName);
  }
  return flagName;
}
function formatAsNegated(flagName, displayCaseStyle) {
  if (displayCaseStyle === "convert-camel-to-kebab") {
    return `no-${convertCamelCaseToKebabCase(flagName)}`;
  }
  return `no${flagName[0].toUpperCase()}${flagName.slice(1)}`;
}
function withDefaults(config) {
  const scannerCaseStyle = config.scanner?.caseStyle ?? "original";
  let displayCaseStyle;
  if (config.documentation?.caseStyle) {
    if (scannerCaseStyle === "original" && config.documentation.caseStyle === "convert-camel-to-kebab") {
      throw new InternalError("Cannot convert route and flag names on display but scan as original");
    }
    displayCaseStyle = config.documentation.caseStyle;
  } else if (scannerCaseStyle === "allow-kebab-for-camel") {
    displayCaseStyle = "convert-camel-to-kebab";
  } else {
    displayCaseStyle = scannerCaseStyle;
  }
  const scannerConfig = {
    caseStyle: scannerCaseStyle,
    allowArgumentEscapeSequence: config.scanner?.allowArgumentEscapeSequence ?? false,
    distanceOptions: config.scanner?.distanceOptions ?? {
      threshold: 7,
      weights: {
        insertion: 1,
        deletion: 3,
        substitution: 2,
        transposition: 0
      }
    }
  };
  const documentationConfig = {
    alwaysShowHelpAllFlag: config.documentation?.alwaysShowHelpAllFlag ?? false,
    useAliasInUsageLine: config.documentation?.useAliasInUsageLine ?? false,
    onlyRequiredInUsageLine: config.documentation?.onlyRequiredInUsageLine ?? false,
    caseStyle: displayCaseStyle,
    disableAnsiColor: config.documentation?.disableAnsiColor ?? false
  };
  const completionConfig = {
    includeAliases: config.completion?.includeAliases ?? documentationConfig.useAliasInUsageLine,
    includeHiddenRoutes: config.completion?.includeHiddenRoutes ?? false,
    ...config.completion
  };
  return {
    ...config,
    scanner: scannerConfig,
    completion: completionConfig,
    documentation: documentationConfig,
    localization: {
      defaultLocale: "en",
      loadText: defaultTextLoader,
      ...config.localization
    }
  };
}
function buildApplication(root, appConfig) {
  const config = withDefaults(appConfig);
  if (root.kind === CommandSymbol && config.versionInfo) {
    if (root.usesFlag("version")) {
      throw new InternalError("Unable to use command with flag --version as root when version info is supplied");
    }
    if (root.usesFlag("v")) {
      throw new InternalError("Unable to use command with alias -v as root when version info is supplied");
    }
  }
  const defaultText = config.localization.loadText(config.localization.defaultLocale);
  if (!defaultText) {
    throw new InternalError(`No text available for the default locale "${config.localization.defaultLocale}"`);
  }
  return {
    root,
    config,
    defaultText
  };
}
function hasDefault(flag) {
  return "default" in flag && typeof flag.default !== "undefined";
}
function isOptionalAtRuntime(flag) {
  return flag.optional ?? hasDefault(flag);
}
function wrapRequiredFlag(text) {
  return `(${text})`;
}
function wrapOptionalFlag(text) {
  return `[${text}]`;
}
function wrapVariadicFlag(text) {
  return `${text}...`;
}
function wrapRequiredParameter(text) {
  return `<${text}>`;
}
function wrapOptionalParameter(text) {
  return `[<${text}>]`;
}
function wrapVariadicParameter(text) {
  return `<${text}>...`;
}
function formatUsageLineForParameters(parameters, args) {
  const flagsUsage = Object.entries(parameters.flags ?? {}).filter(([, flag]) => {
    if (flag.hidden) {
      return false;
    }
    if (args.config.onlyRequiredInUsageLine && isOptionalAtRuntime(flag)) {
      return false;
    }
    return true;
  }).map(([name, flag]) => {
    let displayName = args.config.caseStyle === "convert-camel-to-kebab" ? `--${convertCamelCaseToKebabCase(name)}` : `--${name}`;
    if (parameters.aliases && args.config.useAliasInUsageLine) {
      const aliases = Object.entries(parameters.aliases).filter((entry) => entry[1] === name);
      if (aliases.length === 1 && aliases[0]) {
        displayName = `-${aliases[0][0]}`;
      }
    }
    if (flag.kind === "boolean") {
      return [flag, displayName];
    }
    if (flag.kind === "enum" && typeof flag.placeholder !== "string") {
      return [flag, `${displayName} ${flag.values.join("|")}`];
    }
    const placeholder = flag.placeholder ?? "value";
    return [flag, `${displayName} ${placeholder}`];
  }).map(([flag, usage]) => {
    if (flag.kind === "parsed" && flag.variadic) {
      if (isOptionalAtRuntime(flag)) {
        return wrapVariadicFlag(wrapOptionalFlag(usage));
      }
      return wrapVariadicFlag(wrapRequiredFlag(usage));
    }
    if (isOptionalAtRuntime(flag)) {
      return wrapOptionalFlag(usage);
    }
    return wrapRequiredFlag(usage);
  });
  let positionalUsage = [];
  const positional = parameters.positional;
  if (positional) {
    if (positional.kind === "array") {
      positionalUsage = [wrapVariadicParameter(positional.parameter.placeholder ?? "args")];
    } else {
      let parameters2 = positional.parameters;
      if (args.config.onlyRequiredInUsageLine) {
        parameters2 = parameters2.filter((param) => !param.optional && typeof param.default === "undefined");
      }
      positionalUsage = parameters2.map((param, i) => {
        const argName = param.placeholder ?? `arg${i + 1}`;
        return param.optional || typeof param.default !== "undefined" ? wrapOptionalParameter(argName) : wrapRequiredParameter(argName);
      });
    }
  }
  return [...args.prefix, ...flagsUsage, ...positionalUsage].join(" ");
}
function formatDocumentationForFlagParameters(flags, aliases, args) {
  const { keywords, briefs } = args.text;
  const visibleFlags = Object.entries(flags).filter(([, flag]) => {
    if (flag.hidden && !args.includeHidden) {
      return false;
    }
    return true;
  });
  const atLeastOneOptional = visibleFlags.some(([, flag]) => isOptionalAtRuntime(flag));
  const rows = visibleFlags.map(([name, flag]) => {
    const aliasStrings = Object.entries(aliases).filter((entry) => entry[1] === name).map(([alias]) => `-${alias}`);
    let flagName = "--" + formatForDisplay(name, args.config.caseStyle);
    if (flag.kind === "boolean" && flag.default !== false && flag.withNegated !== false) {
      const negatedFlagName = formatAsNegated(name, args.config.caseStyle);
      flagName = `${flagName}/--${negatedFlagName}`;
    }
    if (isOptionalAtRuntime(flag)) {
      flagName = `[${flagName}]`;
    } else if (atLeastOneOptional) {
      flagName = ` ${flagName}`;
    }
    if (flag.kind === "parsed" && flag.variadic) {
      flagName = `${flagName}...`;
    }
    const suffixParts = [];
    if (flag.kind === "enum") {
      const choices = flag.values.join("|");
      suffixParts.push(choices);
    }
    if (hasDefault(flag)) {
      const defaultKeyword = args.ansiColor ? `\x1B[2m${keywords.default}\x1B[22m` : keywords.default;
      let defaultValue;
      if (Array.isArray(flag.default)) {
        if (flag.default.length === 0) {
          defaultValue = "[]";
        } else {
          const separator = "variadic" in flag && typeof flag.variadic === "string" ? flag.variadic : " ";
          defaultValue = flag.default.join(separator);
        }
      } else {
        defaultValue = flag.default === "" ? `""` : String(flag.default);
      }
      suffixParts.push(`${defaultKeyword} ${defaultValue}`);
    }
    if ("variadic" in flag && typeof flag.variadic === "string") {
      const separatorKeyword = args.ansiColor ? `\x1B[2m${keywords.separator}\x1B[22m` : keywords.separator;
      suffixParts.push(`${separatorKeyword} ${flag.variadic}`);
    }
    const suffix = suffixParts.length > 0 ? `[${suffixParts.join(", ")}]` : undefined;
    return {
      aliases: aliasStrings.join(" "),
      flagName,
      brief: flag.brief,
      suffix,
      hidden: flag.hidden
    };
  });
  rows.push({
    aliases: "-h",
    flagName: atLeastOneOptional ? " --help" : "--help",
    brief: briefs.help
  });
  if (args.includeHelpAllFlag) {
    const helpAllFlagName = formatForDisplay("helpAll", args.config.caseStyle);
    rows.push({
      aliases: "-H",
      flagName: atLeastOneOptional ? ` --${helpAllFlagName}` : `--${helpAllFlagName}`,
      brief: briefs.helpAll,
      hidden: !args.config.alwaysShowHelpAllFlag
    });
  }
  if (args.includeVersionFlag) {
    rows.push({
      aliases: "-v",
      flagName: atLeastOneOptional ? " --version" : "--version",
      brief: briefs.version
    });
  }
  if (args.includeArgumentEscapeSequenceFlag) {
    rows.push({
      aliases: "",
      flagName: atLeastOneOptional ? " --" : "--",
      brief: briefs.argumentEscapeSequence
    });
  }
  return formatRowsWithColumns(rows.map((row) => {
    if (!args.ansiColor) {
      return [row.aliases, row.flagName, row.brief, row.suffix ?? ""];
    }
    return [
      row.hidden ? `\x1B[2m${row.aliases}\x1B[22m` : `\x1B[1m${row.aliases}\x1B[22m`,
      row.hidden ? `\x1B[2m${row.flagName}\x1B[22m` : `\x1B[1m${row.flagName}\x1B[22m`,
      row.hidden ? `\x1B[2;3m${row.brief}\x1B[22;23m` : `\x1B[;;3m${row.brief}\x1B[;;;23m`,
      row.suffix ?? ""
    ];
  }), [" ", "  ", " "]);
}
function* generateBuiltInFlagUsageLines(args) {
  yield args.config.useAliasInUsageLine ? "-h" : "--help";
  if (args.includeHelpAllFlag) {
    const helpAllFlagName = formatForDisplay("helpAll", args.config.caseStyle);
    yield args.config.useAliasInUsageLine ? "-H" : `--${helpAllFlagName}`;
  }
  if (args.includeVersionFlag) {
    yield args.config.useAliasInUsageLine ? "-v" : "--version";
  }
}
function formatDocumentationForPositionalParameters(positional, args) {
  if (positional.kind === "array") {
    const name = positional.parameter.placeholder ?? "args";
    const argName = args.ansiColor ? `\x1B[1m${name}...\x1B[22m` : `${name}...`;
    const brief = args.ansiColor ? `\x1B[3m${positional.parameter.brief}\x1B[23m` : positional.parameter.brief;
    return formatRowsWithColumns([[argName, brief]], ["  "]);
  }
  const { keywords } = args.text;
  const atLeastOneOptional = positional.parameters.some((def) => def.optional);
  return formatRowsWithColumns(positional.parameters.map((def, i) => {
    let name = def.placeholder ?? `arg${i + 1}`;
    let suffix;
    if (def.optional) {
      name = `[${name}]`;
    } else if (atLeastOneOptional) {
      name = ` ${name}`;
    }
    if (def.default) {
      const defaultKeyword = args.ansiColor ? `\x1B[2m${keywords.default}\x1B[22m` : keywords.default;
      suffix = `[${defaultKeyword} ${def.default}]`;
    }
    return [
      args.ansiColor ? `\x1B[1m${name}\x1B[22m` : name,
      args.ansiColor ? `\x1B[3m${def.brief}\x1B[23m` : def.brief,
      suffix ?? ""
    ];
  }), ["  ", " "]);
}
function* generateCommandHelpLines(parameters, docs, args) {
  const { brief, fullDescription, customUsage } = docs;
  const { headers } = args.text;
  const prefix = args.prefix.join(" ");
  yield args.ansiColor ? `\x1B[4m${headers.usage}\x1B[24m` : headers.usage;
  if (customUsage) {
    for (const usage of customUsage) {
      if (typeof usage === "string") {
        yield `  ${prefix} ${usage}`;
      } else {
        const brief2 = args.ansiColor ? `\x1B[3m${usage.brief}\x1B[23m` : usage.brief;
        yield `  ${prefix} ${usage.input}
    ${brief2}`;
      }
    }
  } else {
    yield `  ${formatUsageLineForParameters(parameters, args)}`;
  }
  for (const line of generateBuiltInFlagUsageLines(args)) {
    yield `  ${prefix} ${line}`;
  }
  yield "";
  yield fullDescription ?? brief;
  if (args.aliases && args.aliases.length > 0) {
    const aliasPrefix = args.prefix.slice(0, -1).join(" ");
    yield "";
    yield args.ansiColor ? `\x1B[4m${headers.aliases}\x1B[24m` : headers.aliases;
    for (const alias of args.aliases) {
      yield `  ${aliasPrefix} ${alias}`;
    }
  }
  yield "";
  yield args.ansiColor ? `\x1B[4m${headers.flags}\x1B[24m` : headers.flags;
  for (const line of formatDocumentationForFlagParameters(parameters.flags ?? {}, parameters.aliases ?? {}, args)) {
    yield `  ${line}`;
  }
  const positional = parameters.positional ?? { kind: "tuple", parameters: [] };
  if (positional.kind === "array" || positional.parameters.length > 0) {
    yield "";
    yield args.ansiColor ? `\x1B[4m${headers.arguments}\x1B[24m` : headers.arguments;
    for (const line of formatDocumentationForPositionalParameters(positional, args)) {
      yield `  ${line}`;
    }
  }
}
function checkForReservedFlags(flags, reserved) {
  for (const flag of reserved) {
    if (flag in flags) {
      throw new InternalError(`Unable to use reserved flag --${flag}`);
    }
  }
}
function checkForReservedAliases(aliases, reserved) {
  for (const alias of reserved) {
    if (alias in aliases) {
      throw new InternalError(`Unable to use reserved alias -${alias}`);
    }
  }
}
function* asNegationFlagNames(flagName) {
  yield `no-${convertCamelCaseToKebabCase(flagName)}`;
  yield `no${flagName[0].toUpperCase()}${flagName.slice(1)}`;
}
function checkForNegationCollisions(flags) {
  const flagsAllowingNegation = Object.entries(flags).filter(([, flag]) => flag.kind === "boolean" && !flag.optional);
  for (const [internalFlagName] of flagsAllowingNegation) {
    for (const negatedFlagName of asNegationFlagNames(internalFlagName)) {
      if (negatedFlagName in flags) {
        throw new InternalError(`Unable to allow negation for --${internalFlagName} as it conflicts with --${negatedFlagName}`);
      }
    }
  }
}
function checkForInvalidVariadicSeparators(flags) {
  for (const [internalFlagName, flag] of Object.entries(flags)) {
    if ("variadic" in flag && typeof flag.variadic === "string") {
      if (flag.variadic.length < 1) {
        throw new InternalError(`Unable to use "" as variadic separator for --${internalFlagName} as it is empty`);
      }
      if (/\s/.test(flag.variadic)) {
        throw new InternalError(`Unable to use "${flag.variadic}" as variadic separator for --${internalFlagName} as it contains whitespace`);
      }
    }
  }
}
function buildCommand(builderArgs) {
  const { flags = {}, aliases = {} } = builderArgs.parameters;
  checkForReservedFlags(flags, ["help", "helpAll", "help-all"]);
  checkForReservedAliases(aliases, ["h", "H"]);
  checkForNegationCollisions(flags);
  checkForInvalidVariadicSeparators(flags);
  let loader;
  if ("func" in builderArgs) {
    loader = async () => builderArgs.func;
  } else {
    loader = builderArgs.loader;
  }
  return {
    kind: CommandSymbol,
    loader,
    parameters: builderArgs.parameters,
    get brief() {
      return builderArgs.docs.brief;
    },
    get fullDescription() {
      return builderArgs.docs.fullDescription;
    },
    formatUsageLine: (args) => {
      return formatUsageLineForParameters(builderArgs.parameters, args);
    },
    formatHelp: (args) => {
      const lines = [
        ...generateCommandHelpLines(builderArgs.parameters, builderArgs.docs, args)
      ];
      const text = lines.join(`
`);
      return text + `
`;
    },
    usesFlag: (flagName) => {
      return Boolean(flagName in flags || flagName in aliases);
    }
  };
}
function* generateRouteMapHelpLines(routes, docs, args) {
  const { brief, fullDescription, hideRoute } = docs;
  const { headers } = args.text;
  yield args.ansiColor ? `\x1B[4m${headers.usage}\x1B[24m` : headers.usage;
  for (const [name, route] of Object.entries(routes)) {
    if (!hideRoute || !hideRoute[name] || args.includeHidden) {
      const externalRouteName = args.config.caseStyle === "convert-camel-to-kebab" ? convertCamelCaseToKebabCase(name) : name;
      yield `  ${route.formatUsageLine({
        ...args,
        prefix: [...args.prefix, externalRouteName]
      })}`;
    }
  }
  const prefix = args.prefix.join(" ");
  for (const line of generateBuiltInFlagUsageLines(args)) {
    yield `  ${prefix} ${line}`;
  }
  yield "";
  yield fullDescription ?? brief;
  if (args.aliases && args.aliases.length > 0) {
    const aliasPrefix = args.prefix.slice(0, -1).join(" ");
    yield "";
    yield args.ansiColor ? `\x1B[4m${headers.aliases}\x1B[24m` : headers.aliases;
    for (const alias of args.aliases) {
      yield `  ${aliasPrefix} ${alias}`;
    }
  }
  yield "";
  yield args.ansiColor ? `\x1B[4m${headers.flags}\x1B[24m` : headers.flags;
  for (const line of formatDocumentationForFlagParameters({}, {}, args)) {
    yield `  ${line}`;
  }
  yield "";
  yield args.ansiColor ? `\x1B[4m${headers.commands}\x1B[24m` : headers.commands;
  const visibleRoutes = Object.entries(routes).filter(([name]) => !hideRoute || !hideRoute[name] || args.includeHidden);
  const rows = visibleRoutes.map(([internalRouteName, route]) => {
    const externalRouteName = formatForDisplay(internalRouteName, args.config.caseStyle);
    return {
      routeName: externalRouteName,
      brief: route.brief,
      hidden: hideRoute && hideRoute[internalRouteName]
    };
  });
  const formattedRows = formatRowsWithColumns(rows.map((row) => {
    if (!args.ansiColor) {
      return [row.routeName, row.brief];
    }
    return [
      row.hidden ? `\x1B[2m${row.routeName}\x1B[22m` : `\x1B[1m${row.routeName}\x1B[32m`,
      row.hidden ? `\x1B[2;3m${row.brief}\x1B[22;23m` : `\x1B[;;3m${row.brief}\x1B[;;;23m`
    ];
  }), ["  "]);
  for (const line of formattedRows) {
    yield `  ${line}`;
  }
}
function buildRouteMap({
  routes,
  defaultCommand: defaultCommandRoute,
  docs,
  aliases
}) {
  if (Object.entries(routes).length === 0) {
    throw new InternalError("Route map must contain at least one route");
  }
  const activeAliases = aliases ?? {};
  const aliasesByRoute = /* @__PURE__ */ new Map;
  for (const [alias, routeName] of Object.entries(activeAliases)) {
    if (alias in routes) {
      throw new InternalError(`Cannot use "${alias}" as an alias when a route with that name already exists`);
    }
    const routeAliases = aliasesByRoute.get(routeName) ?? [];
    aliasesByRoute.set(routeName, [...routeAliases, alias]);
  }
  const defaultCommand = defaultCommandRoute ? routes[defaultCommandRoute] : undefined;
  if (defaultCommand && defaultCommand.kind === RouteMapSymbol) {
    throw new InternalError(`Cannot use "${defaultCommandRoute}" as the default command because it is not a Command`);
  }
  const resolveRouteName = (input) => {
    if (input in activeAliases) {
      return activeAliases[input];
    } else if (input in routes) {
      return input;
    }
  };
  return {
    kind: RouteMapSymbol,
    get brief() {
      return docs.brief;
    },
    get fullDescription() {
      return docs.fullDescription;
    },
    formatUsageLine(args) {
      const routeNames = this.getAllEntries().filter((entry) => !entry.hidden).map((entry) => entry.name[args.config.caseStyle]);
      return `${args.prefix.join(" ")} ${routeNames.join("|")} ...`;
    },
    formatHelp: (config) => {
      const lines = [...generateRouteMapHelpLines(routes, docs, config)];
      const text = lines.join(`
`);
      return text + `
`;
    },
    getDefaultCommand: () => {
      return defaultCommand;
    },
    getOtherAliasesForInput: (input, caseStyle) => {
      if (defaultCommandRoute) {
        if (input === defaultCommandRoute) {
          return {
            original: [""],
            "convert-camel-to-kebab": [""]
          };
        }
        if (input === "") {
          return {
            original: [defaultCommandRoute],
            "convert-camel-to-kebab": [defaultCommandRoute]
          };
        }
      }
      const camelInput = convertKebabCaseToCamelCase(input);
      let routeName = resolveRouteName(input);
      if (!routeName && caseStyle === "allow-kebab-for-camel") {
        routeName = resolveRouteName(camelInput);
      }
      if (!routeName) {
        return {
          original: [],
          "convert-camel-to-kebab": []
        };
      }
      const otherAliases = [routeName, ...aliasesByRoute.get(routeName) ?? []].filter((alias) => alias !== input && alias !== camelInput);
      return {
        original: otherAliases,
        "convert-camel-to-kebab": otherAliases.map(convertCamelCaseToKebabCase)
      };
    },
    getRoutingTargetForInput: (input) => {
      const routeName = input in activeAliases ? activeAliases[input] : input;
      return routes[routeName];
    },
    getAllEntries() {
      const hiddenRoutes = docs.hideRoute;
      return Object.entries(routes).map(([originalRouteName, target]) => {
        return {
          name: {
            original: originalRouteName,
            "convert-camel-to-kebab": convertCamelCaseToKebabCase(originalRouteName)
          },
          target,
          aliases: aliasesByRoute.get(originalRouteName) ?? [],
          hidden: hiddenRoutes?.[originalRouteName] ?? false
        };
      });
    }
  };
}
async function run(app, inputs, context) {
  const exitCode = await runApplication(app, inputs, context);
  context.process.exitCode = exitCode;
}
// package.json
var package_default = {
  name: "rudel",
  version: "0.1.11",
  type: "module",
  description: "CLI for the Coding Agent Analytics Platform rudel.ai",
  license: "MIT",
  homepage: "https://app.rudel.ai",
  repository: {
    type: "git",
    url: "https://github.com/obsessiondb/rudel.git",
    directory: "apps/cli"
  },
  bugs: {
    url: "https://github.com/obsessiondb/rudel/issues"
  },
  keywords: [
    "claude",
    "claude-code",
    "analytics",
    "session",
    "transcript",
    "coding-agent"
  ],
  author: "ObsessionDB",
  bin: {
    rudel: "./dist/cli.js"
  },
  files: [
    "dist",
    "README.md"
  ],
  scripts: {
    dev: "bun run src/bin/cli.ts",
    "check-types": "tsc --noEmit",
    build: "bun build src/bin/cli.ts --outdir dist --target node",
    test: "bun test"
  },
  dependencies: {
    "@clack/prompts": "^1.0.1",
    "@logtape/file": "^2.0.4",
    "@logtape/logtape": "^2.0.4",
    "@orpc/client": "^1.13.5",
    "@orpc/contract": "^1.13.5",
    "@stricli/core": "^1.2.5",
    "p-map": "^7.0.4"
  },
  devDependencies: {
    "@rudel/agent-adapters": "workspace:*",
    "@rudel/api-routes": "workspace:*",
    "@rudel/typescript-config": "workspace:*",
    "@types/node": "^22",
    "bun-types": "latest",
    typescript: "5.9.2"
  }
};

// ../../packages/agent-adapters/src/adapters/claude-code/index.ts
import { readdir as readdir2, readFile as readFile2, stat } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname2, join as join3 } from "node:path";

// ../../node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// ../../node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// ../../node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// ../../packages/ch-schema/src/generated/chkit-types.ts
var RudelClaudeSessionsRowSchema = exports_external.object({
  session_date: exports_external.string(),
  last_interaction_date: exports_external.string(),
  session_id: exports_external.string(),
  organization_id: exports_external.string(),
  project_path: exports_external.string(),
  git_remote: exports_external.string(),
  package_name: exports_external.string(),
  package_type: exports_external.string(),
  content: exports_external.string(),
  ingested_at: exports_external.string(),
  user_id: exports_external.string(),
  git_branch: exports_external.string().nullable(),
  git_sha: exports_external.string().nullable(),
  tag: exports_external.string().nullable(),
  subagents: exports_external.record(exports_external.string(), exports_external.string())
});
var RudelCodexSessionsRowSchema = exports_external.object({
  session_date: exports_external.string(),
  last_interaction_date: exports_external.string(),
  session_id: exports_external.string(),
  organization_id: exports_external.string(),
  project_path: exports_external.string(),
  git_remote: exports_external.string(),
  package_name: exports_external.string(),
  package_type: exports_external.string(),
  content: exports_external.string(),
  ingested_at: exports_external.string(),
  user_id: exports_external.string(),
  git_branch: exports_external.string().nullable(),
  git_sha: exports_external.string().nullable(),
  tag: exports_external.string().nullable()
});
var RudelSessionAnalyticsRowSchema = exports_external.object({
  session_date: exports_external.string(),
  last_interaction_date: exports_external.string(),
  session_id: exports_external.string(),
  organization_id: exports_external.string(),
  project_path: exports_external.string(),
  git_remote: exports_external.string(),
  package_name: exports_external.string(),
  package_type: exports_external.string(),
  content: exports_external.string(),
  subagents: exports_external.record(exports_external.string(), exports_external.string()),
  skills: exports_external.array(exports_external.string()),
  slash_commands: exports_external.array(exports_external.string()),
  subagent_types: exports_external.array(exports_external.string()),
  ingested_at: exports_external.string(),
  user_id: exports_external.string(),
  git_branch: exports_external.string().nullable(),
  git_sha: exports_external.string().nullable(),
  input_tokens: exports_external.string(),
  output_tokens: exports_external.string(),
  cache_read_input_tokens: exports_external.string(),
  cache_creation_input_tokens: exports_external.string(),
  total_tokens: exports_external.string(),
  tag: exports_external.string().nullable(),
  source: exports_external.string(),
  total_interactions: exports_external.number(),
  actual_duration_min: exports_external.number(),
  avg_period_sec: exports_external.number(),
  median_period_sec: exports_external.number(),
  quick_responses: exports_external.number(),
  normal_responses: exports_external.number(),
  long_pauses: exports_external.number(),
  error_count: exports_external.number(),
  model_used: exports_external.string(),
  has_commit: exports_external.number(),
  session_archetype: exports_external.string(),
  success_score: exports_external.number(),
  used_plan_mode: exports_external.number(),
  inference_duration_sec: exports_external.number(),
  human_duration_sec: exports_external.number()
});

// ../../packages/ch-schema/src/generated/chkit-ingest.ts
async function ingestRudelClaudeSessions(ingestor, rows, options) {
  const data = options?.validate ? rows.map((row) => RudelClaudeSessionsRowSchema.parse(row)) : rows;
  await ingestor.insert({ table: "rudel.claude_sessions", values: data });
}
async function ingestRudelCodexSessions(ingestor, rows, options) {
  const data = options?.validate ? rows.map((row) => RudelCodexSessionsRowSchema.parse(row)) : rows;
  await ingestor.insert({ table: "rudel.codex_sessions", values: data });
}
// ../../packages/agent-adapters/src/utils.ts
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
function toClickHouseDateTime(isoString) {
  return isoString.replace("T", " ").replace("Z", "").replace(/\+.*$/, "");
}
async function readFileWithRetry(filePath, maxRetries = 5) {
  const delayMs = 500;
  for (let attempt = 1;attempt <= maxRetries; attempt++) {
    try {
      return await readFile(filePath, "utf-8");
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to read file: ${filePath}`);
}
async function readJsonlFirstLine(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const firstLine = content.split(`
`)[0];
    if (!firstLine)
      return null;
    return JSON.parse(firstLine);
  } catch {
    return null;
  }
}
async function walkJsonlFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry.endsWith(".jsonl")) {
      results.push(fullPath);
    } else if (!entry.includes(".")) {
      const nested = await walkJsonlFiles(fullPath);
      results.push(...nested);
    }
  }
  return results;
}
function toDisplayPath(absolutePath) {
  const home = homedir();
  return absolutePath.startsWith(home) ? `~${absolutePath.slice(home.length)}` : absolutePath;
}

// ../../packages/agent-adapters/src/adapters/claude-code/settings.ts
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join as join2, resolve } from "node:path";
var HOOK_COMMAND = "rudel hooks claude session-end";
function findClaudeDir() {
  let dir = resolve(process.cwd());
  while (dir !== dirname(dir)) {
    const candidate = join2(dir, ".claude");
    if (existsSync(candidate)) {
      return candidate;
    }
    dir = dirname(dir);
  }
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    return join2(gitRoot, ".claude");
  } catch {
    return join2(resolve(process.cwd()), ".claude");
  }
}
function getClaudeSettingsPath() {
  return join2(findClaudeDir(), "settings.json");
}
function readClaudeSettings() {
  const path = getClaudeSettingsPath();
  if (!existsSync(path))
    return {};
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content);
}
function writeClaudeSettings(settings) {
  const path = getClaudeSettingsPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(settings, null, 2)}
`);
}
function isHookEnabled() {
  const settings = readClaudeSettings();
  const entries = settings.hooks?.SessionEnd;
  if (!Array.isArray(entries))
    return false;
  return entries.some((entry) => entry.hooks?.some((h) => h.command === HOOK_COMMAND));
}
function addHook() {
  const settings = readClaudeSettings();
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!Array.isArray(settings.hooks.SessionEnd)) {
    settings.hooks.SessionEnd = [];
  }
  const alreadyExists = settings.hooks.SessionEnd.some((entry) => entry.hooks?.some((h) => h.command === HOOK_COMMAND));
  if (alreadyExists)
    return;
  settings.hooks.SessionEnd.push({
    matcher: "",
    hooks: [{ type: "command", command: HOOK_COMMAND, async: true }]
  });
  writeClaudeSettings(settings);
}
function removeHook() {
  const settings = readClaudeSettings();
  const hooks = settings.hooks;
  const entries = hooks?.SessionEnd;
  if (!hooks || !Array.isArray(entries))
    return;
  hooks.SessionEnd = entries.filter((entry) => !entry.hooks?.some((h) => h.command === HOOK_COMMAND));
  if (hooks.SessionEnd.length === 0) {
    delete hooks.SessionEnd;
  }
  if (Object.keys(hooks).length === 0) {
    delete settings.hooks;
  }
  writeClaudeSettings(settings);
}

// ../../packages/agent-adapters/src/adapters/claude-code/index.ts
var SESSIONS_BASE_DIR = join3(homedir2(), ".claude", "projects");
function encodeProjectPath(projectPath) {
  return projectPath.replace(/\//g, "-");
}
async function decodeProjectPath(encodedDir) {
  const parts = encodedDir.replace(/^-/, "").split("-");
  async function findPath(partIndex, currentPath) {
    if (partIndex >= parts.length) {
      try {
        await stat(currentPath);
        return currentPath;
      } catch {
        return null;
      }
    }
    for (let endIndex = parts.length;endIndex > partIndex; endIndex--) {
      const segment = parts.slice(partIndex, endIndex).join("-");
      const testPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`;
      try {
        await stat(testPath);
        if (endIndex === parts.length) {
          return testPath;
        }
        const result2 = await findPath(endIndex, testPath);
        if (result2) {
          return result2;
        }
      } catch {}
    }
    return null;
  }
  const result = await findPath(0, "");
  if (result) {
    return result;
  }
  return `/${parts.join("/")}`;
}
function extractAgentIds(sessionContent) {
  const agentIds = new Set;
  for (const line of sessionContent.split(`
`)) {
    if (!line.trim())
      continue;
    try {
      const entry = JSON.parse(line);
      if (entry.toolUseResult?.agentId) {
        agentIds.add(entry.toolUseResult.agentId);
      }
    } catch {}
  }
  return Array.from(agentIds);
}
async function readSubagentFiles(sessionDir, agentIds, sessionId) {
  const subagents = [];
  for (const agentId of agentIds) {
    const possiblePaths = [
      join3(sessionDir, `agent-${agentId}.jsonl`),
      ...sessionId ? [join3(sessionDir, sessionId, "subagents", `agent-${agentId}.jsonl`)] : []
    ];
    for (const agentPath of possiblePaths) {
      try {
        const content = await readFile2(agentPath, "utf-8");
        subagents.push({ agentId, content });
        break;
      } catch {}
    }
  }
  return subagents;
}

class ClaudeCodeAdapter {
  name = "Claude Code";
  source = "claude_code";
  rawTableName = "rudel.claude_sessions";
  getSessionsBaseDir() {
    return SESSIONS_BASE_DIR;
  }
  async findProjectSessions(projectPath) {
    const encoded = encodeProjectPath(projectPath);
    const sessionDir = join3(SESSIONS_BASE_DIR, encoded);
    const files = await this.listSessionFiles(sessionDir, projectPath);
    if (files.length > 0)
      return files;
    return this.findByDecoding(projectPath);
  }
  async scanAllSessions() {
    let projectDirs;
    try {
      projectDirs = await readdir2(SESSIONS_BASE_DIR);
    } catch {
      return [];
    }
    const projects = [];
    for (const dir of projectDirs) {
      const sessionDir = `${SESSIONS_BASE_DIR}/${dir}`;
      let files;
      try {
        files = await readdir2(sessionDir);
      } catch {
        continue;
      }
      const sessionFiles = files.filter((f) => f.endsWith(".jsonl") && !f.startsWith("agent-"));
      if (sessionFiles.length === 0)
        continue;
      const decodedPath = await decodeProjectPath(dir);
      const sessions = sessionFiles.map((f) => ({
        sessionId: f.replace(/\.jsonl$/, ""),
        transcriptPath: join3(sessionDir, f),
        projectPath: decodedPath
      }));
      projects.push({
        source: this.source,
        projectPath: decodedPath,
        displayPath: toDisplayPath(decodedPath),
        sessions,
        sessionCount: sessions.length
      });
    }
    return projects;
  }
  getHookConfigPath() {
    return getClaudeSettingsPath();
  }
  installHook() {
    addHook();
  }
  removeHook() {
    removeHook();
  }
  isHookInstalled() {
    return isHookEnabled();
  }
  async buildUploadRequest(session, context) {
    const content = await readFileWithRetry(session.transcriptPath);
    const agentIds = extractAgentIds(content);
    const sessionDir = dirname2(session.transcriptPath);
    const subagents = agentIds.length > 0 ? await readSubagentFiles(sessionDir, agentIds, session.sessionId) : [];
    return {
      source: this.source,
      sessionId: session.sessionId,
      projectPath: session.projectPath,
      gitRemote: context.gitInfo.gitRemote,
      packageName: context.gitInfo.packageName,
      packageType: context.gitInfo.packageType,
      gitBranch: context.gitInfo.branch,
      gitSha: context.gitInfo.sha,
      tag: context.tag,
      content,
      subagents: subagents.length > 0 ? subagents : undefined,
      organizationId: context.organizationId
    };
  }
  extractTimestamps(content) {
    let min = null;
    let max = null;
    for (const line of content.split(`
`)) {
      if (!line)
        continue;
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      if ((parsed.type === "user" || parsed.type === "assistant") && parsed.timestamp) {
        const ts = parsed.timestamp;
        if (!min || ts < min)
          min = ts;
        if (!max || ts > max)
          max = ts;
      }
    }
    if (!min || !max)
      return null;
    return { sessionDate: min, lastInteractionDate: max };
  }
  async ingest(ingestor, input, context) {
    const row = this.buildRow(input, context);
    await ingestRudelClaudeSessions(ingestor, [row]);
  }
  buildRow(input, context) {
    const now = new Date().toISOString().replace("Z", "");
    const subagents = {};
    if (input.subagents) {
      for (const sub of input.subagents) {
        subagents[sub.agentId] = sub.content;
      }
    }
    const timestamps = this.extractTimestamps(input.content);
    return {
      session_date: timestamps ? toClickHouseDateTime(timestamps.sessionDate) : now,
      last_interaction_date: timestamps ? toClickHouseDateTime(timestamps.lastInteractionDate) : now,
      session_id: input.sessionId,
      organization_id: context.organizationId,
      project_path: input.projectPath,
      git_remote: input.gitRemote ?? "",
      package_name: input.packageName ?? "",
      package_type: input.packageType ?? "",
      content: input.content,
      subagents,
      ingested_at: now,
      user_id: context.userId,
      git_branch: input.gitBranch ?? null,
      git_sha: input.gitSha ?? null,
      tag: input.tag ?? null
    };
  }
  async listSessionFiles(sessionDir, projectPath) {
    try {
      const entries = await readdir2(sessionDir);
      return entries.filter((f) => f.endsWith(".jsonl") && !f.startsWith("agent-")).map((f) => ({
        sessionId: f.replace(/\.jsonl$/, ""),
        transcriptPath: join3(sessionDir, f),
        projectPath
      }));
    } catch {
      return [];
    }
  }
  async findByDecoding(projectPath) {
    let projectDirs;
    try {
      projectDirs = await readdir2(SESSIONS_BASE_DIR);
    } catch {
      return [];
    }
    for (const dir of projectDirs) {
      try {
        const decoded = await decodeProjectPath(dir);
        if (decoded === projectPath) {
          const sessionDir = join3(SESSIONS_BASE_DIR, dir);
          return this.listSessionFiles(sessionDir, projectPath);
        }
      } catch {}
    }
    return [];
  }
}
var claudeCodeAdapter = new ClaudeCodeAdapter;
// ../../packages/agent-adapters/src/adapters/codex/index.ts
import { readFile as readFile3 } from "node:fs/promises";
import { homedir as homedir4 } from "node:os";
import { join as join5 } from "node:path";

// ../../packages/agent-adapters/src/adapters/codex/config.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { join as join4 } from "node:path";

// ../../node_modules/smol-toml/dist/error.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1;i <= line + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += `
`;
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += `^
`;
    }
  }
  return codeblock;
}

class TomlError extends Error {
  line;
  column;
  codeblock;
  constructor(message, options) {
    const [line, column] = getLineColFromPtr(options.toml, options.ptr);
    const codeblock = makeCodeBlock(options.toml, line, column);
    super(`Invalid TOML document: ${message}

${codeblock}`, options);
    this.line = line;
    this.column = column;
    this.codeblock = codeblock;
  }
}

// ../../node_modules/smol-toml/dist/util.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function isEscaped(str, ptr) {
  let i = 0;
  while (str[ptr - ++i] === "\\")
    ;
  return --i && i % 2;
}
function indexOfNewline(str, start = 0, end = str.length) {
  let idx = str.indexOf(`
`, start);
  if (str[idx - 1] === "\r")
    idx--;
  return idx <= end ? idx : -1;
}
function skipComment(str, ptr) {
  for (let i = ptr;i < str.length; i++) {
    let c = str[i];
    if (c === `
`)
      return i;
    if (c === "\r" && str[i + 1] === `
`)
      return i + 1;
    if (c < " " && c !== "\t" || c === "") {
      throw new TomlError("control characters are not allowed in comments", {
        toml: str,
        ptr
      });
    }
  }
  return str.length;
}
function skipVoid(str, ptr, banNewLines, banComments) {
  let c;
  while ((c = str[ptr]) === " " || c === "\t" || !banNewLines && (c === `
` || c === "\r" && str[ptr + 1] === `
`))
    ptr++;
  return banComments || c !== "#" ? ptr : skipVoid(str, skipComment(str, ptr), banNewLines);
}
function skipUntil(str, ptr, sep, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr;i < str.length; i++) {
    let c = str[i];
    if (c === "#") {
      i = indexOfNewline(str, i);
    } else if (c === sep) {
      return i + 1;
    } else if (c === end || banNewLines && (c === `
` || c === "\r" && str[i + 1] === `
`)) {
      return i;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: str,
    ptr
  });
}
function getStringEnd(str, seek) {
  let first = str[seek];
  let target = first === str[seek + 1] && str[seek + 1] === str[seek + 2] ? str.slice(seek, seek + 3) : first;
  seek += target.length - 1;
  do
    seek = str.indexOf(target, ++seek);
  while (seek > -1 && first !== "'" && isEscaped(str, seek));
  if (seek > -1) {
    seek += target.length;
    if (target.length > 1) {
      if (str[seek] === first)
        seek++;
      if (str[seek] === first)
        seek++;
    }
  }
  return seek;
}

// ../../node_modules/smol-toml/dist/date.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;

class TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    if (typeof date === "string") {
      let match = date.match(DATE_TIME_RE);
      if (match) {
        if (!match[1]) {
          hasDate = false;
          date = `0000-01-01T${date}`;
        }
        hasTime = !!match[2];
        hasTime && date[10] === " " && (date = date.replace(" ", "T"));
        if (match[2] && +match[2] > 23) {
          date = "";
        } else {
          offset = match[3] || null;
          date = date.toUpperCase();
          if (!offset && hasTime)
            date += "Z";
        }
      } else {
        date = "";
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 60000);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
}

// ../../node_modules/smol-toml/dist/primitive.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var LEADING_ZERO = /^[+-]?0[0-9_]/;
var ESCAPE_REGEX = /^[0-9a-f]{2,8}$/i;
var ESC_MAP = {
  b: "\b",
  t: "\t",
  n: `
`,
  f: "\f",
  r: "\r",
  e: "\x1B",
  '"': '"',
  "\\": "\\"
};
function parseString(str, ptr = 0, endPtr = str.length) {
  let isLiteral = str[ptr] === "'";
  let isMultiline = str[ptr++] === str[ptr] && str[ptr] === str[ptr + 1];
  if (isMultiline) {
    endPtr -= 2;
    if (str[ptr += 2] === "\r")
      ptr++;
    if (str[ptr] === `
`)
      ptr++;
  }
  let tmp = 0;
  let isEscape;
  let parsed = "";
  let sliceStart = ptr;
  while (ptr < endPtr - 1) {
    let c = str[ptr++];
    if (c === `
` || c === "\r" && str[ptr] === `
`) {
      if (!isMultiline) {
        throw new TomlError("newlines are not allowed in strings", {
          toml: str,
          ptr: ptr - 1
        });
      }
    } else if (c < " " && c !== "\t" || c === "") {
      throw new TomlError("control characters are not allowed in strings", {
        toml: str,
        ptr: ptr - 1
      });
    }
    if (isEscape) {
      isEscape = false;
      if (c === "x" || c === "u" || c === "U") {
        let code = str.slice(ptr, ptr += c === "x" ? 2 : c === "u" ? 4 : 8);
        if (!ESCAPE_REGEX.test(code)) {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
        try {
          parsed += String.fromCodePoint(parseInt(code, 16));
        } catch {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
      } else if (isMultiline && (c === `
` || c === " " || c === "\t" || c === "\r")) {
        ptr = skipVoid(str, ptr - 1, true);
        if (str[ptr] !== `
` && str[ptr] !== "\r") {
          throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
            toml: str,
            ptr: tmp
          });
        }
        ptr = skipVoid(str, ptr);
      } else if (c in ESC_MAP) {
        parsed += ESC_MAP[c];
      } else {
        throw new TomlError("unrecognized escape sequence", {
          toml: str,
          ptr: tmp
        });
      }
      sliceStart = ptr;
    } else if (!isLiteral && c === "\\") {
      tmp = ptr - 1;
      isEscape = true;
      parsed += str.slice(sliceStart, tmp);
    }
  }
  return parsed + str.slice(sliceStart, endPtr - 1);
}
function parseValue(value, toml, ptr, integersAsBigInt) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid()) {
    throw new TomlError("invalid value", {
      toml,
      ptr
    });
  }
  return date;
}

// ../../node_modules/smol-toml/dist/extract.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function sliceAndTrimEndOf(str, startPtr, endPtr) {
  let value = str.slice(startPtr, endPtr);
  let commentIdx = value.indexOf("#");
  if (commentIdx > -1) {
    skipComment(str, commentIdx);
    value = value.slice(0, commentIdx);
  }
  return [value.trimEnd(), commentIdx];
}
function extractValue(str, ptr, end, depth, integersAsBigInt) {
  if (depth === 0) {
    throw new TomlError("document contains excessively nested structures. aborting.", {
      toml: str,
      ptr
    });
  }
  let c = str[ptr];
  if (c === "[" || c === "{") {
    let [value, endPtr2] = c === "[" ? parseArray(str, ptr, depth, integersAsBigInt) : parseInlineTable(str, ptr, depth, integersAsBigInt);
    if (end) {
      endPtr2 = skipVoid(str, endPtr2);
      if (str[endPtr2] === ",")
        endPtr2++;
      else if (str[endPtr2] !== end) {
        throw new TomlError("expected comma or end of structure", {
          toml: str,
          ptr: endPtr2
        });
      }
    }
    return [value, endPtr2];
  }
  let endPtr;
  if (c === '"' || c === "'") {
    endPtr = getStringEnd(str, ptr);
    let parsed = parseString(str, ptr, endPtr);
    if (end) {
      endPtr = skipVoid(str, endPtr);
      if (str[endPtr] && str[endPtr] !== "," && str[endPtr] !== end && str[endPtr] !== `
` && str[endPtr] !== "\r") {
        throw new TomlError("unexpected character encountered", {
          toml: str,
          ptr: endPtr
        });
      }
      endPtr += +(str[endPtr] === ",");
    }
    return [parsed, endPtr];
  }
  endPtr = skipUntil(str, ptr, ",", end);
  let slice = sliceAndTrimEndOf(str, ptr, endPtr - +(str[endPtr - 1] === ","));
  if (!slice[0]) {
    throw new TomlError("incomplete key-value declaration: no value specified", {
      toml: str,
      ptr
    });
  }
  if (end && slice[1] > -1) {
    endPtr = skipVoid(str, ptr + slice[1]);
    endPtr += +(str[endPtr] === ",");
  }
  return [
    parseValue(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}

// ../../node_modules/smol-toml/dist/struct.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
function parseKey(str, ptr, end = "=") {
  let dot = ptr - 1;
  let parsed = [];
  let endPtr = str.indexOf(end, ptr);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: str,
      ptr
    });
  }
  do {
    let c = str[ptr = ++dot];
    if (c !== " " && c !== "\t") {
      if (c === '"' || c === "'") {
        if (c === str[ptr + 1] && c === str[ptr + 2]) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: str,
            ptr
          });
        }
        let eos = getStringEnd(str, ptr);
        if (eos < 0) {
          throw new TomlError("unfinished string encountered", {
            toml: str,
            ptr
          });
        }
        dot = str.indexOf(".", eos);
        let strEnd = str.slice(eos, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: str,
            ptr: ptr + dot + newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: str,
            ptr: eos
          });
        }
        if (endPtr < eos) {
          endPtr = str.indexOf(end, eos);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: str,
              ptr
            });
          }
        }
        parsed.push(parseString(str, ptr, eos));
      } else {
        dot = str.indexOf(".", ptr);
        let part = str.slice(ptr, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: str,
            ptr
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  return [parsed, skipVoid(str, endPtr + 1, true, true)];
}
function parseInlineTable(str, ptr, depth, integersAsBigInt) {
  let res = {};
  let seen = new Set;
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "}" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "\t" && c !== `
` && c !== "\r") {
      let k;
      let t = res;
      let hasOwn = false;
      let [key, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0;i < key.length; i++) {
        if (i)
          t = hasOwn ? t[k] : t[k] = {};
        k = key[i];
        if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: str,
          ptr
        });
      }
      let [value, valueEndPtr] = extractValue(str, keyEndPtr, "}", depth - 1, integersAsBigInt);
      seen.add(value);
      t[k] = value;
      ptr = valueEndPtr;
    }
  }
  if (!c) {
    throw new TomlError("unfinished table encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}
function parseArray(str, ptr, depth, integersAsBigInt) {
  let res = [];
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "]" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "\t" && c !== `
` && c !== "\r") {
      let e = extractValue(str, ptr - 1, "]", depth - 1, integersAsBigInt);
      res.push(e[0]);
      ptr = e[1];
    }
  }
  if (!c) {
    throw new TomlError("unfinished array encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}

// ../../node_modules/smol-toml/dist/parse.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function peekTable(key, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0;i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key[i];
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k === "__proto__") {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t, state.c];
}
function parse(toml, { maxDepth = 1000, integersAsBigInt } = {}) {
  let res = {};
  let meta = {};
  let tbl = res;
  let m = meta;
  for (let ptr = skipVoid(toml, 0);ptr < toml.length; ) {
    if (toml[ptr] === "[") {
      let isTableArray = toml[++ptr] === "[";
      let k = parseKey(toml, ptr += +isTableArray, "]");
      if (isTableArray) {
        if (toml[k[1] - 1] !== "]") {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: k[1] - 1
          });
        }
        k[1]++;
      }
      let p = peekTable(k[0], res, meta, isTableArray ? 2 : 1);
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      m = p[2];
      tbl = p[1];
      ptr = k[1];
    } else {
      let k = parseKey(toml, ptr);
      let p = peekTable(k[0], tbl, m, 0);
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      let v = extractValue(toml, k[1], undefined, maxDepth, integersAsBigInt);
      p[1][p[0]] = v[0];
      ptr = v[1];
    }
    ptr = skipVoid(toml, ptr, true);
    if (toml[ptr] && toml[ptr] !== `
` && toml[ptr] !== "\r") {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr
      });
    }
    ptr = skipVoid(toml, ptr);
  }
  return res;
}

// ../../node_modules/smol-toml/dist/stringify.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var BARE_KEY = /^[a-z0-9-_]+$/i;
function extendedTypeOf(obj) {
  let type = typeof obj;
  if (type === "object") {
    if (Array.isArray(obj))
      return "array";
    if (obj instanceof Date)
      return "date";
  }
  return type;
}
function isArrayOfTables(obj) {
  for (let i = 0;i < obj.length; i++) {
    if (extendedTypeOf(obj[i]) !== "object")
      return false;
  }
  return obj.length != 0;
}
function formatString(s) {
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyValue(val, type, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  if (type === "number") {
    if (isNaN(val))
      return "nan";
    if (val === Infinity)
      return "inf";
    if (val === -Infinity)
      return "-inf";
    if (numberAsFloat && Number.isInteger(val))
      return val.toFixed(1);
    return val.toString();
  }
  if (type === "bigint" || type === "boolean") {
    return val.toString();
  }
  if (type === "string") {
    return formatString(val);
  }
  if (type === "date") {
    if (isNaN(val.getTime())) {
      throw new TypeError("cannot serialize invalid date");
    }
    return val.toISOString();
  }
  if (type === "object") {
    return stringifyInlineTable(val, depth, numberAsFloat);
  }
  if (type === "array") {
    return stringifyArray(val, depth, numberAsFloat);
  }
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
  let keys = Object.keys(obj);
  if (keys.length === 0)
    return "{}";
  let res = "{ ";
  for (let i = 0;i < keys.length; i++) {
    let k = keys[i];
    if (i)
      res += ", ";
    res += BARE_KEY.test(k) ? k : formatString(k);
    res += " = ";
    res += stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat);
  }
  return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
  if (array.length === 0)
    return "[]";
  let res = "[ ";
  for (let i = 0;i < array.length; i++) {
    if (i)
      res += ", ";
    if (array[i] === null || array[i] === undefined) {
      throw new TypeError("arrays cannot contain null or undefined values");
    }
    res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat);
  }
  return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let res = "";
  for (let i = 0;i < array.length; i++) {
    res += `${res && `
`}[[${key}]]
`;
    res += stringifyTable(0, array[i], key, depth, numberAsFloat);
  }
  return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let preamble = "";
  let tables = "";
  let keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    let k = keys[i];
    if (obj[k] !== null && obj[k] !== undefined) {
      let type = extendedTypeOf(obj[k]);
      if (type === "symbol" || type === "function") {
        throw new TypeError(`cannot serialize values of type '${type}'`);
      }
      let key = BARE_KEY.test(k) ? k : formatString(k);
      if (type === "array" && isArrayOfTables(obj[k])) {
        tables += (tables && `
`) + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
      } else if (type === "object") {
        let tblKey = prefix ? `${prefix}.${key}` : key;
        tables += (tables && `
`) + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat);
      } else {
        preamble += key;
        preamble += " = ";
        preamble += stringifyValue(obj[k], type, depth, numberAsFloat);
        preamble += `
`;
      }
    }
  }
  if (tableKey && (preamble || !tables))
    preamble = preamble ? `[${tableKey}]
${preamble}` : `[${tableKey}]`;
  return preamble && tables ? `${preamble}
${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1000, numbersAsFloat = false } = {}) {
  if (extendedTypeOf(obj) !== "object") {
    throw new TypeError("stringify can only be called with an object");
  }
  let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
  if (str[str.length - 1] !== `
`)
    return str + `
`;
  return str;
}

// ../../node_modules/smol-toml/dist/index.js
/*!
 * Copyright (c) Squirrel Chat et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// ../../packages/agent-adapters/src/adapters/codex/config.ts
var CONFIG_PATH = join4(homedir3(), ".codex", "config.toml");
var HOOK_COMMAND2 = "rudel hooks codex turn-complete";
function readConfig() {
  if (!existsSync2(CONFIG_PATH))
    return {};
  const content = readFileSync2(CONFIG_PATH, "utf-8");
  return parse(content);
}
function writeConfig(config) {
  writeFileSync2(CONFIG_PATH, stringify(config));
}
function installHook() {
  const config = readConfig();
  if (!Array.isArray(config.notify)) {
    config.notify = [];
  }
  if (!config.notify.includes(HOOK_COMMAND2)) {
    config.notify.push(HOOK_COMMAND2);
  }
  writeConfig(config);
}
function removeHook2() {
  const config = readConfig();
  if (!Array.isArray(config.notify))
    return;
  config.notify = config.notify.filter((cmd) => cmd !== HOOK_COMMAND2);
  if (config.notify.length === 0) {
    delete config.notify;
  }
  writeConfig(config);
}
function isHookInstalled() {
  const config = readConfig();
  if (!Array.isArray(config.notify))
    return false;
  return config.notify.includes(HOOK_COMMAND2);
}

// ../../packages/agent-adapters/src/adapters/codex/index.ts
var SESSIONS_BASE_DIR2 = join5(homedir4(), ".codex", "sessions");
async function readCodexSessionMeta(filePath) {
  const parsed = await readJsonlFirstLine(filePath);
  if (!parsed || parsed.type !== "session_meta" || !parsed.payload) {
    return null;
  }
  return {
    id: parsed.payload.id ?? filePath.split("/").pop()?.replace(/\.jsonl$/, "") ?? "",
    cwd: parsed.payload.cwd ?? "",
    gitBranch: parsed.payload.git?.branch,
    gitSha: parsed.payload.git?.sha
  };
}
async function findActiveRolloutFile(threadId) {
  const files = await walkJsonlFiles(SESSIONS_BASE_DIR2);
  for (const filePath of files) {
    const meta = await readCodexSessionMeta(filePath);
    if (meta?.id === threadId) {
      return filePath;
    }
  }
  return null;
}

class CodexAdapter {
  name = "OpenAI Codex";
  source = "codex";
  rawTableName = "rudel.codex_sessions";
  getSessionsBaseDir() {
    return SESSIONS_BASE_DIR2;
  }
  async findProjectSessions(projectPath) {
    const sessions = [];
    try {
      const files = await walkJsonlFiles(SESSIONS_BASE_DIR2);
      for (const filePath of files) {
        const meta = await readCodexSessionMeta(filePath);
        if (meta?.cwd === projectPath) {
          sessions.push({
            sessionId: meta.id,
            transcriptPath: filePath,
            projectPath,
            gitBranch: meta.gitBranch,
            gitSha: meta.gitSha
          });
        }
      }
    } catch {}
    return sessions;
  }
  async scanAllSessions() {
    const files = await walkJsonlFiles(SESSIONS_BASE_DIR2);
    const projectMap = new Map;
    for (const filePath of files) {
      const meta = await readCodexSessionMeta(filePath);
      if (!meta || !meta.cwd)
        continue;
      const sessions = projectMap.get(meta.cwd) ?? [];
      sessions.push({
        sessionId: meta.id,
        transcriptPath: filePath,
        projectPath: meta.cwd,
        gitBranch: meta.gitBranch,
        gitSha: meta.gitSha
      });
      projectMap.set(meta.cwd, sessions);
    }
    const projects = [];
    for (const [projectPath, sessions] of projectMap) {
      projects.push({
        source: this.source,
        projectPath,
        displayPath: toDisplayPath(projectPath),
        sessions,
        sessionCount: sessions.length
      });
    }
    return projects.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
  }
  getHookConfigPath() {
    return CONFIG_PATH;
  }
  installHook() {
    installHook();
  }
  removeHook() {
    removeHook2();
  }
  isHookInstalled() {
    return isHookInstalled();
  }
  async buildUploadRequest(session, context) {
    const content = await readFile3(session.transcriptPath, "utf-8");
    return {
      source: this.source,
      sessionId: session.sessionId,
      projectPath: session.projectPath,
      gitBranch: session.gitBranch ?? context.gitInfo.branch,
      gitSha: session.gitSha ?? context.gitInfo.sha,
      tag: context.tag,
      content,
      organizationId: context.organizationId
    };
  }
  extractTimestamps(content) {
    let min = null;
    let max = null;
    for (const line of content.split(`
`)) {
      if (!line)
        continue;
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      if (parsed.timestamp) {
        const ts = parsed.timestamp;
        if (!min || ts < min)
          min = ts;
        if (!max || ts > max)
          max = ts;
      }
    }
    if (!min || !max)
      return null;
    return { sessionDate: min, lastInteractionDate: max };
  }
  async ingest(ingestor, input, context) {
    const row = this.buildRow(input, context);
    await ingestRudelCodexSessions(ingestor, [row]);
  }
  buildRow(input, context) {
    const now = new Date().toISOString().replace("Z", "");
    const timestamps = this.extractTimestamps(input.content);
    return {
      session_date: timestamps ? toClickHouseDateTime(timestamps.sessionDate) : now,
      last_interaction_date: timestamps ? toClickHouseDateTime(timestamps.lastInteractionDate) : now,
      session_id: input.sessionId,
      organization_id: context.organizationId,
      project_path: input.projectPath,
      git_remote: input.gitRemote ?? "",
      package_name: input.packageName ?? "",
      package_type: input.packageType ?? "",
      content: input.content,
      ingested_at: now,
      user_id: context.userId,
      git_branch: input.gitBranch ?? null,
      git_sha: input.gitSha ?? null,
      tag: input.tag ?? null
    };
  }
}
var codexAdapter = new CodexAdapter;
// ../../packages/agent-adapters/src/registry.ts
import { existsSync as existsSync3 } from "node:fs";
var adapters = new Map;
function registerAdapter(adapter) {
  adapters.set(adapter.source, adapter);
}
function getAdapter(source) {
  const adapter = adapters.get(source);
  if (!adapter) {
    throw new Error(`No adapter registered for source: ${source}`);
  }
  return adapter;
}
function getAllAdapters() {
  return Array.from(adapters.values());
}
function getAvailableAdapters() {
  return getAllAdapters().filter((a) => existsSync3(a.getSessionsBaseDir()));
}
// ../../packages/agent-adapters/src/index.ts
registerAdapter(claudeCodeAdapter);
registerAdapter(codexAdapter);

// src/lib/project-grouping.ts
import { homedir as homedir6 } from "node:os";

// src/lib/git-info.ts
import { existsSync as existsSync4, readFileSync as readFileSync3 } from "node:fs";
import { join as join6 } from "node:path";

// src/lib/exec.ts
import { execFile } from "node:child_process";
function exec(cmd, args) {
  return new Promise((resolve2) => {
    execFile(cmd, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      resolve2({
        exitCode: error ? error.code ?? 1 : 0,
        stdout,
        stderr
      });
    });
  });
}

// src/lib/git-info.ts
function normalizeRemoteUrl(url) {
  return url.replace(/^(https?:\/\/|git@|ssh:\/\/)/, "").replace(/:/, "/").replace(/\.git$/, "");
}
async function getGitInfo(cwd) {
  const [remoteUrl, branch, sha, packageInfo] = await Promise.all([
    getGitRemoteUrl(cwd),
    getGitBranch(cwd),
    getGitSha(cwd),
    getPackageInfo(cwd)
  ]);
  const gitRemote = remoteUrl ? normalizeRemoteUrl(remoteUrl) : undefined;
  return {
    gitRemote,
    packageName: packageInfo?.name,
    packageType: packageInfo?.type,
    branch: branch ?? undefined,
    sha: sha ?? undefined
  };
}
async function getPackageInfo(cwd) {
  try {
    const result = await exec("git", [
      "-C",
      cwd,
      "rev-parse",
      "--show-toplevel"
    ]);
    const root = result.exitCode === 0 ? result.stdout.trim() : cwd;
    return getNodePackage(root) ?? getPythonPackage(root) ?? getRustPackage(root) ?? getGoModule(root);
  } catch {
    return null;
  }
}
function getNodePackage(root) {
  try {
    const filePath = join6(root, "package.json");
    if (!existsSync4(filePath))
      return null;
    const pkg = JSON.parse(readFileSync3(filePath, "utf-8"));
    return pkg.name ? { name: pkg.name, type: "package.json" } : null;
  } catch {
    return null;
  }
}
function getPythonPackage(root) {
  try {
    const filePath = join6(root, "pyproject.toml");
    if (!existsSync4(filePath))
      return null;
    const content = readFileSync3(filePath, "utf-8");
    const name = content.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
    return name ? { name, type: "pyproject.toml" } : null;
  } catch {
    return null;
  }
}
function getRustPackage(root) {
  try {
    const filePath = join6(root, "Cargo.toml");
    if (!existsSync4(filePath))
      return null;
    const content = readFileSync3(filePath, "utf-8");
    const name = content.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
    return name ? { name, type: "Cargo.toml" } : null;
  } catch {
    return null;
  }
}
function getGoModule(root) {
  try {
    const filePath = join6(root, "go.mod");
    if (!existsSync4(filePath))
      return null;
    const content = readFileSync3(filePath, "utf-8");
    const name = content.match(/^module\s+(\S+)/m)?.[1];
    return name ? { name, type: "go.mod" } : null;
  } catch {
    return null;
  }
}
async function getGitRemoteUrl(cwd) {
  try {
    const result = await exec("git", [
      "-C",
      cwd,
      "remote",
      "get-url",
      "origin"
    ]);
    if (result.exitCode !== 0)
      return null;
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}
async function getGitBranch(cwd) {
  try {
    const result = await exec("git", [
      "-C",
      cwd,
      "rev-parse",
      "--abbrev-ref",
      "HEAD"
    ]);
    if (result.exitCode !== 0)
      return null;
    return result.stdout.trim();
  } catch {
    return null;
  }
}
async function getGitSha(cwd) {
  try {
    const result = await exec("git", ["-C", cwd, "rev-parse", "HEAD"]);
    if (result.exitCode !== 0)
      return null;
    return result.stdout.trim();
  } catch {
    return null;
  }
}

// src/lib/remote-cache.ts
import { existsSync as existsSync5, readFileSync as readFileSync4 } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir as homedir5 } from "node:os";
import { dirname as dirname3, join as join7 } from "node:path";
var CACHE_PATH = join7(homedir5(), ".rudel", "remote-cache.json");
async function getRemoteCache() {
  try {
    if (!existsSync5(CACHE_PATH))
      return {};
    return JSON.parse(readFileSync4(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function getCachedRemote(cache, encodedDir) {
  return cache[encodedDir] ?? null;
}
function cacheRemote(cache, encodedDir, normalizedRemote) {
  cache[encodedDir] = normalizedRemote;
}
async function cacheRemotes(cache) {
  try {
    await mkdir(dirname3(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(cache));
  } catch {}
}

// src/lib/project-grouping.ts
async function scanAndGroupProjects(cwd = process.cwd()) {
  const adapters2 = getAvailableAdapters();
  const projects = [];
  for (const adapter of adapters2) {
    const scanned = await adapter.scanAllSessions();
    projects.push(...scanned);
  }
  const groups = await groupProjectsByRemote(projects, cwd);
  return { projects, groups };
}
function extractDisplayName(normalized) {
  const parts = normalized.split("/");
  if (parts.length >= 3) {
    return parts.slice(1).join("/");
  }
  return normalized;
}
function encodeProjectPath2(projectPath) {
  return projectPath.replace(/\//g, "-");
}
async function groupProjectsByRemote(projects, cwd) {
  const cache = await getRemoteCache();
  let cacheUpdated = false;
  const remotes = await Promise.all(projects.map((p) => getGitRemoteUrl(p.projectPath)));
  const grouped = new Map;
  const ungrouped = [];
  for (let i = 0;i < projects.length; i++) {
    const project = projects[i];
    const remote = remotes[i];
    if (remote) {
      const normalized = normalizeRemoteUrl(remote);
      const encodedDir = encodeProjectPath2(project.projectPath);
      if (getCachedRemote(cache, encodedDir) !== normalized) {
        cacheRemote(cache, encodedDir, normalized);
        cacheUpdated = true;
      }
      const existing = grouped.get(normalized);
      if (existing) {
        existing.projects.push(project);
      } else {
        grouped.set(normalized, { remote: normalized, projects: [project] });
      }
    } else {
      const encodedDir = encodeProjectPath2(project.projectPath);
      const cached = getCachedRemote(cache, encodedDir);
      if (cached) {
        const existing = grouped.get(cached);
        if (existing) {
          existing.projects.push(project);
        } else {
          grouped.set(cached, { remote: cached, projects: [project] });
        }
      } else {
        ungrouped.push(project);
      }
    }
  }
  const groups = [];
  for (const [, entry] of grouped) {
    const containsCwd = entry.projects.some((p) => cwd === p.projectPath || cwd.startsWith(`${p.projectPath}/`));
    groups.push({
      displayName: extractDisplayName(entry.remote),
      gitRemote: entry.remote,
      projects: entry.projects,
      totalSessions: entry.projects.reduce((s, p) => s + p.sessionCount, 0),
      containsCwd
    });
  }
  const homeSegments = homedir6().split("/").length;
  const remainingUngrouped = [];
  for (const project of ungrouped) {
    const match = findBestGroupByPath(project, groups, homeSegments);
    if (match) {
      match.projects.push(project);
      match.totalSessions += project.sessionCount;
      if (cwd === project.projectPath || cwd.startsWith(`${project.projectPath}/`)) {
        match.containsCwd = true;
      }
    } else {
      remainingUngrouped.push(project);
    }
  }
  for (const project of remainingUngrouped) {
    const containsCwd = cwd === project.projectPath || cwd.startsWith(`${project.projectPath}/`);
    groups.push({
      displayName: project.displayPath,
      gitRemote: null,
      projects: [project],
      totalSessions: project.sessionCount,
      containsCwd
    });
  }
  groups.sort((a, b) => {
    if (a.containsCwd !== b.containsCwd)
      return a.containsCwd ? -1 : 1;
    const aHasRemote = a.gitRemote !== null;
    const bHasRemote = b.gitRemote !== null;
    if (aHasRemote !== bHasRemote)
      return aHasRemote ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
  if (cacheUpdated) {
    cacheRemotes(cache);
  }
  return groups;
}
function commonPrefixLength(a, b) {
  const partsA = a.split("/");
  const partsB = b.split("/");
  let count = 0;
  for (let i = 0;i < Math.min(partsA.length, partsB.length); i++) {
    if (partsA[i] === partsB[i])
      count++;
    else
      break;
  }
  return count;
}
function findBestGroupByPath(project, groups, homeSegments) {
  let bestGroup = null;
  let bestLen = 0;
  let secondBestLen = 0;
  for (const group2 of groups) {
    if (!group2.gitRemote)
      continue;
    let groupBest = 0;
    for (const p of group2.projects) {
      groupBest = Math.max(groupBest, commonPrefixLength(project.projectPath, p.projectPath));
    }
    if (groupBest > bestLen) {
      secondBestLen = bestLen;
      bestLen = groupBest;
      bestGroup = group2;
    } else if (groupBest > secondBestLen) {
      secondBestLen = groupBest;
    }
  }
  if (bestGroup && bestLen > homeSegments && bestLen > secondBestLen) {
    return bestGroup;
  }
  return null;
}

// src/commands/dev/list-sessions.ts
async function runListSessions() {
  const { projects: allProjects, groups } = await scanAndGroupProjects();
  if (allProjects.length === 0) {
    console.log("No projects with sessions found.");
    return;
  }
  const lines = [];
  for (const group2 of groups) {
    const isCurrent = group2.containsCwd ? " [current]" : "";
    if (group2.projects.length === 1) {
      const proj = group2.projects[0];
      const name = getAdapter(proj.source).name;
      lines.push(`[${name}] ${proj.displayPath} (${proj.sessionCount} sessions)${isCurrent}`);
      continue;
    }
    const totalSessions2 = group2.projects.reduce((s, p) => s + p.sessionCount, 0);
    lines.push(`${group2.displayName} (${group2.projects.length} projects, ${totalSessions2} sessions)${isCurrent}`);
    for (const proj of group2.projects) {
      const name = getAdapter(proj.source).name;
      const cwdMarker = proj.projectPath === process.cwd() ? " [cwd]" : "";
      lines.push(`  [${name}] ${proj.displayPath} (${proj.sessionCount} sessions)${cwdMarker}`);
    }
  }
  const totalSessions = allProjects.reduce((s, p) => s + p.sessionCount, 0);
  console.log(`${allProjects.length} projects, ${totalSessions} sessions
`);
  for (const line of lines) {
    console.log(line);
  }
}
var listSessionsCommand = buildCommand({
  loader: async () => ({ default: runListSessions }),
  parameters: {},
  docs: {
    brief: "List session files that would appear in the upload picker"
  }
});

// src/commands/dev/index.ts
var devRouteMap = buildRouteMap({
  routes: {
    "list-sessions": listSessionsCommand
  },
  docs: {
    brief: "Development utilities (not available in published builds)"
  }
});

// ../../node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
import { styleText as D } from "node:util";
import { stdout as R, stdin as q } from "node:process";
import * as k from "node:readline";
import ot from "node:readline";
import { ReadStream as J } from "node:tty";
function x(t, e, s) {
  if (!s.some((u) => !u.disabled))
    return t;
  const i = t + e, r = Math.max(s.length - 1, 0), n = i < 0 ? r : i > r ? 0 : i;
  return s[n].disabled ? x(n, e < 0 ? -1 : 1, s) : n;
}
var at = (t) => t === 161 || t === 164 || t === 167 || t === 168 || t === 170 || t === 173 || t === 174 || t >= 176 && t <= 180 || t >= 182 && t <= 186 || t >= 188 && t <= 191 || t === 198 || t === 208 || t === 215 || t === 216 || t >= 222 && t <= 225 || t === 230 || t >= 232 && t <= 234 || t === 236 || t === 237 || t === 240 || t === 242 || t === 243 || t >= 247 && t <= 250 || t === 252 || t === 254 || t === 257 || t === 273 || t === 275 || t === 283 || t === 294 || t === 295 || t === 299 || t >= 305 && t <= 307 || t === 312 || t >= 319 && t <= 322 || t === 324 || t >= 328 && t <= 331 || t === 333 || t === 338 || t === 339 || t === 358 || t === 359 || t === 363 || t === 462 || t === 464 || t === 466 || t === 468 || t === 470 || t === 472 || t === 474 || t === 476 || t === 593 || t === 609 || t === 708 || t === 711 || t >= 713 && t <= 715 || t === 717 || t === 720 || t >= 728 && t <= 731 || t === 733 || t === 735 || t >= 768 && t <= 879 || t >= 913 && t <= 929 || t >= 931 && t <= 937 || t >= 945 && t <= 961 || t >= 963 && t <= 969 || t === 1025 || t >= 1040 && t <= 1103 || t === 1105 || t === 8208 || t >= 8211 && t <= 8214 || t === 8216 || t === 8217 || t === 8220 || t === 8221 || t >= 8224 && t <= 8226 || t >= 8228 && t <= 8231 || t === 8240 || t === 8242 || t === 8243 || t === 8245 || t === 8251 || t === 8254 || t === 8308 || t === 8319 || t >= 8321 && t <= 8324 || t === 8364 || t === 8451 || t === 8453 || t === 8457 || t === 8467 || t === 8470 || t === 8481 || t === 8482 || t === 8486 || t === 8491 || t === 8531 || t === 8532 || t >= 8539 && t <= 8542 || t >= 8544 && t <= 8555 || t >= 8560 && t <= 8569 || t === 8585 || t >= 8592 && t <= 8601 || t === 8632 || t === 8633 || t === 8658 || t === 8660 || t === 8679 || t === 8704 || t === 8706 || t === 8707 || t === 8711 || t === 8712 || t === 8715 || t === 8719 || t === 8721 || t === 8725 || t === 8730 || t >= 8733 && t <= 8736 || t === 8739 || t === 8741 || t >= 8743 && t <= 8748 || t === 8750 || t >= 8756 && t <= 8759 || t === 8764 || t === 8765 || t === 8776 || t === 8780 || t === 8786 || t === 8800 || t === 8801 || t >= 8804 && t <= 8807 || t === 8810 || t === 8811 || t === 8814 || t === 8815 || t === 8834 || t === 8835 || t === 8838 || t === 8839 || t === 8853 || t === 8857 || t === 8869 || t === 8895 || t === 8978 || t >= 9312 && t <= 9449 || t >= 9451 && t <= 9547 || t >= 9552 && t <= 9587 || t >= 9600 && t <= 9615 || t >= 9618 && t <= 9621 || t === 9632 || t === 9633 || t >= 9635 && t <= 9641 || t === 9650 || t === 9651 || t === 9654 || t === 9655 || t === 9660 || t === 9661 || t === 9664 || t === 9665 || t >= 9670 && t <= 9672 || t === 9675 || t >= 9678 && t <= 9681 || t >= 9698 && t <= 9701 || t === 9711 || t === 9733 || t === 9734 || t === 9737 || t === 9742 || t === 9743 || t === 9756 || t === 9758 || t === 9792 || t === 9794 || t === 9824 || t === 9825 || t >= 9827 && t <= 9829 || t >= 9831 && t <= 9834 || t === 9836 || t === 9837 || t === 9839 || t === 9886 || t === 9887 || t === 9919 || t >= 9926 && t <= 9933 || t >= 9935 && t <= 9939 || t >= 9941 && t <= 9953 || t === 9955 || t === 9960 || t === 9961 || t >= 9963 && t <= 9969 || t === 9972 || t >= 9974 && t <= 9977 || t === 9979 || t === 9980 || t === 9982 || t === 9983 || t === 10045 || t >= 10102 && t <= 10111 || t >= 11094 && t <= 11097 || t >= 12872 && t <= 12879 || t >= 57344 && t <= 63743 || t >= 65024 && t <= 65039 || t === 65533 || t >= 127232 && t <= 127242 || t >= 127248 && t <= 127277 || t >= 127280 && t <= 127337 || t >= 127344 && t <= 127373 || t === 127375 || t === 127376 || t >= 127387 && t <= 127404 || t >= 917760 && t <= 917999 || t >= 983040 && t <= 1048573 || t >= 1048576 && t <= 1114109;
var lt = (t) => t === 12288 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510;
var ht = (t) => t >= 4352 && t <= 4447 || t === 8986 || t === 8987 || t === 9001 || t === 9002 || t >= 9193 && t <= 9196 || t === 9200 || t === 9203 || t === 9725 || t === 9726 || t === 9748 || t === 9749 || t >= 9800 && t <= 9811 || t === 9855 || t === 9875 || t === 9889 || t === 9898 || t === 9899 || t === 9917 || t === 9918 || t === 9924 || t === 9925 || t === 9934 || t === 9940 || t === 9962 || t === 9970 || t === 9971 || t === 9973 || t === 9978 || t === 9981 || t === 9989 || t === 9994 || t === 9995 || t === 10024 || t === 10060 || t === 10062 || t >= 10067 && t <= 10069 || t === 10071 || t >= 10133 && t <= 10135 || t === 10160 || t === 10175 || t === 11035 || t === 11036 || t === 11088 || t === 11093 || t >= 11904 && t <= 11929 || t >= 11931 && t <= 12019 || t >= 12032 && t <= 12245 || t >= 12272 && t <= 12287 || t >= 12289 && t <= 12350 || t >= 12353 && t <= 12438 || t >= 12441 && t <= 12543 || t >= 12549 && t <= 12591 || t >= 12593 && t <= 12686 || t >= 12688 && t <= 12771 || t >= 12783 && t <= 12830 || t >= 12832 && t <= 12871 || t >= 12880 && t <= 19903 || t >= 19968 && t <= 42124 || t >= 42128 && t <= 42182 || t >= 43360 && t <= 43388 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65049 || t >= 65072 && t <= 65106 || t >= 65108 && t <= 65126 || t >= 65128 && t <= 65131 || t >= 94176 && t <= 94180 || t === 94192 || t === 94193 || t >= 94208 && t <= 100343 || t >= 100352 && t <= 101589 || t >= 101632 && t <= 101640 || t >= 110576 && t <= 110579 || t >= 110581 && t <= 110587 || t === 110589 || t === 110590 || t >= 110592 && t <= 110882 || t === 110898 || t >= 110928 && t <= 110930 || t === 110933 || t >= 110948 && t <= 110951 || t >= 110960 && t <= 111355 || t === 126980 || t === 127183 || t === 127374 || t >= 127377 && t <= 127386 || t >= 127488 && t <= 127490 || t >= 127504 && t <= 127547 || t >= 127552 && t <= 127560 || t === 127568 || t === 127569 || t >= 127584 && t <= 127589 || t >= 127744 && t <= 127776 || t >= 127789 && t <= 127797 || t >= 127799 && t <= 127868 || t >= 127870 && t <= 127891 || t >= 127904 && t <= 127946 || t >= 127951 && t <= 127955 || t >= 127968 && t <= 127984 || t === 127988 || t >= 127992 && t <= 128062 || t === 128064 || t >= 128066 && t <= 128252 || t >= 128255 && t <= 128317 || t >= 128331 && t <= 128334 || t >= 128336 && t <= 128359 || t === 128378 || t === 128405 || t === 128406 || t === 128420 || t >= 128507 && t <= 128591 || t >= 128640 && t <= 128709 || t === 128716 || t >= 128720 && t <= 128722 || t >= 128725 && t <= 128727 || t >= 128732 && t <= 128735 || t === 128747 || t === 128748 || t >= 128756 && t <= 128764 || t >= 128992 && t <= 129003 || t === 129008 || t >= 129292 && t <= 129338 || t >= 129340 && t <= 129349 || t >= 129351 && t <= 129535 || t >= 129648 && t <= 129660 || t >= 129664 && t <= 129672 || t >= 129680 && t <= 129725 || t >= 129727 && t <= 129733 || t >= 129742 && t <= 129755 || t >= 129760 && t <= 129768 || t >= 129776 && t <= 129784 || t >= 131072 && t <= 196605 || t >= 196608 && t <= 262141;
var O = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var y = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var L = /\t{1,1000}/y;
var P = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var M = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var ct = /\p{M}+/gu;
var ft = { limit: 1 / 0, ellipsis: "" };
var X = (t, e = {}, s = {}) => {
  const i = e.limit ?? 1 / 0, r = e.ellipsis ?? "", n = e?.ellipsisWidth ?? (r ? X(r, ft, s).width : 0), u = s.ansiWidth ?? 0, a = s.controlWidth ?? 0, l = s.tabWidth ?? 8, E = s.ambiguousWidth ?? 1, g = s.emojiWidth ?? 2, m = s.fullWidthWidth ?? 2, A = s.regularWidth ?? 1, V = s.wideWidth ?? 2;
  let h = 0, o = 0, p = t.length, v = 0, F = false, d = p, b = Math.max(0, i - n), C = 0, w = 0, c = 0, f = 0;
  t:
    for (;; ) {
      if (w > C || o >= p && o > h) {
        const ut = t.slice(C, w) || t.slice(h, o);
        v = 0;
        for (const Y of ut.replaceAll(ct, "")) {
          const $ = Y.codePointAt(0) || 0;
          if (lt($) ? f = m : ht($) ? f = V : E !== A && at($) ? f = E : f = A, c + f > b && (d = Math.min(d, Math.max(C, h) + v)), c + f > i) {
            F = true;
            break t;
          }
          v += Y.length, c += f;
        }
        C = w = 0;
      }
      if (o >= p)
        break;
      if (M.lastIndex = o, M.test(t)) {
        if (v = M.lastIndex - o, f = v * A, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / A))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = M.lastIndex;
        continue;
      }
      if (O.lastIndex = o, O.test(t)) {
        if (c + u > b && (d = Math.min(d, o)), c + u > i) {
          F = true;
          break;
        }
        c += u, C = h, w = o, o = h = O.lastIndex;
        continue;
      }
      if (y.lastIndex = o, y.test(t)) {
        if (v = y.lastIndex - o, f = v * a, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / a))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = y.lastIndex;
        continue;
      }
      if (L.lastIndex = o, L.test(t)) {
        if (v = L.lastIndex - o, f = v * l, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / l))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = L.lastIndex;
        continue;
      }
      if (P.lastIndex = o, P.test(t)) {
        if (c + g > b && (d = Math.min(d, o)), c + g > i) {
          F = true;
          break;
        }
        c += g, C = h, w = o, o = h = P.lastIndex;
        continue;
      }
      o += 1;
    }
  return { width: F ? b : c, index: F ? d : p, truncated: F, ellipsed: F && i >= n };
};
var pt = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var S = (t, e = {}) => X(t, pt, e).width;
var T = "\x1B";
var Z = "";
var Ft = 39;
var j = "\x07";
var Q = "[";
var dt = "]";
var tt = "m";
var U = `${dt}8;;`;
var et = new RegExp(`(?:\\${Q}(?<code>\\d+)m|\\${U}(?<uri>.*)${j})`, "y");
var mt = (t) => {
  if (t >= 30 && t <= 37 || t >= 90 && t <= 97)
    return 39;
  if (t >= 40 && t <= 47 || t >= 100 && t <= 107)
    return 49;
  if (t === 1 || t === 2)
    return 22;
  if (t === 3)
    return 23;
  if (t === 4)
    return 24;
  if (t === 7)
    return 27;
  if (t === 8)
    return 28;
  if (t === 9)
    return 29;
  if (t === 0)
    return 0;
};
var st = (t) => `${T}${Q}${t}${tt}`;
var it = (t) => `${T}${U}${t}${j}`;
var gt = (t) => t.map((e) => S(e));
var G = (t, e, s) => {
  const i = e[Symbol.iterator]();
  let r = false, n = false, u = t.at(-1), a = u === undefined ? 0 : S(u), l = i.next(), E = i.next(), g = 0;
  for (;!l.done; ) {
    const m = l.value, A = S(m);
    a + A <= s ? t[t.length - 1] += m : (t.push(m), a = 0), (m === T || m === Z) && (r = true, n = e.startsWith(U, g + 1)), r ? n ? m === j && (r = false, n = false) : m === tt && (r = false) : (a += A, a === s && !E.done && (t.push(""), a = 0)), l = E, E = i.next(), g += m.length;
  }
  u = t.at(-1), !a && u !== undefined && u.length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
};
var vt = (t) => {
  const e = t.split(" ");
  let s = e.length;
  for (;s > 0 && !(S(e[s - 1]) > 0); )
    s--;
  return s === e.length ? t : e.slice(0, s).join(" ") + e.slice(s).join("");
};
var Et = (t, e, s = {}) => {
  if (s.trim !== false && t.trim() === "")
    return "";
  let i = "", r, n;
  const u = t.split(" "), a = gt(u);
  let l = [""];
  for (const [h, o] of u.entries()) {
    s.trim !== false && (l[l.length - 1] = (l.at(-1) ?? "").trimStart());
    let p = S(l.at(-1) ?? "");
    if (h !== 0 && (p >= e && (s.wordWrap === false || s.trim === false) && (l.push(""), p = 0), (p > 0 || s.trim === false) && (l[l.length - 1] += " ", p++)), s.hard && a[h] > e) {
      const v = e - p, F = 1 + Math.floor((a[h] - v - 1) / e);
      Math.floor((a[h] - 1) / e) < F && l.push(""), G(l, o, e);
      continue;
    }
    if (p + a[h] > e && p > 0 && a[h] > 0) {
      if (s.wordWrap === false && p < e) {
        G(l, o, e);
        continue;
      }
      l.push("");
    }
    if (p + a[h] > e && s.wordWrap === false) {
      G(l, o, e);
      continue;
    }
    l[l.length - 1] += o;
  }
  s.trim !== false && (l = l.map((h) => vt(h)));
  const E = l.join(`
`), g = E[Symbol.iterator]();
  let m = g.next(), A = g.next(), V = 0;
  for (;!m.done; ) {
    const h = m.value, o = A.value;
    if (i += h, h === T || h === Z) {
      et.lastIndex = V + 1;
      const F = et.exec(E)?.groups;
      if (F?.code !== undefined) {
        const d = Number.parseFloat(F.code);
        r = d === Ft ? undefined : d;
      } else
        F?.uri !== undefined && (n = F.uri.length === 0 ? undefined : F.uri);
    }
    const p = r ? mt(r) : undefined;
    o === `
` ? (n && (i += it("")), r && p && (i += st(p))) : h === `
` && (r && p && (i += st(r)), n && (i += it(n))), V += h.length, m = A, A = g.next();
  }
  return i;
};
function K(t, e, s) {
  return String(t).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => Et(i, e, s)).join(`
`);
}
var At = ["up", "down", "left", "right", "space", "enter", "cancel"];
var _ = { actions: new Set(At), aliases: new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["\x03", "cancel"], ["escape", "cancel"]]), messages: { cancel: "Canceled", error: "Something went wrong" }, withGuide: true };
function H(t, e) {
  if (typeof t == "string")
    return _.aliases.get(t) === e;
  for (const s of t)
    if (s !== undefined && H(s, e))
      return true;
  return false;
}
function _t(t, e) {
  if (t === e)
    return;
  const s = t.split(`
`), i = e.split(`
`), r = Math.max(s.length, i.length), n = [];
  for (let u = 0;u < r; u++)
    s[u] !== i[u] && n.push(u);
  return { lines: n, numLinesBefore: s.length, numLinesAfter: i.length, numLines: r };
}
var bt = globalThis.process.platform.startsWith("win");
var z = Symbol("clack:cancel");
function Ct(t) {
  return t === z;
}
function W(t, e) {
  const s = t;
  s.isTTY && s.setRawMode(e);
}
function xt({ input: t = q, output: e = R, overwrite: s = true, hideCursor: i = true } = {}) {
  const r = k.createInterface({ input: t, output: e, prompt: "", tabSize: 1 });
  k.emitKeypressEvents(t, r), t instanceof J && t.isTTY && t.setRawMode(true);
  const n = (u, { name: a, sequence: l }) => {
    const E = String(u);
    if (H([E, a, l], "cancel")) {
      i && e.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!s)
      return;
    const g = a === "return" ? 0 : -1, m = a === "return" ? -1 : 0;
    k.moveCursor(e, g, m, () => {
      k.clearLine(e, 1, () => {
        t.once("keypress", n);
      });
    });
  };
  return i && e.write(import_sisteransi.cursor.hide), t.once("keypress", n), () => {
    t.off("keypress", n), i && e.write(import_sisteransi.cursor.show), t instanceof J && t.isTTY && !bt && t.setRawMode(false), r.terminal = false, r.close();
  };
}
var rt = (t) => ("columns" in t) && typeof t.columns == "number" ? t.columns : 80;
var nt = (t) => ("rows" in t) && typeof t.rows == "number" ? t.rows : 20;
function Bt(t, e, s, i = s) {
  const r = rt(t ?? R);
  return K(e, r - s.length, { hard: true, trim: false }).split(`
`).map((n, u) => `${u === 0 ? i : s}${n}`).join(`
`);
}

class B {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = new Map;
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  constructor(e, s = true) {
    const { input: i = q, output: r = R, render: n, signal: u, ...a } = e;
    this.opts = a, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = n.bind(this), this._track = s, this._abortSignal = u, this.input = i, this.output = r;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(e, s) {
    const i = this._subscribers.get(e) ?? [];
    i.push(s), this._subscribers.set(e, i);
  }
  on(e, s) {
    this.setSubscriber(e, { cb: s });
  }
  once(e, s) {
    this.setSubscriber(e, { cb: s, once: true });
  }
  emit(e, ...s) {
    const i = this._subscribers.get(e) ?? [], r = [];
    for (const n of i)
      n.cb(...s), n.once && r.push(() => i.splice(i.indexOf(n), 1));
    for (const n of r)
      n();
  }
  prompt() {
    return new Promise((e) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), e(z);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      this.rl = ot.createInterface({ input: this.input, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), this.rl.prompt(), this.opts.initialUserInput !== undefined && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), W(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), W(this.input, false), e(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), W(this.input, false), e(z);
      });
    });
  }
  _isActionKey(e, s) {
    return e === "\t";
  }
  _setValue(e) {
    this.value = e, this.emit("value", this.value);
  }
  _setUserInput(e, s) {
    this.userInput = e ?? "", this.emit("userInput", this.userInput), s && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  onKeypress(e, s) {
    if (this._track && s.name !== "return" && (s.name && this._isActionKey(e, s) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), s?.name && (!this._track && _.aliases.has(s.name) && this.emit("cursor", _.aliases.get(s.name)), _.actions.has(s.name) && this.emit("cursor", s.name)), e && (e.toLowerCase() === "y" || e.toLowerCase() === "n") && this.emit("confirm", e.toLowerCase() === "y"), this.emit("key", e?.toLowerCase(), s), s?.name === "return") {
      if (this.opts.validate) {
        const i = this.opts.validate(this.value);
        i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
      }
      this.state !== "error" && (this.state = "submit");
    }
    H([e, s?.name, s?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), W(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const e = K(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, e * -1));
  }
  render() {
    const e = K(this._render(this) ?? "", process.stdout.columns, { hard: true, trim: false });
    if (e !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const s = _t(this._prevFrame, e), i = nt(this.output);
        if (this.restoreCursor(), s) {
          const r = Math.max(0, s.numLinesAfter - i), n = Math.max(0, s.numLinesBefore - i);
          let u = s.lines.find((a) => a >= r);
          if (u === undefined) {
            this._prevFrame = e;
            return;
          }
          if (s.lines.length === 1) {
            this.output.write(import_sisteransi.cursor.move(0, u - n)), this.output.write(import_sisteransi.erase.lines(1));
            const a = e.split(`
`);
            this.output.write(a[u]), this._prevFrame = e, this.output.write(import_sisteransi.cursor.move(0, a.length - u - 1));
            return;
          } else if (s.lines.length > 1) {
            if (r < n)
              u = r;
            else {
              const l = u - n;
              l > 0 && this.output.write(import_sisteransi.cursor.move(0, l));
            }
            this.output.write(import_sisteransi.erase.down());
            const a = e.split(`
`).slice(u);
            this.output.write(a.join(`
`)), this._prevFrame = e;
            return;
          }
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(e), this.state === "initial" && (this.state = "active"), this._prevFrame = e;
    }
  }
}
function wt(t, e) {
  if (t === undefined || e.length === 0)
    return 0;
  const s = e.findIndex((i) => i.value === t);
  return s !== -1 ? s : 0;
}
function Dt(t, e) {
  return (e.label ?? String(e.value)).toLowerCase().includes(t.toLowerCase());
}
function St(t, e) {
  if (e)
    return t ? e : e[0];
}

class Vt extends B {
  filteredOptions;
  multiple;
  isNavigating = false;
  selectedValues = [];
  focusedValue;
  #t = 0;
  #s = "";
  #i;
  #e;
  get cursor() {
    return this.#t;
  }
  get userInputWithCursor() {
    if (!this.userInput)
      return D(["inverse", "hidden"], "_");
    if (this._cursor >= this.userInput.length)
      return `${this.userInput}█`;
    const e = this.userInput.slice(0, this._cursor), [s, ...i] = this.userInput.slice(this._cursor);
    return `${e}${D("inverse", s)}${i.join("")}`;
  }
  get options() {
    return typeof this.#e == "function" ? this.#e() : this.#e;
  }
  constructor(e) {
    super(e), this.#e = e.options;
    const s = this.options;
    this.filteredOptions = [...s], this.multiple = e.multiple === true, this.#i = e.filter ?? Dt;
    let i;
    if (e.initialValue && Array.isArray(e.initialValue) ? this.multiple ? i = e.initialValue : i = e.initialValue.slice(0, 1) : !this.multiple && this.options.length > 0 && (i = [this.options[0].value]), i)
      for (const r of i) {
        const n = s.findIndex((u) => u.value === r);
        n !== -1 && (this.toggleSelected(r), this.#t = n);
      }
    this.focusedValue = this.options[this.#t]?.value, this.on("key", (r, n) => this.#r(r, n)), this.on("userInput", (r) => this.#n(r));
  }
  _isActionKey(e, s) {
    return e === "\t" || this.multiple && this.isNavigating && s.name === "space" && e !== undefined && e !== "";
  }
  #r(e, s) {
    const i = s.name === "up", r = s.name === "down", n = s.name === "return";
    i || r ? (this.#t = x(this.#t, i ? -1 : 1, this.filteredOptions), this.focusedValue = this.filteredOptions[this.#t]?.value, this.multiple || (this.selectedValues = [this.focusedValue]), this.isNavigating = true) : n ? this.value = St(this.multiple, this.selectedValues) : this.multiple ? this.focusedValue !== undefined && (s.name === "tab" || this.isNavigating && s.name === "space") ? this.toggleSelected(this.focusedValue) : this.isNavigating = false : (this.focusedValue && (this.selectedValues = [this.focusedValue]), this.isNavigating = false);
  }
  deselectAll() {
    this.selectedValues = [];
  }
  toggleSelected(e) {
    this.filteredOptions.length !== 0 && (this.multiple ? this.selectedValues.includes(e) ? this.selectedValues = this.selectedValues.filter((s) => s !== e) : this.selectedValues = [...this.selectedValues, e] : this.selectedValues = [e]);
  }
  #n(e) {
    if (e !== this.#s) {
      this.#s = e;
      const s = this.options;
      e ? this.filteredOptions = s.filter((n) => this.#i(e, n)) : this.filteredOptions = [...s];
      const i = wt(this.focusedValue, this.filteredOptions);
      this.#t = x(i, 0, this.filteredOptions);
      const r = this.filteredOptions[this.#t];
      r && !r.disabled ? this.focusedValue = r.value : this.focusedValue = undefined, this.multiple || (this.focusedValue !== undefined ? this.toggleSelected(this.focusedValue) : this.deselectAll());
    }
  }
}

class kt extends B {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(e) {
    super(e, false), this.value = !!e.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (s) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = s, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}

class yt extends B {
  options;
  cursor = 0;
  #t;
  getGroupItems(e) {
    return this.options.filter((s) => s.group === e);
  }
  isGroupSelected(e) {
    const s = this.getGroupItems(e), i = this.value;
    return i === undefined ? false : s.every((r) => i.includes(r.value));
  }
  toggleValue() {
    const e = this.options[this.cursor];
    if (this.value === undefined && (this.value = []), e.group === true) {
      const s = e.value, i = this.getGroupItems(s);
      this.isGroupSelected(s) ? this.value = this.value.filter((r) => i.findIndex((n) => n.value === r) === -1) : this.value = [...this.value, ...i.map((r) => r.value)], this.value = Array.from(new Set(this.value));
    } else {
      const s = this.value.includes(e.value);
      this.value = s ? this.value.filter((i) => i !== e.value) : [...this.value, e.value];
    }
  }
  constructor(e) {
    super(e, false);
    const { options: s } = e;
    this.#t = e.selectableGroups !== false, this.options = Object.entries(s).flatMap(([i, r]) => [{ value: i, group: true, label: i }, ...r.map((n) => ({ ...n, group: i }))]), this.value = [...e.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: i }) => i === e.cursorAt), this.#t ? 0 : 1), this.on("cursor", (i) => {
      switch (i) {
        case "left":
        case "up": {
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
          break;
        }
        case "down":
        case "right": {
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
          break;
        }
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
}
var Lt = class extends B {
  options;
  cursor = 0;
  get _value() {
    return this.options[this.cursor].value;
  }
  get _enabledOptions() {
    return this.options.filter((e) => e.disabled !== true);
  }
  toggleAll() {
    const e = this._enabledOptions, s = this.value !== undefined && this.value.length === e.length;
    this.value = s ? [] : e.map((i) => i.value);
  }
  toggleInvert() {
    const e = this.value;
    if (!e)
      return;
    const s = this._enabledOptions.filter((i) => !e.includes(i.value));
    this.value = s.map((i) => i.value);
  }
  toggleValue() {
    this.value === undefined && (this.value = []);
    const e = this.value.includes(this._value);
    this.value = e ? this.value.filter((s) => s !== this._value) : [...this.value, this._value];
  }
  constructor(e) {
    super(e, false), this.options = e.options, this.value = [...e.initialValues ?? []];
    const s = Math.max(this.options.findIndex(({ value: i }) => i === e.cursorAt), 0);
    this.cursor = this.options[s].disabled ? x(s, 1, this.options) : s, this.on("key", (i) => {
      i === "a" && this.toggleAll(), i === "i" && this.toggleInvert();
    }), this.on("cursor", (i) => {
      switch (i) {
        case "left":
        case "up":
          this.cursor = x(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = x(this.cursor, 1, this.options);
          break;
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
};
class Tt extends B {
  options;
  cursor = 0;
  get _selectedValue() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._selectedValue.value;
  }
  constructor(e) {
    super(e, false), this.options = e.options;
    const s = this.options.findIndex(({ value: r }) => r === e.initialValue), i = s === -1 ? 0 : s;
    this.cursor = this.options[i].disabled ? x(i, 1, this.options) : i, this.changeValue(), this.on("cursor", (r) => {
      switch (r) {
        case "left":
        case "up":
          this.cursor = x(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = x(this.cursor, 1, this.options);
          break;
      }
      this.changeValue();
    });
  }
}

// ../../node_modules/@clack/prompts/dist/index.mjs
import { styleText as t, stripVTControlCharacters as ue } from "node:util";
import N2 from "node:process";
var import_sisteransi2 = __toESM(require_src(), 1);
function pt2() {
  return N2.platform !== "win32" ? N2.env.TERM !== "linux" : !!N2.env.CI || !!N2.env.WT_SESSION || !!N2.env.TERMINUS_SUBLIME || N2.env.ConEmuTask === "{cmd::Cmder}" || N2.env.TERM_PROGRAM === "Terminus-Sublime" || N2.env.TERM_PROGRAM === "vscode" || N2.env.TERM === "xterm-256color" || N2.env.TERM === "alacritty" || N2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var ee = pt2();
var ce = () => process.env.CI === "true";
var I2 = (e, r) => ee ? e : r;
var Re = I2("◆", "*");
var $e = I2("■", "x");
var de = I2("▲", "x");
var V = I2("◇", "o");
var he = I2("┌", "T");
var h = I2("│", "|");
var x2 = I2("└", "—");
var Oe = I2("┐", "T");
var Pe = I2("┘", "—");
var z2 = I2("●", ">");
var H2 = I2("○", " ");
var te = I2("◻", "[•]");
var U2 = I2("◼", "[+]");
var q2 = I2("◻", "[ ]");
var Ne = I2("▪", "•");
var se = I2("─", "-");
var pe = I2("╮", "+");
var We = I2("├", "+");
var me = I2("╯", "+");
var ge = I2("╰", "+");
var Ge = I2("╭", "+");
var fe = I2("●", "•");
var Fe = I2("◆", "*");
var ye = I2("▲", "!");
var Ee = I2("■", "x");
var W2 = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return t("cyan", Re);
    case "cancel":
      return t("red", $e);
    case "error":
      return t("yellow", de);
    case "submit":
      return t("green", V);
  }
};
var ve = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return t("cyan", h);
    case "cancel":
      return t("red", h);
    case "error":
      return t("yellow", h);
    case "submit":
      return t("green", h);
  }
};
var mt2 = (e) => e === 161 || e === 164 || e === 167 || e === 168 || e === 170 || e === 173 || e === 174 || e >= 176 && e <= 180 || e >= 182 && e <= 186 || e >= 188 && e <= 191 || e === 198 || e === 208 || e === 215 || e === 216 || e >= 222 && e <= 225 || e === 230 || e >= 232 && e <= 234 || e === 236 || e === 237 || e === 240 || e === 242 || e === 243 || e >= 247 && e <= 250 || e === 252 || e === 254 || e === 257 || e === 273 || e === 275 || e === 283 || e === 294 || e === 295 || e === 299 || e >= 305 && e <= 307 || e === 312 || e >= 319 && e <= 322 || e === 324 || e >= 328 && e <= 331 || e === 333 || e === 338 || e === 339 || e === 358 || e === 359 || e === 363 || e === 462 || e === 464 || e === 466 || e === 468 || e === 470 || e === 472 || e === 474 || e === 476 || e === 593 || e === 609 || e === 708 || e === 711 || e >= 713 && e <= 715 || e === 717 || e === 720 || e >= 728 && e <= 731 || e === 733 || e === 735 || e >= 768 && e <= 879 || e >= 913 && e <= 929 || e >= 931 && e <= 937 || e >= 945 && e <= 961 || e >= 963 && e <= 969 || e === 1025 || e >= 1040 && e <= 1103 || e === 1105 || e === 8208 || e >= 8211 && e <= 8214 || e === 8216 || e === 8217 || e === 8220 || e === 8221 || e >= 8224 && e <= 8226 || e >= 8228 && e <= 8231 || e === 8240 || e === 8242 || e === 8243 || e === 8245 || e === 8251 || e === 8254 || e === 8308 || e === 8319 || e >= 8321 && e <= 8324 || e === 8364 || e === 8451 || e === 8453 || e === 8457 || e === 8467 || e === 8470 || e === 8481 || e === 8482 || e === 8486 || e === 8491 || e === 8531 || e === 8532 || e >= 8539 && e <= 8542 || e >= 8544 && e <= 8555 || e >= 8560 && e <= 8569 || e === 8585 || e >= 8592 && e <= 8601 || e === 8632 || e === 8633 || e === 8658 || e === 8660 || e === 8679 || e === 8704 || e === 8706 || e === 8707 || e === 8711 || e === 8712 || e === 8715 || e === 8719 || e === 8721 || e === 8725 || e === 8730 || e >= 8733 && e <= 8736 || e === 8739 || e === 8741 || e >= 8743 && e <= 8748 || e === 8750 || e >= 8756 && e <= 8759 || e === 8764 || e === 8765 || e === 8776 || e === 8780 || e === 8786 || e === 8800 || e === 8801 || e >= 8804 && e <= 8807 || e === 8810 || e === 8811 || e === 8814 || e === 8815 || e === 8834 || e === 8835 || e === 8838 || e === 8839 || e === 8853 || e === 8857 || e === 8869 || e === 8895 || e === 8978 || e >= 9312 && e <= 9449 || e >= 9451 && e <= 9547 || e >= 9552 && e <= 9587 || e >= 9600 && e <= 9615 || e >= 9618 && e <= 9621 || e === 9632 || e === 9633 || e >= 9635 && e <= 9641 || e === 9650 || e === 9651 || e === 9654 || e === 9655 || e === 9660 || e === 9661 || e === 9664 || e === 9665 || e >= 9670 && e <= 9672 || e === 9675 || e >= 9678 && e <= 9681 || e >= 9698 && e <= 9701 || e === 9711 || e === 9733 || e === 9734 || e === 9737 || e === 9742 || e === 9743 || e === 9756 || e === 9758 || e === 9792 || e === 9794 || e === 9824 || e === 9825 || e >= 9827 && e <= 9829 || e >= 9831 && e <= 9834 || e === 9836 || e === 9837 || e === 9839 || e === 9886 || e === 9887 || e === 9919 || e >= 9926 && e <= 9933 || e >= 9935 && e <= 9939 || e >= 9941 && e <= 9953 || e === 9955 || e === 9960 || e === 9961 || e >= 9963 && e <= 9969 || e === 9972 || e >= 9974 && e <= 9977 || e === 9979 || e === 9980 || e === 9982 || e === 9983 || e === 10045 || e >= 10102 && e <= 10111 || e >= 11094 && e <= 11097 || e >= 12872 && e <= 12879 || e >= 57344 && e <= 63743 || e >= 65024 && e <= 65039 || e === 65533 || e >= 127232 && e <= 127242 || e >= 127248 && e <= 127277 || e >= 127280 && e <= 127337 || e >= 127344 && e <= 127373 || e === 127375 || e === 127376 || e >= 127387 && e <= 127404 || e >= 917760 && e <= 917999 || e >= 983040 && e <= 1048573 || e >= 1048576 && e <= 1114109;
var gt2 = (e) => e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510;
var ft2 = (e) => e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 || e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9800 && e <= 9811 || e === 9855 || e === 9875 || e === 9889 || e === 9898 || e === 9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e === 9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <= 10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 || e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 || e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12771 || e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 19903 || e >= 19968 && e <= 42124 || e >= 42128 && e <= 42182 || e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 || e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 || e >= 100352 && e <= 101589 || e >= 101632 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e === 110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 && e <= 111355 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <= 127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 && e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >= 127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 || e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 && e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <= 128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 || e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129672 || e >= 129680 && e <= 129725 || e >= 129727 && e <= 129733 || e >= 129742 && e <= 129755 || e >= 129760 && e <= 129768 || e >= 129776 && e <= 129784 || e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141;
var we = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var re = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var ie = /\t{1,1000}/y;
var Ae = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var ne = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var Ft2 = /\p{M}+/gu;
var yt2 = { limit: 1 / 0, ellipsis: "" };
var Le = (e, r = {}, s = {}) => {
  const i = r.limit ?? 1 / 0, a = r.ellipsis ?? "", o = r?.ellipsisWidth ?? (a ? Le(a, yt2, s).width : 0), u = s.ansiWidth ?? 0, l = s.controlWidth ?? 0, n = s.tabWidth ?? 8, c = s.ambiguousWidth ?? 1, p = s.emojiWidth ?? 2, f = s.fullWidthWidth ?? 2, g = s.regularWidth ?? 1, E = s.wideWidth ?? 2;
  let $ = 0, m = 0, d = e.length, F = 0, y2 = false, v = d, C = Math.max(0, i - o), A = 0, b = 0, w = 0, S2 = 0;
  e:
    for (;; ) {
      if (b > A || m >= d && m > $) {
        const T2 = e.slice(A, b) || e.slice($, m);
        F = 0;
        for (const M2 of T2.replaceAll(Ft2, "")) {
          const O2 = M2.codePointAt(0) || 0;
          if (gt2(O2) ? S2 = f : ft2(O2) ? S2 = E : c !== g && mt2(O2) ? S2 = c : S2 = g, w + S2 > C && (v = Math.min(v, Math.max(A, $) + F)), w + S2 > i) {
            y2 = true;
            break e;
          }
          F += M2.length, w += S2;
        }
        A = b = 0;
      }
      if (m >= d)
        break;
      if (ne.lastIndex = m, ne.test(e)) {
        if (F = ne.lastIndex - m, S2 = F * g, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / g))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = ne.lastIndex;
        continue;
      }
      if (we.lastIndex = m, we.test(e)) {
        if (w + u > C && (v = Math.min(v, m)), w + u > i) {
          y2 = true;
          break;
        }
        w += u, A = $, b = m, m = $ = we.lastIndex;
        continue;
      }
      if (re.lastIndex = m, re.test(e)) {
        if (F = re.lastIndex - m, S2 = F * l, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / l))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = re.lastIndex;
        continue;
      }
      if (ie.lastIndex = m, ie.test(e)) {
        if (F = ie.lastIndex - m, S2 = F * n, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / n))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = ie.lastIndex;
        continue;
      }
      if (Ae.lastIndex = m, Ae.test(e)) {
        if (w + p > C && (v = Math.min(v, m)), w + p > i) {
          y2 = true;
          break;
        }
        w += p, A = $, b = m, m = $ = Ae.lastIndex;
        continue;
      }
      m += 1;
    }
  return { width: y2 ? C : w, index: y2 ? v : d, truncated: y2, ellipsed: y2 && i >= o };
};
var Et2 = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var D2 = (e, r = {}) => Le(e, Et2, r).width;
var ae = "\x1B";
var je = "";
var vt2 = 39;
var Ce = "\x07";
var ke = "[";
var wt2 = "]";
var Ve = "m";
var Se = `${wt2}8;;`;
var He = new RegExp(`(?:\\${ke}(?<code>\\d+)m|\\${Se}(?<uri>.*)${Ce})`, "y");
var At2 = (e) => {
  if (e >= 30 && e <= 37 || e >= 90 && e <= 97)
    return 39;
  if (e >= 40 && e <= 47 || e >= 100 && e <= 107)
    return 49;
  if (e === 1 || e === 2)
    return 22;
  if (e === 3)
    return 23;
  if (e === 4)
    return 24;
  if (e === 7)
    return 27;
  if (e === 8)
    return 28;
  if (e === 9)
    return 29;
  if (e === 0)
    return 0;
};
var Ue = (e) => `${ae}${ke}${e}${Ve}`;
var Ke = (e) => `${ae}${Se}${e}${Ce}`;
var Ct2 = (e) => e.map((r) => D2(r));
var Ie = (e, r, s) => {
  const i = r[Symbol.iterator]();
  let a = false, o = false, u = e.at(-1), l = u === undefined ? 0 : D2(u), n = i.next(), c = i.next(), p = 0;
  for (;!n.done; ) {
    const f = n.value, g = D2(f);
    l + g <= s ? e[e.length - 1] += f : (e.push(f), l = 0), (f === ae || f === je) && (a = true, o = r.startsWith(Se, p + 1)), a ? o ? f === Ce && (a = false, o = false) : f === Ve && (a = false) : (l += g, l === s && !c.done && (e.push(""), l = 0)), n = c, c = i.next(), p += f.length;
  }
  u = e.at(-1), !l && u !== undefined && u.length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
};
var St2 = (e) => {
  const r = e.split(" ");
  let s = r.length;
  for (;s > 0 && !(D2(r[s - 1]) > 0); )
    s--;
  return s === r.length ? e : r.slice(0, s).join(" ") + r.slice(s).join("");
};
var It2 = (e, r, s = {}) => {
  if (s.trim !== false && e.trim() === "")
    return "";
  let i = "", a, o;
  const u = e.split(" "), l = Ct2(u);
  let n = [""];
  for (const [$, m] of u.entries()) {
    s.trim !== false && (n[n.length - 1] = (n.at(-1) ?? "").trimStart());
    let d = D2(n.at(-1) ?? "");
    if ($ !== 0 && (d >= r && (s.wordWrap === false || s.trim === false) && (n.push(""), d = 0), (d > 0 || s.trim === false) && (n[n.length - 1] += " ", d++)), s.hard && l[$] > r) {
      const F = r - d, y2 = 1 + Math.floor((l[$] - F - 1) / r);
      Math.floor((l[$] - 1) / r) < y2 && n.push(""), Ie(n, m, r);
      continue;
    }
    if (d + l[$] > r && d > 0 && l[$] > 0) {
      if (s.wordWrap === false && d < r) {
        Ie(n, m, r);
        continue;
      }
      n.push("");
    }
    if (d + l[$] > r && s.wordWrap === false) {
      Ie(n, m, r);
      continue;
    }
    n[n.length - 1] += m;
  }
  s.trim !== false && (n = n.map(($) => St2($)));
  const c = n.join(`
`), p = c[Symbol.iterator]();
  let f = p.next(), g = p.next(), E = 0;
  for (;!f.done; ) {
    const $ = f.value, m = g.value;
    if (i += $, $ === ae || $ === je) {
      He.lastIndex = E + 1;
      const y2 = He.exec(c)?.groups;
      if (y2?.code !== undefined) {
        const v = Number.parseFloat(y2.code);
        a = v === vt2 ? undefined : v;
      } else
        y2?.uri !== undefined && (o = y2.uri.length === 0 ? undefined : y2.uri);
    }
    const d = a ? At2(a) : undefined;
    m === `
` ? (o && (i += Ke("")), a && d && (i += Ue(d))) : $ === `
` && (a && d && (i += Ue(a)), o && (i += Ke(o))), E += $.length, f = g, g = p.next();
  }
  return i;
};
function J2(e, r, s) {
  return String(e).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => It2(i, r, s)).join(`
`);
}
var bt2 = (e, r, s, i, a) => {
  let o = r, u = 0;
  for (let l = s;l < i; l++) {
    const n = e[l];
    if (o = o - n.length, u++, o <= a)
      break;
  }
  return { lineCount: o, removals: u };
};
var X2 = ({ cursor: e, options: r, style: s, output: i = process.stdout, maxItems: a = Number.POSITIVE_INFINITY, columnPadding: o = 0, rowPadding: u = 4 }) => {
  const l = rt(i) - o, n = nt(i), c = t("dim", "..."), p = Math.max(n - u, 0), f = Math.max(Math.min(a, p), 5);
  let g = 0;
  e >= f - 3 && (g = Math.max(Math.min(e - f + 3, r.length - f), 0));
  let E = f < r.length && g > 0, $ = f < r.length && g + f < r.length;
  const m = Math.min(g + f, r.length), d = [];
  let F = 0;
  E && F++, $ && F++;
  const y2 = g + (E ? 1 : 0), v = m - ($ ? 1 : 0);
  for (let A = y2;A < v; A++) {
    const b = J2(s(r[A], A === e), l, { hard: true, trim: false }).split(`
`);
    d.push(b), F += b.length;
  }
  if (F > p) {
    let A = 0, b = 0, w = F;
    const S2 = e - y2, T2 = (M2, O2) => bt2(d, w, M2, O2, p);
    E ? ({ lineCount: w, removals: A } = T2(0, S2), w > p && ({ lineCount: w, removals: b } = T2(S2 + 1, d.length))) : ({ lineCount: w, removals: b } = T2(S2 + 1, d.length), w > p && ({ lineCount: w, removals: A } = T2(0, S2))), A > 0 && (E = true, d.splice(0, A)), b > 0 && ($ = true, d.splice(d.length - b, b));
  }
  const C = [];
  E && C.push(c);
  for (const A of d)
    for (const b of A)
      C.push(b);
  return $ && C.push(c), C;
};
var _t2 = [Ge, pe, ge, me];
var Dt2 = [he, Oe, x2, Pe];
function Ye(e, r, s, i) {
  let a = s, o = s;
  return i === "center" ? a = Math.floor((r - e) / 2) : i === "right" && (a = r - e - s), o = r - a - e, [a, o];
}
var Tt2 = (e) => e;
var Mt2 = (e = "", r = "", s) => {
  const i = s?.output ?? process.stdout, a = rt(i), o = 2, u = s?.titlePadding ?? 1, l = s?.contentPadding ?? 2, n = s?.width === undefined || s.width === "auto" ? 1 : Math.min(1, s.width), c = s?.withGuide ?? _.withGuide ? `${h} ` : "", p = s?.formatBorder ?? Tt2, f = ((s?.rounded) ? _t2 : Dt2).map(p), g = p(se), E = p(h), $ = D2(c), m = D2(r), d = a - $;
  let F = Math.floor(a * n) - $;
  if (s?.width === "auto") {
    const T2 = e.split(`
`);
    let M2 = m + u * 2;
    for (const le of T2) {
      const k2 = D2(le) + l * 2;
      k2 > M2 && (M2 = k2);
    }
    const O2 = M2 + o;
    O2 < F && (F = O2);
  }
  F % 2 !== 0 && (F < d ? F++ : F--);
  const y2 = F - o, v = y2 - u * 2, C = m > v ? `${r.slice(0, v - 3)}...` : r, [A, b] = Ye(D2(C), y2, u, s?.titleAlign), w = J2(e, y2 - l * 2, { hard: true, trim: false });
  i.write(`${c}${f[0]}${g.repeat(A)}${C}${g.repeat(b)}${f[1]}
`);
  const S2 = w.split(`
`);
  for (const T2 of S2) {
    const [M2, O2] = Ye(D2(T2), y2, l, s?.contentAlign);
    i.write(`${c}${E}${" ".repeat(M2)}${T2}${" ".repeat(O2)}${E}
`);
  }
  i.write(`${c}${f[2]}${g.repeat(y2)}${f[3]}
`);
};
var Rt = (e) => {
  const r = e.active ?? "Yes", s = e.inactive ?? "No";
  return new kt({ active: r, inactive: s, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue ?? true, render() {
    const i = e.withGuide ?? _.withGuide, a = `${i ? `${t("gray", h)}
` : ""}${W2(this.state)}  ${e.message}
`, o = this.value ? r : s;
    switch (this.state) {
      case "submit": {
        const u = i ? `${t("gray", h)}  ` : "";
        return `${a}${u}${t("dim", o)}`;
      }
      case "cancel": {
        const u = i ? `${t("gray", h)}  ` : "";
        return `${a}${u}${t(["strikethrough", "dim"], o)}${i ? `
${t("gray", h)}` : ""}`;
      }
      default: {
        const u = i ? `${t("cyan", h)}  ` : "", l = i ? t("cyan", x2) : "";
        return `${a}${u}${this.value ? `${t("green", z2)} ${r}` : `${t("dim", H2)} ${t("dim", r)}`}${e.vertical ? i ? `
${t("cyan", h)}  ` : `
` : ` ${t("dim", "/")} `}${this.value ? `${t("dim", H2)} ${t("dim", s)}` : `${t("green", z2)} ${s}`}
${l}
`;
      }
    }
  } }).prompt();
};
var R2 = { message: (e = [], { symbol: r = t("gray", h), secondarySymbol: s = t("gray", h), output: i = process.stdout, spacing: a = 1, withGuide: o } = {}) => {
  const u = [], l = o ?? _.withGuide, n = l ? s : "", c = l ? `${r}  ` : "", p = l ? `${s}  ` : "";
  for (let g = 0;g < a; g++)
    u.push(n);
  const f = Array.isArray(e) ? e : e.split(`
`);
  if (f.length > 0) {
    const [g, ...E] = f;
    g.length > 0 ? u.push(`${c}${g}`) : u.push(l ? r : "");
    for (const $ of E)
      $.length > 0 ? u.push(`${p}${$}`) : u.push(l ? s : "");
  }
  i.write(`${u.join(`
`)}
`);
}, info: (e, r) => {
  R2.message(e, { ...r, symbol: t("blue", fe) });
}, success: (e, r) => {
  R2.message(e, { ...r, symbol: t("green", Fe) });
}, step: (e, r) => {
  R2.message(e, { ...r, symbol: t("green", V) });
}, warn: (e, r) => {
  R2.message(e, { ...r, symbol: t("yellow", ye) });
}, warning: (e, r) => {
  R2.warn(e, r);
}, error: (e, r) => {
  R2.message(e, { ...r, symbol: t("red", Ee) });
} };
var Nt = (e = "", r) => {
  const s = r?.output ?? process.stdout, i = r?.withGuide ?? _.withGuide ? `${t("gray", x2)}  ` : "";
  s.write(`${i}${t("red", e)}

`);
};
var Wt2 = (e = "", r) => {
  const s = r?.output ?? process.stdout, i = r?.withGuide ?? _.withGuide ? `${t("gray", he)}  ` : "";
  s.write(`${i}${e}
`);
};
var Gt = (e = "", r) => {
  const s = r?.output ?? process.stdout, i = r?.withGuide ?? _.withGuide ? `${t("gray", h)}
${t("gray", x2)}  ` : "";
  s.write(`${i}${e}

`);
};
var Q2 = (e, r) => e.split(`
`).map((s) => r(s)).join(`
`);
var Lt2 = (e) => {
  const r = (i, a) => {
    const o = i.label ?? String(i.value);
    return a === "disabled" ? `${t("gray", q2)} ${Q2(o, (u) => t(["strikethrough", "gray"], u))}${i.hint ? ` ${t("dim", `(${i.hint ?? "disabled"})`)}` : ""}` : a === "active" ? `${t("cyan", te)} ${o}${i.hint ? ` ${t("dim", `(${i.hint})`)}` : ""}` : a === "selected" ? `${t("green", U2)} ${Q2(o, (u) => t("dim", u))}${i.hint ? ` ${t("dim", `(${i.hint})`)}` : ""}` : a === "cancelled" ? `${Q2(o, (u) => t(["strikethrough", "dim"], u))}` : a === "active-selected" ? `${t("green", U2)} ${o}${i.hint ? ` ${t("dim", `(${i.hint})`)}` : ""}` : a === "submitted" ? `${Q2(o, (u) => t("dim", u))}` : `${t("dim", q2)} ${Q2(o, (u) => t("dim", u))}`;
  }, s = e.required ?? true;
  return new Lt({ options: e.options, signal: e.signal, input: e.input, output: e.output, initialValues: e.initialValues, required: s, cursorAt: e.cursorAt, validate(i) {
    if (s && (i === undefined || i.length === 0))
      return `Please select at least one option.
${t("reset", t("dim", `Press ${t(["gray", "bgWhite", "inverse"], " space ")} to select, ${t("gray", t("bgWhite", t("inverse", " enter ")))} to submit`))}`;
  }, render() {
    const i = Bt(e.output, e.message, `${ve(this.state)}  `, `${W2(this.state)}  `), a = `${t("gray", h)}
${i}
`, o = this.value ?? [], u = (l, n) => {
      if (l.disabled)
        return r(l, "disabled");
      const c = o.includes(l.value);
      return n && c ? r(l, "active-selected") : c ? r(l, "selected") : r(l, n ? "active" : "inactive");
    };
    switch (this.state) {
      case "submit": {
        const l = this.options.filter(({ value: c }) => o.includes(c)).map((c) => r(c, "submitted")).join(t("dim", ", ")) || t("dim", "none"), n = Bt(e.output, l, `${t("gray", h)}  `);
        return `${a}${n}`;
      }
      case "cancel": {
        const l = this.options.filter(({ value: c }) => o.includes(c)).map((c) => r(c, "cancelled")).join(t("dim", ", "));
        if (l.trim() === "")
          return `${a}${t("gray", h)}`;
        const n = Bt(e.output, l, `${t("gray", h)}  `);
        return `${a}${n}
${t("gray", h)}`;
      }
      case "error": {
        const l = `${t("yellow", h)}  `, n = this.error.split(`
`).map((f, g) => g === 0 ? `${t("yellow", x2)}  ${t("yellow", f)}` : `   ${f}`).join(`
`), c = a.split(`
`).length, p = n.split(`
`).length + 1;
        return `${a}${l}${X2({ output: e.output, options: this.options, cursor: this.cursor, maxItems: e.maxItems, columnPadding: l.length, rowPadding: c + p, style: u }).join(`
${l}`)}
${n}
`;
      }
      default: {
        const l = `${t("cyan", h)}  `, n = a.split(`
`).length;
        return `${a}${l}${X2({ output: e.output, options: this.options, cursor: this.cursor, maxItems: e.maxItems, columnPadding: l.length, rowPadding: n + 2, style: u }).join(`
${l}`)}
${t("cyan", x2)}
`;
      }
    }
  } }).prompt();
};
var Kt = (e) => t("magenta", e);
var be = ({ indicator: e = "dots", onCancel: r, output: s = process.stdout, cancelMessage: i, errorMessage: a, frames: o = ee ? ["◒", "◐", "◓", "◑"] : ["•", "o", "O", "0"], delay: u = ee ? 80 : 120, signal: l, ...n } = {}) => {
  const c = ce();
  let p, f, g = false, E = false, $ = "", m, d = performance.now();
  const F = rt(s), y2 = n?.styleFrame ?? Kt, v = (B2) => {
    const P2 = B2 > 1 ? a ?? _.messages.error : i ?? _.messages.cancel;
    E = B2 === 1, g && (k2(P2, B2), E && typeof r == "function" && r());
  }, C = () => v(2), A = () => v(1), b = () => {
    process.on("uncaughtExceptionMonitor", C), process.on("unhandledRejection", C), process.on("SIGINT", A), process.on("SIGTERM", A), process.on("exit", v), l && l.addEventListener("abort", A);
  }, w = () => {
    process.removeListener("uncaughtExceptionMonitor", C), process.removeListener("unhandledRejection", C), process.removeListener("SIGINT", A), process.removeListener("SIGTERM", A), process.removeListener("exit", v), l && l.removeEventListener("abort", A);
  }, S2 = () => {
    if (m === undefined)
      return;
    c && s.write(`
`);
    const B2 = J2(m, F, { hard: true, trim: false }).split(`
`);
    B2.length > 1 && s.write(import_sisteransi2.cursor.up(B2.length - 1)), s.write(import_sisteransi2.cursor.to(0)), s.write(import_sisteransi2.erase.down());
  }, T2 = (B2) => B2.replace(/\.+$/, ""), M2 = (B2) => {
    const P2 = (performance.now() - B2) / 1000, G2 = Math.floor(P2 / 60), L2 = Math.floor(P2 % 60);
    return G2 > 0 ? `[${G2}m ${L2}s]` : `[${L2}s]`;
  }, O2 = n.withGuide ?? _.withGuide, le = (B2 = "") => {
    g = true, p = xt({ output: s }), $ = T2(B2), d = performance.now(), O2 && s.write(`${t("gray", h)}
`);
    let P2 = 0, G2 = 0;
    b(), f = setInterval(() => {
      if (c && $ === m)
        return;
      S2(), m = $;
      const L2 = y2(o[P2]);
      let Z2;
      if (c)
        Z2 = `${L2}  ${$}...`;
      else if (e === "timer")
        Z2 = `${L2}  ${$} ${M2(d)}`;
      else {
        const et2 = ".".repeat(Math.floor(G2)).slice(0, 3);
        Z2 = `${L2}  ${$}${et2}`;
      }
      const Ze = J2(Z2, F, { hard: true, trim: false });
      s.write(Ze), P2 = P2 + 1 < o.length ? P2 + 1 : 0, G2 = G2 < 4 ? G2 + 0.125 : 0;
    }, u);
  }, k2 = (B2 = "", P2 = 0, G2 = false) => {
    if (!g)
      return;
    g = false, clearInterval(f), S2();
    const L2 = P2 === 0 ? t("green", V) : P2 === 1 ? t("red", $e) : t("red", de);
    $ = B2 ?? $, G2 || (e === "timer" ? s.write(`${L2}  ${$} ${M2(d)}
`) : s.write(`${L2}  ${$}
`)), w(), p();
  };
  return { start: le, stop: (B2 = "") => k2(B2, 0), message: (B2 = "") => {
    $ = T2(B2 ?? $);
  }, cancel: (B2 = "") => k2(B2, 1), error: (B2 = "") => k2(B2, 2), clear: () => k2("", 0, true), get isCancelled() {
    return E;
  } };
};
var ze = { light: I2("─", "-"), heavy: I2("━", "="), block: I2("█", "#") };
function qt({ style: e = "heavy", max: r = 100, size: s = 40, ...i } = {}) {
  const a = be(i);
  let o = 0, u = "";
  const l = Math.max(1, r), n = Math.max(1, s), c = (E) => {
    switch (E) {
      case "initial":
      case "active":
        return ($) => t("magenta", $);
      case "error":
      case "cancel":
        return ($) => t("red", $);
      case "submit":
        return ($) => t("green", $);
      default:
        return ($) => t("magenta", $);
    }
  }, p = (E, $) => {
    const m = Math.floor(o / l * n);
    return `${c(E)(ze[e].repeat(m))}${t("dim", ze[e].repeat(n - m))} ${$}`;
  }, f = (E = "") => {
    u = E, a.start(p("initial", E));
  }, g = (E = 1, $) => {
    o = Math.min(l, E + o), a.message(p("active", $ ?? u)), u = $ ?? u;
  };
  return { start: f, stop: a.stop, cancel: a.cancel, error: a.error, clear: a.clear, advance: g, isCancelled: a.isCancelled, message: (E) => g(0, E) };
}
var oe = (e, r) => e.includes(`
`) ? e.split(`
`).map((s) => r(s)).join(`
`) : r(e);
var Jt = (e) => {
  const r = (s, i) => {
    const a = s.label ?? String(s.value);
    switch (i) {
      case "disabled":
        return `${t("gray", H2)} ${oe(a, (o) => t("gray", o))}${s.hint ? ` ${t("dim", `(${s.hint ?? "disabled"})`)}` : ""}`;
      case "selected":
        return `${oe(a, (o) => t("dim", o))}`;
      case "active":
        return `${t("green", z2)} ${a}${s.hint ? ` ${t("dim", `(${s.hint})`)}` : ""}`;
      case "cancelled":
        return `${oe(a, (o) => t(["strikethrough", "dim"], o))}`;
      default:
        return `${t("dim", H2)} ${oe(a, (o) => t("dim", o))}`;
    }
  };
  return new Tt({ options: e.options, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue, render() {
    const s = e.withGuide ?? _.withGuide, i = `${W2(this.state)}  `, a = `${ve(this.state)}  `, o = Bt(e.output, e.message, a, i), u = `${s ? `${t("gray", h)}
` : ""}${o}
`;
    switch (this.state) {
      case "submit": {
        const l = s ? `${t("gray", h)}  ` : "", n = Bt(e.output, r(this.options[this.cursor], "selected"), l);
        return `${u}${n}`;
      }
      case "cancel": {
        const l = s ? `${t("gray", h)}  ` : "", n = Bt(e.output, r(this.options[this.cursor], "cancelled"), l);
        return `${u}${n}${s ? `
${t("gray", h)}` : ""}`;
      }
      default: {
        const l = s ? `${t("cyan", h)}  ` : "", n = s ? t("cyan", x2) : "", c = u.split(`
`).length, p = s ? 2 : 1;
        return `${u}${l}${X2({ output: e.output, cursor: this.cursor, options: this.options, maxItems: e.maxItems, columnPadding: l.length, rowPadding: c + p, style: (f, g) => r(f, f.disabled ? "disabled" : g ? "active" : "inactive") }).join(`
${l}`)}
${n}
`;
      }
    }
  } }).prompt();
};
var Qe = `${t("gray", h)}  `;

// src/commands/disable.ts
async function runDisable() {
  const adapters2 = getAllAdapters();
  let anyDisabled = false;
  for (const adapter of adapters2) {
    if (adapter.isHookInstalled()) {
      adapter.removeHook();
      R2.success(`${adapter.name}: Auto-upload hook removed from ${adapter.getHookConfigPath()}`);
      anyDisabled = true;
    }
  }
  if (!anyDisabled) {
    R2.info("No auto-upload hooks are enabled.");
  }
}
var disableCommand = buildCommand({
  loader: async () => ({ default: runDisable }),
  parameters: {},
  docs: {
    brief: "Disable automatic session upload"
  }
});

// ../../node_modules/@orpc/shared/dist/index.mjs
function resolveMaybeOptionalOptions(rest) {
  return rest[0] ?? {};
}
function toArray(value) {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}
var ORPC_NAME = "orpc";
var ORPC_SHARED_PACKAGE_NAME = "@orpc/shared";
var ORPC_SHARED_PACKAGE_VERSION = "1.13.6";

class AbortError extends Error {
  constructor(...rest) {
    super(...rest);
    this.name = "AbortError";
  }
}
function once(fn) {
  let cached;
  return () => {
    if (cached) {
      return cached.result;
    }
    const result = fn();
    cached = { result };
    return result;
  };
}
function sequential(fn) {
  let lastOperationPromise = Promise.resolve();
  return (...args) => {
    return lastOperationPromise = lastOperationPromise.catch(() => {}).then(() => {
      return fn(...args);
    });
  };
}
var SPAN_ERROR_STATUS = 2;
var GLOBAL_OTEL_CONFIG_KEY = `__${ORPC_SHARED_PACKAGE_NAME}@${ORPC_SHARED_PACKAGE_VERSION}/otel/config__`;
function getGlobalOtelConfig() {
  return globalThis[GLOBAL_OTEL_CONFIG_KEY];
}
function startSpan(name, options = {}, context) {
  const tracer = getGlobalOtelConfig()?.tracer;
  return tracer?.startSpan(name, options, context);
}
function setSpanError(span, error, options = {}) {
  if (!span) {
    return;
  }
  const exception = toOtelException(error);
  span.recordException(exception);
  if (!options.signal?.aborted || options.signal.reason !== error) {
    span.setStatus({
      code: SPAN_ERROR_STATUS,
      message: exception.message
    });
  }
}
function toOtelException(error) {
  if (error instanceof Error) {
    const exception = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    if ("code" in error && (typeof error.code === "string" || typeof error.code === "number")) {
      exception.code = error.code;
    }
    return exception;
  }
  return { message: String(error) };
}
async function runWithSpan({ name, context, ...options }, fn) {
  const tracer = getGlobalOtelConfig()?.tracer;
  if (!tracer) {
    return fn();
  }
  const callback = async (span) => {
    try {
      return await fn(span);
    } catch (e) {
      setSpanError(span, e, options);
      throw e;
    } finally {
      span.end();
    }
  };
  if (context) {
    return tracer.startActiveSpan(name, options, context, callback);
  } else {
    return tracer.startActiveSpan(name, options, callback);
  }
}
async function runInSpanContext(span, fn) {
  const otelConfig = getGlobalOtelConfig();
  if (!span || !otelConfig) {
    return fn();
  }
  const ctx = otelConfig.trace.setSpan(otelConfig.context.active(), span);
  return otelConfig.context.with(ctx, fn);
}
function isAsyncIteratorObject(maybe) {
  if (!maybe || typeof maybe !== "object") {
    return false;
  }
  return "next" in maybe && typeof maybe.next === "function" && Symbol.asyncIterator in maybe && typeof maybe[Symbol.asyncIterator] === "function";
}
var fallbackAsyncDisposeSymbol = Symbol.for("asyncDispose");
var asyncDisposeSymbol = Symbol.asyncDispose ?? fallbackAsyncDisposeSymbol;

class AsyncIteratorClass {
  #isDone = false;
  #isExecuteComplete = false;
  #cleanup;
  #next;
  constructor(next, cleanup) {
    this.#cleanup = cleanup;
    this.#next = sequential(async () => {
      if (this.#isDone) {
        return { done: true, value: undefined };
      }
      try {
        const result = await next();
        if (result.done) {
          this.#isDone = true;
        }
        return result;
      } catch (err) {
        this.#isDone = true;
        throw err;
      } finally {
        if (this.#isDone && !this.#isExecuteComplete) {
          this.#isExecuteComplete = true;
          await this.#cleanup("next");
        }
      }
    });
  }
  next() {
    return this.#next();
  }
  async return(value) {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("return");
    }
    return { done: true, value };
  }
  async throw(err) {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("throw");
    }
    throw err;
  }
  async[asyncDisposeSymbol]() {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("dispose");
    }
  }
  [Symbol.asyncIterator]() {
    return this;
  }
}
function asyncIteratorWithSpan({ name, ...options }, iterator) {
  let span;
  return new AsyncIteratorClass(async () => {
    span ??= startSpan(name);
    try {
      const result = await runInSpanContext(span, () => iterator.next());
      span?.addEvent(result.done ? "completed" : "yielded");
      return result;
    } catch (err) {
      setSpanError(span, err, options);
      throw err;
    }
  }, async (reason) => {
    try {
      if (reason !== "next") {
        await runInSpanContext(span, () => iterator.return?.());
      }
    } catch (err) {
      setSpanError(span, err, options);
      throw err;
    } finally {
      span?.end();
    }
  });
}

class EventPublisher {
  #listenersMap = /* @__PURE__ */ new Map;
  #maxBufferedEvents;
  constructor(options = {}) {
    this.#maxBufferedEvents = options.maxBufferedEvents ?? 100;
  }
  get size() {
    return this.#listenersMap.size;
  }
  publish(event, payload) {
    const listeners = this.#listenersMap.get(event);
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      listener(payload);
    }
  }
  subscribe(event, listenerOrOptions) {
    if (typeof listenerOrOptions === "function") {
      let listeners = this.#listenersMap.get(event);
      if (!listeners) {
        this.#listenersMap.set(event, listeners = []);
      }
      listeners.push(listenerOrOptions);
      return once(() => {
        listeners.splice(listeners.indexOf(listenerOrOptions), 1);
        if (listeners.length === 0) {
          this.#listenersMap.delete(event);
        }
      });
    }
    const signal = listenerOrOptions?.signal;
    const maxBufferedEvents = listenerOrOptions?.maxBufferedEvents ?? this.#maxBufferedEvents;
    signal?.throwIfAborted();
    const bufferedEvents = [];
    const pullResolvers = [];
    const unsubscribe = this.subscribe(event, (payload) => {
      const resolver = pullResolvers.shift();
      if (resolver) {
        resolver[0]({ done: false, value: payload });
      } else {
        bufferedEvents.push(payload);
        if (bufferedEvents.length > maxBufferedEvents) {
          bufferedEvents.shift();
        }
      }
    });
    const abortListener = (event2) => {
      unsubscribe();
      pullResolvers.forEach((resolver) => resolver[1](event2.target.reason));
      pullResolvers.length = 0;
      bufferedEvents.length = 0;
    };
    signal?.addEventListener("abort", abortListener, { once: true });
    return new AsyncIteratorClass(async () => {
      if (signal?.aborted) {
        throw signal.reason;
      }
      if (bufferedEvents.length > 0) {
        return { done: false, value: bufferedEvents.shift() };
      }
      return new Promise((resolve2, reject) => {
        pullResolvers.push([resolve2, reject]);
      });
    }, async () => {
      unsubscribe();
      signal?.removeEventListener("abort", abortListener);
      pullResolvers.forEach((resolver) => resolver[0]({ done: true, value: undefined }));
      pullResolvers.length = 0;
      bufferedEvents.length = 0;
    });
  }
}

class SequentialIdGenerator {
  index = BigInt(1);
  generate() {
    const id = this.index.toString(36);
    this.index++;
    return id;
  }
}
function intercept(interceptors, options, main) {
  const next = (options2, index) => {
    const interceptor = interceptors[index];
    if (!interceptor) {
      return main(options2);
    }
    return interceptor({
      ...options2,
      next: (newOptions = options2) => next(newOptions, index + 1)
    });
  };
  return next(options, 0);
}
function parseEmptyableJSON(text) {
  if (!text) {
    return;
  }
  return JSON.parse(text);
}
function stringifyJSON(value) {
  return JSON.stringify(value);
}
function getConstructor(value) {
  if (!isTypescriptObject(value)) {
    return null;
  }
  return Object.getPrototypeOf(value)?.constructor;
}
function isObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || !proto || !proto.constructor;
}
function isTypescriptObject(value) {
  return !!value && (typeof value === "object" || typeof value === "function");
}
function value(value2, ...args) {
  if (typeof value2 === "function") {
    return value2(...args);
  }
  return value2;
}
function preventNativeAwait(target) {
  return new Proxy(target, {
    get(target2, prop, receiver) {
      const value2 = Reflect.get(target2, prop, receiver);
      if (prop !== "then" || typeof value2 !== "function") {
        return value2;
      }
      return new Proxy(value2, {
        apply(targetFn, thisArg, args) {
          if (args.length !== 2 || args.some((arg) => !isNativeFunction(arg))) {
            return Reflect.apply(targetFn, thisArg, args);
          }
          let shouldOmit = true;
          args[0].call(thisArg, preventNativeAwait(new Proxy(target2, {
            get: (target3, prop2, receiver2) => {
              if (shouldOmit && prop2 === "then") {
                shouldOmit = false;
                return;
              }
              return Reflect.get(target3, prop2, receiver2);
            }
          })));
        }
      });
    }
  });
}
var NATIVE_FUNCTION_REGEX = /^\s*function\s*\(\)\s*\{\s*\[native code\]\s*\}\s*$/;
function isNativeFunction(fn) {
  return typeof fn === "function" && NATIVE_FUNCTION_REGEX.test(fn.toString());
}
function tryDecodeURIComponent(value2) {
  try {
    return decodeURIComponent(value2);
  } catch {
    return value2;
  }
}
// ../../node_modules/@orpc/client/dist/shared/client.BKHdcV-f.mjs
var ORPC_CLIENT_PACKAGE_NAME = "@orpc/client";
var ORPC_CLIENT_PACKAGE_VERSION = "1.13.6";
var COMMON_ORPC_ERROR_DEFS = {
  BAD_REQUEST: {
    status: 400,
    message: "Bad Request"
  },
  UNAUTHORIZED: {
    status: 401,
    message: "Unauthorized"
  },
  FORBIDDEN: {
    status: 403,
    message: "Forbidden"
  },
  NOT_FOUND: {
    status: 404,
    message: "Not Found"
  },
  METHOD_NOT_SUPPORTED: {
    status: 405,
    message: "Method Not Supported"
  },
  NOT_ACCEPTABLE: {
    status: 406,
    message: "Not Acceptable"
  },
  TIMEOUT: {
    status: 408,
    message: "Request Timeout"
  },
  CONFLICT: {
    status: 409,
    message: "Conflict"
  },
  PRECONDITION_FAILED: {
    status: 412,
    message: "Precondition Failed"
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "Payload Too Large"
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "Unsupported Media Type"
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    message: "Unprocessable Content"
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: "Too Many Requests"
  },
  CLIENT_CLOSED_REQUEST: {
    status: 499,
    message: "Client Closed Request"
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal Server Error"
  },
  NOT_IMPLEMENTED: {
    status: 501,
    message: "Not Implemented"
  },
  BAD_GATEWAY: {
    status: 502,
    message: "Bad Gateway"
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "Service Unavailable"
  },
  GATEWAY_TIMEOUT: {
    status: 504,
    message: "Gateway Timeout"
  }
};
function fallbackORPCErrorStatus(code, status) {
  return status ?? COMMON_ORPC_ERROR_DEFS[code]?.status ?? 500;
}
function fallbackORPCErrorMessage(code, message) {
  return message || COMMON_ORPC_ERROR_DEFS[code]?.message || code;
}
var GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL = Symbol.for(`__${ORPC_CLIENT_PACKAGE_NAME}@${ORPC_CLIENT_PACKAGE_VERSION}/error/ORPC_ERROR_CONSTRUCTORS__`);
globalThis[GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL] ??= /* @__PURE__ */ new WeakSet;
var globalORPCErrorConstructors = globalThis[GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL];

class ORPCError extends Error {
  defined;
  code;
  status;
  data;
  constructor(code, ...rest) {
    const options = resolveMaybeOptionalOptions(rest);
    if (options.status !== undefined && !isORPCErrorStatus(options.status)) {
      throw new Error("[ORPCError] Invalid error status code.");
    }
    const message = fallbackORPCErrorMessage(code, options.message);
    super(message, options);
    this.code = code;
    this.status = fallbackORPCErrorStatus(code, options.status);
    this.defined = options.defined ?? false;
    this.data = options.data;
  }
  toJSON() {
    return {
      defined: this.defined,
      code: this.code,
      status: this.status,
      message: this.message,
      data: this.data
    };
  }
  static [Symbol.hasInstance](instance) {
    if (globalORPCErrorConstructors.has(this)) {
      const constructor = getConstructor(instance);
      if (constructor && globalORPCErrorConstructors.has(constructor)) {
        return true;
      }
    }
    return super[Symbol.hasInstance](instance);
  }
}
globalORPCErrorConstructors.add(ORPCError);
function toORPCError(error) {
  return error instanceof ORPCError ? error : new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Internal server error",
    cause: error
  });
}
function isORPCErrorStatus(status) {
  return status < 200 || status >= 400;
}
function isORPCErrorJson(json) {
  if (!isObject(json)) {
    return false;
  }
  const validKeys = ["defined", "code", "status", "message", "data"];
  if (Object.keys(json).some((k2) => !validKeys.includes(k2))) {
    return false;
  }
  return "defined" in json && typeof json.defined === "boolean" && "code" in json && typeof json.code === "string" && "status" in json && typeof json.status === "number" && isORPCErrorStatus(json.status) && "message" in json && typeof json.message === "string";
}
function createORPCErrorFromJson(json, options = {}) {
  return new ORPCError(json.code, {
    ...options,
    ...json
  });
}
// ../../node_modules/@orpc/standard-server/dist/index.mjs
class EventEncoderError extends TypeError {
}

class EventDecoderError extends TypeError {
}

class ErrorEvent extends Error {
  data;
  constructor(options) {
    super(options?.message ?? "An error event was received", options);
    this.data = options?.data;
  }
}
function decodeEventMessage(encoded) {
  const lines = encoded.replace(/\n+$/, "").split(/\n/);
  const message = {
    data: undefined,
    event: undefined,
    id: undefined,
    retry: undefined,
    comments: []
  };
  for (const line of lines) {
    const index = line.indexOf(":");
    const key = index === -1 ? line : line.slice(0, index);
    const value2 = index === -1 ? "" : line.slice(index + 1).replace(/^\s/, "");
    if (index === 0) {
      message.comments.push(value2);
    } else if (key === "data") {
      message.data ??= "";
      message.data += `${value2}
`;
    } else if (key === "event") {
      message.event = value2;
    } else if (key === "id") {
      message.id = value2;
    } else if (key === "retry") {
      const maybeInteger = Number.parseInt(value2);
      if (Number.isInteger(maybeInteger) && maybeInteger >= 0 && maybeInteger.toString() === value2) {
        message.retry = maybeInteger;
      }
    }
  }
  message.data = message.data?.replace(/\n$/, "");
  return message;
}

class EventDecoder {
  constructor(options = {}) {
    this.options = options;
  }
  incomplete = "";
  feed(chunk) {
    this.incomplete += chunk;
    const lastCompleteIndex = this.incomplete.lastIndexOf(`

`);
    if (lastCompleteIndex === -1) {
      return;
    }
    const completes = this.incomplete.slice(0, lastCompleteIndex).split(/\n\n/);
    this.incomplete = this.incomplete.slice(lastCompleteIndex + 2);
    for (const encoded of completes) {
      const message = decodeEventMessage(`${encoded}

`);
      if (this.options.onEvent) {
        this.options.onEvent(message);
      }
    }
  }
  end() {
    if (this.incomplete) {
      throw new EventDecoderError("Event Iterator ended before complete");
    }
  }
}

class EventDecoderStream extends TransformStream {
  constructor() {
    let decoder;
    super({
      start(controller) {
        decoder = new EventDecoder({
          onEvent: (event) => {
            controller.enqueue(event);
          }
        });
      },
      transform(chunk) {
        decoder.feed(chunk);
      },
      flush() {
        decoder.end();
      }
    });
  }
}
function assertEventId(id) {
  if (id.includes(`
`)) {
    throw new EventEncoderError("Event's id must not contain a newline character");
  }
}
function assertEventName(event) {
  if (event.includes(`
`)) {
    throw new EventEncoderError("Event's event must not contain a newline character");
  }
}
function assertEventRetry(retry) {
  if (!Number.isInteger(retry) || retry < 0) {
    throw new EventEncoderError("Event's retry must be a integer and >= 0");
  }
}
function assertEventComment(comment) {
  if (comment.includes(`
`)) {
    throw new EventEncoderError("Event's comment must not contain a newline character");
  }
}
function encodeEventData(data) {
  const lines = data?.split(/\n/) ?? [];
  let output = "";
  for (const line of lines) {
    output += `data: ${line}
`;
  }
  return output;
}
function encodeEventComments(comments) {
  let output = "";
  for (const comment of comments ?? []) {
    assertEventComment(comment);
    output += `: ${comment}
`;
  }
  return output;
}
function encodeEventMessage(message) {
  let output = "";
  output += encodeEventComments(message.comments);
  if (message.event !== undefined) {
    assertEventName(message.event);
    output += `event: ${message.event}
`;
  }
  if (message.retry !== undefined) {
    assertEventRetry(message.retry);
    output += `retry: ${message.retry}
`;
  }
  if (message.id !== undefined) {
    assertEventId(message.id);
    output += `id: ${message.id}
`;
  }
  output += encodeEventData(message.data);
  output += `
`;
  return output;
}
var EVENT_SOURCE_META_SYMBOL = Symbol("ORPC_EVENT_SOURCE_META");
function withEventMeta(container, meta) {
  if (meta.id === undefined && meta.retry === undefined && !meta.comments?.length) {
    return container;
  }
  if (meta.id !== undefined) {
    assertEventId(meta.id);
  }
  if (meta.retry !== undefined) {
    assertEventRetry(meta.retry);
  }
  if (meta.comments !== undefined) {
    for (const comment of meta.comments) {
      assertEventComment(comment);
    }
  }
  return new Proxy(container, {
    get(target, prop, receiver) {
      if (prop === EVENT_SOURCE_META_SYMBOL) {
        return meta;
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function getEventMeta(container) {
  return isTypescriptObject(container) ? Reflect.get(container, EVENT_SOURCE_META_SYMBOL) : undefined;
}
function generateContentDisposition(filename) {
  const escapedFileName = filename.replace(/"/g, "\\\"");
  const encodedFilenameStar = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return `inline; filename="${escapedFileName}"; filename*=utf-8''${encodedFilenameStar}`;
}
function getFilenameFromContentDisposition(contentDisposition) {
  const encodedFilenameStarMatch = contentDisposition.match(/filename\*=(UTF-8'')?([^;]*)/i);
  if (encodedFilenameStarMatch && typeof encodedFilenameStarMatch[2] === "string") {
    return tryDecodeURIComponent(encodedFilenameStarMatch[2]);
  }
  const encodedFilenameMatch = contentDisposition.match(/filename="((?:\\"|[^"])*)"/i);
  if (encodedFilenameMatch && typeof encodedFilenameMatch[1] === "string") {
    return encodedFilenameMatch[1].replace(/\\"/g, '"');
  }
}
function mergeStandardHeaders(a, b) {
  const merged = { ...a };
  for (const key in b) {
    if (Array.isArray(b[key])) {
      merged[key] = [...toArray(merged[key]), ...b[key]];
    } else if (b[key] !== undefined) {
      if (Array.isArray(merged[key])) {
        merged[key] = [...merged[key], b[key]];
      } else if (merged[key] !== undefined) {
        merged[key] = [merged[key], b[key]];
      } else {
        merged[key] = b[key];
      }
    }
  }
  return merged;
}

// ../../node_modules/@orpc/client/dist/shared/client.BLtwTQUg.mjs
function mapEventIterator(iterator, maps) {
  const mapError = async (error) => {
    let mappedError = await maps.error(error);
    if (mappedError !== error) {
      const meta = getEventMeta(error);
      if (meta && isTypescriptObject(mappedError)) {
        mappedError = withEventMeta(mappedError, meta);
      }
    }
    return mappedError;
  };
  return new AsyncIteratorClass(async () => {
    const { done, value: value2 } = await (async () => {
      try {
        return await iterator.next();
      } catch (error) {
        throw await mapError(error);
      }
    })();
    let mappedValue = await maps.value(value2, done);
    if (mappedValue !== value2) {
      const meta = getEventMeta(value2);
      if (meta && isTypescriptObject(mappedValue)) {
        mappedValue = withEventMeta(mappedValue, meta);
      }
    }
    return { done, value: mappedValue };
  }, async () => {
    try {
      await iterator.return?.();
    } catch (error) {
      throw await mapError(error);
    }
  });
}
// ../../node_modules/@orpc/client/dist/index.mjs
function resolveFriendlyClientOptions(options) {
  return {
    ...options,
    context: options.context ?? {}
  };
}
function createORPCClient(link, options = {}) {
  const path = options.path ?? [];
  const procedureClient = async (...[input, options2 = {}]) => {
    return await link.call(path, input, resolveFriendlyClientOptions(options2));
  };
  const recursive = new Proxy(procedureClient, {
    get(target, key) {
      if (typeof key !== "string") {
        return Reflect.get(target, key);
      }
      return createORPCClient(link, {
        ...options,
        path: [...path, key]
      });
    }
  });
  return preventNativeAwait(recursive);
}

// ../../node_modules/@orpc/standard-server-fetch/dist/index.mjs
function toEventIterator(stream, options = {}) {
  const eventStream = stream?.pipeThrough(new TextDecoderStream).pipeThrough(new EventDecoderStream);
  const reader = eventStream?.getReader();
  let span;
  let isCancelled = false;
  return new AsyncIteratorClass(async () => {
    span ??= startSpan("consume_event_iterator_stream");
    try {
      while (true) {
        if (reader === undefined) {
          return { done: true, value: undefined };
        }
        const { done, value: value2 } = await runInSpanContext(span, () => reader.read());
        if (done) {
          if (isCancelled) {
            throw new AbortError("Stream was cancelled");
          }
          return { done: true, value: undefined };
        }
        switch (value2.event) {
          case "message": {
            let message = parseEmptyableJSON(value2.data);
            if (isTypescriptObject(message)) {
              message = withEventMeta(message, value2);
            }
            span?.addEvent("message");
            return { done: false, value: message };
          }
          case "error": {
            let error = new ErrorEvent({
              data: parseEmptyableJSON(value2.data)
            });
            error = withEventMeta(error, value2);
            span?.addEvent("error");
            throw error;
          }
          case "done": {
            let done2 = parseEmptyableJSON(value2.data);
            if (isTypescriptObject(done2)) {
              done2 = withEventMeta(done2, value2);
            }
            span?.addEvent("done");
            return { done: true, value: done2 };
          }
          default: {
            span?.addEvent("maybe_keepalive");
          }
        }
      }
    } catch (e) {
      if (!(e instanceof ErrorEvent)) {
        setSpanError(span, e, options);
      }
      throw e;
    }
  }, async (reason) => {
    try {
      if (reason !== "next") {
        isCancelled = true;
        span?.addEvent("cancelled");
      }
      await runInSpanContext(span, () => reader?.cancel());
    } catch (e) {
      setSpanError(span, e, options);
      throw e;
    } finally {
      span?.end();
    }
  });
}
function toEventStream(iterator, options = {}) {
  const keepAliveEnabled = options.eventIteratorKeepAliveEnabled ?? true;
  const keepAliveInterval = options.eventIteratorKeepAliveInterval ?? 5000;
  const keepAliveComment = options.eventIteratorKeepAliveComment ?? "";
  const initialCommentEnabled = options.eventIteratorInitialCommentEnabled ?? true;
  const initialComment = options.eventIteratorInitialComment ?? "";
  let cancelled = false;
  let timeout;
  let span;
  const stream = new ReadableStream({
    start(controller) {
      span = startSpan("stream_event_iterator");
      if (initialCommentEnabled) {
        controller.enqueue(encodeEventMessage({
          comments: [initialComment]
        }));
      }
    },
    async pull(controller) {
      try {
        if (keepAliveEnabled) {
          timeout = setInterval(() => {
            controller.enqueue(encodeEventMessage({
              comments: [keepAliveComment]
            }));
            span?.addEvent("keepalive");
          }, keepAliveInterval);
        }
        const value2 = await runInSpanContext(span, () => iterator.next());
        clearInterval(timeout);
        if (cancelled) {
          return;
        }
        const meta = getEventMeta(value2.value);
        if (!value2.done || value2.value !== undefined || meta !== undefined) {
          const event = value2.done ? "done" : "message";
          controller.enqueue(encodeEventMessage({
            ...meta,
            event,
            data: stringifyJSON(value2.value)
          }));
          span?.addEvent(event);
        }
        if (value2.done) {
          controller.close();
          span?.end();
        }
      } catch (err) {
        clearInterval(timeout);
        if (cancelled) {
          return;
        }
        if (err instanceof ErrorEvent) {
          controller.enqueue(encodeEventMessage({
            ...getEventMeta(err),
            event: "error",
            data: stringifyJSON(err.data)
          }));
          span?.addEvent("error");
          controller.close();
        } else {
          setSpanError(span, err);
          controller.error(err);
        }
        span?.end();
      }
    },
    async cancel() {
      try {
        cancelled = true;
        clearInterval(timeout);
        span?.addEvent("cancelled");
        await runInSpanContext(span, () => iterator.return?.());
      } catch (e) {
        setSpanError(span, e);
        throw e;
      } finally {
        span?.end();
      }
    }
  }).pipeThrough(new TextEncoderStream);
  return stream;
}
function toStandardBody(re2, options = {}) {
  return runWithSpan({ name: "parse_standard_body", signal: options.signal }, async () => {
    const contentDisposition = re2.headers.get("content-disposition");
    if (typeof contentDisposition === "string") {
      const fileName = getFilenameFromContentDisposition(contentDisposition) ?? "blob";
      const blob2 = await re2.blob();
      return new File([blob2], fileName, {
        type: blob2.type
      });
    }
    const contentType = re2.headers.get("content-type");
    if (!contentType || contentType.startsWith("application/json")) {
      const text = await re2.text();
      return parseEmptyableJSON(text);
    }
    if (contentType.startsWith("multipart/form-data")) {
      return await re2.formData();
    }
    if (contentType.startsWith("application/x-www-form-urlencoded")) {
      const text = await re2.text();
      return new URLSearchParams(text);
    }
    if (contentType.startsWith("text/event-stream")) {
      return toEventIterator(re2.body, options);
    }
    if (contentType.startsWith("text/plain")) {
      return await re2.text();
    }
    const blob = await re2.blob();
    return new File([blob], "blob", {
      type: blob.type
    });
  });
}
function toFetchBody(body, headers, options = {}) {
  const currentContentDisposition = headers.get("content-disposition");
  headers.delete("content-type");
  headers.delete("content-disposition");
  if (body === undefined) {
    return;
  }
  if (body instanceof Blob) {
    headers.set("content-type", body.type);
    headers.set("content-length", body.size.toString());
    headers.set("content-disposition", currentContentDisposition ?? generateContentDisposition(body instanceof File ? body.name : "blob"));
    return body;
  }
  if (body instanceof FormData) {
    return body;
  }
  if (body instanceof URLSearchParams) {
    return body;
  }
  if (isAsyncIteratorObject(body)) {
    headers.set("content-type", "text/event-stream");
    return toEventStream(body, options);
  }
  headers.set("content-type", "application/json");
  return stringifyJSON(body);
}
function toStandardHeaders(headers, standardHeaders = {}) {
  headers.forEach((value2, key) => {
    if (Array.isArray(standardHeaders[key])) {
      standardHeaders[key].push(value2);
    } else if (standardHeaders[key] !== undefined) {
      standardHeaders[key] = [standardHeaders[key], value2];
    } else {
      standardHeaders[key] = value2;
    }
  });
  return standardHeaders;
}
function toFetchHeaders(headers, fetchHeaders = new Headers) {
  for (const [key, value2] of Object.entries(headers)) {
    if (Array.isArray(value2)) {
      for (const v of value2) {
        fetchHeaders.append(key, v);
      }
    } else if (value2 !== undefined) {
      fetchHeaders.append(key, value2);
    }
  }
  return fetchHeaders;
}
function toFetchRequest(request, options = {}) {
  const headers = toFetchHeaders(request.headers);
  const body = toFetchBody(request.body, headers, options);
  return new Request(request.url, {
    signal: request.signal,
    method: request.method,
    headers,
    body
  });
}
function toStandardLazyResponse(response, options = {}) {
  return {
    body: once(() => toStandardBody(response, options)),
    status: response.status,
    get headers() {
      const headers = toStandardHeaders(response.headers);
      Object.defineProperty(this, "headers", { value: headers, writable: true });
      return headers;
    },
    set headers(value2) {
      Object.defineProperty(this, "headers", { value: value2, writable: true });
    }
  };
}

// ../../node_modules/@orpc/client/dist/shared/client.vZdLqpTj.mjs
class CompositeStandardLinkPlugin {
  plugins;
  constructor(plugins = []) {
    this.plugins = [...plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  init(options) {
    for (const plugin of this.plugins) {
      plugin.init?.(options);
    }
  }
}

class StandardLink {
  constructor(codec, sender, options = {}) {
    this.codec = codec;
    this.sender = sender;
    const plugin = new CompositeStandardLinkPlugin(options.plugins);
    plugin.init(options);
    this.interceptors = toArray(options.interceptors);
    this.clientInterceptors = toArray(options.clientInterceptors);
  }
  interceptors;
  clientInterceptors;
  call(path, input, options) {
    return runWithSpan({ name: `${ORPC_NAME}.${path.join("/")}`, signal: options.signal }, (span) => {
      span?.setAttribute("rpc.system", ORPC_NAME);
      span?.setAttribute("rpc.method", path.join("."));
      if (isAsyncIteratorObject(input)) {
        input = asyncIteratorWithSpan({ name: "consume_event_iterator_input", signal: options.signal }, input);
      }
      return intercept(this.interceptors, { ...options, path, input }, async ({ path: path2, input: input2, ...options2 }) => {
        const otelConfig = getGlobalOtelConfig();
        let otelContext;
        const currentSpan = otelConfig?.trace.getActiveSpan() ?? span;
        if (currentSpan && otelConfig) {
          otelContext = otelConfig?.trace.setSpan(otelConfig.context.active(), currentSpan);
        }
        const request = await runWithSpan({ name: "encode_request", context: otelContext }, () => this.codec.encode(path2, input2, options2));
        const response = await intercept(this.clientInterceptors, { ...options2, input: input2, path: path2, request }, ({ input: input3, path: path3, request: request2, ...options3 }) => {
          return runWithSpan({ name: "send_request", signal: options3.signal, context: otelContext }, () => this.sender.call(request2, options3, path3, input3));
        });
        const output = await runWithSpan({ name: "decode_response", context: otelContext }, () => this.codec.decode(response, options2, path2, input2));
        if (isAsyncIteratorObject(output)) {
          return asyncIteratorWithSpan({ name: "consume_event_iterator_output", signal: options2.signal }, output);
        }
        return output;
      });
    });
  }
}
var STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES = {
  BIGINT: 0,
  DATE: 1,
  NAN: 2,
  UNDEFINED: 3,
  URL: 4,
  REGEXP: 5,
  SET: 6,
  MAP: 7
};

class StandardRPCJsonSerializer {
  customSerializers;
  constructor(options = {}) {
    this.customSerializers = options.customJsonSerializers ?? [];
    if (this.customSerializers.length !== new Set(this.customSerializers.map((custom2) => custom2.type)).size) {
      throw new Error("Custom serializer type must be unique.");
    }
  }
  serialize(data, segments = [], meta = [], maps = [], blobs = []) {
    for (const custom2 of this.customSerializers) {
      if (custom2.condition(data)) {
        const result = this.serialize(custom2.serialize(data), segments, meta, maps, blobs);
        meta.push([custom2.type, ...segments]);
        return result;
      }
    }
    if (data instanceof Blob) {
      maps.push(segments);
      blobs.push(data);
      return [data, meta, maps, blobs];
    }
    if (typeof data === "bigint") {
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.BIGINT, ...segments]);
      return [data.toString(), meta, maps, blobs];
    }
    if (data instanceof Date) {
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.DATE, ...segments]);
      if (Number.isNaN(data.getTime())) {
        return [null, meta, maps, blobs];
      }
      return [data.toISOString(), meta, maps, blobs];
    }
    if (Number.isNaN(data)) {
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.NAN, ...segments]);
      return [null, meta, maps, blobs];
    }
    if (data instanceof URL) {
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.URL, ...segments]);
      return [data.toString(), meta, maps, blobs];
    }
    if (data instanceof RegExp) {
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.REGEXP, ...segments]);
      return [data.toString(), meta, maps, blobs];
    }
    if (data instanceof Set) {
      const result = this.serialize(Array.from(data), segments, meta, maps, blobs);
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.SET, ...segments]);
      return result;
    }
    if (data instanceof Map) {
      const result = this.serialize(Array.from(data.entries()), segments, meta, maps, blobs);
      meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.MAP, ...segments]);
      return result;
    }
    if (Array.isArray(data)) {
      const json = data.map((v, i) => {
        if (v === undefined) {
          meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.UNDEFINED, ...segments, i]);
          return v;
        }
        return this.serialize(v, [...segments, i], meta, maps, blobs)[0];
      });
      return [json, meta, maps, blobs];
    }
    if (isObject(data)) {
      const json = {};
      for (const k2 in data) {
        if (k2 === "toJSON" && typeof data[k2] === "function") {
          continue;
        }
        json[k2] = this.serialize(data[k2], [...segments, k2], meta, maps, blobs)[0];
      }
      return [json, meta, maps, blobs];
    }
    return [data, meta, maps, blobs];
  }
  deserialize(json, meta, maps, getBlob) {
    const ref = { data: json };
    if (maps && getBlob) {
      maps.forEach((segments, i) => {
        let currentRef = ref;
        let preSegment = "data";
        segments.forEach((segment) => {
          currentRef = currentRef[preSegment];
          preSegment = segment;
          if (!Object.hasOwn(currentRef, preSegment)) {
            throw new Error(`Security error: accessing non-existent path during deserialization. Path segment: ${preSegment}`);
          }
        });
        currentRef[preSegment] = getBlob(i);
      });
    }
    for (const item of meta) {
      const type = item[0];
      let currentRef = ref;
      let preSegment = "data";
      for (let i = 1;i < item.length; i++) {
        currentRef = currentRef[preSegment];
        preSegment = item[i];
        if (!Object.hasOwn(currentRef, preSegment)) {
          throw new Error(`Security error: accessing non-existent path during deserialization. Path segment: ${preSegment}`);
        }
      }
      for (const custom2 of this.customSerializers) {
        if (custom2.type === type) {
          currentRef[preSegment] = custom2.deserialize(currentRef[preSegment]);
          break;
        }
      }
      switch (type) {
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.BIGINT:
          currentRef[preSegment] = BigInt(currentRef[preSegment]);
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.DATE:
          currentRef[preSegment] = new Date(currentRef[preSegment] ?? "Invalid Date");
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.NAN:
          currentRef[preSegment] = Number.NaN;
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.UNDEFINED:
          currentRef[preSegment] = undefined;
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.URL:
          currentRef[preSegment] = new URL(currentRef[preSegment]);
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.REGEXP: {
          const [, pattern, flags] = currentRef[preSegment].match(/^\/(.*)\/([a-z]*)$/);
          currentRef[preSegment] = new RegExp(pattern, flags);
          break;
        }
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.SET:
          currentRef[preSegment] = new Set(currentRef[preSegment]);
          break;
        case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.MAP:
          currentRef[preSegment] = new Map(currentRef[preSegment]);
          break;
      }
    }
    return ref.data;
  }
}
function toHttpPath(path) {
  return `/${path.map(encodeURIComponent).join("/")}`;
}
function toStandardHeaders2(headers) {
  if (typeof headers.forEach === "function") {
    return toStandardHeaders(headers);
  }
  return headers;
}
function getMalformedResponseErrorCode(status) {
  return Object.entries(COMMON_ORPC_ERROR_DEFS).find(([, def]) => def.status === status)?.[0] ?? "MALFORMED_ORPC_ERROR_RESPONSE";
}

class StandardRPCLinkCodec {
  constructor(serializer, options) {
    this.serializer = serializer;
    this.baseUrl = options.url;
    this.maxUrlLength = options.maxUrlLength ?? 2083;
    this.fallbackMethod = options.fallbackMethod ?? "POST";
    this.expectedMethod = options.method ?? this.fallbackMethod;
    this.headers = options.headers ?? {};
  }
  baseUrl;
  maxUrlLength;
  fallbackMethod;
  expectedMethod;
  headers;
  async encode(path, input, options) {
    let headers = toStandardHeaders2(await value(this.headers, options, path, input));
    if (options.lastEventId !== undefined) {
      headers = mergeStandardHeaders(headers, { "last-event-id": options.lastEventId });
    }
    const expectedMethod = await value(this.expectedMethod, options, path, input);
    const baseUrl = await value(this.baseUrl, options, path, input);
    const url = new URL(baseUrl);
    url.pathname = `${url.pathname.replace(/\/$/, "")}${toHttpPath(path)}`;
    const serialized = this.serializer.serialize(input);
    if (expectedMethod === "GET" && !(serialized instanceof FormData) && !isAsyncIteratorObject(serialized)) {
      const maxUrlLength = await value(this.maxUrlLength, options, path, input);
      const getUrl = new URL(url);
      getUrl.searchParams.append("data", stringifyJSON(serialized));
      if (getUrl.toString().length <= maxUrlLength) {
        return {
          body: undefined,
          method: expectedMethod,
          headers,
          url: getUrl,
          signal: options.signal
        };
      }
    }
    return {
      url,
      method: expectedMethod === "GET" ? this.fallbackMethod : expectedMethod,
      headers,
      body: serialized,
      signal: options.signal
    };
  }
  async decode(response) {
    const isOk = !isORPCErrorStatus(response.status);
    const deserialized = await (async () => {
      let isBodyOk = false;
      try {
        const body = await response.body();
        isBodyOk = true;
        return this.serializer.deserialize(body);
      } catch (error) {
        if (!isBodyOk) {
          throw new Error("Cannot parse response body, please check the response body and content-type.", {
            cause: error
          });
        }
        throw new Error("Invalid RPC response format.", {
          cause: error
        });
      }
    })();
    if (!isOk) {
      if (isORPCErrorJson(deserialized)) {
        throw createORPCErrorFromJson(deserialized);
      }
      throw new ORPCError(getMalformedResponseErrorCode(response.status), {
        status: response.status,
        data: { ...response, body: deserialized }
      });
    }
    return deserialized;
  }
}

class StandardRPCSerializer {
  constructor(jsonSerializer) {
    this.jsonSerializer = jsonSerializer;
  }
  serialize(data) {
    if (isAsyncIteratorObject(data)) {
      return mapEventIterator(data, {
        value: async (value2) => this.#serialize(value2, false),
        error: async (e) => {
          return new ErrorEvent({
            data: this.#serialize(toORPCError(e).toJSON(), false),
            cause: e
          });
        }
      });
    }
    return this.#serialize(data, true);
  }
  #serialize(data, enableFormData) {
    const [json, meta_, maps, blobs] = this.jsonSerializer.serialize(data);
    const meta = meta_.length === 0 ? undefined : meta_;
    if (!enableFormData || blobs.length === 0) {
      return {
        json,
        meta
      };
    }
    const form = new FormData;
    form.set("data", stringifyJSON({ json, meta, maps }));
    blobs.forEach((blob, i) => {
      form.set(i.toString(), blob);
    });
    return form;
  }
  deserialize(data) {
    if (isAsyncIteratorObject(data)) {
      return mapEventIterator(data, {
        value: async (value2) => this.#deserialize(value2),
        error: async (e) => {
          if (!(e instanceof ErrorEvent)) {
            return e;
          }
          const deserialized = this.#deserialize(e.data);
          if (isORPCErrorJson(deserialized)) {
            return createORPCErrorFromJson(deserialized, { cause: e });
          }
          return new ErrorEvent({
            data: deserialized,
            cause: e
          });
        }
      });
    }
    return this.#deserialize(data);
  }
  #deserialize(data) {
    if (data === undefined) {
      return;
    }
    if (!(data instanceof FormData)) {
      return this.jsonSerializer.deserialize(data.json, data.meta ?? []);
    }
    const serialized = JSON.parse(data.get("data"));
    return this.jsonSerializer.deserialize(serialized.json, serialized.meta ?? [], serialized.maps, (i) => data.get(i.toString()));
  }
}

class StandardRPCLink extends StandardLink {
  constructor(linkClient, options) {
    const jsonSerializer = new StandardRPCJsonSerializer(options);
    const serializer = new StandardRPCSerializer(jsonSerializer);
    const linkCodec = new StandardRPCLinkCodec(serializer, options);
    super(linkCodec, linkClient, options);
  }
}

// ../../node_modules/@orpc/client/dist/adapters/fetch/index.mjs
class CompositeLinkFetchPlugin extends CompositeStandardLinkPlugin {
  initRuntimeAdapter(options) {
    for (const plugin of this.plugins) {
      plugin.initRuntimeAdapter?.(options);
    }
  }
}

class LinkFetchClient {
  fetch;
  toFetchRequestOptions;
  adapterInterceptors;
  constructor(options) {
    const plugin = new CompositeLinkFetchPlugin(options.plugins);
    plugin.initRuntimeAdapter(options);
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.toFetchRequestOptions = options;
    this.adapterInterceptors = toArray(options.adapterInterceptors);
  }
  async call(standardRequest, options, path, input) {
    const request = toFetchRequest(standardRequest, this.toFetchRequestOptions);
    const fetchResponse = await intercept(this.adapterInterceptors, { ...options, request, path, input, init: { redirect: "manual" } }, ({ request: request2, path: path2, input: input2, init, ...options2 }) => this.fetch(request2, init, options2, path2, input2));
    const lazyResponse = toStandardLazyResponse(fetchResponse, { signal: request.signal });
    return lazyResponse;
  }
}

class RPCLink extends StandardRPCLink {
  constructor(options) {
    const linkClient = new LinkFetchClient(options);
    super(linkClient, options);
  }
}

// src/lib/api-client.ts
function createApiClient(config) {
  const authType = config.authType ?? "bearer";
  const authHeaders = authType === "api-key" ? { "x-api-key": config.token } : { Authorization: `Bearer ${config.token}` };
  const link = new RPCLink({
    url: `${config.apiBaseUrl}/rpc`,
    headers: authHeaders
  });
  return createORPCClient(link);
}

// src/lib/credentials.ts
import {
  existsSync as existsSync6,
  mkdirSync as mkdirSync2,
  readFileSync as readFileSync5,
  rmSync,
  writeFileSync as writeFileSync3
} from "node:fs";
import { homedir as homedir7 } from "node:os";
import { join as join8 } from "node:path";
function getConfigDir() {
  return process.env.RUDEL_CONFIG_DIR ?? join8(homedir7(), ".rudel");
}
function getCredentialsPath() {
  return join8(getConfigDir(), "credentials.json");
}
function saveCredentials(credentials) {
  const dir = getConfigDir();
  if (!existsSync6(dir)) {
    mkdirSync2(dir, { recursive: true, mode: 448 });
  }
  writeFileSync3(getCredentialsPath(), JSON.stringify(credentials, null, 2), {
    mode: 384
  });
}
function loadCredentials() {
  const path = getCredentialsPath();
  if (!existsSync6(path))
    return null;
  const content = readFileSync5(path, "utf-8");
  return JSON.parse(content);
}
function clearCredentials() {
  const path = getCredentialsPath();
  if (existsSync6(path)) {
    rmSync(path);
  }
}

// src/lib/auth.ts
async function verifyAuth() {
  const credentials = loadCredentials();
  if (!credentials) {
    return {
      authenticated: false,
      reason: "no_credentials",
      message: "Not authenticated. Run `rudel login` first."
    };
  }
  const client = createApiClient(credentials);
  try {
    const user = credentials.authType === "api-key" ? await client.cli.authStatus() : await client.me();
    return { authenticated: true, credentials, user };
  } catch (error) {
    const message = String(error);
    const isAuthError = message.includes("401") || message.includes("403") || message.includes("Unauthorized") || message.includes("Forbidden");
    if (isAuthError) {
      clearCredentials();
      return {
        authenticated: false,
        reason: "token_expired",
        message: "Session expired or invalid. Run `rudel login` to re-authenticate."
      };
    }
    return {
      authenticated: false,
      reason: "network_error",
      message: "Failed to verify authentication. Check your connection."
    };
  }
}

// ../../node_modules/p-map/index.js
async function pMap(iterable, mapper, {
  concurrency = Number.POSITIVE_INFINITY,
  stopOnError = true,
  signal
} = {}) {
  return new Promise((resolve_, reject_) => {
    if (iterable[Symbol.iterator] === undefined && iterable[Symbol.asyncIterator] === undefined) {
      throw new TypeError(`Expected \`input\` to be either an \`Iterable\` or \`AsyncIterable\`, got (${typeof iterable})`);
    }
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required");
    }
    if (!(Number.isSafeInteger(concurrency) && concurrency >= 1 || concurrency === Number.POSITIVE_INFINITY)) {
      throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
    }
    const result = [];
    const errors2 = [];
    const skippedIndexesMap = new Map;
    let isRejected = false;
    let isResolved = false;
    let isIterableDone = false;
    let resolvingCount = 0;
    let currentIndex = 0;
    const iterator = iterable[Symbol.iterator] === undefined ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
    const signalListener = () => {
      reject(signal.reason);
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", signalListener);
    };
    const resolve2 = (value2) => {
      resolve_(value2);
      cleanup();
    };
    const reject = (reason) => {
      isRejected = true;
      isResolved = true;
      reject_(reason);
      cleanup();
    };
    if (signal) {
      if (signal.aborted) {
        reject(signal.reason);
      }
      signal.addEventListener("abort", signalListener, { once: true });
    }
    const next = async () => {
      if (isResolved) {
        return;
      }
      const nextItem = await iterator.next();
      const index = currentIndex;
      currentIndex++;
      if (nextItem.done) {
        isIterableDone = true;
        if (resolvingCount === 0 && !isResolved) {
          if (!stopOnError && errors2.length > 0) {
            reject(new AggregateError(errors2));
            return;
          }
          isResolved = true;
          if (skippedIndexesMap.size === 0) {
            resolve2(result);
            return;
          }
          const pureResult = [];
          for (const [index2, value2] of result.entries()) {
            if (skippedIndexesMap.get(index2) === pMapSkip) {
              continue;
            }
            pureResult.push(value2);
          }
          resolve2(pureResult);
        }
        return;
      }
      resolvingCount++;
      (async () => {
        try {
          const element = await nextItem.value;
          if (isResolved) {
            return;
          }
          const value2 = await mapper(element, index);
          if (value2 === pMapSkip) {
            skippedIndexesMap.set(index, value2);
          }
          result[index] = value2;
          resolvingCount--;
          await next();
        } catch (error) {
          if (stopOnError) {
            reject(error);
          } else {
            errors2.push(error);
            resolvingCount--;
            try {
              await next();
            } catch (error2) {
              reject(error2);
            }
          }
        }
      })();
    };
    (async () => {
      for (let index = 0;index < concurrency; index++) {
        try {
          await next();
        } catch (error) {
          reject(error);
          break;
        }
        if (isIterableDone || isRejected) {
          break;
        }
      }
    })();
  });
}
var pMapSkip = Symbol("skip");

// src/lib/failed-uploads.ts
import { existsSync as existsSync7, readFileSync as readFileSync6 } from "node:fs";
import { mkdir as mkdir2, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir8 } from "node:os";
import { dirname as dirname4, join as join9 } from "node:path";

// ../../node_modules/@orpc/contract/dist/shared/contract.D_dZrO__.mjs
function mergeErrorMap(errorMap1, errorMap2) {
  return { ...errorMap1, ...errorMap2 };
}
class ContractProcedure {
  "~orpc";
  constructor(def) {
    if (def.route?.successStatus && isORPCErrorStatus(def.route.successStatus)) {
      throw new Error("[ContractProcedure] Invalid successStatus.");
    }
    if (Object.values(def.errorMap).some((val) => val && val.status && !isORPCErrorStatus(val.status))) {
      throw new Error("[ContractProcedure] Invalid error status code.");
    }
    this["~orpc"] = def;
  }
}
function isContractProcedure(item) {
  if (item instanceof ContractProcedure) {
    return true;
  }
  return (typeof item === "object" || typeof item === "function") && item !== null && "~orpc" in item && typeof item["~orpc"] === "object" && item["~orpc"] !== null && "errorMap" in item["~orpc"] && "route" in item["~orpc"] && "meta" in item["~orpc"];
}
// ../../node_modules/@orpc/contract/dist/index.mjs
function mergeMeta(meta1, meta2) {
  return { ...meta1, ...meta2 };
}
function mergeRoute(a, b) {
  return { ...a, ...b };
}
function prefixRoute(route, prefix) {
  if (!route.path) {
    return route;
  }
  return {
    ...route,
    path: `${prefix}${route.path}`
  };
}
function unshiftTagRoute(route, tags) {
  return {
    ...route,
    tags: [...tags, ...route.tags ?? []]
  };
}
function mergePrefix(a, b) {
  return a ? `${a}${b}` : b;
}
function mergeTags(a, b) {
  return a ? [...a, ...b] : b;
}
function enhanceRoute(route, options) {
  let router = route;
  if (options.prefix) {
    router = prefixRoute(router, options.prefix);
  }
  if (options.tags?.length) {
    router = unshiftTagRoute(router, options.tags);
  }
  return router;
}
function enhanceContractRouter(router, options) {
  if (isContractProcedure(router)) {
    const enhanced2 = new ContractProcedure({
      ...router["~orpc"],
      errorMap: mergeErrorMap(options.errorMap, router["~orpc"].errorMap),
      route: enhanceRoute(router["~orpc"].route, options)
    });
    return enhanced2;
  }
  const enhanced = {};
  for (const key in router) {
    enhanced[key] = enhanceContractRouter(router[key], options);
  }
  return enhanced;
}
class ContractBuilder extends ContractProcedure {
  constructor(def) {
    super(def);
    this["~orpc"].prefix = def.prefix;
    this["~orpc"].tags = def.tags;
  }
  $meta(initialMeta) {
    return new ContractBuilder({
      ...this["~orpc"],
      meta: initialMeta
    });
  }
  $route(initialRoute) {
    return new ContractBuilder({
      ...this["~orpc"],
      route: initialRoute
    });
  }
  $input(initialInputSchema) {
    return new ContractBuilder({
      ...this["~orpc"],
      inputSchema: initialInputSchema
    });
  }
  errors(errors2) {
    return new ContractBuilder({
      ...this["~orpc"],
      errorMap: mergeErrorMap(this["~orpc"].errorMap, errors2)
    });
  }
  meta(meta) {
    return new ContractBuilder({
      ...this["~orpc"],
      meta: mergeMeta(this["~orpc"].meta, meta)
    });
  }
  route(route) {
    return new ContractBuilder({
      ...this["~orpc"],
      route: mergeRoute(this["~orpc"].route, route)
    });
  }
  input(schema) {
    return new ContractBuilder({
      ...this["~orpc"],
      inputSchema: schema
    });
  }
  output(schema) {
    return new ContractBuilder({
      ...this["~orpc"],
      outputSchema: schema
    });
  }
  prefix(prefix) {
    return new ContractBuilder({
      ...this["~orpc"],
      prefix: mergePrefix(this["~orpc"].prefix, prefix)
    });
  }
  tag(...tags) {
    return new ContractBuilder({
      ...this["~orpc"],
      tags: mergeTags(this["~orpc"].tags, tags)
    });
  }
  router(router) {
    return enhanceContractRouter(router, this["~orpc"]);
  }
}
var oc = new ContractBuilder({
  errorMap: {},
  route: {},
  meta: {}
});
var EVENT_ITERATOR_DETAILS_SYMBOL = Symbol("ORPC_EVENT_ITERATOR_DETAILS");

// ../../packages/api-routes/src/schemas/source.ts
var SourceSchema = exports_external.enum(["claude_code", "codex"]);

// ../../packages/api-routes/src/schemas/analytics.ts
var DaysInputSchema = exports_external.object({
  days: exports_external.number().int().positive().default(7)
});
var PaginatedDaysInputSchema = DaysInputSchema.extend({
  limit: exports_external.number().int().positive().default(100),
  offset: exports_external.number().int().nonnegative().default(0)
});
var DateRangeInputSchema = exports_external.object({
  startDate: exports_external.string().date(),
  endDate: exports_external.string().date()
});
var MAX_ID_FILTER_LENGTH = 512;
var MAX_PATH_FILTER_LENGTH = 4096;
var OverviewKPIsSchema = exports_external.object({
  distinct_users: exports_external.number(),
  distinct_sessions: exports_external.number(),
  distinct_projects: exports_external.number(),
  distinct_subagents: exports_external.number(),
  distinct_skills: exports_external.number(),
  distinct_slash_commands: exports_external.number(),
  total_sessions: exports_external.number()
});
var UsageTrendDataSchema = exports_external.object({
  date: exports_external.string(),
  sessions: exports_external.number(),
  active_users: exports_external.number(),
  total_hours: exports_external.number(),
  total_tokens: exports_external.number()
});
var ModelTokensTrendDataSchema = exports_external.object({
  date: exports_external.string(),
  model: exports_external.string(),
  total_tokens: exports_external.number(),
  input_tokens: exports_external.number(),
  output_tokens: exports_external.number()
});
var InsightSchema = exports_external.object({
  type: exports_external.enum(["trend", "performer", "alert", "info"]),
  severity: exports_external.enum(["positive", "warning", "negative", "info"]),
  message: exports_external.string(),
  link: exports_external.string().optional()
});
var TeamSummaryComparisonSchema = exports_external.object({
  current: exports_external.object({
    total_sessions: exports_external.number(),
    active_users: exports_external.number(),
    avg_duration_min: exports_external.number(),
    avg_sessions_per_user: exports_external.number()
  }),
  previous: exports_external.object({
    total_sessions: exports_external.number(),
    active_users: exports_external.number(),
    avg_duration_min: exports_external.number(),
    avg_sessions_per_user: exports_external.number()
  }),
  changes: exports_external.object({
    total_sessions: exports_external.number(),
    active_users: exports_external.number(),
    avg_duration_min: exports_external.number(),
    avg_sessions_per_user: exports_external.number()
  })
});
var SuccessRateSchema = exports_external.object({
  current: exports_external.object({
    high_quality_sessions: exports_external.number(),
    total_sessions: exports_external.number(),
    success_rate: exports_external.number()
  }),
  previous: exports_external.object({
    high_quality_sessions: exports_external.number(),
    total_sessions: exports_external.number(),
    success_rate: exports_external.number()
  }),
  changes: exports_external.object({
    success_rate: exports_external.number()
  })
});
var DeveloperSummarySchema = exports_external.object({
  user_id: exports_external.string(),
  total_sessions: exports_external.number(),
  active_days: exports_external.number(),
  total_tokens: exports_external.number(),
  input_tokens: exports_external.number(),
  output_tokens: exports_external.number(),
  total_duration_min: exports_external.number(),
  avg_session_duration_min: exports_external.number(),
  last_active_date: exports_external.string(),
  success_rate: exports_external.number(),
  cost: exports_external.number(),
  success_rate_trend: exports_external.number()
});
var DeveloperDetailsSchema = DeveloperSummarySchema.extend({
  distinct_projects: exports_external.number(),
  error_count: exports_external.number()
});
var DeveloperSessionSchema = exports_external.object({
  session_id: exports_external.string(),
  session_date: exports_external.string(),
  project_path: exports_external.string(),
  git_remote: exports_external.string().optional(),
  package_name: exports_external.string().optional(),
  duration_min: exports_external.number(),
  total_tokens: exports_external.number(),
  has_subagents: exports_external.boolean(),
  has_skills: exports_external.boolean(),
  has_slash_commands: exports_external.boolean(),
  has_errors: exports_external.boolean(),
  likely_success: exports_external.boolean()
});
var DeveloperProjectSchema = exports_external.object({
  project_path: exports_external.string(),
  git_remote: exports_external.string().optional(),
  package_name: exports_external.string().optional(),
  sessions: exports_external.number(),
  total_duration_min: exports_external.number(),
  total_tokens: exports_external.number(),
  first_session: exports_external.string(),
  last_session: exports_external.string()
});
var DeveloperTimelineSchema = exports_external.object({
  date: exports_external.string(),
  sessions: exports_external.number(),
  total_duration_min: exports_external.number(),
  total_tokens: exports_external.number()
});
var DeveloperTrendDataPointSchema = exports_external.object({
  date: exports_external.string(),
  user_id: exports_external.string(),
  sessions: exports_external.number(),
  total_hours: exports_external.number(),
  total_tokens: exports_external.number(),
  avg_success_rate: exports_external.number()
});
var DeveloperFeatureUsageSchema = exports_external.object({
  subagents_adoption_rate: exports_external.number(),
  skills_adoption_rate: exports_external.number(),
  slash_commands_adoption_rate: exports_external.number(),
  top_subagents: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() })),
  top_skills: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() })),
  top_slash_commands: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() }))
});
var DeveloperErrorSchema = exports_external.object({
  error_pattern: exports_external.string(),
  occurrences: exports_external.number(),
  last_seen: exports_external.string()
});
var DeveloperDetailsInputSchema = DaysInputSchema.extend({
  userId: exports_external.string().max(MAX_ID_FILTER_LENGTH)
});
var DeveloperSessionsInputSchema = DaysInputSchema.extend({
  userId: exports_external.string().max(MAX_ID_FILTER_LENGTH),
  projectPath: exports_external.string().max(MAX_PATH_FILTER_LENGTH).optional(),
  outcome: exports_external.enum(["all", "success"]).default("all"),
  limit: exports_external.number().int().positive().default(100),
  offset: exports_external.number().int().nonnegative().default(0),
  sortBy: exports_external.enum(["date", "duration", "tokens"]).default("date"),
  sortOrder: exports_external.enum(["asc", "desc"]).default("desc")
});
var ProjectInvestmentSchema = exports_external.object({
  repository: exports_external.string().nullable(),
  git_remote: exports_external.string().optional(),
  project_path: exports_external.string(),
  sessions: exports_external.number(),
  unique_users: exports_external.number(),
  total_duration_min: exports_external.number(),
  total_tokens: exports_external.number(),
  success_rate: exports_external.number(),
  cost: exports_external.number(),
  success_rate_trend: exports_external.number()
});
var ProjectDetailDataSchema = exports_external.object({
  project_path: exports_external.string(),
  total_sessions: exports_external.number(),
  total_tokens: exports_external.number(),
  contributors_count: exports_external.number(),
  errors_count: exports_external.number(),
  avg_session_duration_min: exports_external.number(),
  success_rate: exports_external.number(),
  total_duration_min: exports_external.number(),
  cost: exports_external.number()
});
var ProjectContributorSchema = exports_external.object({
  user_id: exports_external.string(),
  sessions: exports_external.number(),
  total_duration_min: exports_external.number(),
  total_tokens: exports_external.number(),
  contribution_percentage: exports_external.number()
});
var ProjectFeatureUsageSchema = exports_external.object({
  subagents_adoption_rate: exports_external.number(),
  skills_adoption_rate: exports_external.number(),
  slash_commands_adoption_rate: exports_external.number(),
  top_subagents: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() })),
  top_skills: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() })),
  top_slash_commands: exports_external.array(exports_external.object({ name: exports_external.string(), count: exports_external.number() }))
});
var ProjectErrorSchema = exports_external.object({
  error_pattern: exports_external.string(),
  occurrences: exports_external.number(),
  affected_users: exports_external.number(),
  last_seen: exports_external.string()
});
var ProjectTrendDataPointSchema = exports_external.object({
  date: exports_external.string(),
  project_path: exports_external.string(),
  project_name: exports_external.string(),
  sessions: exports_external.number(),
  total_hours: exports_external.number(),
  total_tokens: exports_external.number(),
  avg_success_rate: exports_external.number()
});
var ProjectDetailsInputSchema = DaysInputSchema.extend({
  projectPath: exports_external.string().max(MAX_PATH_FILTER_LENGTH)
});
var SessionAnalyticsSchema = exports_external.object({
  session_id: exports_external.string(),
  user_id: exports_external.string(),
  session_date: exports_external.string(),
  project_path: exports_external.string(),
  repository: exports_external.string().nullable(),
  git_remote: exports_external.string().optional(),
  duration_min: exports_external.number(),
  total_tokens: exports_external.number(),
  input_tokens: exports_external.number(),
  output_tokens: exports_external.number(),
  success_score: exports_external.number(),
  total_interactions: exports_external.number(),
  avg_period_sec: exports_external.number(),
  subagent_types: exports_external.array(exports_external.string()),
  skills: exports_external.array(exports_external.string()),
  slash_commands: exports_external.array(exports_external.string()),
  has_commit: exports_external.boolean(),
  session_archetype: exports_external.string(),
  model_used: exports_external.string(),
  used_plan_mode: exports_external.boolean(),
  source: SourceSchema.optional()
});
var SessionAnalyticsSummarySchema = exports_external.object({
  total_sessions: exports_external.number(),
  avg_session_duration_min: exports_external.number(),
  avg_response_time_sec: exports_external.number(),
  subagents_adoption_rate: exports_external.number(),
  skills_adoption_rate: exports_external.number(),
  slash_commands_adoption_rate: exports_external.number()
});
var SessionAnalyticsSummaryComparisonSchema = exports_external.object({
  current: SessionAnalyticsSummarySchema,
  previous: SessionAnalyticsSummarySchema,
  changes: exports_external.object({
    total_sessions: exports_external.number(),
    avg_session_duration_min: exports_external.number(),
    avg_response_time_sec: exports_external.number()
  })
});
var SessionListInputSchema = DaysInputSchema.extend({
  userId: exports_external.string().max(MAX_ID_FILTER_LENGTH).optional(),
  projectPath: exports_external.string().max(MAX_PATH_FILTER_LENGTH).optional(),
  repository: exports_external.string().max(MAX_PATH_FILTER_LENGTH).optional(),
  source: SourceSchema.optional(),
  limit: exports_external.number().int().positive().default(100),
  offset: exports_external.number().int().nonnegative().default(0),
  sortBy: exports_external.enum(["session_date", "duration_min", "total_tokens", "success_score"]).default("session_date"),
  sortOrder: exports_external.enum(["asc", "desc"]).default("desc")
});
var VALID_DIMENSIONS = [
  "user_id",
  "project_path",
  "repository",
  "session_archetype",
  "model_used",
  "has_commit",
  "used_plan_mode",
  "used_skills",
  "used_slash_commands",
  "used_subagents"
];
var VALID_METRICS = [
  "session_count",
  "avg_duration",
  "total_duration",
  "avg_interactions",
  "total_interactions",
  "avg_response_time",
  "median_response_time",
  "avg_tokens",
  "total_tokens",
  "avg_success_score",
  "avg_errors",
  "total_errors"
];
var DimensionAnalysisInputSchema = DaysInputSchema.extend({
  dimension: exports_external.enum(VALID_DIMENSIONS),
  metric: exports_external.enum(VALID_METRICS),
  splitBy: exports_external.enum(VALID_DIMENSIONS).optional(),
  limit: exports_external.number().int().positive().default(20),
  userId: exports_external.string().max(MAX_ID_FILTER_LENGTH).optional(),
  projectPath: exports_external.string().max(MAX_PATH_FILTER_LENGTH).optional()
});
var DimensionAnalysisDataPointSchema = exports_external.object({
  dimension_value: exports_external.string(),
  metric_value: exports_external.number().optional(),
  split_values: exports_external.record(exports_external.string(), exports_external.number()).optional()
});
var SessionDetailSchema = exports_external.object({
  session_id: exports_external.string(),
  user_id: exports_external.string(),
  session_date: exports_external.string(),
  last_interaction_date: exports_external.string(),
  project_path: exports_external.string(),
  repository: exports_external.string().nullable(),
  content: exports_external.string(),
  subagents: exports_external.record(exports_external.string(), exports_external.string()),
  skills: exports_external.array(exports_external.string()),
  slash_commands: exports_external.array(exports_external.string()),
  git_branch: exports_external.string().nullable(),
  git_sha: exports_external.string().nullable(),
  total_tokens: exports_external.number(),
  input_tokens: exports_external.number(),
  output_tokens: exports_external.number(),
  success_score: exports_external.number().optional(),
  duration_min: exports_external.number().optional(),
  total_interactions: exports_external.number().optional(),
  session_archetype: exports_external.string().optional(),
  model_used: exports_external.string().optional(),
  source: SourceSchema.optional()
});
var SessionDetailInputSchema = exports_external.object({
  sessionId: exports_external.string().max(MAX_ID_FILTER_LENGTH)
});
var ROIMetricsSchema = exports_external.object({
  total_cost: exports_external.number(),
  total_cost_change_pct: exports_external.number(),
  cost_per_session: exports_external.number(),
  cost_per_session_change_pct: exports_external.number(),
  cost_per_commit: exports_external.number(),
  cost_per_commit_change_pct: exports_external.number(),
  total_tokens: exports_external.number(),
  input_tokens: exports_external.number(),
  output_tokens: exports_external.number(),
  token_utilization_rate: exports_external.number(),
  total_sessions: exports_external.number(),
  total_commits: exports_external.number(),
  total_hours: exports_external.number(),
  active_developers: exports_external.number(),
  avg_success_score: exports_external.number(),
  commits_per_dollar: exports_external.number(),
  sessions_per_dollar: exports_external.number(),
  productivity_improvement_pct: exports_external.number(),
  estimated_loc_generated: exports_external.number(),
  dev_hours_saved: exports_external.number(),
  dev_hours_saved_change_pct: exports_external.number(),
  dollar_value_saved: exports_external.number(),
  roi_percentage: exports_external.number(),
  current_period_start: exports_external.string(),
  current_period_end: exports_external.string(),
  previous_period_start: exports_external.string(),
  previous_period_end: exports_external.string()
});
var ROITrendSchema = exports_external.object({
  week_start: exports_external.string(),
  total_cost: exports_external.number(),
  total_sessions: exports_external.number(),
  total_commits: exports_external.number(),
  active_developers: exports_external.number(),
  avg_success_score: exports_external.number(),
  total_tokens: exports_external.number(),
  output_tokens: exports_external.number(),
  productivity_score: exports_external.number()
});
var DeveloperCostBreakdownSchema = exports_external.object({
  user_id: exports_external.string(),
  sessions: exports_external.number(),
  total_tokens: exports_external.number(),
  cost: exports_external.number(),
  cost_percentage: exports_external.number(),
  avg_success_score: exports_external.number()
});
var ProjectCostBreakdownSchema = exports_external.object({
  project_path: exports_external.string(),
  sessions: exports_external.number(),
  total_tokens: exports_external.number(),
  cost: exports_external.number(),
  cost_percentage: exports_external.number(),
  avg_success_score: exports_external.number()
});
var RecurringErrorSchema = exports_external.object({
  error_pattern: exports_external.string(),
  occurrences: exports_external.number(),
  affected_sessions: exports_external.number(),
  affected_users: exports_external.number(),
  last_seen: exports_external.string(),
  severity: exports_external.enum(["high", "medium", "low"]),
  repositories: exports_external.array(exports_external.string())
});
var ErrorTrendDataPointSchema = exports_external.object({
  date: exports_external.string(),
  dimension: exports_external.string(),
  avg_errors_per_interaction: exports_external.number(),
  avg_errors_per_session: exports_external.number(),
  total_errors: exports_external.number()
});
var ErrorTrendsInputSchema = DateRangeInputSchema.extend({
  splitBy: exports_external.enum(["project_path", "user_id", "model"]).default("project_path")
});
var RecurringErrorsInputSchema = DaysInputSchema.extend({
  minOccurrences: exports_external.number().int().positive().default(2),
  limit: exports_external.number().int().positive().default(20)
});
var LearningEntrySchema = exports_external.object({
  session_id: exports_external.string(),
  user_id: exports_external.string(),
  created_at: exports_external.string(),
  type: exports_external.string(),
  content: exports_external.string(),
  scope: exports_external.string(),
  tags: exports_external.array(exports_external.string()),
  project_path: exports_external.string(),
  repository: exports_external.string().nullable()
});
var LearningsFeedStatsSchema = exports_external.object({
  total_learnings: exports_external.number(),
  unique_users: exports_external.number(),
  unique_projects: exports_external.number(),
  learnings_by_day: exports_external.array(exports_external.object({
    date: exports_external.string(),
    count: exports_external.number()
  }))
});
var LearningsTrendDataPointSchema = exports_external.record(exports_external.string(), exports_external.union([exports_external.string(), exports_external.number()]));
var LearningsTrendInputSchema = DaysInputSchema.extend({
  splitBy: exports_external.enum(["user_id", "repository"])
});
// ../../packages/api-routes/src/index.ts
var HealthSchema = exports_external.object({
  status: exports_external.literal("ok"),
  timestamp: exports_external.number()
});
var UserSchema = exports_external.object({
  id: exports_external.string(),
  email: exports_external.string(),
  name: exports_external.string(),
  image: exports_external.string().nullable(),
  activeOrganizationId: exports_external.string().nullable()
});
var CliUserSchema = exports_external.object({
  id: exports_external.string(),
  email: exports_external.string(),
  name: exports_external.string()
});
var OrganizationSchema = exports_external.object({
  id: exports_external.string(),
  name: exports_external.string(),
  slug: exports_external.string(),
  logo: exports_external.string().nullable()
});
var SessionTagSchema = exports_external.enum([
  "research",
  "new_feature",
  "bug_fix",
  "refactoring",
  "documentation",
  "tests",
  "other"
]);
var SubagentFileSchema = exports_external.object({
  agentId: exports_external.string(),
  content: exports_external.string()
});
var IngestSessionInputSchema = exports_external.object({
  source: SourceSchema.default("claude_code"),
  sessionId: exports_external.string().max(200),
  projectPath: exports_external.string().max(200).transform((p) => p.replace(/\\/g, "/")),
  gitRemote: exports_external.string().max(200).optional(),
  packageName: exports_external.string().max(200).optional(),
  packageType: exports_external.string().max(200).optional(),
  gitBranch: exports_external.string().max(200).optional(),
  gitSha: exports_external.string().max(200).optional(),
  tag: SessionTagSchema.optional(),
  content: exports_external.string(),
  subagents: exports_external.array(SubagentFileSchema).optional(),
  organizationId: exports_external.string().max(200).optional()
});
var IngestSessionOutputSchema = exports_external.object({
  success: exports_external.literal(true),
  sessionId: exports_external.string()
});
var contract = {
  health: oc.output(HealthSchema),
  me: oc.output(UserSchema),
  cli: {
    authStatus: oc.output(CliUserSchema),
    revokeToken: oc.output(exports_external.object({ success: exports_external.literal(true) }))
  },
  listMyOrganizations: oc.output(exports_external.array(OrganizationSchema)),
  ingestSession: oc.input(IngestSessionInputSchema).output(IngestSessionOutputSchema),
  getOrganizationSessionCount: oc.input(exports_external.object({ organizationId: exports_external.string() })).output(exports_external.object({ count: exports_external.number() })),
  deleteOrganization: oc.input(exports_external.object({ organizationId: exports_external.string() })).output(exports_external.object({ success: exports_external.literal(true) })),
  analytics: {
    overview: {
      kpis: oc.input(DateRangeInputSchema).output(OverviewKPIsSchema),
      usageTrend: oc.input(DateRangeInputSchema).output(exports_external.array(UsageTrendDataSchema)),
      modelTokensTrend: oc.input(DateRangeInputSchema).output(exports_external.array(ModelTokensTrendDataSchema)),
      insights: oc.input(DateRangeInputSchema).output(exports_external.array(InsightSchema)),
      teamSummaryComparison: oc.input(DateRangeInputSchema).output(TeamSummaryComparisonSchema),
      successRate: oc.input(DateRangeInputSchema).output(SuccessRateSchema)
    },
    developers: {
      list: oc.input(DaysInputSchema).output(exports_external.array(DeveloperSummarySchema)),
      details: oc.input(DeveloperDetailsInputSchema).output(DeveloperDetailsSchema),
      sessions: oc.input(DeveloperSessionsInputSchema).output(exports_external.array(DeveloperSessionSchema)),
      projects: oc.input(DeveloperDetailsInputSchema).output(exports_external.array(DeveloperProjectSchema)),
      timeline: oc.input(DeveloperDetailsInputSchema).output(exports_external.array(DeveloperTimelineSchema)),
      features: oc.input(DeveloperDetailsInputSchema).output(DeveloperFeatureUsageSchema),
      errors: oc.input(DeveloperDetailsInputSchema).output(exports_external.array(DeveloperErrorSchema)),
      trends: oc.input(DaysInputSchema).output(exports_external.array(DeveloperTrendDataPointSchema))
    },
    projects: {
      investment: oc.input(DaysInputSchema).output(exports_external.array(ProjectInvestmentSchema)),
      trends: oc.input(DaysInputSchema).output(exports_external.array(ProjectTrendDataPointSchema)),
      details: oc.input(ProjectDetailsInputSchema).output(ProjectDetailDataSchema),
      contributors: oc.input(ProjectDetailsInputSchema).output(exports_external.array(ProjectContributorSchema)),
      features: oc.input(ProjectDetailsInputSchema).output(ProjectFeatureUsageSchema),
      errors: oc.input(ProjectDetailsInputSchema).output(exports_external.array(ProjectErrorSchema))
    },
    sessions: {
      list: oc.input(SessionListInputSchema).output(exports_external.array(SessionAnalyticsSchema)),
      summary: oc.input(DaysInputSchema).output(SessionAnalyticsSummarySchema),
      summaryComparison: oc.input(DaysInputSchema).output(SessionAnalyticsSummaryComparisonSchema),
      dimensionAnalysis: oc.input(DimensionAnalysisInputSchema).output(exports_external.array(DimensionAnalysisDataPointSchema)),
      detail: oc.input(SessionDetailInputSchema).output(SessionDetailSchema)
    },
    roi: {
      metrics: oc.input(DaysInputSchema).output(ROIMetricsSchema),
      trends: oc.input(DaysInputSchema).output(exports_external.array(ROITrendSchema)),
      breakdownDevelopers: oc.input(DaysInputSchema).output(exports_external.array(DeveloperCostBreakdownSchema)),
      breakdownProjects: oc.input(DaysInputSchema).output(exports_external.array(ProjectCostBreakdownSchema))
    },
    errors: {
      topRecurring: oc.input(RecurringErrorsInputSchema).output(exports_external.array(RecurringErrorSchema)),
      trends: oc.input(ErrorTrendsInputSchema).output(exports_external.array(ErrorTrendDataPointSchema))
    },
    learnings: {
      list: oc.input(PaginatedDaysInputSchema).output(exports_external.array(LearningEntrySchema)),
      stats: oc.input(DaysInputSchema).output(LearningsFeedStatsSchema),
      users: oc.output(exports_external.array(exports_external.string())),
      projects: oc.output(exports_external.array(exports_external.string())),
      trend: oc.input(LearningsTrendInputSchema).output(exports_external.array(LearningsTrendDataPointSchema))
    }
  }
};

// src/lib/failed-uploads.ts
var FAILED_UPLOADS_PATH = join9(homedir8(), ".rudel", "failed-uploads.json");
function normalizeSource(raw) {
  if (typeof raw !== "string")
    return;
  const normalized = raw.replace(/-/g, "_");
  const parsed = SourceSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}
async function loadFailedUploads() {
  try {
    if (!existsSync7(FAILED_UPLOADS_PATH))
      return [];
    const data = JSON.parse(readFileSync6(FAILED_UPLOADS_PATH, "utf-8"));
    return data.failures.map((f) => ({
      ...f,
      source: normalizeSource(f.source)
    }));
  } catch {
    return [];
  }
}
async function saveFailedUploads(failures) {
  try {
    await mkdir2(dirname4(FAILED_UPLOADS_PATH), { recursive: true });
    const data = { failures };
    await writeFile2(FAILED_UPLOADS_PATH, JSON.stringify(data, null, 2));
  } catch {}
}
async function recordFailedUpload(failure) {
  const failures = await loadFailedUploads();
  const existing = failures.findIndex((f) => f.sessionId === failure.sessionId);
  const entry = {
    ...failure,
    failedAt: new Date().toISOString()
  };
  if (existing >= 0) {
    failures[existing] = entry;
  } else {
    failures.push(entry);
  }
  await saveFailedUploads(failures);
}
async function removeFailedUpload(sessionId) {
  const failures = await loadFailedUploads();
  const filtered = failures.filter((f) => f.sessionId !== sessionId);
  if (filtered.length !== failures.length) {
    await saveFailedUploads(filtered);
  }
}

// src/lib/batch-upload.ts
async function batchUpload(options) {
  const { items, upload, concurrency = 5, onItemComplete, onRetry } = options;
  const total = items.length;
  let succeeded = 0;
  let failed = 0;
  let completed = 0;
  const errors2 = [];
  await pMap(items, async (item) => {
    const itemOnRetry = (attempt, maxAttempts, error) => {
      onRetry?.(item.label, attempt, maxAttempts, error);
    };
    try {
      const result = await upload(item, itemOnRetry);
      if (result.success) {
        succeeded++;
        await removeFailedUpload(item.sessionId);
      } else {
        failed++;
        const error = result.error ?? "Unknown error";
        errors2.push({ label: item.label, error });
        await recordFailedUpload({
          sessionId: item.sessionId,
          transcriptPath: item.transcriptPath,
          projectPath: item.projectPath,
          source: item.source,
          organizationId: item.organizationId,
          error
        });
      }
    } catch (err) {
      failed++;
      const error = err instanceof Error ? err.message : String(err);
      errors2.push({ label: item.label, error });
      await recordFailedUpload({
        sessionId: item.sessionId,
        transcriptPath: item.transcriptPath,
        projectPath: item.projectPath,
        source: item.source,
        organizationId: item.organizationId,
        error
      });
    } finally {
      completed++;
      onItemComplete?.(completed, total);
    }
  }, { concurrency, stopOnError: false });
  return { succeeded, failed, total, errors: errors2 };
}

// src/lib/batch-upload-ui.ts
async function runBatchUpload(options) {
  const { items, upload, label, concurrency } = options;
  const bar = qt({ max: items.length });
  bar.start(label);
  const summary = await batchUpload({
    items,
    upload,
    concurrency,
    onItemComplete: (completed, total) => {
      bar.advance(1, `[${completed}/${total}] ${label}`);
    },
    onRetry: (itemLabel, attempt, maxAttempts, error) => {
      bar.message(`Retrying ${itemLabel} (${attempt}/${maxAttempts}) after ${error}`);
    }
  });
  bar.stop(summary.failed > 0 ? `Completed with ${summary.failed} error(s)` : "Upload complete");
  return summary;
}
function renderBatchSummary(summary, options) {
  const { context, maxErrors = 5, showRetryHint = false } = options ?? {};
  const prefix = context ? `${context}: ` : "";
  const lines = [];
  if (summary.succeeded > 0) {
    lines.push(`${prefix}${summary.succeeded} session(s) uploaded`);
  }
  if (summary.failed > 0) {
    lines.push(`${prefix}${summary.failed} session(s) failed`);
    for (const err of summary.errors.slice(0, maxErrors)) {
      lines.push(`  ${err.label}: ${err.error}`);
    }
    if (summary.errors.length > maxErrors) {
      lines.push(`  ...and ${summary.errors.length - maxErrors} more`);
    }
  }
  if (showRetryHint && summary.failed > 0) {
    lines.push("");
    lines.push("Run `rudel upload --retry` to retry failed uploads.");
  }
  if (lines.length > 0) {
    Mt2(lines.join(`
`), "Upload Summary");
  }
}

// src/lib/project-config.ts
import { existsSync as existsSync8, mkdirSync as mkdirSync3, readFileSync as readFileSync7, writeFileSync as writeFileSync4 } from "node:fs";
import { homedir as homedir9 } from "node:os";
import { join as join10 } from "node:path";
function getConfigDir2() {
  return process.env.RUDEL_CONFIG_DIR ?? join10(homedir9(), ".rudel");
}
function getProjectsConfigPath() {
  return join10(getConfigDir2(), "projects.json");
}
function loadProjectsConfig() {
  const path = getProjectsConfigPath();
  if (!existsSync8(path))
    return { projects: {} };
  const content = readFileSync7(path, "utf-8");
  return JSON.parse(content);
}
function saveProjectsConfig(config) {
  const dir = getConfigDir2();
  if (!existsSync8(dir)) {
    mkdirSync3(dir, { recursive: true, mode: 448 });
  }
  writeFileSync4(getProjectsConfigPath(), JSON.stringify(config, null, 2), {
    mode: 384
  });
}
async function getProjectKey(cwd) {
  try {
    const result = await exec("git", [
      "-C",
      cwd,
      "remote",
      "get-url",
      "origin"
    ]);
    if (result.exitCode === 0) {
      const url = result.stdout.trim();
      return url.replace(/^(https?:\/\/|git@|ssh:\/\/)/, "").replace(/:/, "/").replace(/\.git$/, "");
    }
  } catch {}
  try {
    const result = await exec("git", [
      "-C",
      cwd,
      "rev-parse",
      "--show-toplevel"
    ]);
    if (result.exitCode === 0) {
      return result.stdout.trim();
    }
  } catch {}
  return cwd;
}
async function getProjectOrgId(cwd) {
  const key = await getProjectKey(cwd);
  const config = loadProjectsConfig();
  return config.projects[key]?.organizationId;
}
async function setProjectOrgId(cwd, organizationId) {
  const key = await getProjectKey(cwd);
  const config = loadProjectsConfig();
  config.projects[key] = { organizationId };
  saveProjectsConfig(config);
}

// src/lib/uploader.ts
var RETRYABLE_STATUS_CODES = new Set([502, 503, 429]);
var MAX_ATTEMPTS = 3;
var BASE_DELAY_MS = 1000;
function isRetryable(error) {
  if (error instanceof ORPCError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}
function formatError(error) {
  if (error instanceof ORPCError) {
    return `${error.status} ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
async function uploadSession(request, config) {
  const link = new RPCLink({
    url: config.endpoint,
    headers: config.authType === "api-key" ? { "x-api-key": config.token } : { Authorization: `Bearer ${config.token}` }
  });
  const client = createORPCClient(link);
  for (let attempt = 1;attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await client.ingestSession(request);
      return { success: true, status: 200, attempts: attempt };
    } catch (error) {
      const errorMessage = formatError(error);
      if (isRetryable(error) && attempt < MAX_ATTEMPTS) {
        config.onRetry?.(attempt, MAX_ATTEMPTS, errorMessage);
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
        await new Promise((resolve2) => setTimeout(resolve2, delay));
        continue;
      }
      return {
        success: false,
        error: errorMessage,
        attempts: attempt
      };
    }
  }
  return {
    success: false,
    error: "Max retries exceeded",
    attempts: MAX_ATTEMPTS
  };
}

// src/commands/enable.ts
async function runEnable() {
  Wt2("rudel enable");
  const auth = await verifyAuth();
  if (!auth.authenticated) {
    R2.error(auth.message);
    Gt("Run `rudel login` to authenticate.");
    process.exitCode = 1;
    return;
  }
  const { credentials } = auth;
  let orgs;
  if (credentials.authType === "api-key") {
    orgs = credentials.organizations ?? [];
  } else {
    const client = createApiClient(credentials);
    try {
      orgs = await client.listMyOrganizations();
    } catch {
      R2.error("Failed to fetch organizations. Check your connection.");
      process.exitCode = 1;
      return;
    }
  }
  if (orgs.length === 0) {
    R2.error("No organizations found.");
    Gt("Create one at app.rudel.ai first.");
    process.exitCode = 1;
    return;
  }
  const cwd = process.cwd();
  const existingOrgId = await getProjectOrgId(cwd);
  const existingOrg = existingOrgId ? orgs.find((o) => o.id === existingOrgId) : undefined;
  let selectedOrgId;
  const [firstOrg] = orgs;
  if (orgs.length === 1 && firstOrg) {
    selectedOrgId = firstOrg.id;
    R2.info(`Using organization: ${firstOrg.name}`);
  } else if (existingOrg) {
    R2.info(`Currently configured for: ${existingOrg.name}`);
    selectedOrgId = existingOrg.id;
  } else {
    const selected = await Jt({
      message: "Select an organization for this repository",
      options: orgs.map((org) => ({
        value: org.id,
        label: org.name,
        hint: org.slug
      }))
    });
    if (Ct(selected)) {
      Nt("Setup cancelled.");
      return;
    }
    selectedOrgId = selected;
    const selectedOrg = orgs.find((o) => o.id === selected);
    if (selectedOrg) {
      R2.success(`Selected: ${selectedOrg.name}`);
    }
  }
  await setProjectOrgId(cwd, selectedOrgId);
  const adapters2 = getAvailableAdapters();
  let adaptersToEnable;
  if (adapters2.length > 1) {
    const agentOptions = adapters2.map((a) => ({
      value: a,
      label: a.name,
      hint: a.isHookInstalled() ? "already enabled" : undefined
    }));
    const selectedAdapters = await Lt2({
      message: "Select agents to enable auto-upload for",
      options: agentOptions,
      initialValues: adapters2,
      required: true
    });
    if (Ct(selectedAdapters)) {
      Nt("Setup cancelled.");
      return;
    }
    adaptersToEnable = selectedAdapters;
  } else {
    adaptersToEnable = adapters2;
  }
  for (const adapter of adaptersToEnable) {
    if (adapter.isHookInstalled()) {
      R2.info(`${adapter.name}: Auto-upload hook is already enabled. Organization updated.`);
    } else {
      adapter.installHook();
      R2.success(`${adapter.name}: Auto-upload hook enabled in ${adapter.getHookConfigPath()}`);
    }
  }
  const endpoint = `${credentials.apiBaseUrl}/rpc`;
  let totalFailed = 0;
  for (const adapter of adaptersToEnable) {
    const sessions = await adapter.findProjectSessions(cwd);
    if (sessions.length === 0)
      continue;
    const shouldUpload = await Rt({
      message: `Found ${sessions.length} previous ${adapter.name} session(s). Upload them now?`,
      initialValue: false
    });
    if (Ct(shouldUpload) || !shouldUpload)
      continue;
    const gitInfo = await getGitInfo(cwd);
    const items = sessions.map((session) => ({
      sessionId: session.sessionId,
      label: session.sessionId,
      transcriptPath: session.transcriptPath,
      projectPath: session.projectPath,
      source: adapter.source,
      organizationId: selectedOrgId
    }));
    const summary = await runBatchUpload({
      items,
      label: `Uploading ${adapter.name} sessions...`,
      upload: async (item, onRetry) => {
        const session = sessions.find((s) => s.sessionId === item.sessionId);
        if (!session) {
          return { success: false, error: "Session not found" };
        }
        const request = await adapter.buildUploadRequest(session, {
          gitInfo,
          organizationId: selectedOrgId
        });
        return uploadSession(request, {
          endpoint,
          token: credentials.token,
          authType: credentials.authType,
          onRetry
        });
      }
    });
    renderBatchSummary(summary, { context: adapter.name });
    totalFailed += summary.failed;
  }
  if (totalFailed > 0) {
    R2.info("Run `rudel upload --retry` to retry failed uploads.");
  }
  Gt("Done!");
  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}
var enableCommand = buildCommand({
  loader: async () => ({ default: runEnable }),
  parameters: {},
  docs: {
    brief: "Enable automatic session upload for coding agents"
  }
});
// ../../node_modules/@logtape/logtape/dist/context.js
var categoryPrefixSymbol = Symbol.for("logtape.categoryPrefix");
function getCategoryPrefix() {
  const rootLogger = LoggerImpl.getLogger();
  const store = rootLogger.contextLocalStorage?.getStore();
  if (store == null)
    return [];
  const prefix = store[categoryPrefixSymbol];
  return Array.isArray(prefix) ? prefix : [];
}
function getImplicitContext() {
  const rootLogger = LoggerImpl.getLogger();
  const store = rootLogger.contextLocalStorage?.getStore();
  if (store == null)
    return {};
  const result = {};
  for (const key of Object.keys(store))
    result[key] = store[key];
  return result;
}

// ../../node_modules/@logtape/logtape/dist/level.js
var logLevels = [
  "trace",
  "debug",
  "info",
  "warning",
  "error",
  "fatal"
];
function compareLogLevel(a, b) {
  const aIndex = logLevels.indexOf(a);
  if (aIndex < 0)
    throw new TypeError(`Invalid log level: ${JSON.stringify(a)}.`);
  const bIndex = logLevels.indexOf(b);
  if (bIndex < 0)
    throw new TypeError(`Invalid log level: ${JSON.stringify(b)}.`);
  return aIndex - bIndex;
}

// ../../node_modules/@logtape/logtape/dist/logger.js
var lazySymbol = Symbol.for("logtape.lazy");
function isLazy(value2) {
  return value2 != null && typeof value2 === "object" && lazySymbol in value2 && value2[lazySymbol] === true;
}
function resolveProperties(properties) {
  const resolved = {};
  for (const key in properties) {
    const value2 = properties[key];
    resolved[key] = isLazy(value2) ? value2.getter() : value2;
  }
  return resolved;
}
function getLogger(category = []) {
  return LoggerImpl.getLogger(category);
}
var globalRootLoggerSymbol = Symbol.for("logtape.rootLogger");
var LoggerImpl = class LoggerImpl2 {
  parent;
  children;
  category;
  sinks;
  parentSinks = "inherit";
  filters;
  lowestLevel = "trace";
  contextLocalStorage;
  static getLogger(category = []) {
    let rootLogger = globalRootLoggerSymbol in globalThis ? globalThis[globalRootLoggerSymbol] ?? null : null;
    if (rootLogger == null) {
      rootLogger = new LoggerImpl2(null, []);
      globalThis[globalRootLoggerSymbol] = rootLogger;
    }
    if (typeof category === "string")
      return rootLogger.getChild(category);
    if (category.length === 0)
      return rootLogger;
    return rootLogger.getChild(category);
  }
  constructor(parent, category) {
    this.parent = parent;
    this.children = {};
    this.category = category;
    this.sinks = [];
    this.filters = [];
  }
  getChild(subcategory) {
    const name = typeof subcategory === "string" ? subcategory : subcategory[0];
    const childRef = this.children[name];
    let child = childRef instanceof LoggerImpl2 ? childRef : childRef?.deref();
    if (child == null) {
      child = new LoggerImpl2(this, [...this.category, name]);
      this.children[name] = "WeakRef" in globalThis ? new WeakRef(child) : child;
    }
    if (typeof subcategory === "string" || subcategory.length === 1)
      return child;
    return child.getChild(subcategory.slice(1));
  }
  reset() {
    while (this.sinks.length > 0)
      this.sinks.shift();
    this.parentSinks = "inherit";
    while (this.filters.length > 0)
      this.filters.shift();
    this.lowestLevel = "trace";
  }
  resetDescendants() {
    for (const child of Object.values(this.children)) {
      const logger = child instanceof LoggerImpl2 ? child : child.deref();
      if (logger != null)
        logger.resetDescendants();
    }
    this.reset();
  }
  with(properties) {
    return new LoggerCtx(this, { ...properties });
  }
  filter(record) {
    for (const filter of this.filters)
      if (!filter(record))
        return false;
    if (this.filters.length < 1)
      return this.parent?.filter(record) ?? true;
    return true;
  }
  *getSinks(level) {
    if (this.lowestLevel === null || compareLogLevel(level, this.lowestLevel) < 0)
      return;
    if (this.parent != null && this.parentSinks === "inherit")
      for (const sink of this.parent.getSinks(level))
        yield sink;
    for (const sink of this.sinks)
      yield sink;
  }
  isEnabledFor(level) {
    if (this.lowestLevel === null || compareLogLevel(level, this.lowestLevel) < 0)
      return false;
    for (const _2 of this.getSinks(level))
      return true;
    return false;
  }
  emit(record, bypassSinks) {
    const categoryPrefix = getCategoryPrefix();
    const baseCategory = "category" in record ? record.category : this.category;
    const fullCategory = categoryPrefix.length > 0 ? [...categoryPrefix, ...baseCategory] : baseCategory;
    const descriptors = Object.getOwnPropertyDescriptors(record);
    descriptors.category = {
      value: fullCategory,
      enumerable: true,
      configurable: true
    };
    const fullRecord = Object.defineProperties({}, descriptors);
    if (this.lowestLevel === null || compareLogLevel(fullRecord.level, this.lowestLevel) < 0 || !this.filter(fullRecord))
      return;
    for (const sink of this.getSinks(fullRecord.level)) {
      if (bypassSinks?.has(sink))
        continue;
      try {
        sink(fullRecord);
      } catch (error) {
        const bypassSinks2 = new Set(bypassSinks);
        bypassSinks2.add(sink);
        metaLogger.log("fatal", "Failed to emit a log record to sink {sink}: {error}", {
          sink,
          error,
          record: fullRecord
        }, bypassSinks2);
      }
    }
  }
  log(level, rawMessage, properties, bypassSinks) {
    const implicitContext = getImplicitContext();
    let cachedProps = undefined;
    const record = typeof properties === "function" ? {
      category: this.category,
      level,
      timestamp: Date.now(),
      get message() {
        return parseMessageTemplate(rawMessage, this.properties);
      },
      rawMessage,
      get properties() {
        if (cachedProps == null)
          cachedProps = {
            ...implicitContext,
            ...properties()
          };
        return cachedProps;
      }
    } : {
      category: this.category,
      level,
      timestamp: Date.now(),
      message: parseMessageTemplate(rawMessage, {
        ...implicitContext,
        ...properties
      }),
      rawMessage,
      properties: {
        ...implicitContext,
        ...properties
      }
    };
    this.emit(record, bypassSinks);
  }
  logLazily(level, callback, properties = {}) {
    const implicitContext = getImplicitContext();
    let rawMessage = undefined;
    let msg = undefined;
    function realizeMessage() {
      if (msg == null || rawMessage == null) {
        msg = callback((tpl, ...values) => {
          rawMessage = tpl;
          return renderMessage(tpl, values);
        });
        if (rawMessage == null)
          throw new TypeError("No log record was made.");
      }
      return [msg, rawMessage];
    }
    this.emit({
      category: this.category,
      level,
      get message() {
        return realizeMessage()[0];
      },
      get rawMessage() {
        return realizeMessage()[1];
      },
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  logTemplate(level, messageTemplate, values, properties = {}) {
    const implicitContext = getImplicitContext();
    this.emit({
      category: this.category,
      level,
      message: renderMessage(messageTemplate, values),
      rawMessage: messageTemplate,
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  trace(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("trace"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("trace", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("trace"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("trace", message, resolvedProps);
          });
        }
        this.log("trace", message, result);
        return;
      }
      this.log("trace", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("trace", message);
    else if (!Array.isArray(message))
      this.log("trace", "{*}", message);
    else
      this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("debug"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("debug", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("debug"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("debug", message, resolvedProps);
          });
        }
        this.log("debug", message, result);
        return;
      }
      this.log("debug", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("debug", message);
    else if (!Array.isArray(message))
      this.log("debug", "{*}", message);
    else
      this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("info"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("info", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("info"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("info", message, resolvedProps);
          });
        }
        this.log("info", message, result);
        return;
      }
      this.log("info", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("info", message);
    else if (!Array.isArray(message))
      this.log("info", "{*}", message);
    else
      this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (message instanceof Error)
      this.log("warning", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("warning", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        this.log("warning", message, result);
        return;
      }
      this.log("warning", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    if (message instanceof Error)
      this.log("warning", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("warning", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        this.log("warning", message, result);
        return;
      }
      this.log("warning", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  error(message, ...values) {
    if (message instanceof Error)
      this.log("error", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("error", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("error"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("error", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("error"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("error", message, resolvedProps);
          });
        }
        this.log("error", message, result);
        return;
      }
      this.log("error", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("error", message);
    else if (!Array.isArray(message))
      this.log("error", "{*}", message);
    else
      this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (message instanceof Error)
      this.log("fatal", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("fatal", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("fatal"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("fatal", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("fatal"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("fatal", message, resolvedProps);
          });
        }
        this.log("fatal", message, result);
        return;
      }
      this.log("fatal", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("fatal", message);
    else if (!Array.isArray(message))
      this.log("fatal", "{*}", message);
    else
      this.logTemplate("fatal", message, values);
  }
};
var LoggerCtx = class LoggerCtx2 {
  logger;
  properties;
  constructor(logger, properties) {
    this.logger = logger;
    this.properties = properties;
  }
  get category() {
    return this.logger.category;
  }
  get parent() {
    return this.logger.parent;
  }
  getChild(subcategory) {
    return this.logger.getChild(subcategory).with(this.properties);
  }
  with(properties) {
    return new LoggerCtx2(this.logger, {
      ...this.properties,
      ...properties
    });
  }
  log(level, message, properties, bypassSinks) {
    const contextProps = this.properties;
    this.logger.log(level, message, typeof properties === "function" ? () => resolveProperties({
      ...contextProps,
      ...properties()
    }) : () => resolveProperties({
      ...contextProps,
      ...properties
    }), bypassSinks);
  }
  logLazily(level, callback) {
    this.logger.logLazily(level, callback, resolveProperties(this.properties));
  }
  logTemplate(level, messageTemplate, values) {
    this.logger.logTemplate(level, messageTemplate, values, resolveProperties(this.properties));
  }
  emit(record) {
    const recordWithContext = {
      ...record,
      properties: resolveProperties({
        ...this.properties,
        ...record.properties
      })
    };
    this.logger.emit(recordWithContext);
  }
  isEnabledFor(level) {
    return this.logger.isEnabledFor(level);
  }
  trace(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("trace"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("trace", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("trace"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("trace", message, resolvedProps);
          });
        }
        this.log("trace", message, result);
        return;
      }
      this.log("trace", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("trace", message);
    else if (!Array.isArray(message))
      this.log("trace", "{*}", message);
    else
      this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("debug"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("debug", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("debug"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("debug", message, resolvedProps);
          });
        }
        this.log("debug", message, result);
        return;
      }
      this.log("debug", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("debug", message);
    else if (!Array.isArray(message))
      this.log("debug", "{*}", message);
    else
      this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("info"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("info", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("info"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("info", message, resolvedProps);
          });
        }
        this.log("info", message, result);
        return;
      }
      this.log("info", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("info", message);
    else if (!Array.isArray(message))
      this.log("info", "{*}", message);
    else
      this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (message instanceof Error)
      this.log("warning", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("warning", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        this.log("warning", message, result);
        return;
      }
      this.log("warning", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    if (message instanceof Error)
      this.log("warning", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("warning", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("warning"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("warning", message, resolvedProps);
          });
        }
        this.log("warning", message, result);
        return;
      }
      this.log("warning", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  error(message, ...values) {
    if (message instanceof Error)
      this.log("error", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("error", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("error"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("error", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("error"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("error", message, resolvedProps);
          });
        }
        this.log("error", message, result);
        return;
      }
      this.log("error", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("error", message);
    else if (!Array.isArray(message))
      this.log("error", "{*}", message);
    else
      this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (message instanceof Error)
      this.log("fatal", "{error.message}", { error: message });
    else if (typeof message === "string" && values[0] instanceof Error)
      this.log("fatal", message, { error: values[0] });
    else if (typeof message === "string") {
      const props = values[0];
      if (typeof props === "function") {
        if (props.constructor.name === "AsyncFunction") {
          if (!this.isEnabledFor("fatal"))
            return Promise.resolve();
          return props().then((resolvedProps) => {
            this.log("fatal", message, resolvedProps);
          });
        }
        const result = props();
        if (result instanceof Promise) {
          if (!this.isEnabledFor("fatal"))
            return Promise.resolve();
          return result.then((resolvedProps) => {
            this.log("fatal", message, resolvedProps);
          });
        }
        this.log("fatal", message, result);
        return;
      }
      this.log("fatal", message, props ?? {});
    } else if (typeof message === "function")
      this.logLazily("fatal", message);
    else if (!Array.isArray(message))
      this.log("fatal", "{*}", message);
    else
      this.logTemplate("fatal", message, values);
  }
};
var metaLogger = LoggerImpl.getLogger(["logtape", "meta"]);
function isNestedAccess(key) {
  return key.includes(".") || key.includes("[") || key.includes("?.");
}
function getOwnProperty(obj, key) {
  if (key === "__proto__" || key === "prototype" || key === "constructor")
    return;
  if ((typeof obj === "object" || typeof obj === "function") && obj !== null)
    return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
  return;
}
function parseNextSegment(path, fromIndex) {
  const len = path.length;
  let i = fromIndex;
  if (i >= len)
    return null;
  let segment;
  if (path[i] === "[") {
    i++;
    if (i >= len)
      return null;
    if (path[i] === '"' || path[i] === "'") {
      const quote = path[i];
      i++;
      let segmentStr = "";
      while (i < len && path[i] !== quote)
        if (path[i] === "\\") {
          i++;
          if (i < len) {
            const escapeChar = path[i];
            switch (escapeChar) {
              case "n":
                segmentStr += `
`;
                break;
              case "t":
                segmentStr += "\t";
                break;
              case "r":
                segmentStr += "\r";
                break;
              case "b":
                segmentStr += "\b";
                break;
              case "f":
                segmentStr += "\f";
                break;
              case "v":
                segmentStr += "\v";
                break;
              case "0":
                segmentStr += "\x00";
                break;
              case "\\":
                segmentStr += "\\";
                break;
              case '"':
                segmentStr += '"';
                break;
              case "'":
                segmentStr += "'";
                break;
              case "u":
                if (i + 4 < len) {
                  const hex = path.slice(i + 1, i + 5);
                  const codePoint = Number.parseInt(hex, 16);
                  if (!Number.isNaN(codePoint)) {
                    segmentStr += String.fromCharCode(codePoint);
                    i += 4;
                  } else
                    segmentStr += escapeChar;
                } else
                  segmentStr += escapeChar;
                break;
              default:
                segmentStr += escapeChar;
            }
            i++;
          }
        } else {
          segmentStr += path[i];
          i++;
        }
      if (i >= len)
        return null;
      segment = segmentStr;
      i++;
    } else {
      const startIndex = i;
      while (i < len && path[i] !== "]" && path[i] !== "'" && path[i] !== '"')
        i++;
      if (i >= len)
        return null;
      const indexStr = path.slice(startIndex, i);
      if (indexStr.length === 0)
        return null;
      const indexNum = Number(indexStr);
      segment = Number.isNaN(indexNum) ? indexStr : indexNum;
    }
    while (i < len && path[i] !== "]")
      i++;
    if (i < len)
      i++;
  } else {
    const startIndex = i;
    while (i < len && path[i] !== "." && path[i] !== "[" && path[i] !== "?" && path[i] !== "]")
      i++;
    segment = path.slice(startIndex, i);
    if (segment.length === 0)
      return null;
  }
  if (i < len && path[i] === ".")
    i++;
  return {
    segment,
    nextIndex: i
  };
}
function accessProperty(obj, segment) {
  if (typeof segment === "string")
    return getOwnProperty(obj, segment);
  if (Array.isArray(obj) && segment >= 0 && segment < obj.length)
    return obj[segment];
  return;
}
function resolvePropertyPath(obj, path) {
  if (obj == null)
    return;
  if (path.length === 0 || path.endsWith("."))
    return;
  let current = obj;
  let i = 0;
  const len = path.length;
  while (i < len) {
    const isOptional = path.slice(i, i + 2) === "?.";
    if (isOptional) {
      i += 2;
      if (current == null)
        return;
    } else if (current == null)
      return;
    const result = parseNextSegment(path, i);
    if (result === null)
      return;
    const { segment, nextIndex } = result;
    i = nextIndex;
    current = accessProperty(current, segment);
    if (current === undefined)
      return;
  }
  return current;
}
function parseMessageTemplate(template, properties) {
  const length = template.length;
  if (length === 0)
    return [""];
  if (!template.includes("{"))
    return [template];
  const message = [];
  let startIndex = 0;
  for (let i = 0;i < length; i++) {
    const char = template[i];
    if (char === "{") {
      const nextChar = i + 1 < length ? template[i + 1] : "";
      if (nextChar === "{") {
        i++;
        continue;
      }
      const closeIndex = template.indexOf("}", i + 1);
      if (closeIndex === -1)
        continue;
      const beforeText = template.slice(startIndex, i);
      message.push(beforeText.replace(/{{/g, "{").replace(/}}/g, "}"));
      const key = template.slice(i + 1, closeIndex);
      let prop;
      const trimmedKey = key.trim();
      if (trimmedKey === "*")
        prop = key in properties ? properties[key] : ("*" in properties) ? properties["*"] : properties;
      else {
        if (key !== trimmedKey)
          prop = key in properties ? properties[key] : properties[trimmedKey];
        else
          prop = properties[key];
        if (prop === undefined && isNestedAccess(trimmedKey))
          prop = resolvePropertyPath(properties, trimmedKey);
      }
      message.push(prop);
      i = closeIndex;
      startIndex = i + 1;
    } else if (char === "}" && i + 1 < length && template[i + 1] === "}")
      i++;
  }
  const remainingText = template.slice(startIndex);
  message.push(remainingText.replace(/{{/g, "{").replace(/}}/g, "}"));
  return message;
}
function renderMessage(template, values) {
  const args = [];
  for (let i = 0;i < template.length; i++) {
    args.push(template[i]);
    if (i < values.length)
      args.push(values[i]);
  }
  return args;
}

// ../../node_modules/@logtape/logtape/dist/util.node.js
var exports_util_node = {};
__export(exports_util_node, {
  inspect: () => inspect
});
import util3 from "node:util";
function inspect(obj, options) {
  return util3.inspect(obj, options);
}

// ../../node_modules/@logtape/logtape/dist/formatter.js
var levelAbbreviations = {
  trace: "TRC",
  debug: "DBG",
  info: "INF",
  warning: "WRN",
  error: "ERR",
  fatal: "FTL"
};
var inspect2 = typeof document !== "undefined" || typeof navigator !== "undefined" && navigator.product === "ReactNative" ? (v) => JSON.stringify(v) : ("Deno" in globalThis) && ("inspect" in globalThis.Deno) && typeof globalThis.Deno.inspect === "function" ? (v, opts) => globalThis.Deno.inspect(v, {
  strAbbreviateSize: Infinity,
  iterableLimit: Infinity,
  ...opts
}) : exports_util_node != null && ("inspect" in exports_util_node) && typeof inspect === "function" ? (v, opts) => inspect(v, {
  maxArrayLength: Infinity,
  maxStringLength: Infinity,
  ...opts
}) : (v) => JSON.stringify(v);
function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}
function padThree(num) {
  return num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
}
var timestampFormatters = {
  "date-time-timezone": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} +00:00`;
  },
  "date-time-tz": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} +00`;
  },
  "date-time": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms}`;
  },
  "time-timezone": (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms} +00:00`;
  },
  "time-tz": (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms} +00`;
  },
  time: (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms}`;
  },
  date: (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    return `${year}-${month}-${day}`;
  },
  rfc3339: (ts) => new Date(ts).toISOString(),
  none: () => null
};
var levelRenderersCache = {
  ABBR: levelAbbreviations,
  abbr: {
    trace: "trc",
    debug: "dbg",
    info: "inf",
    warning: "wrn",
    error: "err",
    fatal: "ftl"
  },
  FULL: {
    trace: "TRACE",
    debug: "DEBUG",
    info: "INFO",
    warning: "WARNING",
    error: "ERROR",
    fatal: "FATAL"
  },
  full: {
    trace: "trace",
    debug: "debug",
    info: "info",
    warning: "warning",
    error: "error",
    fatal: "fatal"
  },
  L: {
    trace: "T",
    debug: "D",
    info: "I",
    warning: "W",
    error: "E",
    fatal: "F"
  },
  l: {
    trace: "t",
    debug: "d",
    info: "i",
    warning: "w",
    error: "e",
    fatal: "f"
  }
};
function getLineEndingValue(lineEnding) {
  return lineEnding === "crlf" ? `\r
` : `
`;
}
function jsonReplacer(_key, value2) {
  if (!(value2 instanceof Error))
    return value2;
  const serialized = {
    name: value2.name,
    message: value2.message
  };
  if (typeof value2.stack === "string")
    serialized.stack = value2.stack;
  const cause = value2.cause;
  if (cause !== undefined)
    serialized.cause = cause;
  if (typeof AggregateError !== "undefined" && value2 instanceof AggregateError)
    serialized.errors = value2.errors;
  for (const key of Object.keys(value2))
    if (!(key in serialized))
      serialized[key] = value2[key];
  return serialized;
}
function getTextFormatter(options = {}) {
  const timestampRenderer = (() => {
    const tsOption = options.timestamp;
    if (tsOption == null)
      return timestampFormatters["date-time-timezone"];
    else if (tsOption === "disabled")
      return timestampFormatters["none"];
    else if (typeof tsOption === "string" && tsOption in timestampFormatters)
      return timestampFormatters[tsOption];
    else
      return tsOption;
  })();
  const categorySeparator = options.category ?? "·";
  const valueRenderer = options.value ? (v) => options.value(v, inspect2) : inspect2;
  const levelRenderer = (() => {
    const levelOption = options.level;
    if (levelOption == null || levelOption === "ABBR")
      return (level) => levelRenderersCache.ABBR[level];
    else if (levelOption === "abbr")
      return (level) => levelRenderersCache.abbr[level];
    else if (levelOption === "FULL")
      return (level) => levelRenderersCache.FULL[level];
    else if (levelOption === "full")
      return (level) => levelRenderersCache.full[level];
    else if (levelOption === "L")
      return (level) => levelRenderersCache.L[level];
    else if (levelOption === "l")
      return (level) => levelRenderersCache.l[level];
    else
      return levelOption;
  })();
  const lineEnding = getLineEndingValue(options.lineEnding);
  const formatter = options.format ?? (({ timestamp, level, category, message }) => `${timestamp ? `${timestamp} ` : ""}[${level}] ${category}: ${message}`);
  return (record) => {
    const msgParts = record.message;
    const msgLen = msgParts.length;
    let message;
    if (msgLen === 1)
      message = msgParts[0];
    else if (msgLen <= 6) {
      message = "";
      for (let i = 0;i < msgLen; i++)
        message += i % 2 === 0 ? msgParts[i] : valueRenderer(msgParts[i]);
    } else {
      const parts = new Array(msgLen);
      for (let i = 0;i < msgLen; i++)
        parts[i] = i % 2 === 0 ? msgParts[i] : valueRenderer(msgParts[i]);
      message = parts.join("");
    }
    const timestamp = timestampRenderer(record.timestamp);
    const level = levelRenderer(record.level);
    const category = typeof categorySeparator === "function" ? categorySeparator(record.category) : record.category.join(categorySeparator);
    const values = {
      timestamp,
      level,
      category,
      message,
      record
    };
    return `${formatter(values)}${lineEnding}`;
  };
}
var defaultTextFormatter = getTextFormatter();
var RESET = "\x1B[0m";
var ansiColors = {
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m"
};
var ansiStyles = {
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  italic: "\x1B[3m",
  underline: "\x1B[4m",
  strikethrough: "\x1B[9m"
};
var defaultLevelColors = {
  trace: null,
  debug: "blue",
  info: "green",
  warning: "yellow",
  error: "red",
  fatal: "magenta"
};
function getAnsiColorFormatter(options = {}) {
  const format = options.format;
  const timestampStyle = typeof options.timestampStyle === "undefined" ? "dim" : options.timestampStyle;
  const timestampColor = options.timestampColor ?? null;
  const timestampPrefix = `${timestampStyle == null ? "" : ansiStyles[timestampStyle]}${timestampColor == null ? "" : ansiColors[timestampColor]}`;
  const timestampSuffix = timestampStyle == null && timestampColor == null ? "" : RESET;
  const levelStyle = typeof options.levelStyle === "undefined" ? "bold" : options.levelStyle;
  const levelColors = options.levelColors ?? defaultLevelColors;
  const categoryStyle = typeof options.categoryStyle === "undefined" ? "dim" : options.categoryStyle;
  const categoryColor = options.categoryColor ?? null;
  const categoryPrefix = `${categoryStyle == null ? "" : ansiStyles[categoryStyle]}${categoryColor == null ? "" : ansiColors[categoryColor]}`;
  const categorySuffix = categoryStyle == null && categoryColor == null ? "" : RESET;
  return getTextFormatter({
    timestamp: "date-time-tz",
    value(value2, fallbackInspect) {
      return fallbackInspect(value2, { colors: true });
    },
    ...options,
    format({ timestamp, level, category, message, record }) {
      const levelColor = levelColors[record.level];
      timestamp = timestamp == null ? null : `${timestampPrefix}${timestamp}${timestampSuffix}`;
      level = `${levelStyle == null ? "" : ansiStyles[levelStyle]}${levelColor == null ? "" : ansiColors[levelColor]}${level}${levelStyle == null && levelColor == null ? "" : RESET}`;
      return format == null ? `${timestamp == null ? "" : `${timestamp} `}${level} ${categoryPrefix}${category}:${categorySuffix} ${message}` : format({
        timestamp,
        level,
        category: `${categoryPrefix}${category}${categorySuffix}`,
        message,
        record
      });
    }
  });
}
var ansiColorFormatter = getAnsiColorFormatter();
function getJsonLinesFormatter(options = {}) {
  const lineEnding = getLineEndingValue(options.lineEnding);
  if (!options.categorySeparator && !options.message && !options.properties)
    return (record) => {
      if (record.message.length === 3)
        return JSON.stringify({
          "@timestamp": new Date(record.timestamp).toISOString(),
          level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
          message: record.message[0] + JSON.stringify(record.message[1]) + record.message[2],
          logger: record.category.join("."),
          properties: record.properties
        }, jsonReplacer) + lineEnding;
      if (record.message.length === 1)
        return JSON.stringify({
          "@timestamp": new Date(record.timestamp).toISOString(),
          level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
          message: record.message[0],
          logger: record.category.join("."),
          properties: record.properties
        }, jsonReplacer) + lineEnding;
      let msg = record.message[0];
      for (let i = 1;i < record.message.length; i++)
        msg += i & 1 ? JSON.stringify(record.message[i]) : record.message[i];
      return JSON.stringify({
        "@timestamp": new Date(record.timestamp).toISOString(),
        level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
        message: msg,
        logger: record.category.join("."),
        properties: record.properties
      }, jsonReplacer) + lineEnding;
    };
  const isTemplateMessage = options.message === "template";
  const propertiesOption = options.properties ?? "nest:properties";
  let joinCategory;
  if (typeof options.categorySeparator === "function")
    joinCategory = options.categorySeparator;
  else {
    const separator = options.categorySeparator ?? ".";
    joinCategory = (category) => category.join(separator);
  }
  let getProperties;
  if (propertiesOption === "flatten")
    getProperties = (properties) => properties;
  else if (propertiesOption.startsWith("prepend:")) {
    const prefix = propertiesOption.substring(8);
    if (prefix === "")
      throw new TypeError(`Invalid properties option: ${JSON.stringify(propertiesOption)}. It must be of the form "prepend:<prefix>" where <prefix> is a non-empty string.`);
    getProperties = (properties) => {
      const result = {};
      for (const key in properties)
        result[`${prefix}${key}`] = properties[key];
      return result;
    };
  } else if (propertiesOption.startsWith("nest:")) {
    const key = propertiesOption.substring(5);
    getProperties = (properties) => ({ [key]: properties });
  } else
    throw new TypeError(`Invalid properties option: ${JSON.stringify(propertiesOption)}. It must be "flatten", "prepend:<prefix>", or "nest:<key>".`);
  let getMessage;
  if (isTemplateMessage)
    getMessage = (record) => {
      if (typeof record.rawMessage === "string")
        return record.rawMessage;
      let msg = "";
      for (let i = 0;i < record.rawMessage.length; i++)
        msg += i % 2 < 1 ? record.rawMessage[i] : "{}";
      return msg;
    };
  else
    getMessage = (record) => {
      const msgLen = record.message.length;
      if (msgLen === 1)
        return record.message[0];
      let msg = "";
      for (let i = 0;i < msgLen; i++)
        msg += i % 2 < 1 ? record.message[i] : JSON.stringify(record.message[i]);
      return msg;
    };
  return (record) => {
    return JSON.stringify({
      "@timestamp": new Date(record.timestamp).toISOString(),
      level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
      message: getMessage(record),
      logger: joinCategory(record.category),
      ...getProperties(record.properties)
    }, jsonReplacer) + lineEnding;
  };
}
var jsonLinesFormatter = getJsonLinesFormatter();
var logLevelStyles = {
  trace: "background-color: gray; color: white;",
  debug: "background-color: gray; color: white;",
  info: "background-color: white; color: black;",
  warning: "background-color: orange; color: black;",
  error: "background-color: red; color: white;",
  fatal: "background-color: maroon; color: white;"
};
function defaultConsoleFormatter(record) {
  let msg = "";
  const values = [];
  for (let i = 0;i < record.message.length; i++)
    if (i % 2 === 0)
      msg += record.message[i];
    else {
      msg += "%o";
      values.push(record.message[i]);
    }
  const date = new Date(record.timestamp);
  const time = `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}.${date.getUTCMilliseconds().toString().padStart(3, "0")}`;
  return [
    `%c${time} %c${levelAbbreviations[record.level]}%c %c${record.category.join("·")} %c${msg}`,
    "color: gray;",
    logLevelStyles[record.level],
    "background-color: default;",
    "color: gray;",
    "color: default;",
    ...values
  ];
}
// ../../node_modules/@logtape/logtape/dist/filter.js
function toFilter(filter) {
  if (typeof filter === "function")
    return filter;
  return getLevelFilter(filter);
}
function getLevelFilter(level) {
  if (level == null)
    return () => false;
  if (level === "fatal")
    return (record) => record.level === "fatal";
  else if (level === "error")
    return (record) => record.level === "fatal" || record.level === "error";
  else if (level === "warning")
    return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning";
  else if (level === "info")
    return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning" || record.level === "info";
  else if (level === "debug")
    return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning" || record.level === "info" || record.level === "debug";
  else if (level === "trace")
    return () => true;
  throw new TypeError(`Invalid log level: ${level}.`);
}

// ../../node_modules/@logtape/logtape/dist/sink.js
function getConsoleSink(options = {}) {
  const formatter = options.formatter ?? defaultConsoleFormatter;
  const levelMap = {
    trace: "debug",
    debug: "debug",
    info: "info",
    warning: "warn",
    error: "error",
    fatal: "error",
    ...options.levelMap ?? {}
  };
  const console2 = options.console ?? globalThis.console;
  const baseSink = (record) => {
    const args = formatter(record);
    const method = levelMap[record.level];
    if (method === undefined)
      throw new TypeError(`Invalid log level: ${record.level}.`);
    if (typeof args === "string") {
      const msg = args.replace(/\r?\n$/, "");
      console2[method](msg);
    } else
      console2[method](...args);
  };
  if (!options.nonBlocking)
    return baseSink;
  const nonBlockingConfig = options.nonBlocking === true ? {} : options.nonBlocking;
  const bufferSize = nonBlockingConfig.bufferSize ?? 100;
  const flushInterval = nonBlockingConfig.flushInterval ?? 100;
  const buffer = [];
  let flushTimer = null;
  let disposed = false;
  let flushScheduled = false;
  const maxBufferSize = bufferSize * 2;
  function flush() {
    if (buffer.length === 0)
      return;
    const records = buffer.splice(0);
    for (const record of records)
      try {
        baseSink(record);
      } catch {}
  }
  function scheduleFlush() {
    if (flushScheduled)
      return;
    flushScheduled = true;
    setTimeout(() => {
      flushScheduled = false;
      flush();
    }, 0);
  }
  function startFlushTimer() {
    if (flushTimer !== null || disposed)
      return;
    flushTimer = setInterval(() => {
      flush();
    }, flushInterval);
  }
  const nonBlockingSink = (record) => {
    if (disposed)
      return;
    if (buffer.length >= maxBufferSize)
      buffer.shift();
    buffer.push(record);
    if (buffer.length >= bufferSize)
      scheduleFlush();
    else if (flushTimer === null)
      startFlushTimer();
  };
  nonBlockingSink[Symbol.dispose] = () => {
    disposed = true;
    if (flushTimer !== null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush();
  };
  return nonBlockingSink;
}

// ../../node_modules/@logtape/logtape/dist/config.js
var currentConfig = null;
var strongRefs = /* @__PURE__ */ new Set;
var disposables = /* @__PURE__ */ new Set;
var asyncDisposables = /* @__PURE__ */ new Set;
function isLoggerConfigMeta(cfg) {
  return cfg.category.length === 0 || cfg.category.length === 1 && cfg.category[0] === "logtape" || cfg.category.length === 2 && cfg.category[0] === "logtape" && cfg.category[1] === "meta";
}
async function configure(config) {
  if (currentConfig != null && !config.reset)
    throw new ConfigError("Already configured; if you want to reset, turn on the reset flag.");
  await reset();
  try {
    configureInternal(config, true);
  } catch (e) {
    if (e instanceof ConfigError)
      await reset();
    throw e;
  }
}
function configureInternal(config, allowAsync) {
  currentConfig = config;
  let metaConfigured = false;
  const configuredCategories = /* @__PURE__ */ new Set;
  for (const cfg of config.loggers) {
    if (isLoggerConfigMeta(cfg))
      metaConfigured = true;
    const categoryKey = Array.isArray(cfg.category) ? JSON.stringify(cfg.category) : JSON.stringify([cfg.category]);
    if (configuredCategories.has(categoryKey))
      throw new ConfigError(`Duplicate logger configuration for category: ${categoryKey}. Each category can only be configured once.`);
    configuredCategories.add(categoryKey);
    const logger = LoggerImpl.getLogger(cfg.category);
    for (const sinkId of cfg.sinks ?? []) {
      const sink = config.sinks[sinkId];
      if (!sink)
        throw new ConfigError(`Sink not found: ${sinkId}.`);
      logger.sinks.push(sink);
    }
    logger.parentSinks = cfg.parentSinks ?? "inherit";
    if (cfg.lowestLevel !== undefined)
      logger.lowestLevel = cfg.lowestLevel;
    for (const filterId of cfg.filters ?? []) {
      const filter = config.filters?.[filterId];
      if (filter === undefined)
        throw new ConfigError(`Filter not found: ${filterId}.`);
      logger.filters.push(toFilter(filter));
    }
    strongRefs.add(logger);
  }
  LoggerImpl.getLogger().contextLocalStorage = config.contextLocalStorage;
  for (const sink of Object.values(config.sinks)) {
    if (Symbol.asyncDispose in sink)
      if (allowAsync)
        asyncDisposables.add(sink);
      else
        throw new ConfigError("Async disposables cannot be used with configureSync().");
    if (Symbol.dispose in sink)
      disposables.add(sink);
  }
  for (const filter of Object.values(config.filters ?? {})) {
    if (filter == null || typeof filter === "string")
      continue;
    if (Symbol.asyncDispose in filter)
      if (allowAsync)
        asyncDisposables.add(filter);
      else
        throw new ConfigError("Async disposables cannot be used with configureSync().");
    if (Symbol.dispose in filter)
      disposables.add(filter);
  }
  if (typeof globalThis.EdgeRuntime !== "string" && "process" in globalThis && !("Deno" in globalThis)) {
    const proc = globalThis.process;
    const onMethod = proc?.["on"];
    if (typeof onMethod === "function")
      onMethod.call(proc, "exit", allowAsync ? dispose : disposeSync);
  } else if ("Deno" in globalThis)
    addEventListener("unload", allowAsync ? dispose : disposeSync);
  else
    addEventListener("pagehide", allowAsync ? dispose : disposeSync);
  const meta = LoggerImpl.getLogger(["logtape", "meta"]);
  if (!metaConfigured)
    meta.sinks.push(getConsoleSink());
  meta.info("LogTape loggers are configured.  Note that LogTape itself uses the meta logger, which has category {metaLoggerCategory}.  The meta logger is used to log internal diagnostics such as sink exceptions.  It's recommended to configure the meta logger with a separate sink so that you can easily notice if logging itself fails or is misconfigured.  To turn off this message, configure the meta logger with higher log levels than {dismissLevel}.  See also <https://logtape.org/manual/categories#meta-logger>.", {
    metaLoggerCategory: ["logtape", "meta"],
    dismissLevel: "info"
  });
}
async function reset() {
  await dispose();
  resetInternal();
}
function resetInternal() {
  const rootLogger = LoggerImpl.getLogger([]);
  rootLogger.resetDescendants();
  delete rootLogger.contextLocalStorage;
  strongRefs.clear();
  currentConfig = null;
}
async function dispose() {
  disposeSync();
  const promises = [];
  for (const disposable of asyncDisposables) {
    promises.push(disposable[Symbol.asyncDispose]());
    asyncDisposables.delete(disposable);
  }
  await Promise.all(promises);
}
function disposeSync() {
  for (const disposable of disposables)
    disposable[Symbol.dispose]();
  disposables.clear();
}
var ConfigError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigureError";
  }
};

// src/logging.ts
import { homedir as homedir10 } from "node:os";
import { join as join12 } from "node:path";
// ../../node_modules/@logtape/file/dist/filesink.base.js
var AdaptiveFlushStrategy = class {
  recentFlushSizes = [];
  recentFlushTimes = [];
  avgFlushSize;
  avgFlushInterval;
  maxHistorySize = 10;
  baseThreshold;
  constructor(baseThreshold, baseInterval) {
    this.baseThreshold = baseThreshold;
    this.avgFlushSize = baseThreshold;
    this.avgFlushInterval = baseInterval;
  }
  recordFlush(size, timeSinceLastFlush) {
    this.recentFlushSizes.push(size);
    this.recentFlushTimes.push(timeSinceLastFlush);
    if (this.recentFlushSizes.length > this.maxHistorySize) {
      this.recentFlushSizes.shift();
      this.recentFlushTimes.shift();
    }
    this.updateAverages();
  }
  shouldFlush(currentSize, timeSinceLastFlush) {
    const adaptiveThreshold = this.calculateAdaptiveThreshold();
    const adaptiveInterval = this.calculateAdaptiveInterval();
    return currentSize >= adaptiveThreshold || adaptiveInterval > 0 && timeSinceLastFlush >= adaptiveInterval;
  }
  updateAverages() {
    if (this.recentFlushSizes.length === 0)
      return;
    this.avgFlushSize = this.recentFlushSizes.reduce((sum, size) => sum + size, 0) / this.recentFlushSizes.length;
    this.avgFlushInterval = this.recentFlushTimes.reduce((sum, time) => sum + time, 0) / this.recentFlushTimes.length;
  }
  calculateAdaptiveThreshold() {
    const adaptiveFactor = Math.min(2, Math.max(0.5, this.avgFlushSize / this.baseThreshold));
    return Math.max(Math.min(4096, this.baseThreshold / 2), Math.min(64 * 1024, this.baseThreshold * adaptiveFactor));
  }
  calculateAdaptiveInterval() {
    if (this.avgFlushInterval <= 0)
      return 0;
    if (this.recentFlushTimes.length < 3)
      return this.avgFlushInterval;
    const variance = this.calculateVariance(this.recentFlushTimes);
    const stabilityFactor = Math.min(2, Math.max(0.5, 1000 / variance));
    return Math.max(1000, Math.min(1e4, this.avgFlushInterval * stabilityFactor));
  }
  calculateVariance(values) {
    if (values.length < 2)
      return 1000;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
};
var BufferPool = class {
  pool = [];
  maxPoolSize = 50;
  maxBufferSize = 64 * 1024;
  acquire(size) {
    if (size > this.maxBufferSize)
      return new Uint8Array(size);
    for (let i = this.pool.length - 1;i >= 0; i--) {
      const buffer = this.pool[i];
      if (buffer.length >= size) {
        this.pool.splice(i, 1);
        return buffer.subarray(0, size);
      }
    }
    const actualSize = Math.max(size, 1024);
    return new Uint8Array(actualSize);
  }
  release(buffer) {
    if (this.pool.length >= this.maxPoolSize || buffer.length > this.maxBufferSize)
      return;
    if (buffer.length < 256)
      return;
    this.pool.push(buffer);
  }
  clear() {
    this.pool.length = 0;
  }
  getStats() {
    return {
      poolSize: this.pool.reduce((sum, buf) => sum + buf.length, 0),
      totalBuffers: this.pool.length
    };
  }
};
var ByteRingBuffer = class {
  buffers = [];
  totalSize = 0;
  bufferPool;
  constructor(bufferPool) {
    this.bufferPool = bufferPool;
  }
  append(data) {
    this.buffers.push(data);
    this.totalSize += data.length;
  }
  size() {
    return this.totalSize;
  }
  count() {
    return this.buffers.length;
  }
  flush() {
    const result = [...this.buffers];
    this.clear();
    return result;
  }
  clear() {
    for (const buffer of this.buffers)
      this.bufferPool.release(buffer);
    this.buffers.length = 0;
    this.totalSize = 0;
  }
  isEmpty() {
    return this.buffers.length === 0;
  }
};
function getBaseFileSink(path, options) {
  const formatter = options.formatter ?? defaultTextFormatter;
  const encoder = options.encoder ?? new TextEncoder;
  const bufferSize = options.bufferSize ?? 1024 * 8;
  const flushInterval = options.flushInterval ?? 5000;
  let fd = options.lazy ? null : options.openSync(path);
  const bufferPool = new BufferPool;
  const byteBuffer = new ByteRingBuffer(bufferPool);
  const adaptiveStrategy = new AdaptiveFlushStrategy(bufferSize, flushInterval);
  let lastFlushTimestamp = Date.now();
  if (!options.nonBlocking) {
    let flushBuffer$1 = function() {
      if (fd == null || byteBuffer.isEmpty())
        return;
      const flushSize = byteBuffer.size();
      const currentTime = Date.now();
      const timeSinceLastFlush = currentTime - lastFlushTimestamp;
      const chunks = byteBuffer.flush();
      if (options.writeManySync && chunks.length > 1)
        options.writeManySync(fd, chunks);
      else
        for (const chunk of chunks)
          options.writeSync(fd, chunk);
      options.flushSync(fd);
      adaptiveStrategy.recordFlush(flushSize, timeSinceLastFlush);
      lastFlushTimestamp = currentTime;
    };
    const sink = (record) => {
      if (fd == null)
        fd = options.openSync(path);
      if (byteBuffer.isEmpty() && bufferSize === 8192) {
        const formattedRecord$1 = formatter(record);
        const encodedRecord$1 = encoder.encode(formattedRecord$1);
        if (encodedRecord$1.length < 200) {
          options.writeSync(fd, encodedRecord$1);
          options.flushSync(fd);
          lastFlushTimestamp = Date.now();
          return;
        }
      }
      const formattedRecord = formatter(record);
      const encodedRecord = encoder.encode(formattedRecord);
      byteBuffer.append(encodedRecord);
      if (bufferSize <= 0)
        flushBuffer$1();
      else {
        const timeSinceLastFlush = record.timestamp - lastFlushTimestamp;
        const shouldFlush = adaptiveStrategy.shouldFlush(byteBuffer.size(), timeSinceLastFlush);
        if (shouldFlush)
          flushBuffer$1();
      }
    };
    sink[Symbol.dispose] = () => {
      if (fd !== null) {
        flushBuffer$1();
        options.closeSync(fd);
      }
      bufferPool.clear();
    };
    return sink;
  }
  const asyncOptions = options;
  let disposed = false;
  let activeFlush = null;
  let flushTimer = null;
  async function flushBuffer() {
    if (fd == null || byteBuffer.isEmpty())
      return;
    const flushSize = byteBuffer.size();
    const currentTime = Date.now();
    const timeSinceLastFlush = currentTime - lastFlushTimestamp;
    const chunks = byteBuffer.flush();
    try {
      if (asyncOptions.writeMany && chunks.length > 1)
        await asyncOptions.writeMany(fd, chunks);
      else
        for (const chunk of chunks)
          asyncOptions.writeSync(fd, chunk);
      await asyncOptions.flush(fd);
      adaptiveStrategy.recordFlush(flushSize, timeSinceLastFlush);
      lastFlushTimestamp = currentTime;
    } catch {}
  }
  function scheduleFlush() {
    if (activeFlush || disposed)
      return;
    activeFlush = flushBuffer().finally(() => {
      activeFlush = null;
    });
  }
  function startFlushTimer() {
    if (flushTimer !== null || disposed)
      return;
    flushTimer = setInterval(() => {
      scheduleFlush();
    }, flushInterval);
  }
  const nonBlockingSink = (record) => {
    if (disposed)
      return;
    if (fd == null)
      fd = asyncOptions.openSync(path);
    if (byteBuffer.isEmpty() && !activeFlush && bufferSize === 8192) {
      const formattedRecord$1 = formatter(record);
      const encodedRecord$1 = encoder.encode(formattedRecord$1);
      if (encodedRecord$1.length < 200) {
        asyncOptions.writeSync(fd, encodedRecord$1);
        scheduleFlush();
        lastFlushTimestamp = Date.now();
        return;
      }
    }
    const formattedRecord = formatter(record);
    const encodedRecord = encoder.encode(formattedRecord);
    byteBuffer.append(encodedRecord);
    if (bufferSize <= 0)
      scheduleFlush();
    else {
      const timeSinceLastFlush = record.timestamp - lastFlushTimestamp;
      const shouldFlush = adaptiveStrategy.shouldFlush(byteBuffer.size(), timeSinceLastFlush);
      if (shouldFlush)
        scheduleFlush();
      else if (flushTimer === null && flushInterval > 0)
        startFlushTimer();
    }
  };
  nonBlockingSink[Symbol.asyncDispose] = async () => {
    disposed = true;
    if (flushTimer !== null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    await flushBuffer();
    if (fd !== null)
      try {
        await asyncOptions.close(fd);
      } catch {}
    bufferPool.clear();
  };
  return nonBlockingSink;
}

// ../../node_modules/@logtape/file/dist/filesink.node.js
import fs from "node:fs";
import { join as join11 } from "node:path";
import { promisify } from "node:util";
var nodeDriver = {
  openSync(path) {
    return fs.openSync(path, "a");
  },
  writeSync: fs.writeSync,
  writeManySync(fd, chunks) {
    if (chunks.length === 0)
      return;
    if (chunks.length === 1) {
      fs.writeSync(fd, chunks[0]);
      return;
    }
    fs.writevSync(fd, chunks);
  },
  flushSync: fs.fsyncSync,
  closeSync: fs.closeSync,
  statSync: fs.statSync,
  renameSync: fs.renameSync
};
var nodeAsyncDriver = {
  ...nodeDriver,
  async writeMany(fd, chunks) {
    if (chunks.length === 0)
      return;
    if (chunks.length === 1) {
      await promisify(fs.write)(fd, chunks[0]);
      return;
    }
    await promisify(fs.writev)(fd, chunks);
  },
  flush: promisify(fs.fsync),
  close: promisify(fs.close)
};
var nodeTimeDriver = {
  ...nodeDriver,
  readdirSync: fs.readdirSync,
  unlinkSync: fs.unlinkSync,
  mkdirSync: fs.mkdirSync,
  joinPath: join11
};
var nodeAsyncTimeDriver = {
  ...nodeAsyncDriver,
  readdirSync: fs.readdirSync,
  unlinkSync: fs.unlinkSync,
  mkdirSync: fs.mkdirSync,
  joinPath: join11
};
function getFileSink(path, options = {}) {
  if (options.nonBlocking)
    return getBaseFileSink(path, {
      ...options,
      ...nodeAsyncDriver
    });
  return getBaseFileSink(path, {
    ...options,
    ...nodeDriver
  });
}

// src/logging.ts
var LOG_DIR = join12(homedir10(), ".rudel", "logs");
var LOG_FILE = join12(LOG_DIR, "hook-upload.log");
async function setupHookLogging() {
  const { mkdir: mkdir3 } = await import("node:fs/promises");
  await mkdir3(LOG_DIR, { recursive: true }).catch(() => {});
  await configure({
    sinks: {
      file: getFileSink(LOG_FILE)
    },
    loggers: [
      {
        category: ["rudel", "cli"],
        lowestLevel: "debug",
        sinks: ["file"]
      }
    ]
  });
}

// src/commands/hooks/claude/session-end.ts
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
  }
  return chunks.join("");
}
async function runSessionEnd() {
  await setupHookLogging();
  const logger = getLogger(["rudel", "cli", "hook"]);
  try {
    const raw = await readStdin();
    if (!raw.trim())
      return;
    const input = JSON.parse(raw);
    if (!input.session_id || !input.transcript_path)
      return;
    const credentials = loadCredentials();
    if (!credentials)
      return;
    logger.info("Uploading session {sessionId}", {
      sessionId: input.session_id
    });
    const sessionFile = {
      sessionId: input.session_id,
      transcriptPath: input.transcript_path,
      projectPath: input.cwd
    };
    const gitInfo = await getGitInfo(input.cwd);
    const organizationId = await getProjectOrgId(input.cwd);
    const request = await claudeCodeAdapter.buildUploadRequest(sessionFile, {
      gitInfo,
      organizationId
    });
    const apiBase = process.env.RUDEL_API_BASE ?? credentials.apiBaseUrl;
    const endpoint = `${apiBase}/rpc`;
    const result = await uploadSession(request, {
      endpoint,
      token: credentials.token,
      authType: credentials.authType,
      onRetry: (attempt, maxAttempts, error) => {
        logger.warn("Retrying upload for {sessionId} ({attempt}/{maxAttempts}): {error}", { sessionId: input.session_id, attempt, maxAttempts, error });
      }
    });
    if (result.success) {
      logger.info("Upload successful for session {sessionId} (attempts: {attempts})", { sessionId: input.session_id, attempts: result.attempts });
      await removeFailedUpload(input.session_id);
    } else {
      logger.error("Upload failed for session {sessionId}: {error}", {
        sessionId: input.session_id,
        error: result.error
      });
      await recordFailedUpload({
        sessionId: input.session_id,
        transcriptPath: input.transcript_path,
        projectPath: input.cwd,
        source: claudeCodeAdapter.source,
        organizationId,
        error: result.error ?? "Unknown error"
      });
    }
  } catch (error) {
    logger.error("Session end hook failed: {error}", { error });
  } finally {
    await dispose();
  }
}
var sessionEndCommand = buildCommand({
  loader: async () => ({ default: runSessionEnd }),
  parameters: {},
  docs: {
    brief: "Handle Claude Code SessionEnd hook"
  }
});

// src/commands/hooks/claude/index.ts
var claudeRouteMap = buildRouteMap({
  routes: {
    "session-end": sessionEndCommand
  },
  docs: {
    brief: "Claude Code hook handlers"
  }
});

// src/commands/hooks/codex/turn-complete.ts
async function readStdin2() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
  }
  return chunks.join("");
}
async function runTurnComplete() {
  try {
    const raw = await readStdin2();
    if (!raw.trim())
      return;
    const input = JSON.parse(raw);
    if (!input.thread_id || !input.cwd)
      return;
    const credentials = loadCredentials();
    if (!credentials)
      return;
    const transcriptPath = input.transcript_path ?? await findActiveRolloutFile(input.thread_id);
    if (!transcriptPath)
      return;
    const sessionFile = {
      sessionId: input.thread_id,
      transcriptPath,
      projectPath: input.cwd
    };
    const gitInfo = await getGitInfo(input.cwd);
    const organizationId = await getProjectOrgId(input.cwd);
    const request = await codexAdapter.buildUploadRequest(sessionFile, {
      gitInfo,
      organizationId
    });
    const apiBase = process.env.RUDEL_API_BASE ?? credentials.apiBaseUrl;
    const endpoint = `${apiBase}/rpc`;
    const result = await uploadSession(request, {
      endpoint,
      token: credentials.token,
      authType: credentials.authType
    });
    if (result.success) {
      await removeFailedUpload(input.thread_id);
    } else {
      await recordFailedUpload({
        sessionId: input.thread_id,
        transcriptPath,
        projectPath: input.cwd,
        source: codexAdapter.source,
        organizationId,
        error: result.error ?? "Unknown error"
      });
    }
  } catch {}
}
var turnCompleteCommand = buildCommand({
  loader: async () => ({ default: runTurnComplete }),
  parameters: {},
  docs: {
    brief: "Handle Codex agent-turn-complete hook"
  }
});

// src/commands/hooks/codex/index.ts
var codexRouteMap = buildRouteMap({
  routes: {
    "turn-complete": turnCompleteCommand
  },
  docs: {
    brief: "Codex hook handlers"
  }
});

// src/commands/hooks/index.ts
var hooksRouteMap = buildRouteMap({
  routes: {
    claude: claudeRouteMap,
    codex: codexRouteMap
  },
  docs: {
    brief: "Hook handlers"
  }
});

// src/commands/login.ts
import { spawn } from "node:child_process";
var DEFAULT_API_BASE = "https://app.rudel.ai";
var DEFAULT_WEB_URL = "https://app.rudel.ai";
var DEVICE_CLIENT_ID = "rudel-cli";
var POLL_SAFETY_TIMEOUT_MS = 120000;
async function sleep(ms) {
  await new Promise((resolve2) => setTimeout(resolve2, ms));
}
function openUrl(url) {
  if (process.platform === "win32") {
    const child2 = spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore"
    });
    child2.unref();
    return;
  }
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(opener, [url], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}
async function requestDeviceCode(apiBase) {
  const response = await fetch(`${apiBase}/api/auth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: DEVICE_CLIENT_ID,
      scope: "ingest:write"
    })
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || !("device_code" in body)) {
    throw new Error(body && "error_description" in body && body.error_description || body && "message" in body && body.message || `Failed to start device authorization (${response.status})`);
  }
  return body;
}
async function pollForAccessToken(apiBase, device) {
  const hardDeadline = Date.now() + POLL_SAFETY_TIMEOUT_MS;
  const deviceDeadline = Date.now() + device.expires_in * 1000;
  const deadline = Math.min(hardDeadline, deviceDeadline);
  let intervalMs = Math.max(1000, device.interval * 1000);
  while (Date.now() < deadline) {
    const response = await fetch(`${apiBase}/api/auth/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: device.device_code,
        client_id: DEVICE_CLIENT_ID
      })
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body && "access_token" in body) {
      return body.access_token;
    }
    const errorCode = body && "error" in body && typeof body.error === "string" ? body.error : "";
    const errorDescription = body && "error_description" in body && typeof body.error_description === "string" ? body.error_description : "Device authorization failed";
    if (errorCode === "authorization_pending") {
      await sleep(intervalMs);
      continue;
    }
    if (errorCode === "slow_down") {
      intervalMs += 1000;
      await sleep(intervalMs);
      continue;
    }
    throw new Error(errorDescription);
  }
  throw new Error("Device authorization timed out");
}
async function createIngestApiKey(apiBase, accessToken) {
  const response = await fetch(`${apiBase}/api/auth/api-key/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      name: "rudel-cli-ingest",
      expiresIn: null
    })
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || !("key" in body) || !("id" in body)) {
    throw new Error(body && "error_description" in body && body.error_description || body && "message" in body && body.message || `Failed to create CLI API key (${response.status})`);
  }
  return body;
}
async function runLogin(flags) {
  Wt2("rudel login");
  const existing = loadCredentials();
  if (existing) {
    R2.warn("Already logged in.");
    Gt("Run `rudel logout` first to switch accounts.");
    return;
  }
  let deviceCode;
  try {
    deviceCode = await requestDeviceCode(flags.apiBase);
  } catch (error) {
    R2.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const verifyUrl = deviceCode.verification_uri_complete ?? `${deviceCode.verification_uri}?user_code=${encodeURIComponent(deviceCode.user_code)}`;
  R2.info(`If the browser doesn't open, visit:
${verifyUrl}`);
  R2.info(`User code: ${deviceCode.user_code}`);
  if (!flags.noBrowser) {
    openUrl(verifyUrl);
  }
  const spin = be();
  spin.start("Waiting for browser authentication...");
  let accessToken;
  try {
    accessToken = await pollForAccessToken(flags.apiBase, deviceCode);
  } catch (error) {
    spin.stop("Authentication failed");
    R2.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  spin.message("Creating ingest token...");
  let ingestKey;
  try {
    ingestKey = await createIngestApiKey(flags.apiBase, accessToken);
  } catch (error) {
    spin.stop("Authentication failed");
    R2.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const client = createApiClient({
    apiBaseUrl: flags.apiBase,
    token: accessToken,
    authType: "bearer"
  });
  let user;
  let organizations;
  try {
    const [me2, orgs] = await Promise.all([
      client.me(),
      client.listMyOrganizations()
    ]);
    user = { id: me2.id, email: me2.email, name: me2.name };
    organizations = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug
    }));
  } catch {
    spin.stop("Authentication failed");
    R2.error("Login failed: unable to fetch account details");
    process.exitCode = 1;
    return;
  }
  saveCredentials({
    token: ingestKey.key,
    apiBaseUrl: flags.apiBase,
    authType: "api-key",
    apiKeyId: ingestKey.id,
    user,
    organizations
  });
  spin.stop("Authenticated");
  R2.success(`Logged in as ${user.name} (${user.email})`);
  Gt("Done!");
}
var loginCommand = buildCommand({
  loader: async () => ({ default: runLogin }),
  parameters: {
    flags: {
      apiBase: {
        kind: "parsed",
        parse: String,
        brief: "API server base URL",
        default: DEFAULT_API_BASE
      },
      webUrl: {
        kind: "parsed",
        parse: String,
        brief: "Web app URL for authentication",
        default: DEFAULT_WEB_URL
      },
      noBrowser: {
        kind: "boolean",
        brief: "Skip opening the browser automatically",
        default: false
      }
    }
  },
  docs: {
    brief: "Authenticate with the Rudel API via browser login"
  }
});

// src/commands/logout.ts
async function runLogout() {
  const credentials = loadCredentials();
  if (!credentials) {
    R2.info("Not logged in.");
    return;
  }
  if (credentials.authType === "api-key") {
    try {
      const client = createApiClient(credentials);
      await client.cli.revokeToken();
    } catch {
      R2.warn("Failed to revoke token on server. Local credentials were cleared.");
    }
  }
  clearCredentials();
  R2.success("Logged out successfully.");
}
var logoutCommand = buildCommand({
  loader: async () => ({ default: runLogout }),
  parameters: {},
  docs: {
    brief: "Log out and remove stored credentials"
  }
});

// src/commands/set-org.ts
async function runSetOrg() {
  Wt2("rudel set-org");
  const credentials = loadCredentials();
  if (!credentials) {
    R2.error("Not authenticated.");
    Gt("Run `rudel login` first.");
    process.exitCode = 1;
    return;
  }
  let orgs;
  if (credentials.authType === "api-key") {
    orgs = credentials.organizations ?? [];
  } else {
    const client = createApiClient(credentials);
    try {
      orgs = await client.listMyOrganizations();
    } catch {
      R2.error("Failed to fetch organizations. Check your connection.");
      process.exitCode = 1;
      return;
    }
  }
  if (orgs.length === 0) {
    R2.error("No organizations found.");
    Gt("Create one at app.rudel.ai first.");
    process.exitCode = 1;
    return;
  }
  const cwd = process.cwd();
  const currentOrgId = await getProjectOrgId(cwd);
  const selected = await Jt({
    message: "Select an organization for this repository",
    options: orgs.map((org) => ({
      value: org.id,
      label: org.name,
      hint: org.id === currentOrgId ? `${org.slug} (current)` : org.slug
    })),
    initialValue: currentOrgId ?? undefined
  });
  if (Ct(selected)) {
    Nt("Cancelled.");
    return;
  }
  await setProjectOrgId(cwd, selected);
  const selectedOrg = orgs.find((o) => o.id === selected);
  R2.success(`Organization set to: ${selectedOrg?.name}`);
  Gt("Done!");
}
var setOrgCommand = buildCommand({
  loader: async () => ({ default: runSetOrg }),
  parameters: {},
  docs: {
    brief: "Set the organization for the current repository"
  }
});

// src/lib/classifier.ts
import { spawn as spawn2 } from "node:child_process";

// src/lib/types.ts
var SESSION_TAGS = [
  "research",
  "new_feature",
  "bug_fix",
  "refactoring",
  "documentation",
  "tests",
  "other"
];
var DEFAULT_ENDPOINT = "https://app.rudel.ai/rpc";

// src/lib/classifier.ts
var SYSTEM_PROMPT = `You are a session classifier. Analyze the Claude Code session transcript and classify it into exactly ONE of these categories:

- research: Exploring codebase, understanding code, answering questions about how things work
- new_feature: Implementing new functionality or features
- bug_fix: Fixing bugs, errors, or unexpected behavior
- refactoring: Restructuring existing code without changing functionality
- documentation: Writing or updating documentation, comments, READMEs
- tests: Writing, updating, or fixing tests

CRITICAL: Respond with ONLY the tag name. Nothing else. No explanation, no punctuation, no formatting. Just ONE of: research, new_feature, bug_fix, refactoring, documentation, tests`;
async function classifySession(content) {
  const truncatedContent = content.slice(0, 50000);
  const prompt = `Classify this session transcript:

${truncatedContent}`;
  try {
    const result = await execWithStdin("claude", [
      "--output-format",
      "text",
      "--print",
      "--model",
      "haiku",
      "--no-session-persistence",
      "--system-prompt",
      SYSTEM_PROMPT
    ], prompt);
    if (result.exitCode !== 0) {
      return "other";
    }
    const output = result.stdout.trim().toLowerCase();
    if (SESSION_TAGS.includes(output)) {
      return output;
    }
    for (const tag of SESSION_TAGS) {
      if (new RegExp(`\\b${tag}\\b`).test(output)) {
        return tag;
      }
    }
    return "other";
  } catch {
    return;
  }
}
function execWithStdin(cmd, args, stdin) {
  return new Promise((resolve2) => {
    const child = spawn2(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      resolve2({ exitCode: code ?? 1, stdout, stderr });
    });
    child.on("error", () => {
      resolve2({ exitCode: 1, stdout, stderr });
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });
}

// src/lib/session-resolver.ts
import { access, readdir as readdir3 } from "node:fs/promises";
import { homedir as homedir11 } from "node:os";
import { basename, dirname as dirname5, join as join13 } from "node:path";
var SESSIONS_BASE_DIR3 = join13(homedir11(), ".claude", "projects");
async function resolveSession(input) {
  const isPath = input.includes("/") || input.endsWith(".jsonl");
  if (isPath) {
    return resolveFromPath(input);
  }
  return resolveFromId(input);
}
async function resolveFromPath(filePath) {
  const filename = basename(filePath);
  validateNotSubagent(filename);
  try {
    await access(filePath);
  } catch {
    throw new Error(`Session file not found: ${filePath}`);
  }
  const sessionId = filename.replace(/\.jsonl$/, "");
  const sessionDir = dirname5(filePath);
  const parentDir = basename(sessionDir);
  const projectPath = await decodeProjectPath(parentDir);
  return { transcriptPath: filePath, projectPath, sessionDir, sessionId };
}
async function resolveFromId(sessionId) {
  validateNotSubagent(`${sessionId}.jsonl`);
  const sessionFileName = `${sessionId}.jsonl`;
  let projectDirs;
  try {
    projectDirs = await readdir3(SESSIONS_BASE_DIR3);
  } catch {
    throw new Error(`Session not found: ${sessionId}`);
  }
  for (const projectDir of projectDirs) {
    const sessionDir = join13(SESSIONS_BASE_DIR3, projectDir);
    try {
      const files = await readdir3(sessionDir);
      if (files.includes(sessionFileName)) {
        const transcriptPath = join13(sessionDir, sessionFileName);
        const projectPath = await decodeProjectPath(projectDir);
        return {
          transcriptPath,
          projectPath,
          sessionDir,
          sessionId
        };
      }
    } catch {}
  }
  throw new Error(`Session not found: ${sessionId}`);
}
function validateNotSubagent(filename) {
  if (filename.startsWith("agent-") && filename.endsWith(".jsonl")) {
    throw new Error("This is a subagent file, not a main session. Please provide the main session ID or path.");
  }
}

// src/commands/upload.ts
async function runInteractiveUpload(flags) {
  const credentials = loadCredentials();
  if (!credentials && !flags.dryRun) {
    R2.error("Not authenticated. Run `rudel login` first.");
    process.exitCode = 1;
    return;
  }
  Wt2("rudel upload");
  const spin = be();
  spin.start("Scanning projects...");
  const { projects: allProjects, groups } = await scanAndGroupProjects();
  spin.stop(`Found ${allProjects.length} project(s)`);
  if (allProjects.length === 0) {
    R2.warn("No projects with sessions found.");
    Gt("Nothing to upload.");
    return;
  }
  const options = [];
  const preSelected = [];
  for (const group2 of groups) {
    for (const proj of group2.projects) {
      options.push({
        value: proj,
        label: `[${getAdapterName(proj.source)}] ${proj.displayPath}`,
        hint: sessionCountHint(proj.sessionCount)
      });
      if (group2.containsCwd) {
        preSelected.push(proj);
      }
    }
  }
  const selected = await Lt2({
    message: "Select projects to upload",
    options,
    initialValues: preSelected,
    required: true
  });
  if (Ct(selected)) {
    Nt("Upload cancelled.");
    return;
  }
  const totalSessions = selected.reduce((sum, proj) => sum + proj.sessionCount, 0);
  R2.info(`Uploading ${totalSessions} session(s) from ${selected.length} project(s)`);
  const uploadConfig = {
    endpoint: flags.endpoint,
    token: credentials?.token ?? "",
    authType: credentials?.authType
  };
  const work = [];
  for (const project of selected) {
    const adapter = getAdapter(project.source);
    const gitInfo = await getGitInfo(project.projectPath);
    const organizationId = flags.org ?? await getProjectOrgId(project.projectPath);
    for (const session of project.sessions) {
      work.push({ session, project, adapter, gitInfo, organizationId });
    }
  }
  const items = work.map((w) => ({
    sessionId: w.session.sessionId,
    label: `${w.project.displayPath}/${w.session.sessionId}`,
    transcriptPath: w.session.transcriptPath,
    projectPath: w.session.projectPath,
    source: w.project.source,
    organizationId: w.organizationId,
    session: w.session,
    adapter: w.adapter,
    gitInfo: w.gitInfo
  }));
  const summary = await runBatchUpload({
    items,
    label: "Uploading sessions...",
    concurrency: flags.concurrency,
    upload: async (item, onRetry) => {
      const request = await item.adapter.buildUploadRequest(item.session, {
        tag: flags.tag,
        gitInfo: item.gitInfo,
        organizationId: item.organizationId
      });
      if (!flags.tag && flags.classify) {
        const classified = await classifySession(request.content);
        if (classified) {
          request.tag = classified;
        }
      }
      if (flags.dryRun) {
        return { success: true };
      }
      return uploadSession(request, { ...uploadConfig, onRetry });
    }
  });
  renderBatchSummary(summary, { showRetryHint: summary.failed > 0 });
  if (flags.dryRun) {
    Gt("Dry run complete — no sessions were uploaded.");
  } else {
    Gt("Done!");
  }
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}
function getAdapterName(source) {
  return getAdapter(source).name;
}
function sessionCountHint(count) {
  return `${count} session${count !== 1 ? "s" : ""}`;
}
async function runSingleUpload(flags, session) {
  const write = (msg) => {
    process.stdout.write(`${msg}
`);
  };
  const writeError = (msg) => {
    process.stderr.write(`${msg}
`);
  };
  const credentials = loadCredentials();
  if (!credentials && !flags.dryRun) {
    writeError("Error: Not authenticated. Run `rudel login` first.");
    process.exitCode = 1;
    return;
  }
  write(`Resolving session: ${session}`);
  let sessionInfo;
  try {
    sessionInfo = await resolveSession(session);
  } catch (error) {
    writeError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }
  write(`Found session at: ${sessionInfo.transcriptPath}`);
  const gitInfo = await getGitInfo(sessionInfo.projectPath);
  const displayName = gitInfo.gitRemote || gitInfo.packageName || sessionInfo.projectPath.split("/").pop();
  if (displayName)
    write(`Repository: ${displayName}`);
  if (gitInfo.branch)
    write(`Branch: ${gitInfo.branch}`);
  const organizationId = flags.org ?? await getProjectOrgId(sessionInfo.projectPath);
  if (organizationId)
    write(`Organization: ${organizationId}`);
  write("Building upload request...");
  const sessionFile = {
    sessionId: sessionInfo.sessionId,
    transcriptPath: sessionInfo.transcriptPath,
    projectPath: sessionInfo.projectPath
  };
  const request = await claudeCodeAdapter.buildUploadRequest(sessionFile, {
    tag: flags.tag,
    gitInfo,
    organizationId
  });
  write(`Transcript: ${request.content.length} bytes`);
  if (request.subagents && request.subagents.length > 0) {
    write(`Subagents: ${request.subagents.length} file(s)`);
  }
  if (!flags.tag && flags.classify) {
    write("Classifying session...");
    const classified = await classifySession(request.content);
    if (classified) {
      request.tag = classified;
      write(`Classified as: ${classified}`);
    }
  }
  if (flags.dryRun) {
    const preview = {
      ...request,
      content: `[${request.content.length} bytes]`,
      subagents: request.subagents?.map((s) => ({
        ...s,
        content: `[${s.content.length} bytes]`
      }))
    };
    write("Dry run - would upload:");
    write(JSON.stringify(preview, null, 2));
    return;
  }
  write("Uploading...");
  const result = await uploadSession(request, {
    endpoint: flags.endpoint,
    token: credentials.token,
    authType: credentials?.authType
  });
  if (result.success) {
    write("Upload successful!");
  } else {
    writeError(`Upload failed: ${result.error}`);
    process.exitCode = 1;
  }
}
async function runRetryUpload(flags) {
  const credentials = loadCredentials();
  if (!credentials) {
    R2.error("Not authenticated. Run `rudel login` first.");
    process.exitCode = 1;
    return;
  }
  Wt2("rudel upload --retry");
  const failures = await loadFailedUploads();
  if (failures.length === 0) {
    Gt("No failed uploads to retry.");
    return;
  }
  R2.info(`Found ${failures.length} failed upload(s):`);
  for (const f of failures.slice(0, 10)) {
    R2.warn(`  ${f.sessionId}: ${f.error} (${f.failedAt})`);
  }
  if (failures.length > 10) {
    R2.warn(`  ...and ${failures.length - 10} more`);
  }
  const shouldRetry = await Rt({
    message: `Retry all ${failures.length} failed upload(s)?`,
    initialValue: true
  });
  if (Ct(shouldRetry) || !shouldRetry) {
    Nt("Retry cancelled.");
    return;
  }
  const endpoint = flags.endpoint;
  const items = failures.map((f) => ({
    sessionId: f.sessionId,
    label: f.sessionId,
    transcriptPath: f.transcriptPath,
    projectPath: f.projectPath,
    source: f.source,
    organizationId: f.organizationId,
    failure: f
  }));
  const summary = await runBatchUpload({
    items,
    label: "Retrying uploads...",
    concurrency: flags.concurrency,
    upload: async (item, onRetry) => {
      const adapter = item.failure.source ? getAdapter(item.failure.source) : claudeCodeAdapter;
      const sessionFile = {
        sessionId: item.failure.sessionId,
        transcriptPath: item.failure.transcriptPath,
        projectPath: item.failure.projectPath
      };
      const gitInfo = await getGitInfo(item.failure.projectPath);
      const organizationId = flags.org ?? item.failure.organizationId ?? await getProjectOrgId(item.failure.projectPath);
      const request = await adapter.buildUploadRequest(sessionFile, {
        tag: flags.tag,
        gitInfo,
        organizationId
      });
      return uploadSession(request, {
        endpoint,
        token: credentials.token,
        authType: credentials.authType,
        onRetry
      });
    }
  });
  renderBatchSummary(summary);
  Gt("Done!");
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}
async function runUpload(flags, ...sessions) {
  if (flags.retry) {
    return runRetryUpload(flags);
  }
  if (sessions.length === 0) {
    return runInteractiveUpload(flags);
  }
  return runSingleUpload(flags, sessions[0]);
}
var uploadCommand = buildCommand({
  loader: async () => ({ default: runUpload }),
  parameters: {
    positional: {
      kind: "array",
      parameter: {
        brief: "Session ID or path to a session .jsonl file",
        parse: String,
        placeholder: "session"
      }
    },
    flags: {
      tag: {
        kind: "enum",
        values: [...SESSION_TAGS],
        brief: "Session tag/category",
        optional: true
      },
      endpoint: {
        kind: "parsed",
        parse: String,
        brief: "Override the upload endpoint URL",
        default: DEFAULT_ENDPOINT
      },
      classify: {
        kind: "boolean",
        brief: "Auto-classify session tag using Claude CLI",
        default: false
      },
      dryRun: {
        kind: "boolean",
        brief: "Preview what would be uploaded without sending",
        default: false
      },
      org: {
        kind: "parsed",
        parse: String,
        brief: "Override the organization ID to upload to",
        optional: true
      },
      retry: {
        kind: "boolean",
        brief: "Retry previously failed uploads",
        default: false
      },
      concurrency: {
        kind: "parsed",
        parse: Number,
        brief: "Max concurrent uploads",
        default: "5"
      }
    },
    aliases: {
      t: "tag",
      c: "classify",
      n: "dryRun",
      o: "org",
      r: "retry",
      j: "concurrency"
    }
  },
  docs: {
    brief: "Upload session transcripts (Claude Code & Codex). No args = interactive project picker."
  }
});

// src/commands/whoami.ts
async function runWhoami() {
  const result = await verifyAuth();
  if (!result.authenticated) {
    if (result.reason === "no_credentials") {
      R2.info("Not logged in. Run `rudel login` to authenticate.");
    } else {
      R2.error(result.message);
      process.exitCode = 1;
    }
    return;
  }
  R2.info(`Logged in as ${result.user.name} (${result.user.email})`);
}
var whoamiCommand = buildCommand({
  loader: async () => ({ default: runWhoami }),
  parameters: {},
  docs: {
    brief: "Show the currently authenticated user"
  }
});

// src/app.ts
var routes = buildRouteMap({
  routes: {
    login: loginCommand,
    logout: logoutCommand,
    whoami: whoamiCommand,
    upload: uploadCommand,
    enable: enableCommand,
    disable: disableCommand,
    "set-org": setOrgCommand,
    hooks: hooksRouteMap,
    dev: devRouteMap
  },
  docs: {
    brief: "CLI tools for managing Claude Code sessions",
    hideRoute: { hooks: true, dev: true }
  }
});
var app = buildApplication(routes, {
  name: "rudel",
  versionInfo: {
    currentVersion: package_default.version
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel"
  }
});

// src/bin/cli.ts
await run(app, process.argv.slice(2), { process });
