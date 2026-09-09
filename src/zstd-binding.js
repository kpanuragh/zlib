'use strict';

var fzstd = require('fzstd');

var constants = require('./constants');
var errors = require('./errors');

var VALID_DECODER_PARAMS = [constants.ZSTD_d_windowLogMax];

// Zstd decoder binding, backed by fzstd's incremental decoder. Unlike the
// Brotli binding this one is genuinely streaming: input is handed to fzstd as
// it arrives and output is queued as fzstd produces it.
function ZstdDecoder(mode) {
  if (mode !== constants.ZSTD_DECOMPRESS) {
    throw new TypeError('Bad argument: expected ZSTD_DECOMPRESS mode');
  }

  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.err = 0;

  this.pendingChunks = [];
  this.pendingOffset = 0;
  this.finished = false;
}

ZstdDecoder.prototype.init = function (params) {
  if (params != null) {
    Object.keys(params).forEach(function (key) {
      if (VALID_DECODER_PARAMS.indexOf(Number(key)) === -1) {
        throw errors.zstdInvalidParam(key);
      }
    });
  }
  this._createStream();
  this.init_done = true;
};

ZstdDecoder.prototype._createStream = function () {
  var self = this;
  this.stream = new fzstd.Decompress(function (chunk, final) {
    if (chunk && chunk.length) self.pendingChunks.push(chunk);
    if (final) self.finished = true;
  });
};

ZstdDecoder.prototype.reset = function () {
  this.pendingChunks = [];
  this.pendingOffset = 0;
  this.finished = false;
  this.err = 0;
  this._createStream();
};

ZstdDecoder.prototype.close = function () {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  this.pending_close = false;
  this.mode = constants.NONE;
  this.pendingChunks = [];
  this.stream = null;
};

ZstdDecoder.prototype._error = function (message, errno) {
  this.err = errno;
  this.write_in_progress = false;
  if (this.onerror) {
    this.onerror(message, errno);
  } else {
    throw new Error(message);
  }
};

// Hand out queued output, honouring the binding contract: avail_out === 0
// means there is more waiting.
ZstdDecoder.prototype._drain = function (out, out_off, out_len) {
  var written = 0;

  while (written < out_len && this.pendingChunks.length > 0) {
    var head = this.pendingChunks[0];
    var available = head.length - this.pendingOffset;
    var n = Math.min(available, out_len - written);

    out.set(head.subarray(this.pendingOffset, this.pendingOffset + n), out_off + written);
    written += n;
    this.pendingOffset += n;

    if (this.pendingOffset >= head.length) {
      this.pendingChunks.shift();
      this.pendingOffset = 0;
    }
  }

  return [0, out_len - written];
};

ZstdDecoder.prototype.writeSync = function (flush, input, in_off, in_len, out, out_off, out_len) {
  if (!this.init_done) {
    throw new Error('write before init');
  }

  var last = flush === constants.ZSTD_e_end;

  if ((input && in_len > 0) || last) {
    var chunk = input && in_len > 0
      ? new Uint8Array(input.buffer, input.byteOffset + in_off, in_len)
      : new Uint8Array(0);

    try {
      // fzstd rejects a second final push, so only send one.
      if (!this.pushedFinal) {
        this.stream.push(chunk, last);
        if (last) this.pushedFinal = true;
      }
    } catch (err) {
      this._error(err.message, constants.Z_DATA_ERROR);
      return [0, out_len];
    }
  }

  return this._drain(out, out_off, out_len);
};

ZstdDecoder.prototype.write = function (flush, input, in_off, in_len, out, out_off, out_len) {
  var self = this;
  this.write_in_progress = true;
  process.nextTick(function () {
    var result;
    try {
      result = self.writeSync(flush, input, in_off, in_len, out, out_off, out_len);
    } catch (err) {
      self.write_in_progress = false;
      if (self.onerror) return self.onerror(err.message, self.err || constants.Z_DATA_ERROR);
      throw err;
    }
    self.write_in_progress = false;
    if (result && self.callback) self.callback(result[0], result[1]);
    if (self.pending_close) self.close();
  });
  return this;
};

// There is no pure-JavaScript zstd encoder to bind to. Every WASM option
// needs asynchronous initialization, which cannot back a *Sync API, and does
// not run under Hermes - so compression fails loudly at construction rather
// than pretending to work.
function ZstdEncoder() {
  throw errors.notImplemented(
    'Zstd compression is not available in this package: there is no ' +
    'pure-JavaScript zstd encoder. Zstd decompression is supported.');
}

exports.ZstdDecoder = ZstdDecoder;
exports.ZstdEncoder = ZstdEncoder;
