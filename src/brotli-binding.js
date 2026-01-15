'use strict';

var brotli = require('brotli');
var binding = require('./binding');

/**
 * Brotli encoder binding - emulates Node.js native brotli binding
 */
function BrotliEncoder(mode) {
  if (mode !== binding.BROTLI_ENCODE) {
    throw new TypeError('Bad argument: expected BROTLI_ENCODE mode');
  }

  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.err = 0;

  // Brotli parameters with defaults
  this.params = {
    mode: binding.BROTLI_MODE_GENERIC,
    quality: binding.BROTLI_DEFAULT_QUALITY,
    lgwin: binding.BROTLI_DEFAULT_WINDOW,
    lgblock: 0
  };

  this.inputBuffer = [];
  this.outputBuffer = null;
}

BrotliEncoder.prototype.init = function(params) {
  if (params) {
    if (params[binding.BROTLI_PARAM_MODE] !== undefined) {
      this.params.mode = params[binding.BROTLI_PARAM_MODE];
    }
    if (params[binding.BROTLI_PARAM_QUALITY] !== undefined) {
      this.params.quality = params[binding.BROTLI_PARAM_QUALITY];
    }
    if (params[binding.BROTLI_PARAM_LGWIN] !== undefined) {
      this.params.lgwin = params[binding.BROTLI_PARAM_LGWIN];
    }
    if (params[binding.BROTLI_PARAM_LGBLOCK] !== undefined) {
      this.params.lgblock = params[binding.BROTLI_PARAM_LGBLOCK];
    }
  }
  this.init_done = true;
};

BrotliEncoder.prototype.close = function() {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  this.pending_close = false;
  this.mode = binding.NONE;
  this.inputBuffer = [];
  this.outputBuffer = null;
};

BrotliEncoder.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
  if (!this.init_done) {
    throw new Error('write before init');
  }

  // Accumulate input
  if (input && in_len > 0) {
    var chunk = input.slice(in_off, in_off + in_len);
    this.inputBuffer.push(chunk);
  }

  // On finish, compress all accumulated data
  if (flush === binding.BROTLI_OPERATION_FINISH) {
    var totalLength = 0;
    for (var i = 0; i < this.inputBuffer.length; i++) {
      totalLength += this.inputBuffer[i].length;
    }

    var combined = Buffer.concat(this.inputBuffer, totalLength);

    var compressed = brotli.compress(combined, {
      mode: this.params.mode,
      quality: this.params.quality,
      lgwin: this.params.lgwin
    });

    if (!compressed) {
      this.err = -1;
      return [0, out_len];
    }

    var compressedBuf = Buffer.from(compressed);
    var bytesToCopy = Math.min(compressedBuf.length, out_len);
    compressedBuf.copy(out, out_off, 0, bytesToCopy);

    this.inputBuffer = [];
    return [0, out_len - bytesToCopy];
  }

  // For non-finish operations, just accumulate
  return [0, out_len];
};

BrotliEncoder.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  var self = this;
  process.nextTick(function() {
    var result = self.writeSync(flush, input, in_off, in_len, out, out_off, out_len);
    if (self.callback) {
      self.callback(result[0], result[1]);
    }
  });
  return this;
};

/**
 * Brotli decoder binding - emulates Node.js native brotli binding
 */
function BrotliDecoder(mode) {
  if (mode !== binding.BROTLI_DECODE) {
    throw new TypeError('Bad argument: expected BROTLI_DECODE mode');
  }

  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.err = 0;

  this.params = {};
  this.inputBuffer = [];
  this.outputBuffer = null;
}

BrotliDecoder.prototype.init = function(params) {
  if (params) {
    this.params = params;
  }
  this.init_done = true;
};

BrotliDecoder.prototype.close = function() {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  this.pending_close = false;
  this.mode = binding.NONE;
  this.inputBuffer = [];
  this.outputBuffer = null;
};

BrotliDecoder.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
  if (!this.init_done) {
    throw new Error('write before init');
  }

  // Accumulate input
  if (input && in_len > 0) {
    var chunk = input.slice(in_off, in_off + in_len);
    this.inputBuffer.push(chunk);
  }

  // On finish, decompress all accumulated data
  if (flush === binding.BROTLI_OPERATION_FINISH) {
    var totalLength = 0;
    for (var i = 0; i < this.inputBuffer.length; i++) {
      totalLength += this.inputBuffer[i].length;
    }

    var combined = Buffer.concat(this.inputBuffer, totalLength);

    var decompressed = brotli.decompress(combined);

    if (!decompressed) {
      this.err = binding.BROTLI_DECODER_RESULT_ERROR;
      return [0, out_len];
    }

    var decompressedBuf = Buffer.from(decompressed);
    var bytesToCopy = Math.min(decompressedBuf.length, out_len);
    decompressedBuf.copy(out, out_off, 0, bytesToCopy);

    this.inputBuffer = [];
    this.err = binding.BROTLI_DECODER_RESULT_SUCCESS;
    return [0, out_len - bytesToCopy];
  }

  // For non-finish operations, just accumulate
  return [0, out_len];
};

BrotliDecoder.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  var self = this;
  process.nextTick(function() {
    var result = self.writeSync(flush, input, in_off, in_len, out, out_off, out_len);
    if (self.callback) {
      self.callback(result[0], result[1]);
    }
  });
  return this;
};

exports.BrotliEncoder = BrotliEncoder;
exports.BrotliDecoder = BrotliDecoder;
