'use strict';

// Which build the suite runs against. `npm test` runs it twice: once over the
// raw source (what Node consumers load) and once over the browserify bundle
// (what browser and React Native consumers load).
var entry = process.env.ZLIB_ENTRY || 'src';

var zlib = entry === 'bundle'
  ? require('../../index.js')
  : require('../../src/zlib.js');

module.exports = {
  zlib: zlib,
  entry: entry,
  // The bundle substitutes feross/buffer for Node's Buffer, so results are
  // Uint8Array-compatible but not Node Buffer instances.
  nativeBuffers: entry === 'src',
  label: 'entry=' + entry
};
