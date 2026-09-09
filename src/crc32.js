'use strict';

var errors = require('./errors');

// Standard CRC-32 (IEEE 802.3) table, built once at load rather than carried
// as a 256-entry literal.
var table = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c >>> 0;
  }
  return t;
})();

// Note: unlike the compression methods, Node's crc32 does not accept an
// ArrayBuffer, and its message omits it. Kept deliberately narrow to match.
var DATA_ARG = 'of type string or an instance of Buffer, TypedArray, or DataView';

// zlib.crc32(data[, value]) - Node.js 22.2.0+
module.exports = function crc32(data, value) {
  if (typeof data === 'string') {
    data = Buffer.from(data);
  } else if (ArrayBuffer.isView(data)) {
    data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else {
    throw errors.invalidArgType('data', DATA_ARG, data);
  }

  if (value === undefined) {
    value = 0;
  } else {
    if (typeof value !== 'number') {
      throw errors.invalidArgType('value', 'of type number', value);
    }
    if (!Number.isInteger(value)) {
      throw errors.outOfRange('value', 'an integer', value);
    }
    if (value < 0 || value > 0xFFFFFFFF) {
      throw errors.outOfRange('value', '>= 0 && <= 4294967295', value);
    }
  }

  var crc = value ^ 0xFFFFFFFF;
  for (var i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
};
