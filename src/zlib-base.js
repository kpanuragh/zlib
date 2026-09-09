'use strict';

var Buffer = require('buffer').Buffer;
var kMaxLength = require('buffer').kMaxLength;
var Transform = require('stream').Transform;
var util = require('util');
var assert = require('assert').ok;

var constants = require('./constants');
var errors = require('./errors');

// The single Transform implementation behind every codec in this package.
// Subclasses supply a binding handle and their own flush constants; the write
// loop, the option validation, bytesWritten, maxOutputLength and the stream
// lifecycle all live here so there is exactly one copy of each.
//
// The binding contract, inherited from Node's C++ layer:
//
//   writeSync(flush, input, in_off, in_len, out, out_off, out_len)
//     -> [avail_in, avail_out]
//
// A binding MUST report avail_out honestly. Returning avail_out === 0 means
// "the output buffer filled up and I have more to give", and the loop will
// call again with a fresh buffer. A binding that has nothing left MUST return
// a non-zero avail_out, or the loop will not terminate.

function ZlibBase(opts, mode, handle, config) {
  var self = this;

  opts = opts || {};
  this._opts = opts;
  this._mode = mode;
  this._config = config;

  validateChunkSize(opts);
  validateFlushFlags(opts, config);
  var maxOutputLength = validateMaxOutputLength(opts);

  Transform.call(this, opts);

  this._chunkSize = opts.chunkSize || constants.Z_DEFAULT_CHUNK;
  this._maxOutputLength = maxOutputLength;
  this._flushFlag = opts.flush !== undefined ? opts.flush : config.defaultFlush;
  this._finishFlushFlag = opts.finishFlush !== undefined ? opts.finishFlush : config.finishFlush;

  this._handle = handle;
  this._hadError = false;
  this._handle.onerror = function (message, errno) {
    closeHandle(self);
    self._hadError = true;

    var error = new Error(message);
    error.errno = errno;
    error.code = constants.Z_ERRNO === errno ? 'Z_ERRNO' : codeFor(errno);
    self.emit('error', error);
  };

  this._buffer = Buffer.allocUnsafe(this._chunkSize);
  this._offset = 0;
  this.bytesWritten = 0;
}

util.inherits(ZlibBase, Transform);

Object.defineProperty(ZlibBase.prototype, '_closed', {
  configurable: true,
  enumerable: true,
  get: function () { return !this._handle; }
});

// Deprecated alias Node still carries; both count bytes fed to the engine.
Object.defineProperty(ZlibBase.prototype, 'bytesRead', {
  configurable: true,
  enumerable: false,
  get: function () { return this.bytesWritten; },
  set: function (value) { this.bytesWritten = value; }
});

// Reverse lookup of a zlib return code, used to tag stream errors the way
// Node does (err.code === 'Z_DATA_ERROR').
var codeNames = ['Z_OK', 'Z_STREAM_END', 'Z_NEED_DICT', 'Z_ERRNO', 'Z_STREAM_ERROR',
  'Z_DATA_ERROR', 'Z_MEM_ERROR', 'Z_BUF_ERROR', 'Z_VERSION_ERROR'];
function codeFor(errno) {
  for (var i = 0; i < codeNames.length; i++) {
    if (constants[codeNames[i]] === errno) return codeNames[i];
  }
  return undefined;
}

function validateChunkSize(opts) {
  if (opts.chunkSize === undefined) return;
  if (typeof opts.chunkSize !== 'number') {
    throw errors.invalidPropType('options.chunkSize', 'of type number', opts.chunkSize);
  }
  if (opts.chunkSize < constants.Z_MIN_CHUNK) {
    throw errors.outOfRange('options.chunkSize', '>= ' + constants.Z_MIN_CHUNK, opts.chunkSize);
  }
}

function validateFlushFlags(opts, config) {
  ['flush', 'finishFlush'].forEach(function (name) {
    var value = opts[name];
    if (value === undefined) return;
    if (typeof value !== 'number') {
      throw errors.invalidPropType('options.' + name, 'of type number', value);
    }
    if (!config.isValidFlush(value)) {
      throw errors.outOfRange('options.' + name,
        '>= ' + config.minFlush + ' and <= ' + config.maxFlush, value);
    }
  });
}

function validateMaxOutputLength(opts) {
  if (opts.maxOutputLength === undefined) return kMaxLength;
  var value = opts.maxOutputLength;
  if (typeof value !== 'number') {
    throw errors.invalidPropType('options.maxOutputLength', 'of type number', value);
  }
  if (value < 0 || value > kMaxLength) {
    throw errors.outOfRange('options.maxOutputLength', '>= 0 && <= ' + kMaxLength, value);
  }
  return value;
}

