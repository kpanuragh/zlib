'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');

var target = require('./helpers/target');
var data = require('./helpers/data');
var zlib = target.zlib;

var SAMPLE = data.gen(50000);

test('maxOutputLength is enforced synchronously [' + target.label + ']', function () {
  assert.throws(function () {
    zlib.gzipSync(SAMPLE, { maxOutputLength: 5 });
  }, function (err) {
    assert.strictEqual(err.code, 'ERR_BUFFER_TOO_LARGE');
    assert.strictEqual(err.name, 'RangeError');
    return true;
  });
});

test('maxOutputLength is enforced asynchronously [' + target.label + ']', function (t, done) {
  zlib.gzip(SAMPLE, { maxOutputLength: 5 }, function (err) {
    assert.ok(err, 'expected an error');
    assert.strictEqual(err.code, 'ERR_BUFFER_TOO_LARGE');
    done();
  });
});

test('maxOutputLength large enough to fit is not triggered [' + target.label + ']', function () {
  var out = zlib.gzipSync(SAMPLE, { maxOutputLength: 1024 * 1024 });
  assert.ok(out.length > 0);
});

test('info returns buffer and engine, synchronously [' + target.label + ']', function () {
  var result = zlib.gzipSync('hi', { info: true });
  assert.deepStrictEqual(Object.keys(result).sort(), ['buffer', 'engine']);
  assert.strictEqual(nodeZlib.gunzipSync(Buffer.from(result.buffer)).toString(), 'hi');
  assert.ok(result.engine instanceof zlib.Gzip);
});

test('info returns buffer and engine, asynchronously [' + target.label + ']', function (t, done) {
  zlib.gzip('hi', { info: true }, function (err, result) {
    assert.ifError(err);
    assert.deepStrictEqual(Object.keys(result).sort(), ['buffer', 'engine']);
    done();
  });
});

test('info flows through the promise form [' + target.label + ']', async function () {
  var result = await zlib.gzip('hi', { info: true });
  assert.ok(result.buffer && result.engine);
});

test('bytesWritten counts input bytes, like Node [' + target.label + ']', function (t, done) {
  var input = data.gen(1000);
  var gzip = zlib.createGzip();
  gzip.resume();
  gzip.on('end', function () {
    assert.strictEqual(gzip.bytesWritten, 1000);
    assert.strictEqual(gzip.bytesRead, 1000);
    done();
  });
  gzip.end(input);
});

test('every compression level produces valid output [' + target.label + ']', function () {
  for (var level = 0; level <= 9; level++) {
    var out = zlib.gzipSync(SAMPLE, { level: level });
    assert.strictEqual(nodeZlib.gunzipSync(Buffer.from(out)).toString(), SAMPLE,
      'level ' + level + ' produced unreadable output');
  }
});

test('every strategy produces valid output [' + target.label + ']', function () {
  [zlib.constants.Z_DEFAULT_STRATEGY, zlib.constants.Z_FILTERED,
    zlib.constants.Z_HUFFMAN_ONLY, zlib.constants.Z_RLE,
    zlib.constants.Z_FIXED].forEach(function (strategy) {
    var out = zlib.deflateSync(SAMPLE, { strategy: strategy });
    assert.strictEqual(nodeZlib.inflateSync(Buffer.from(out)).toString(), SAMPLE,
      'strategy ' + strategy + ' produced unreadable output');
  });
});

test('a dictionary round-trips and interoperates with Node [' + target.label + ']', function () {
  var dictionary = Buffer.from('the quick brown fox');
  var input = 'the quick brown fox jumps over the lazy dog';

  var compressed = zlib.deflateSync(input, { dictionary: dictionary });
  assert.strictEqual(
    nodeZlib.inflateSync(Buffer.from(compressed), { dictionary: dictionary }).toString(),
    input);
});

test('a small chunkSize still produces complete output [' + target.label + ']', function () {
  var out = zlib.gzipSync(SAMPLE, { chunkSize: 64 });
  assert.strictEqual(nodeZlib.gunzipSync(Buffer.from(out)).toString(), SAMPLE);
  assert.strictEqual(zlib.gunzipSync(out, { chunkSize: 64 }).toString(), SAMPLE);
});

test('brotli quality settings are honoured [' + target.label + ']', function () {
  var low = zlib.brotliCompressSync(SAMPLE, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 1 }
  });
  var high = zlib.brotliCompressSync(SAMPLE, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
  });

  assert.strictEqual(nodeZlib.brotliDecompressSync(Buffer.from(low)).toString(), SAMPLE);
  assert.strictEqual(nodeZlib.brotliDecompressSync(Buffer.from(high)).toString(), SAMPLE);
  assert.ok(high.length <= low.length, 'quality 11 should not be larger than quality 1');
});

if (target.nativeBuffers) {
  test('results are real Node Buffers [' + target.label + ']', function () {
    assert.ok(Buffer.isBuffer(zlib.gzipSync('x')));
    assert.ok(Buffer.isBuffer(zlib.deflateSync('x')));
    assert.ok(Buffer.isBuffer(zlib.brotliCompressSync('x')));
  });
}
