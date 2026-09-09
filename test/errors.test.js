'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');

var target = require('./helpers/target');
var zlib = target.zlib;

// Each case runs against both implementations; the outcomes must be identical
// down to the message text.
var CASES = [
  ['buffer is a number', function (z) { return z.gzipSync(12); }],
  ['buffer is null', function (z) { return z.gzipSync(null); }],
  ['buffer is a plain object', function (z) { return z.gzipSync({}); }],
  ['buffer is an ArrayBuffer', function (z) { return z.gzipSync(new ArrayBuffer(8)); }],
  ['level above range', function (z) { return z.gzipSync('x', { level: 12 }); }],
  ['level below range', function (z) { return z.gzipSync('x', { level: -2 }); }],
  ['level is a string', function (z) { return z.gzipSync('x', { level: 'a' }); }],
  ['windowBits above range', function (z) { return z.gzipSync('x', { windowBits: 20 }); }],
  ['windowBits below range', function (z) { return z.gzipSync('x', { windowBits: 8 }); }],
  ['windowBits at minimum', function (z) { return z.gzipSync('x', { windowBits: 9 }); }],
  ['memLevel below range', function (z) { return z.gzipSync('x', { memLevel: 0 }); }],
  ['memLevel above range', function (z) { return z.gzipSync('x', { memLevel: 10 }); }],
  ['chunkSize below minimum', function (z) { return z.gzipSync('x', { chunkSize: 2 }); }],
  ['unknown strategy', function (z) { return z.gzipSync('x', { strategy: 99 }); }],
  ['dictionary is a string', function (z) { return z.gzipSync('x', { dictionary: 'nope' }); }],
  ['flush out of range', function (z) { return z.gzipSync('x', { flush: 99 }); }],
  ['maxOutputLength exceeded', function (z) { return z.gzipSync('x'.repeat(500), { maxOutputLength: 5 }); }],
  ['brotli flush out of range', function (z) { return z.brotliCompressSync('x', { flush: 99 }); }],
  ['brotli parameter unknown', function (z) { return z.brotliCompressSync('x', { params: { 99999: 1 } }); }],
  ['corrupt gzip data', function (z) { return z.gunzipSync(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])); }],
  ['corrupt deflate data', function (z) { return z.inflateSync(Buffer.from([9, 9, 9, 9, 9, 9, 9, 9])); }],
  ['crc32 rejects a number', function (z) { return z.crc32(12); }],
  ['crc32 rejects an ArrayBuffer', function (z) { return z.crc32(new ArrayBuffer(4)); }],
  ['crc32 rejects a fractional seed', function (z) { return z.crc32('x', 1.5); }],
  ['crc32 rejects a negative seed', function (z) { return z.crc32('x', -1); }]
];

function outcome(z, fn) {
  try {
    fn(z);
    return 'no error';
  } catch (err) {
    return err.code + ' | ' + err.name + ' | ' + err.message;
  }
}

CASES.forEach(function (entry) {
  test(entry[0] + ' behaves as Node does [' + target.label + ']', function () {
    assert.strictEqual(outcome(zlib, entry[1]), outcome(nodeZlib, entry[1]));
  });
});

test('a corrupt stream rejects rather than crashing the process [' + target.label + ']', async function () {
  await assert.rejects(zlib.brotliDecompress(Buffer.from([1, 2, 3, 4, 5])));
  await assert.rejects(zlib.gunzip(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), { code: 'Z_DATA_ERROR' });
  await assert.rejects(zlib.zstdDecompress(Buffer.from([1, 2, 3, 4, 5])));
});

test('a corrupt stream reaches the callback rather than throwing [' + target.label + ']', function (t, done) {
  zlib.brotliDecompress(Buffer.from([9, 9, 9, 9, 9]), function (err) {
    assert.ok(err, 'expected an error');
    done();
  });
});

test('zstd compression fails with a clear, coded error [' + target.label + ']', function () {
  assert.throws(function () { zlib.zstdCompressSync('x'); }, function (err) {
    assert.strictEqual(err.code, 'ERR_METHOD_NOT_IMPLEMENTED');
    assert.match(err.message, /pure-JavaScript zstd encoder/);
    return true;
  });
  assert.throws(function () { zlib.createZstdCompress(); }, { code: 'ERR_METHOD_NOT_IMPLEMENTED' });
});
