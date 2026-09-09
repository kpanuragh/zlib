'use strict';

// Deterministic filler. Sizes deliberately straddle the 16 KB default chunk
// size, which is where the output-buffer handling used to break.
exports.SIZES = [0, 1, 13, 1000, 16383, 16384, 16385, 50000, 300000];

exports.gen = function (n, seed) {
  seed = seed || 31;
  var out = new Array(n);
  for (var i = 0; i < n; i++) {
    out[i] = String.fromCharCode(32 + ((i * seed) % 90));
  }
  return out.join('');
};
