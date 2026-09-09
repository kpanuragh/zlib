'use strict';
// Generates src/constants.js from the host Node's zlib constant table.
var c = require('zlib').constants;

var EXTRA = { Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8, Z_TREES: 6, NONE: 0 };

function fmt(v) {
  if (v === Infinity) return 'Infinity';
  return String(v);
}

function section(title, keys) {
  var out = '\n// ' + title + '\n';
  var width = keys.reduce(function (m, k) { return Math.max(m, k.length); }, 0);
  keys.forEach(function (k) {
    var v = (k in c) ? c[k] : EXTRA[k];
    out += 'exports.' + k + ' = ' + new Array(width - k.length + 1).join(' ') + fmt(v) + ';\n';
  });
  return out;
}

var all = Object.keys(c);
var pick = function (re) { return all.filter(function (k) { return re.test(k); }); };

var flush   = ['Z_NO_FLUSH','Z_PARTIAL_FLUSH','Z_SYNC_FLUSH','Z_FULL_FLUSH','Z_FINISH','Z_BLOCK','Z_TREES'];
var ret     = ['Z_OK','Z_STREAM_END','Z_NEED_DICT','Z_ERRNO','Z_STREAM_ERROR','Z_DATA_ERROR','Z_MEM_ERROR','Z_BUF_ERROR','Z_VERSION_ERROR'];
var level   = ['Z_NO_COMPRESSION','Z_BEST_SPEED','Z_BEST_COMPRESSION','Z_DEFAULT_COMPRESSION'];
var strat   = ['Z_FILTERED','Z_HUFFMAN_ONLY','Z_RLE','Z_FIXED','Z_DEFAULT_STRATEGY'];
var dtype   = ['Z_BINARY','Z_TEXT','Z_UNKNOWN','Z_DEFLATED'];
var limits  = ['Z_MIN_WINDOWBITS','Z_MAX_WINDOWBITS','Z_DEFAULT_WINDOWBITS','Z_MIN_CHUNK','Z_MAX_CHUNK','Z_DEFAULT_CHUNK','Z_MIN_MEMLEVEL','Z_MAX_MEMLEVEL','Z_DEFAULT_MEMLEVEL','Z_MIN_LEVEL','Z_MAX_LEVEL','Z_DEFAULT_LEVEL','ZLIB_VERNUM'];
var modes   = ['NONE','DEFLATE','INFLATE','GZIP','GUNZIP','DEFLATERAW','INFLATERAW','UNZIP','BROTLI_DECODE','BROTLI_ENCODE','ZSTD_COMPRESS','ZSTD_DECOMPRESS'];

var brotliOps    = pick(/^BROTLI_OPERATION_/);
var brotliParams = pick(/^BROTLI_PARAM_/);
var brotliModes  = pick(/^BROTLI_(MODE_|DEFAULT_MODE)/);
var brotliQual   = pick(/^BROTLI_(MIN_QUALITY|MAX_QUALITY|DEFAULT_QUALITY|MIN_WINDOW_BITS|MAX_WINDOW_BITS|LARGE_MAX_WINDOW_BITS|DEFAULT_WINDOW|MIN_INPUT_BLOCK_BITS|MAX_INPUT_BLOCK_BITS)$/);
var brotliDecP   = pick(/^BROTLI_DECODER_PARAM_/);
var brotliDecR   = pick(/^BROTLI_DECODER_(RESULT_|NEEDS_|NO_ERROR|SUCCESS)/);
var brotliDecE   = pick(/^BROTLI_DECODER_ERROR_/);

var zstdE   = pick(/^ZSTD_e_/);
var zstdC   = pick(/^ZSTD_c_/);
var zstdD   = pick(/^ZSTD_d_/);
var zstdStr = ['ZSTD_fast','ZSTD_dfast','ZSTD_greedy','ZSTD_lazy','ZSTD_lazy2','ZSTD_btlazy2','ZSTD_btopt','ZSTD_btultra','ZSTD_btultra2'];
var zstdLvl = ['ZSTD_CLEVEL_DEFAULT'];
var zstdErr = pick(/^ZSTD_error_/);

var src = "'use strict';\n\n" +
  "// Zlib, Brotli and Zstd constants, matching Node.js core `zlib.constants`.\n" +
  "//\n" +
  "// Hardcoded on purpose: this package exists to run where there is no zlib\n" +
  "// module to read them from, and pako's table is missing several of them.\n" +
  "// Regenerate with scripts/gen-constants.js against a current Node.\n";

src += section('Flush values', flush);
src += section('Return codes', ret);
src += section('Compression levels', level);
src += section('Compression strategies', strat);
src += section('Data types', dtype);
src += section('Limits and defaults', limits);
src += section('Engine modes', modes);
src += section('Brotli operations', brotliOps);
src += section('Brotli encoder parameters', brotliParams);
src += section('Brotli encoder modes', brotliModes);
src += section('Brotli quality and window limits', brotliQual);
src += section('Brotli decoder parameters', brotliDecP);
src += section('Brotli decoder results', brotliDecR);
src += section('Brotli decoder error codes', brotliDecE);
src += section('Zstd end directives', zstdE);
src += section('Zstd compression parameters', zstdC);
src += section('Zstd decompression parameters', zstdD);
src += section('Zstd strategies', zstdStr);
src += section('Zstd compression levels', zstdLvl);
src += section('Zstd error codes', zstdErr);

process.stdout.write(src);

// coverage check
var emitted = new Set(src.match(/exports\.([A-Za-z0-9_]+)/g).map(function (s) { return s.slice(8); }));
var missed = all.filter(function (k) { return !emitted.has(k); });
if (missed.length) { console.error('MISSED: ' + missed.join(' ')); process.exit(1); }
console.error('OK: emitted ' + emitted.size + ' constants, covering all ' + all.length + ' Node constants');