ZlibBase.prototype.reset = function () {
  assert(this._handle, 'zlib binding closed');
  return this._handle.reset();
};

ZlibBase.prototype.flush = function (kind, callback) {
  var self = this;
  var ws = this._writableState;

  if (typeof kind === 'function' || (kind === undefined && !callback)) {
    callback = kind;
    kind = this._config.fullFlush;
  }

  if (ws.ended) {
    if (callback) process.nextTick(callback);
  } else if (ws.ending) {
    if (callback) this.once('end', callback);
  } else if (ws.needDrain) {
    if (callback) {
      this.once('drain', function () { self.flush(kind, callback); });
    }
  } else {
    this._flushFlag = kind;
    this.write(Buffer.alloc(0), '', callback);
  }
};

ZlibBase.prototype.close = function (callback) {
  closeHandle(this, callback);
  process.nextTick(emitCloseNT, this);
};

ZlibBase.prototype._destroy = function (err, callback) {
  closeHandle(this);
  callback(err);
};

ZlibBase.prototype._final = function (callback) {
  callback();
};

function closeHandle(engine, callback) {
  if (callback) process.nextTick(callback);
  if (!engine._handle) return;
  engine._handle.close();
  engine._handle = null;
}

function emitCloseNT(self) {
  self.emit('close');
}

ZlibBase.prototype._flush = function (callback) {
  this._transform(Buffer.alloc(0), '', callback);
};

ZlibBase.prototype._transform = function (chunk, encoding, cb) {
  var ws = this._writableState;
  var ending = ws.ending || ws.ended;
  var last = ending && (!chunk || ws.length === chunk.length);

  if (chunk !== null && !Buffer.isBuffer(chunk)) {
    return cb(errors.invalidArgType('chunk', errors.BUFFER_ARG, chunk));
  }
  if (!this._handle) return cb(new Error('zlib binding closed'));

  var flushFlag;
  if (last) {
    flushFlag = this._finishFlushFlag;
  } else {
    flushFlag = this._flushFlag;
    if (chunk.length >= ws.length) {
      this._flushFlag = this._opts.flush !== undefined ? this._opts.flush : this._config.defaultFlush;
    }
  }

  this._processChunk(chunk, flushFlag, cb);
};

ZlibBase.prototype._processChunk = function (chunk, flushFlag, cb) {
  var self = this;
  var async = typeof cb === 'function';

  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var inOff = 0;

  this.bytesWritten += availInBefore || 0;

  var buffers = [];
  var nread = 0;

  if (!async) {
    var error;
    this.on('error', function (er) { error = er; });

    assert(this._handle, 'zlib binding closed');
    var res;
    do {
      res = this._handle.writeSync(flushFlag, chunk, inOff, availInBefore,
        this._buffer, this._offset, availOutBefore);
    } while (!this._hadError && callback(res[0], res[1]));

    if (this._hadError) {
      closeHandle(this);
      throw error;
    }

    var buf = Buffer.concat(buffers, nread);
    closeHandle(this);
    return buf;
  }

  assert(this._handle, 'zlib binding closed');
  var req = this._handle.write(flushFlag, chunk, inOff, availInBefore,
    this._buffer, this._offset, availOutBefore);
  req.buffer = chunk;
  req.callback = callback;

  // Returns true to ask the sync loop for another pass, false when done.
  function callback(availInAfter, availOutAfter) {
    if (self._hadError) return false;

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;

      if (nread + have > self._maxOutputLength) {
        var err = errors.bufferTooLarge(self._maxOutputLength);
        if (async) {
          self._hadError = true;
          closeHandle(self);
          self.emit('error', err);
          return false;
        }
        closeHandle(self);
        throw err;
      }

      if (async) {
        self.push(out);
      } else {
        buffers.push(out);
      }
      nread += have;
    }

    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = Buffer.allocUnsafe(self._chunkSize);
    }

    if (availOutAfter === 0) {
      inOff += availInBefore - availInAfter;
      availInBefore = availInAfter;

      if (!async) return true;

      var newReq = self._handle.write(flushFlag, chunk, inOff, availInBefore,
        self._buffer, self._offset, self._chunkSize);
      newReq.callback = callback;
      newReq.buffer = chunk;
      return;
    }

    if (!async) return false;

    cb();
  }
};

module.exports = ZlibBase;
module.exports.closeHandle = closeHandle;
