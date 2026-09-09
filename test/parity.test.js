'use strict';

var test = require('node:test');
var assert = require('node:assert');
var nodeZlib = require('node:zlib');

var target = require('./helpers/target');
var zlib = target.zlib;

// Every name reachable on the module, enumerable or not.
function reachableKeys(obj) {
  var seen = new Set();
  for (var key in obj) seen.add(key);
  Object.getOwnPropertyNames(obj).forEach(function (k) { seen.add(k); });
  return seen;
}

function prototypeKeys(Ctor) {
  var keys = new Set();
  var proto = Ctor.prototype;
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(function (k) { keys.add(k); });
    proto = Object.getPrototypeOf(proto);
    if (proto && proto.constructor && /Transform|Duplex|Readable|Stream|EventEmitter/.test(proto.constructor.name)) {
      break;
    }
  }
  return keys;
}

test('exposes every name Node\'s zlib exposes [' + target.label + ']', function () {
  var ours = reachableKeys(zlib);
  var missing = [];
  reachableKeys(nodeZlib).forEach(function (key) {
    if (!ours.has(key)) missing.push(key);
  });
  assert.deepStrictEqual(missing, [], 'missing exports: ' + missing.join(', '));
});

test('enumerable exports match Node exactly [' + target.label + ']', function () {
  assert.deepStrictEqual(Object.keys(zlib).sort(), Object.keys(nodeZlib).sort());
});

test('every Node constant is present with the same value [' + target.label + ']', function () {
  var wrong = [];
  Object.keys(nodeZlib.constants).forEach(function (key) {
    if (!(key in zlib.constants)) {
      wrong.push(key + ' missing');
    } else if (zlib.constants[key] !== nodeZlib.constants[key]) {
      wrong.push(key + ' is ' + zlib.constants[key] + ', Node has ' + nodeZlib.constants[key]);
    }
  });
  assert.deepStrictEqual(wrong, []);
});

test('constants and codes are frozen [' + target.label + ']', function () {
  assert.ok(Object.isFrozen(zlib.constants));
  assert.ok(Object.isFrozen(zlib.codes));
});

test('codes maps both directions, with no undefined key [' + target.label + ']', function () {
  assert.deepStrictEqual(zlib.codes, nodeZlib.codes);
  assert.ok(!('undefined' in zlib.codes));
});

test('BROTLI_ENCODE and BROTLI_DECODE are not transposed [' + target.label + ']', function () {
  assert.strictEqual(zlib.constants.BROTLI_DECODE, nodeZlib.constants.BROTLI_DECODE);
  assert.strictEqual(zlib.constants.BROTLI_ENCODE, nodeZlib.constants.BROTLI_ENCODE);
});

var CLASSES = ['Deflate', 'Inflate', 'Gzip', 'Gunzip', 'DeflateRaw', 'InflateRaw',
  'Unzip', 'BrotliCompress', 'BrotliDecompress', 'ZstdCompress', 'ZstdDecompress'];

CLASSES.forEach(function (name) {
  test(name + ' has every method Node\'s does [' + target.label + ']', function () {
    var ours = prototypeKeys(zlib[name]);
    var missing = [];
    prototypeKeys(nodeZlib[name]).forEach(function (k) {
      if (!ours.has(k)) missing.push(k);
    });
    assert.deepStrictEqual(missing, [], name + ' missing: ' + missing.join(', '));
  });
});
