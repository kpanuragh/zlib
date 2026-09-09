'use strict';

var Buffer = require('buffer').Buffer;
var util = require('util');
var assert = require('assert').ok;

var constants = require('./constants');
var errors = require('./errors');
var binding = require('./binding');
var brotliBinding = require('./brotli-binding');
var zstdBinding = require('./zstd-binding');
var ZlibBase = require('./zlib-base');
var crc32 = require('./crc32');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

Object.defineProperty(exports, 'constants', {
  enumerable: true,
  value: Object.freeze(Object.assign({}, constants)),
  writable: false
});

// Node exposes its constants as non-enumerable top-level aliases, so
// `Object.keys(zlib)` lists none of them. We mirror that, and additionally
// alias the BROTLI_* names, which Node keeps only on `zlib.constants` but
// earlier versions of this package exposed here. Being non-enumerable, the
// extras leave `Object.keys(zlib)` identical to Node's.
Object.keys(constants).forEach(function (key) {
  Object.defineProperty(exports, key, {
    value: constants[key],
    enumerable: false,
    writable: false,
    configurable: true
  });
});

var codes = {
  Z_OK: constants.Z_OK,
  Z_STREAM_END: constants.Z_STREAM_END,
  Z_NEED_DICT: constants.Z_NEED_DICT,
  Z_ERRNO: constants.Z_ERRNO,
  Z_STREAM_ERROR: constants.Z_STREAM_ERROR,
  Z_DATA_ERROR: constants.Z_DATA_ERROR,
  Z_MEM_ERROR: constants.Z_MEM_ERROR,
  Z_BUF_ERROR: constants.Z_BUF_ERROR,
  Z_VERSION_ERROR: constants.Z_VERSION_ERROR
};
Object.keys(codes).forEach(function (key) {
  codes[codes[key]] = key;
});

Object.defineProperty(exports, 'codes', {
  enumerable: true,
  value: Object.freeze(codes),
  writable: false
});

// ---------------------------------------------------------------------------
// Option validation
// ---------------------------------------------------------------------------

function checkNumberRange(value, name, min, max) {
  if (typeof value !== 'number') {
    throw errors.invalidPropType(name, 'of type number', value);
  }
  if (Number.isNaN(value) || value < min || value > max) {
    throw errors.outOfRange(name, '>= ' + min + ' and <= ' + max, value);
  }
  return value;
}

function checkLevel(opts) {
  if (opts.level === undefined) return constants.Z_DEFAULT_COMPRESSION;
  return checkNumberRange(opts.level, 'options.level', constants.Z_MIN_LEVEL, constants.Z_MAX_LEVEL);
}

function checkWindowBits(opts, mode) {
  if (opts.windowBits === undefined) return constants.Z_DEFAULT_WINDOWBITS;
  // zlib only accepts windowBits 8 when inflating a raw stream.
  var min = mode === constants.INFLATERAW ? 8 : 9;
  return checkNumberRange(opts.windowBits, 'options.windowBits', min, constants.Z_MAX_WINDOWBITS);
}

function checkMemLevel(opts) {
  if (opts.memLevel === undefined) return constants.Z_DEFAULT_MEMLEVEL;
  return checkNumberRange(opts.memLevel, 'options.memLevel', constants.Z_MIN_MEMLEVEL, constants.Z_MAX_MEMLEVEL);
}

function checkStrategy(opts) {
  if (opts.strategy === undefined) return constants.Z_DEFAULT_STRATEGY;
  return checkNumberRange(opts.strategy, 'options.strategy', constants.Z_DEFAULT_STRATEGY, constants.Z_FIXED);
}

function checkDictionary(opts) {
  if (opts.dictionary === undefined) return undefined;
  var d = opts.dictionary;
  if (Buffer.isBuffer(d)) return d;
  if (ArrayBuffer.isView(d)) return Buffer.from(d.buffer, d.byteOffset, d.byteLength);
  if (d instanceof ArrayBuffer) return Buffer.from(d);
  throw errors.invalidPropType('options.dictionary', errors.BUFFER_PROP, d);
}

// Accepts everything Node's compression methods accept.
function normalizeInput(buffer) {
  if (typeof buffer === 'string') return Buffer.from(buffer);
  if (Buffer.isBuffer(buffer)) return buffer;
  if (ArrayBuffer.isView(buffer)) return Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (buffer instanceof ArrayBuffer) return Buffer.from(buffer);
  throw errors.invalidArgType('buffer', errors.BUFFER_ARG, buffer);
}

// ---------------------------------------------------------------------------
// Per-family flush configuration
// ---------------------------------------------------------------------------

var ZLIB_CONFIG = {
  defaultFlush: constants.Z_NO_FLUSH,
  finishFlush: constants.Z_FINISH,
  fullFlush: constants.Z_FULL_FLUSH,
  minFlush: constants.Z_NO_FLUSH,
  maxFlush: constants.Z_BLOCK,
  isValidFlush: function (f) { return f >= constants.Z_NO_FLUSH && f <= constants.Z_BLOCK; }
};

