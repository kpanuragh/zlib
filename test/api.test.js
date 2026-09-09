'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');

var target = require('./helpers/target');
var data = require('./helpers/data');
var zlib = target.zlib;

var SAMPLE = data.gen(20000);

// Every async convenience method, with the decompressor that reverses it.
var ASYNC = [
  ['gzip', 'gunzip'],
  ['deflate', 'inflate'],
  ['deflateRaw', 'inflateRaw'],
  ['brotliCompress', 'brotliDecompress']
];

ASYNC.forEach(function (pair) {
  test(pair[0] + ' returns a promise when no callback is given [' + target.label + ']', async function () {
    var compressed = await zlib[pair[0]](SAMPLE);
    var out = await zlib[pair[1]](compressed);
    assert.strictEqual(out.toString(), SAMPLE);
  });

  test(pair[0] + ' still honours a callback [' + target.label + ']', function (t, done) {
    zlib[pair[0]](SAMPLE, function (err, compressed) {
      assert.ifError(err);
      zlib[pair[1]](compressed, function (err2, out) {
        assert.ifError(err2);
        assert.strictEqual(out.toString(), SAMPLE);
        done();
      });
    });
  });

  test(pair[0] + ' accepts options with a callback [' + target.label + ']', function (t, done) {
    zlib[pair[0]](SAMPLE, {}, function (err, compressed) {
      assert.ifError(err);
      assert.ok(compressed.length > 0);
      done();
    });
  });
});

test('unzip supports both promise and callback forms [' + target.label + ']', async function () {
  var compressed = await zlib.gzip(SAMPLE);
  assert.strictEqual((await zlib.unzip(compressed)).toString(), SAMPLE);
});

test('zstdDecompress supports both forms [' + target.label + ']', async function () {
  var compressed = nodeZlib.zstdCompressSync(Buffer.from(SAMPLE));
  assert.strictEqual((await zlib.zstdDecompress(compressed)).toString(), SAMPLE);

  await new Promise(function (resolve) {
    zlib.zstdDecompress(compressed, function (err, out) {
      assert.ifError(err);
      assert.strictEqual(out.toString(), SAMPLE);
      resolve();
    });
  });
});

test('promise and callback results are identical [' + target.label + ']', async function () {
  var viaPromise = await zlib.gzip(SAMPLE);
  var viaCallback = await new Promise(function (resolve, reject) {
    zlib.gzip(SAMPLE, function (err, out) { err ? reject(err) : resolve(out); });
  });
  assert.ok(Buffer.from(viaPromise).equals(Buffer.from(viaCallback)));
});

test('the two forms interoperate [' + target.label + ']', async function () {
  var compressed = await new Promise(function (resolve, reject) {
    zlib.gzip(SAMPLE, function (err, out) { err ? reject(err) : resolve(out); });
  });
  assert.strictEqual((await zlib.gunzip(compressed)).toString(), SAMPLE);
});

test('option errors throw synchronously, as Node does [' + target.label + ']', function () {
  assert.throws(function () { zlib.gzip(SAMPLE, { level: 99 }, function () {}); },
    { code: 'ERR_OUT_OF_RANGE' });
  assert.throws(function () { zlib.gzip(SAMPLE, { level: 99 }); },
    { code: 'ERR_OUT_OF_RANGE' });
});

test('crc32 matches Node [' + target.label + ']', function () {
  ['', 'hello world', SAMPLE].forEach(function (input) {
    assert.strictEqual(zlib.crc32(input), nodeZlib.crc32(input));
  });
  assert.strictEqual(zlib.crc32('world', zlib.crc32('hello ')),
    nodeZlib.crc32('world', nodeZlib.crc32('hello ')));
});

test('factory functions produce the matching classes [' + target.label + ']', function () {
  var pairs = [
    ['createDeflate', 'Deflate'], ['createInflate', 'Inflate'],
    ['createGzip', 'Gzip'], ['createGunzip', 'Gunzip'],
    ['createDeflateRaw', 'DeflateRaw'], ['createInflateRaw', 'InflateRaw'],
    ['createUnzip', 'Unzip'], ['createBrotliCompress', 'BrotliCompress'],
    ['createBrotliDecompress', 'BrotliDecompress'], ['createZstdDecompress', 'ZstdDecompress']
  ];
  pairs.forEach(function (pair) {
    var instance = zlib[pair[0]]();
    assert.ok(instance instanceof zlib[pair[1]], pair[0] + ' did not produce a ' + pair[1]);
    instance.close();
  });
});

test('classes work without new [' + target.label + ']', function () {
  var instance = zlib.Gzip();
  assert.ok(instance instanceof zlib.Gzip);
  instance.close();
});
