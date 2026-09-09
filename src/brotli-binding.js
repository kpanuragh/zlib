'use strict';

// The `brotli` package ships an emscripten build of the reference C encoder
// and decoder. We bind to the encoder module directly rather than through its
// compress.js wrapper: that wrapper allocates length+1024 bytes of output but
// then tells the encoder the capacity is only `length`, so it reports failure
// for any input that does not compress smaller than itself - which is every
// short string.
var encoder = require('brotli/build/encode');
var brotliDecompress = require('brotli/decompress');

var constants = require('./constants');
var errors = require('./errors');

var VALID_ENCODER_PARAMS = [
  constants.BROTLI_PARAM_MODE,
  constants.BROTLI_PARAM_QUALITY,
  constants.BROTLI_PARAM_LGWIN,
  constants.BROTLI_PARAM_LGBLOCK,
  constants.BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING,
  constants.BROTLI_PARAM_SIZE_HINT,
  constants.BROTLI_PARAM_LARGE_WINDOW,
  constants.BROTLI_PARAM_NPOSTFIX,
  constants.BROTLI_PARAM_NDIRECT
];

var VALID_DECODER_PARAMS = [
  constants.BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION,
  constants.BROTLI_DECODER_PARAM_LARGE_WINDOW
];

function validateParams(params, valid, kind) {
  if (params == null) return;
  Object.keys(params).forEach(function (key) {
    var id = Number(key);
    if (valid.indexOf(id) === -1) {
      throw kind === 'brotli' ? errors.brotliInvalidParam(key) : errors.zstdInvalidParam(key);
    }
  });
}

// One-shot compression against the emscripten encoder, with the output
// capacity it was actually given.
function encode(input, quality, lgwin, mode) {
  var inPtr = encoder._malloc(input.length);
  encoder.HEAPU8.set(input, inPtr);

  var capacity = input.length + 1024;
  var outPtr = encoder._malloc(capacity);

  try {
    var size = encoder._encode(quality, lgwin, mode, input.length, inPtr, capacity, outPtr);
    if (size === -1) return null;

    var out = Buffer.allocUnsafe(size);
    out.set(encoder.HEAPU8.subarray(outPtr, outPtr + size));
    return out;
  } finally {
    encoder._free(inPtr);
    encoder._free(outPtr);
  }
}

// Shared machinery for both directions. The output of a one-shot codec is
// held here and handed to the caller across as many writeSync calls as it
// takes, reporting avail_out honestly each time so the write loop terminates.
function BrotliBinding(mode) {
  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.err = 0;

  this.inputChunks = [];
  this.inputLength = 0;
  this.pending = null;
  this.pendingOffset = 0;
  this.finished = false;
}

BrotliBinding.prototype.close = function () {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  this.pending_close = false;
  this.mode = constants.NONE;
  this.inputChunks = [];
  this.inputLength = 0;
  this.pending = null;
};

BrotliBinding.prototype.reset = function () {
  this.inputChunks = [];
  this.inputLength = 0;
  this.pending = null;
  this.pendingOffset = 0;
  this.finished = false;
  this.err = 0;
};

BrotliBinding.prototype._error = function (message, errno) {
  this.err = errno;
  this.write_in_progress = false;
  if (this.onerror) {
    this.onerror(message, errno);
  } else {
    throw new Error(message);
  }
};

// Copy as much of the pending output as fits. Returns the binding contract's
// [avail_in, avail_out]; avail_out === 0 means "call me again, there is more".
BrotliBinding.prototype._drain = function (out, out_off, out_len) {
  if (this.pending === null) {
    return [0, out_len];
  }

  var remaining = this.pending.length - this.pendingOffset;
  var n = Math.min(remaining, out_len);
  this.pending.copy(out, out_off, this.pendingOffset, this.pendingOffset + n);
  this.pendingOffset += n;

  if (this.pendingOffset >= this.pending.length) {
    this.pending = null;
    this.pendingOffset = 0;
  }

  return [0, out_len - n];
};