var BROTLI_CONFIG = {
  defaultFlush: constants.BROTLI_OPERATION_PROCESS,
  finishFlush: constants.BROTLI_OPERATION_FINISH,
  fullFlush: constants.BROTLI_OPERATION_FLUSH,
  minFlush: constants.BROTLI_OPERATION_PROCESS,
  maxFlush: constants.BROTLI_OPERATION_EMIT_METADATA,
  isValidFlush: function (f) {
    return f >= constants.BROTLI_OPERATION_PROCESS && f <= constants.BROTLI_OPERATION_EMIT_METADATA;
  }
};

var ZSTD_CONFIG = {
  defaultFlush: constants.ZSTD_e_continue,
  finishFlush: constants.ZSTD_e_end,
  fullFlush: constants.ZSTD_e_flush,
  minFlush: constants.ZSTD_e_continue,
  maxFlush: constants.ZSTD_e_end,
  isValidFlush: function (f) { return f >= constants.ZSTD_e_continue && f <= constants.ZSTD_e_end; }
};

// ---------------------------------------------------------------------------
// Engine families
// ---------------------------------------------------------------------------

function Zlib(opts, mode) {
  opts = opts || {};

  var level = checkLevel(opts);
  var windowBits = checkWindowBits(opts, mode);
  var memLevel = checkMemLevel(opts);
  var strategy = checkStrategy(opts);
  var dictionary = checkDictionary(opts);

  var handle = new binding.Zlib(mode);
  ZlibBase.call(this, opts, mode, handle, ZLIB_CONFIG);

  handle.init(windowBits, level, memLevel, strategy, dictionary);

  this._level = level;
  this._strategy = strategy;
}
util.inherits(Zlib, ZlibBase);

// deflateParams: retune level and strategy mid-stream.
Zlib.prototype.params = function (level, strategy, callback) {
  checkNumberRange(level, 'level', constants.Z_MIN_LEVEL, constants.Z_MAX_LEVEL);
  checkNumberRange(strategy, 'strategy', constants.Z_DEFAULT_STRATEGY, constants.Z_FIXED);

  if (this._level === level && this._strategy === strategy) {
    if (callback) process.nextTick(callback);
    return;
  }

  var self = this;
  this.flush(constants.Z_SYNC_FLUSH, function () {
    assert(self._handle, 'zlib binding closed');
    self._handle.params(level, strategy);
    if (!self._hadError) {
      self._level = level;
      self._strategy = strategy;
      if (callback) callback();
    }
  });
};

function Brotli(opts, mode) {
  opts = opts || {};

  var handle = mode === constants.BROTLI_ENCODE
    ? new brotliBinding.BrotliEncoder(mode)
    : new brotliBinding.BrotliDecoder(mode);

  ZlibBase.call(this, opts, mode, handle, BROTLI_CONFIG);

  handle.init(opts.params);
}
util.inherits(Brotli, ZlibBase);

// Brotli has no equivalent of deflateParams; Node still exposes the method as
// a no-op that invokes the callback, so we match that.
Brotli.prototype.params = function (level, strategy, callback) {
  if (callback) process.nextTick(callback);
};

function Zstd(opts, mode) {
  opts = opts || {};

  var handle = mode === constants.ZSTD_COMPRESS
    ? new zstdBinding.ZstdEncoder(mode)
    : new zstdBinding.ZstdDecoder(mode);

  ZlibBase.call(this, opts, mode, handle, ZSTD_CONFIG);

  handle.init(opts.params);
}
util.inherits(Zstd, ZlibBase);

// ---------------------------------------------------------------------------
// Concrete classes
// ---------------------------------------------------------------------------

function makeClass(name, Base, mode) {
  function Ctor(opts) {
    if (!(this instanceof Ctor)) return new Ctor(opts);
    Base.call(this, opts, mode);
  }
  util.inherits(Ctor, Base);
  Object.defineProperty(Ctor, 'name', { value: name, configurable: true });
  return Ctor;
}

var Deflate = makeClass('Deflate', Zlib, constants.DEFLATE);
var Inflate = makeClass('Inflate', Zlib, constants.INFLATE);
var Gzip = makeClass('Gzip', Zlib, constants.GZIP);
var Gunzip = makeClass('Gunzip', Zlib, constants.GUNZIP);
var DeflateRaw = makeClass('DeflateRaw', Zlib, constants.DEFLATERAW);
var InflateRaw = makeClass('InflateRaw', Zlib, constants.INFLATERAW);
var Unzip = makeClass('Unzip', Zlib, constants.UNZIP);

