'use strict';

var fzstd = require('fzstd');
var zstdEncode = require('zstd-js');

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

/**
 * Zstd encoder binding, backed by zstd-js.
 *
 * zstd-js compresses a whole buffer at a time, so input accumulates here and
 * the frame is produced at ZSTD_e_end, then handed out across as many
 * writeSync calls as the output buffer takes - the same shape as the Brotli
 * encoder above.
 */
function ZstdEncoder(mode) {
  if (mode !== constants.ZSTD_COMPRESS) {
    throw new TypeError('Bad argument: expected ZSTD_COMPRESS mode');
  }

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
  this.params = {};
}

ZstdEncoder.prototype.init = function (params) {
  if (params != null) {
    var self = this;
    Object.keys(params).forEach(function (key) {
      var id = Number(key);
      // Only the compression level is honoured; the rest are accepted so
      // callers written against Node do not fail here.
      if (id === constants.ZSTD_c_compressionLevel) {
        self.params.level = params[key];
      }
    });
  }
  this.init_done = true;
};

ZstdEncoder.prototype.close = function () {
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

ZstdEncoder.prototype.reset = function () {
  this.inputChunks = [];
  this.inputLength = 0;
  this.pending = null;
  this.pendingOffset = 0;
  this.finished = false;
  this.err = 0;
};

ZstdEncoder.prototype._error = function (message, errno) {
  this.err = errno;
  this.write_in_progress = false;
  if (this.onerror) {
    this.onerror(message, errno);
  } else {
    throw new Error(message);
  }
};

// Hand out queued output. avail_out === 0 means there is more waiting.
ZstdEncoder.prototype._drain = function (out, out_off, out_len) {
  if (this.pending === null) return [0, out_len];

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

ZstdEncoder.prototype.writeSync = function (flush, input, in_off, in_len, out, out_off, out_len) {
  if (!this.init_done) {
    throw new Error('write before init');
  }

  if (input && in_len > 0) {
    this.inputChunks.push(input.slice(in_off, in_off + in_len));
    this.inputLength += in_len;
  }

  if (flush === constants.ZSTD_e_end && !this.finished) {
    this.finished = true;
    var combined = Buffer.concat(this.inputChunks, this.inputLength);
    this.inputChunks = [];
    this.inputLength = 0;

    try {
      this.pending = zstdEncode.compress(combined);
    } catch (err) {
      this._error(err.message, constants.Z_ERRNO);
      return [0, out_len];
    }
    this.pendingOffset = 0;
  }

  return this._drain(out, out_off, out_len);
};

ZstdEncoder.prototype.write = function (flush, input, in_off, in_len, out, out_off, out_len) {
  var self = this;
  this.write_in_progress = true;
  process.nextTick(function () {
    var result;
    try {
      result = self.writeSync(flush, input, in_off, in_len, out, out_off, out_len);
    } catch (err) {
      self.write_in_progress = false;
      if (self.onerror) return self.onerror(err.message, self.err || constants.Z_ERRNO);
      throw err;
    }
    self.write_in_progress = false;
    if (result && self.callback) self.callback(result[0], result[1]);
    if (self.pending_close) self.close();
  });
  return this;
};

exports.ZstdDecoder = ZstdDecoder;
exports.ZstdEncoder = ZstdEncoder;