BrotliBinding.prototype.writeSync = function (flush, input, in_off, in_len, out, out_off, out_len) {
  if (!this.init_done) {
    throw new Error('write before init');
  }

  if (input && in_len > 0) {
    this.inputChunks.push(input.slice(in_off, in_off + in_len));
    this.inputLength += in_len;
  }

  // The emscripten build exposes only one-shot entry points, so everything is
  // produced at FINISH. Earlier operations just accumulate.
  if (flush === constants.BROTLI_OPERATION_FINISH && !this.finished) {
    this.finished = true;
    var combined = Buffer.concat(this.inputChunks, this.inputLength);
    this.inputChunks = [];
    this.inputLength = 0;

    var produced = this._codec(combined);
    if (produced === null) return [0, out_len];

    this.pending = produced;
    this.pendingOffset = 0;
  }

  return this._drain(out, out_off, out_len);
};

BrotliBinding.prototype.write = function (flush, input, in_off, in_len, out, out_off, out_len) {
  var self = this;
  this.write_in_progress = true;
  process.nextTick(function () {
    var result;
    try {
      result = self.writeSync(flush, input, in_off, in_len, out, out_off, out_len);
    } catch (err) {
      self.write_in_progress = false;
      if (self.onerror) {
        self.onerror(err.message, self.err || constants.Z_ERRNO);
        return;
      }
      throw err;
    }
    self.write_in_progress = false;
    if (result && self.callback) {
      self.callback(result[0], result[1]);
    }
    if (self.pending_close) self.close();
  });
  return this;
};

/**
 * Brotli encoder binding.
 */
function BrotliEncoder(mode) {
  if (mode !== constants.BROTLI_ENCODE) {
    throw new TypeError('Bad argument: expected BROTLI_ENCODE mode');
  }
  BrotliBinding.call(this, mode);

  this.params = {
    mode: constants.BROTLI_MODE_GENERIC,
    quality: constants.BROTLI_DEFAULT_QUALITY,
    lgwin: constants.BROTLI_DEFAULT_WINDOW
  };
}

BrotliEncoder.prototype = Object.create(BrotliBinding.prototype);
BrotliEncoder.prototype.constructor = BrotliEncoder;

BrotliEncoder.prototype.init = function (params) {
  validateParams(params, VALID_ENCODER_PARAMS, 'brotli');

  if (params) {
    if (params[constants.BROTLI_PARAM_MODE] !== undefined) {
      this.params.mode = params[constants.BROTLI_PARAM_MODE];
    }
    if (params[constants.BROTLI_PARAM_QUALITY] !== undefined) {
      this.params.quality = params[constants.BROTLI_PARAM_QUALITY];
    }
    if (params[constants.BROTLI_PARAM_LGWIN] !== undefined) {
      this.params.lgwin = params[constants.BROTLI_PARAM_LGWIN];
    }
  }
  this.init_done = true;
};

BrotliEncoder.prototype._codec = function (input) {
  var out;
  try {
    out = encode(input, this.params.quality, this.params.lgwin, this.params.mode);
  } catch (err) {
    this._error(err.message, constants.Z_ERRNO);
    return null;
  }

  if (out === null) {
    this._error('Brotli compression failed', constants.Z_ERRNO);
    return null;
  }
  return out;
};

/**
 * Brotli decoder binding.
 */
function BrotliDecoder(mode) {
  if (mode !== constants.BROTLI_DECODE) {
    throw new TypeError('Bad argument: expected BROTLI_DECODE mode');
  }
  BrotliBinding.call(this, mode);
}

BrotliDecoder.prototype = Object.create(BrotliBinding.prototype);
BrotliDecoder.prototype.constructor = BrotliDecoder;

BrotliDecoder.prototype.init = function (params) {
  validateParams(params, VALID_DECODER_PARAMS, 'brotli');
  this.init_done = true;
};

BrotliDecoder.prototype._codec = function (input) {
  var out;
  try {
    out = brotliDecompress(input);
  } catch (err) {
    this._error(err.message, constants.Z_DATA_ERROR);
    return null;
  }

  if (!out) {
    this._error('Brotli decompression failed', constants.Z_DATA_ERROR);
    return null;
  }
  return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
};

exports.BrotliEncoder = BrotliEncoder;
exports.BrotliDecoder = BrotliDecoder;