var BrotliCompress = makeClass('BrotliCompress', Brotli, constants.BROTLI_ENCODE);
var BrotliDecompress = makeClass('BrotliDecompress', Brotli, constants.BROTLI_DECODE);

var ZstdCompress = makeClass('ZstdCompress', Zstd, constants.ZSTD_COMPRESS);
var ZstdDecompress = makeClass('ZstdDecompress', Zstd, constants.ZSTD_DECOMPRESS);

exports.Deflate = Deflate;
exports.Inflate = Inflate;
exports.Gzip = Gzip;
exports.Gunzip = Gunzip;
exports.DeflateRaw = DeflateRaw;
exports.InflateRaw = InflateRaw;
exports.Unzip = Unzip;
exports.BrotliCompress = BrotliCompress;
exports.BrotliDecompress = BrotliDecompress;
exports.ZstdCompress = ZstdCompress;
exports.ZstdDecompress = ZstdDecompress;

// Not part of Node's surface; kept because earlier versions exposed them, but
// non-enumerable so Object.keys(zlib) still matches Node's exactly.
['Zlib', 'BrotliBase', 'ZlibBase'].forEach(function (name) {
  var value = name === 'Zlib' ? Zlib : name === 'BrotliBase' ? Brotli : ZlibBase;
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: false,
    writable: false,
    configurable: true
  });
});

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

exports.createDeflate = function (o) { return new Deflate(o); };
exports.createInflate = function (o) { return new Inflate(o); };
exports.createDeflateRaw = function (o) { return new DeflateRaw(o); };
exports.createInflateRaw = function (o) { return new InflateRaw(o); };
exports.createGzip = function (o) { return new Gzip(o); };
exports.createGunzip = function (o) { return new Gunzip(o); };
exports.createUnzip = function (o) { return new Unzip(o); };
exports.createBrotliCompress = function (o) { return new BrotliCompress(o); };
exports.createBrotliDecompress = function (o) { return new BrotliDecompress(o); };
exports.createZstdCompress = function (o) { return new ZstdCompress(o); };
exports.createZstdDecompress = function (o) { return new ZstdDecompress(o); };

// ---------------------------------------------------------------------------
// Buffer helpers
// ---------------------------------------------------------------------------

function withInfo(engine, buf) {
  return engine._opts && engine._opts.info ? { buffer: buf, engine: engine } : buf;
}

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  engine.on('error', onError);
  engine.on('end', onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once('readable', flow);
  }

  function onError(err) {
    engine.removeListener('end', onEnd);
    engine.removeListener('readable', flow);
    callback(err);
  }

  function onEnd() {
    var buf = Buffer.concat(buffers, nread);
    buffers = [];
    engine.close();
    callback(null, withInfo(engine, buf));
  }
}

function zlibBufferSync(engine, buffer) {
  buffer = normalizeInput(buffer);
  var out = engine._processChunk(buffer, engine._finishFlushFlag);
  return withInfo(engine, out);
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

// Async form. With a callback it behaves exactly like Node's; without one it
// returns a promise, which is this package's own addition.
function convenience(Engine) {
  return function (buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = undefined;
    }

    // Constructed before anything async so option errors throw where Node's do.
    var engine = new Engine(opts);
    buffer = normalizeInput(buffer);

    if (!callback) {
      return new Promise(function (resolve, reject) {
        zlibBuffer(engine, buffer, function (err, result) {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    return zlibBuffer(engine, buffer, callback);
  };
}

function convenienceSync(Engine) {
  return function (buffer, opts) {
    return zlibBufferSync(new Engine(opts), buffer);
  };
}

exports.deflate = convenience(Deflate);
exports.deflateSync = convenienceSync(Deflate);
exports.gzip = convenience(Gzip);
exports.gzipSync = convenienceSync(Gzip);
exports.deflateRaw = convenience(DeflateRaw);
exports.deflateRawSync = convenienceSync(DeflateRaw);
exports.unzip = convenience(Unzip);
exports.unzipSync = convenienceSync(Unzip);
exports.inflate = convenience(Inflate);
exports.inflateSync = convenienceSync(Inflate);
exports.gunzip = convenience(Gunzip);
exports.gunzipSync = convenienceSync(Gunzip);
exports.inflateRaw = convenience(InflateRaw);
exports.inflateRawSync = convenienceSync(InflateRaw);

exports.brotliCompress = convenience(BrotliCompress);
exports.brotliCompressSync = convenienceSync(BrotliCompress);
exports.brotliDecompress = convenience(BrotliDecompress);
exports.brotliDecompressSync = convenienceSync(BrotliDecompress);

exports.zstdCompress = convenience(ZstdCompress);
exports.zstdCompressSync = convenienceSync(ZstdCompress);
exports.zstdDecompress = convenience(ZstdDecompress);
exports.zstdDecompressSync = convenienceSync(ZstdDecompress);

exports.crc32 = crc32;
