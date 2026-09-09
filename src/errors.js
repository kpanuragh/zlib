'use strict';

// Reproductions of the Node.js core errors that zlib throws, with matching
// `code`, prototype and message text. Only the ones zlib actually raises are
// here; this is not a general port of internal/errors.

// Formats a value the way Node's error messages do, e.g. `type number (12)`,
// `an instance of Object`, `null`.
function determineSpecificType(value) {
  if (value == null) return '' + value;

  var type = typeof value;
  if (type === 'function' && value.name) {
    return 'function ' + value.name;
  }
  if (type === 'object') {
    if (value.constructor && value.constructor.name) {
      return 'an instance of ' + value.constructor.name;
    }
    return 'an instance of Object';
  }
  if (type === 'string' || type === 'symbol' || type === 'bigint') {
    var inspected = type === 'string' ? "'" + value + "'" : String(value);
    return 'type ' + type + ' (' + inspected + ')';
  }
  return 'type ' + type + ' (' + value + ')';
}

function makeError(Base, code, message) {
  var err = new Base(message);
  Object.defineProperty(err, 'code', {
    value: code,
    enumerable: false,
    writable: true,
    configurable: true
  });
  return err;
}

// The "buffer" argument must be of type string or an instance of Buffer,
// TypedArray, DataView, or ArrayBuffer. Received type number (12)
exports.invalidArgType = function (name, expected, actual) {
  return makeError(TypeError, 'ERR_INVALID_ARG_TYPE',
    'The "' + name + '" argument must be ' + expected +
    '. Received ' + determineSpecificType(actual));
};

// The "options.level" property must be of type number. Received type string ('a')
exports.invalidPropType = function (name, expected, actual) {
  return makeError(TypeError, 'ERR_INVALID_ARG_TYPE',
    'The "' + name + '" property must be ' + expected +
    '. Received ' + determineSpecificType(actual));
};

// The value of "options.level" is out of range. It must be >= -1 and <= 9. Received 12
exports.outOfRange = function (name, range, actual) {
  return makeError(RangeError, 'ERR_OUT_OF_RANGE',
    'The value of "' + name + '" is out of range. It must be ' + range +
    '. Received ' + actual);
};

exports.bufferTooLarge = function (max) {
  return makeError(RangeError, 'ERR_BUFFER_TOO_LARGE',
    'Cannot create a Buffer larger than ' + max + ' bytes');
};

exports.initializationFailed = function (message) {
  return makeError(Error, 'ERR_ZLIB_INITIALIZATION_FAILED',
    message || 'Initialization failed');
};

exports.brotliInvalidParam = function (param) {
  return makeError(RangeError, 'ERR_BROTLI_INVALID_PARAM',
    param + ' is not a valid Brotli parameter');
};

exports.zstdInvalidParam = function (param) {
  return makeError(RangeError, 'ERR_ZSTD_INVALID_PARAM',
    param + ' is not a valid zstd parameter');
};

exports.methodNotImplemented = function (name) {
  return makeError(Error, 'ERR_METHOD_NOT_IMPLEMENTED',
    'The ' + name + ' method is not implemented');
};

// Used where this package cannot reach parity at all, rather than where it
// simply has not yet. The message says why, so callers are not left guessing.
exports.notImplemented = function (message) {
  return makeError(Error, 'ERR_METHOD_NOT_IMPLEMENTED', message);
};

// Shared expectation strings, kept here so the wording stays identical
// everywhere it is used.
exports.BUFFER_ARG = 'of type string or an instance of Buffer, TypedArray, DataView, or ArrayBuffer';
exports.BUFFER_PROP = 'an instance of Buffer, TypedArray, DataView, or ArrayBuffer';

exports.determineSpecificType = determineSpecificType;
