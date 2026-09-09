'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');

var target = require('./helpers/target');
var data = require('./helpers/data');
var zlib = target.zlib;

// Compressor/decompressor pairs that work in both directions.
var PAIRS = [
  { name: 'gzip', compress: 'gzip', decompress: 'gunzip' },
  { name: 'deflate', compress: 'deflate', decompress: 'inflate' },
  { name: 'deflateRaw', compress: 'deflateRaw', decompress: 'inflateRaw' },
  { name: 'brotli', compress: 'brotliCompress', decompress: 'brotliDecompress' }
];

PAIRS.forEach(function (pair) {
  data.SIZES.forEach(function (size) {
    var input = data.gen(size);

    test(pair.name + ' round-trips ' + size + ' bytes [' + target.label + ']', function () {
      var compressed = zlib[pair.compress + 'Sync'](input);
      var out = zlib[pair.decompress + 'Sync'](compressed);
      assert.strictEqual(out.toString(), input);
    });

    // The bug class this suite exists for: our output must be readable by a
    // real zlib, and a real zlib's output must be readable by us.
    test(pair.name + ' output is decodable by Node at ' + size + ' bytes [' + target.label + ']', function () {
      var compressed = Buffer.from(zlib[pair.compress + 'Sync'](input));
      assert.strictEqual(nodeZlib[pair.decompress + 'Sync'](compressed).toString(), input);
    });

    test(pair.name + ' decodes Node output at ' + size + ' bytes [' + target.label + ']', function () {
      var compressed = nodeZlib[pair.compress + 'Sync'](Buffer.from(input));
      assert.strictEqual(zlib[pair.decompress + 'Sync'](compressed).toString(), input);
    });
  });
});

data.SIZES.forEach(function (size) {
  test('zstd decodes Node output at ' + size + ' bytes [' + target.label + ']', function () {
    var input = data.gen(size);
    var compressed = nodeZlib.zstdCompressSync(Buffer.from(input));
    assert.strictEqual(zlib.zstdDecompressSync(compressed).toString(), input);
  });
});

test('unzip auto-detects gzip and deflate [' + target.label + ']', function () {
  assert.strictEqual(zlib.unzipSync(zlib.gzipSync('hello')).toString(), 'hello');
  assert.strictEqual(zlib.unzipSync(zlib.deflateSync('hello')).toString(), 'hello');
});

test('brotli compresses short and incompressible input [' + target.label + ']', function () {
  // A one-shot encoder that bails when output >= input used to emit zero
  // bytes here, silently losing the data.
  ['', 'a', 'hello brotli stream'].forEach(function (input) {
    var compressed = zlib.brotliCompressSync(input);
    assert.ok(compressed.length > 0, 'produced no output for ' + JSON.stringify(input));
    assert.strictEqual(nodeZlib.brotliDecompressSync(Buffer.from(compressed)).toString(), input);
  });
});

test('binary data survives every codec [' + target.label + ']', function () {
  var binary = Buffer.alloc(70000);
  for (var i = 0; i < binary.length; i++) binary[i] = (i * 7 + (i >> 8)) & 0xFF;

  PAIRS.forEach(function (pair) {
    var out = zlib[pair.decompress + 'Sync'](zlib[pair.compress + 'Sync'](binary));
    assert.ok(Buffer.from(out).equals(binary), pair.name + ' corrupted binary data');
  });
});

test('accepts every input type Node accepts [' + target.label + ']', function () {
  var expected = 'abc';
  var buf = Buffer.from(expected);
  var inputs = [
    expected,
    buf,
    new Uint8Array(buf),
    new DataView(new Uint8Array(buf).buffer),
    new Uint8Array(buf).buffer
  ];
  inputs.forEach(function (input, i) {
    assert.strictEqual(zlib.gunzipSync(zlib.gzipSync(input)).toString(), expected, 'input form ' + i);
  });
});
