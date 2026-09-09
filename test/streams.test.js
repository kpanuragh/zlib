'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');
var stream = require('node:stream');

var target = require('./helpers/target');
var data = require('./helpers/data');
var zlib = target.zlib;

function collect(engine, callback) {
  var chunks = [];
  engine.on('data', function (chunk) { chunks.push(Buffer.from(chunk)); });
  engine.on('error', callback);
  engine.on('end', function () { callback(null, Buffer.concat(chunks)); });
}

var STREAMS = [
  { name: 'createGzip', decode: function (b) { return nodeZlib.gunzipSync(b); } },
  { name: 'createDeflate', decode: function (b) { return nodeZlib.inflateSync(b); } },
  { name: 'createDeflateRaw', decode: function (b) { return nodeZlib.inflateRawSync(b); } },
  { name: 'createBrotliCompress', decode: function (b) { return nodeZlib.brotliDecompressSync(b); } }
];

STREAMS.forEach(function (entry) {
  test(entry.name + ' streams multi-chunk input [' + target.label + ']', function (t, done) {
    var input = data.gen(200000);
    var engine = zlib[entry.name]();

    collect(engine, function (err, out) {
      assert.ifError(err);
      assert.strictEqual(entry.decode(out).toString(), input);
      done();
    });

    for (var i = 0; i < input.length; i += 8192) {
      engine.write(input.slice(i, i + 8192));
    }
    engine.end();
  });
});

test('createZstdDecompress decodes incrementally [' + target.label + ']', function (t, done) {
  var input = data.gen(200000);
  var compressed = nodeZlib.zstdCompressSync(Buffer.from(input));
  var engine = zlib.createZstdDecompress();

  collect(engine, function (err, out) {
    assert.ifError(err);
    assert.strictEqual(out.toString(), input);
    done();
  });

  for (var i = 0; i < compressed.length; i += 7) {
    engine.write(compressed.slice(i, i + 7));
  }
  engine.end();
});

test('decompression streams read compressed input [' + target.label + ']', function (t, done) {
  var input = data.gen(120000);
  var compressed = nodeZlib.gzipSync(Buffer.from(input));
  var engine = zlib.createGunzip();

  collect(engine, function (err, out) {
    assert.ifError(err);
    assert.strictEqual(out.toString(), input);
    done();
  });
  engine.end(compressed);
});

test('params() retunes a live deflate stream [' + target.label + ']', function (t, done) {
  var first = data.gen(40000, 7);
  var second = data.gen(40000, 13);
  var engine = zlib.createDeflate({ level: 1 });

  collect(engine, function (err, out) {
    assert.ifError(err);
    assert.strictEqual(nodeZlib.inflateSync(out).toString(), first + second);
    done();
  });

  engine.write(first);
  engine.params(9, zlib.constants.Z_DEFAULT_STRATEGY, function () {
    engine.end(second);
  });
});

test('flush() mid-stream keeps the output valid [' + target.label + ']', function (t, done) {
  var engine = zlib.createGzip();

  collect(engine, function (err, out) {
    assert.ifError(err);
    assert.strictEqual(nodeZlib.gunzipSync(out).toString(), 'beforeafter');
    done();
  });

  engine.write('before');
  engine.flush(function () {
    engine.end('after');
  });
});

test('pipeline works end to end [' + target.label + ']', function (t, done) {
  var input = data.gen(80000);

  stream.pipeline(
    stream.Readable.from([Buffer.from(input)]),
    zlib.createGzip(),
    zlib.createGunzip(),
    concat(function (out) {
      assert.strictEqual(out.toString(), input);
      done();
    }),
    function (err) { assert.ifError(err); }
  );

  function concat(cb) {
    var chunks = [];
    return new stream.Writable({
      write: function (chunk, enc, next) { chunks.push(Buffer.from(chunk)); next(); },
      final: function (next) { cb(Buffer.concat(chunks)); next(); }
    });
  }
});

test('destroy() releases the handle without throwing [' + target.label + ']', function (t, done) {
  var engine = zlib.createGzip();
  engine.on('close', function () {
    assert.strictEqual(engine._closed, true);
    done();
  });
  engine.destroy();
});

test('close() emits close and marks the engine closed [' + target.label + ']', function (t, done) {
  var engine = zlib.createGzip();
  engine.on('close', function () {
    assert.strictEqual(engine._closed, true);
    done();
  });
  engine.close();
});

test('reset() lets a decompressor be reused [' + target.label + ']', function () {
  var engine = zlib.createGunzip();
  engine.reset();
  engine.close();
});
