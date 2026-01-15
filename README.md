# react-zlib-js

[![npm version](https://badge.fury.io/js/react-zlib-js.svg)](https://www.npmjs.com/package/react-zlib-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Pure JavaScript implementation of Node.js `zlib` module for React Native, browsers, and JavaScript environments where native modules are not available.

**Compatible with Node.js 22.x LTS API**

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Convenience Methods (Async)](#convenience-methods-async)
  - [Convenience Methods (Sync)](#convenience-methods-sync)
  - [Stream Factory Methods](#stream-factory-methods)
  - [Stream Classes](#stream-classes)
  - [Utility Functions](#utility-functions)
- [Options](#options)
- [Constants](#constants)
- [Examples](#examples)
- [Compression Comparison](#compression-comparison)
- [React Native Usage](#react-native-usage)
- [Browser Usage](#browser-usage)
- [Building from Source](#building-from-source)
- [Migration from v1.x](#migration-from-v1x)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

| Feature | Description | Node.js Version |
|---------|-------------|-----------------|
| **Gzip/Gunzip** | Standard gzip compression | All |
| **Deflate/Inflate** | Raw deflate with zlib header | All |
| **DeflateRaw/InflateRaw** | Raw deflate without header | All |
| **Unzip** | Auto-detect and decompress | All |
| **Brotli** | Modern compression, better ratios | 11.7.0+ |
| **CRC32** | Checksum calculation | 22.2.0+ |
| **Stream Support** | Node.js Transform streams | All |
| **Sync & Async APIs** | Both synchronous and callback | All |

## Installation

```bash
npm install react-zlib-js
```

Or with yarn:

```bash
yarn add react-zlib-js
```

## Quick Start

```javascript
const zlib = require('react-zlib-js');

// ============================================
// Gzip Compression
// ============================================

// Async
zlib.gzip('Hello, World!', (err, compressed) => {
  if (err) throw err;

  zlib.gunzip(compressed, (err, decompressed) => {
    console.log(decompressed.toString()); // 'Hello, World!'
  });
});

// Sync
const compressed = zlib.gzipSync('Hello, World!');
const decompressed = zlib.gunzipSync(compressed);
console.log(decompressed.toString()); // 'Hello, World!'

// ============================================
// Brotli Compression (Better compression ratio)
// ============================================

const brotliCompressed = zlib.brotliCompressSync('Hello, World!');
const brotliDecompressed = zlib.brotliDecompressSync(brotliCompressed);
console.log(brotliDecompressed.toString()); // 'Hello, World!'

// ============================================
// CRC32 Checksum
// ============================================

const checksum = zlib.crc32('Hello, World!');
console.log(checksum); // 3957769958
```

## API Reference

### Convenience Methods (Async)

All async methods follow the pattern: `method(buffer[, options], callback)`

```javascript
// Callback signature: (error, result) => void
```

| Method | Description |
|--------|-------------|
| `zlib.gzip(buffer[, options], callback)` | Compress using Gzip |
| `zlib.gunzip(buffer[, options], callback)` | Decompress Gzip |
| `zlib.deflate(buffer[, options], callback)` | Compress using Deflate |
| `zlib.inflate(buffer[, options], callback)` | Decompress Deflate |
| `zlib.deflateRaw(buffer[, options], callback)` | Compress using raw Deflate (no header) |
| `zlib.inflateRaw(buffer[, options], callback)` | Decompress raw Deflate |
| `zlib.unzip(buffer[, options], callback)` | Auto-detect and decompress (gzip or deflate) |
| `zlib.brotliCompress(buffer[, options], callback)` | Compress using Brotli |
| `zlib.brotliDecompress(buffer[, options], callback)` | Decompress Brotli |

**Example:**

```javascript
zlib.gzip('Hello', { level: 9 }, (err, result) => {
  if (err) {
    console.error('Compression failed:', err);
    return;
  }
  console.log('Compressed size:', result.length);
});
```

### Convenience Methods (Sync)

All sync methods follow the pattern: `methodSync(buffer[, options])`

| Method | Description |
|--------|-------------|
| `zlib.gzipSync(buffer[, options])` | Compress using Gzip |
| `zlib.gunzipSync(buffer[, options])` | Decompress Gzip |
| `zlib.deflateSync(buffer[, options])` | Compress using Deflate |
| `zlib.inflateSync(buffer[, options])` | Decompress Deflate |
| `zlib.deflateRawSync(buffer[, options])` | Compress using raw Deflate |
| `zlib.inflateRawSync(buffer[, options])` | Decompress raw Deflate |
| `zlib.unzipSync(buffer[, options])` | Auto-detect and decompress |
| `zlib.brotliCompressSync(buffer[, options])` | Compress using Brotli |
| `zlib.brotliDecompressSync(buffer[, options])` | Decompress Brotli |

**Example:**

```javascript
try {
  const compressed = zlib.gzipSync('Hello', { level: 9 });
  const decompressed = zlib.gunzipSync(compressed);
  console.log(decompressed.toString());
} catch (err) {
  console.error('Error:', err);
}
```

### Stream Factory Methods

Create Transform streams for piping data.

| Method | Description |
|--------|-------------|
| `zlib.createGzip([options])` | Create Gzip compression stream |
| `zlib.createGunzip([options])` | Create Gzip decompression stream |
| `zlib.createDeflate([options])` | Create Deflate compression stream |
| `zlib.createInflate([options])` | Create Deflate decompression stream |
| `zlib.createDeflateRaw([options])` | Create raw Deflate compression stream |
| `zlib.createInflateRaw([options])` | Create raw Deflate decompression stream |
| `zlib.createUnzip([options])` | Create auto-detect decompression stream |
| `zlib.createBrotliCompress([options])` | Create Brotli compression stream |
| `zlib.createBrotliDecompress([options])` | Create Brotli decompression stream |

**Example:**

```javascript
const gzip = zlib.createGzip();
const gunzip = zlib.createGunzip();

// Pipe data through compression and decompression
inputStream.pipe(gzip).pipe(gunzip).pipe(outputStream);
```

### Stream Classes

Direct class constructors (also available via factory methods).

| Class | Description |
|-------|-------------|
| `zlib.Gzip` | Gzip compression class |
| `zlib.Gunzip` | Gzip decompression class |
| `zlib.Deflate` | Deflate compression class |
| `zlib.Inflate` | Deflate decompression class |
| `zlib.DeflateRaw` | Raw Deflate compression class |
| `zlib.InflateRaw` | Raw Deflate decompression class |
| `zlib.Unzip` | Auto-detect decompression class |
| `zlib.BrotliCompress` | Brotli compression class |
| `zlib.BrotliDecompress` | Brotli decompression class |

**Example:**

```javascript
const gzip = new zlib.Gzip({ level: 9 });
```

### Utility Functions

#### `zlib.crc32(data[, value])`

Computes a 32-bit CRC checksum (IEEE CRC-32 polynomial).

**Parameters:**
- `data` `<string>` | `<Buffer>` | `<TypedArray>` | `<DataView>` - Input data
- `value` `<number>` - Optional starting CRC value for chaining (default: 0)

**Returns:** `<number>` - 32-bit unsigned integer

**Example:**

```javascript
// Basic usage
const crc = zlib.crc32('hello');
console.log(crc);  // 907060870

// With Buffer
const crc2 = zlib.crc32(Buffer.from('hello'));
console.log(crc2); // 907060870

// Chained CRC32 for streaming
let runningCrc = zlib.crc32('hello');
runningCrc = zlib.crc32(' world', runningCrc);
console.log(runningCrc); // Combined checksum
```

## Options

### Zlib Options (Gzip, Deflate, etc.)

```javascript
{
  // Flush behavior during compression
  flush: zlib.Z_NO_FLUSH,

  // Flush behavior at end of stream
  finishFlush: zlib.Z_FINISH,

  // Internal buffer size (default: 16KB)
  chunkSize: 16 * 1024,

  // Window size bits: 8-15 (default: 15)
  // Higher = better compression, more memory
  windowBits: 15,

  // Compression level: -1 to 9
  // -1 = default, 0 = none, 1 = fastest, 9 = best
  level: zlib.Z_DEFAULT_COMPRESSION,

  // Memory usage level: 1-9 (default: 8)
  // Higher = faster, more memory
  memLevel: 8,

  // Compression strategy
  strategy: zlib.Z_DEFAULT_STRATEGY,

  // Preset dictionary for compression
  dictionary: Buffer
}
```

**Compression Level Examples:**

```javascript
// No compression (fastest, largest output)
zlib.deflateSync(data, { level: zlib.Z_NO_COMPRESSION });

// Best speed (level 1)
zlib.deflateSync(data, { level: zlib.Z_BEST_SPEED });

// Best compression (level 9, slowest)
zlib.deflateSync(data, { level: zlib.Z_BEST_COMPRESSION });

// Default (level 6, balanced)
zlib.deflateSync(data, { level: zlib.Z_DEFAULT_COMPRESSION });
```

### Brotli Options

```javascript
{
  // Flush behavior during compression
  flush: zlib.BROTLI_OPERATION_PROCESS,

  // Flush behavior at end of stream
  finishFlush: zlib.BROTLI_OPERATION_FINISH,

  // Internal buffer size
  chunkSize: 16 * 1024,

  // Brotli-specific parameters
  params: {
    // Compression mode
    [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_GENERIC,

    // Quality: 0-11 (default: 11)
    [zlib.BROTLI_PARAM_QUALITY]: 11,

    // Window size bits: 10-24 (default: 22)
    [zlib.BROTLI_PARAM_LGWIN]: 22,

    // Block size bits: 16-24
    [zlib.BROTLI_PARAM_LGBLOCK]: 0,

    // Input size hint (optional)
    [zlib.BROTLI_PARAM_SIZE_HINT]: 0
  }
}
```

**Brotli Mode Examples:**

```javascript
// Generic mode (default)
zlib.brotliCompressSync(data, {
  params: { [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_GENERIC }
});

// Text mode (optimized for UTF-8 text)
zlib.brotliCompressSync(data, {
  params: { [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_TEXT }
});

// Font mode (optimized for WOFF 2.0)
zlib.brotliCompressSync(fontData, {
  params: { [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_FONT }
});
```

## Constants

All constants are available both directly on `zlib` and via `zlib.constants`.

### Compression Levels

| Constant | Value | Description |
|----------|-------|-------------|
| `Z_NO_COMPRESSION` | 0 | No compression, store only |
| `Z_BEST_SPEED` | 1 | Fastest compression |
| `Z_BEST_COMPRESSION` | 9 | Best compression ratio |
| `Z_DEFAULT_COMPRESSION` | -1 | Default level (6) |

### Flush Values

| Constant | Value | Description |
|----------|-------|-------------|
| `Z_NO_FLUSH` | 0 | Normal operation |
| `Z_PARTIAL_FLUSH` | 1 | Partial flush |
| `Z_SYNC_FLUSH` | 2 | Sync to byte boundary |
| `Z_FULL_FLUSH` | 3 | Full flush, reset state |
| `Z_FINISH` | 4 | Finish compression |
| `Z_BLOCK` | 5 | Block flush |

### Return Codes

| Constant | Value | Description |
|----------|-------|-------------|
| `Z_OK` | 0 | Success |
| `Z_STREAM_END` | 1 | Stream complete |
| `Z_NEED_DICT` | 2 | Dictionary needed |
| `Z_ERRNO` | -1 | System error |
| `Z_STREAM_ERROR` | -2 | Stream state error |
| `Z_DATA_ERROR` | -3 | Data corruption |
| `Z_MEM_ERROR` | -4 | Out of memory |
| `Z_BUF_ERROR` | -5 | Buffer error |
| `Z_VERSION_ERROR` | -6 | Version mismatch |

### Strategies

| Constant | Value | Description |
|----------|-------|-------------|
| `Z_FILTERED` | 1 | For filtered data (e.g., images) |
| `Z_HUFFMAN_ONLY` | 2 | Huffman encoding only |
| `Z_RLE` | 3 | Run-length encoding |
| `Z_FIXED` | 4 | Fixed Huffman codes |
| `Z_DEFAULT_STRATEGY` | 0 | Default strategy |

### Brotli Operations

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_OPERATION_PROCESS` | 0 | Normal processing |
| `BROTLI_OPERATION_FLUSH` | 1 | Flush output |
| `BROTLI_OPERATION_FINISH` | 2 | Finish stream |
| `BROTLI_OPERATION_EMIT_METADATA` | 3 | Emit metadata block |

### Brotli Modes

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_MODE_GENERIC` | 0 | Generic compression |
| `BROTLI_MODE_TEXT` | 1 | UTF-8 text optimization |
| `BROTLI_MODE_FONT` | 2 | WOFF 2.0 font optimization |

### Brotli Quality

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_MIN_QUALITY` | 0 | Minimum (fastest) |
| `BROTLI_MAX_QUALITY` | 11 | Maximum (best compression) |
| `BROTLI_DEFAULT_QUALITY` | 11 | Default quality |

### Brotli Window Size

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_MIN_WINDOW_BITS` | 10 | Minimum window (1KB) |
| `BROTLI_MAX_WINDOW_BITS` | 24 | Maximum window (16MB) |
| `BROTLI_LARGE_MAX_WINDOW_BITS` | 30 | Large window (1GB) |
| `BROTLI_DEFAULT_WINDOW` | 22 | Default window (4MB) |

### Brotli Parameters

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_PARAM_MODE` | 0 | Compression mode |
| `BROTLI_PARAM_QUALITY` | 1 | Quality level (0-11) |
| `BROTLI_PARAM_LGWIN` | 2 | Window size bits |
| `BROTLI_PARAM_LGBLOCK` | 3 | Block size bits |
| `BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING` | 4 | Disable context modeling |
| `BROTLI_PARAM_SIZE_HINT` | 5 | Input size hint |
| `BROTLI_PARAM_LARGE_WINDOW` | 6 | Enable large window |
| `BROTLI_PARAM_NPOSTFIX` | 7 | Postfix bits |
| `BROTLI_PARAM_NDIRECT` | 8 | Direct distance codes |

### Brotli Decoder Parameters

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION` | 0 | Disable buffer realloc |
| `BROTLI_DECODER_PARAM_LARGE_WINDOW` | 1 | Enable large window |

### Brotli Decoder Results

| Constant | Value | Description |
|----------|-------|-------------|
| `BROTLI_DECODER_RESULT_ERROR` | 0 | Decoding error |
| `BROTLI_DECODER_RESULT_SUCCESS` | 1 | Success |
| `BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT` | 2 | Need more input |
| `BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT` | 3 | Need more output |

### Accessing Constants

```javascript
// Direct access
console.log(zlib.Z_BEST_COMPRESSION);      // 9
console.log(zlib.BROTLI_MAX_QUALITY);      // 11

// Via constants object
console.log(zlib.constants.Z_BEST_COMPRESSION);  // 9
console.log(zlib.constants.BROTLI_MAX_QUALITY);  // 11

// Error codes with reverse lookup
console.log(zlib.codes.Z_OK);     // 0
console.log(zlib.codes[0]);       // 'Z_OK'
console.log(zlib.codes[-3]);      // 'Z_DATA_ERROR'
```

## Examples

### Basic Compression/Decompression

```javascript
const zlib = require('react-zlib-js');

const original = 'Hello, World! This is a test string for compression.';

// Gzip
const gzipped = zlib.gzipSync(original);
const ungzipped = zlib.gunzipSync(gzipped);
console.log('Gzip:', original.length, '->', gzipped.length, 'bytes');
console.log('Match:', ungzipped.toString() === original);

// Deflate
const deflated = zlib.deflateSync(original);
const inflated = zlib.inflateSync(deflated);
console.log('Deflate:', original.length, '->', deflated.length, 'bytes');

// Brotli (best compression)
const brotlied = zlib.brotliCompressSync(original);
const unbrotlied = zlib.brotliDecompressSync(brotlied);
console.log('Brotli:', original.length, '->', brotlied.length, 'bytes');
```

### Compression Levels Comparison

```javascript
const zlib = require('react-zlib-js');

const data = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);

console.log('Original size:', data.length, 'bytes\n');

// Different compression levels
const levels = [
  { name: 'No compression', level: zlib.Z_NO_COMPRESSION },
  { name: 'Best speed', level: zlib.Z_BEST_SPEED },
  { name: 'Level 5', level: 5 },
  { name: 'Default', level: zlib.Z_DEFAULT_COMPRESSION },
  { name: 'Best compression', level: zlib.Z_BEST_COMPRESSION }
];

levels.forEach(({ name, level }) => {
  const compressed = zlib.deflateSync(data, { level });
  const ratio = ((1 - compressed.length / data.length) * 100).toFixed(1);
  console.log(`${name} (${level}): ${compressed.length} bytes (${ratio}% reduction)`);
});
```

### Async Compression with Error Handling

```javascript
const zlib = require('react-zlib-js');

function compressData(data) {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, compressed) => {
      if (err) reject(err);
      else resolve(compressed);
    });
  });
}

function decompressData(data) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(data, (err, decompressed) => {
      if (err) reject(err);
      else resolve(decompressed);
    });
  });
}

// Usage with async/await
async function example() {
  try {
    const original = 'Hello, World!';
    const compressed = await compressData(original);
    console.log('Compressed size:', compressed.length);

    const decompressed = await decompressData(compressed);
    console.log('Decompressed:', decompressed.toString());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

example();
```

### Stream-based Compression

```javascript
const zlib = require('react-zlib-js');

// Compress using streams
function compressWithStream(input) {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const chunks = [];

    gzip.on('data', chunk => chunks.push(chunk));
    gzip.on('end', () => resolve(Buffer.concat(chunks)));
    gzip.on('error', reject);

    gzip.write(input);
    gzip.end();
  });
}

// Decompress using streams
function decompressWithStream(input) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const chunks = [];

    gunzip.on('data', chunk => chunks.push(chunk));
    gunzip.on('end', () => resolve(Buffer.concat(chunks)));
    gunzip.on('error', reject);

    gunzip.write(input);
    gunzip.end();
  });
}

// Usage
async function streamExample() {
  const original = 'Stream compression example data';

  const compressed = await compressWithStream(original);
  console.log('Compressed:', compressed.length, 'bytes');

  const decompressed = await decompressWithStream(compressed);
  console.log('Decompressed:', decompressed.toString());
}

streamExample();
```

### Brotli with Custom Options

```javascript
const zlib = require('react-zlib-js');

const text = 'This is UTF-8 text content for Brotli compression.'.repeat(50);

// Fast compression (lower quality)
const fast = zlib.brotliCompressSync(text, {
  params: {
    [zlib.BROTLI_PARAM_QUALITY]: 1
  }
});

// Best compression (highest quality)
const best = zlib.brotliCompressSync(text, {
  params: {
    [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_TEXT,
    [zlib.BROTLI_PARAM_QUALITY]: zlib.BROTLI_MAX_QUALITY
  }
});

console.log('Original:', text.length, 'bytes');
console.log('Fast (Q1):', fast.length, 'bytes');
console.log('Best (Q11):', best.length, 'bytes');
```

### Binary Data Compression

```javascript
const zlib = require('react-zlib-js');

// Create binary data
const binaryData = Buffer.alloc(1000);
for (let i = 0; i < binaryData.length; i++) {
  binaryData[i] = Math.floor(Math.random() * 256);
}

// Compress
const compressed = zlib.gzipSync(binaryData);

// Decompress
const decompressed = zlib.gunzipSync(compressed);

// Verify
const match = Buffer.compare(binaryData, decompressed) === 0;
console.log('Binary data preserved:', match);
console.log('Original:', binaryData.length, 'bytes');
console.log('Compressed:', compressed.length, 'bytes');
```

### Auto-detect Decompression with Unzip

```javascript
const zlib = require('react-zlib-js');

const original = 'Test data for auto-detection';

// Compress with different algorithms
const gzipped = zlib.gzipSync(original);
const deflated = zlib.deflateSync(original);

// unzip auto-detects the format
const fromGzip = zlib.unzipSync(gzipped);
const fromDeflate = zlib.unzipSync(deflated);

console.log('From Gzip:', fromGzip.toString());
console.log('From Deflate:', fromDeflate.toString());
```

### CRC32 Checksum Calculation

```javascript
const zlib = require('react-zlib-js');

// Simple CRC32
const crc = zlib.crc32('hello');
console.log('CRC32 of "hello":', crc);

// CRC32 with Buffer
const bufferCrc = zlib.crc32(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f]));
console.log('CRC32 from buffer:', bufferCrc);

// Streaming/chunked CRC32
function calculateStreamingCRC(chunks) {
  let crc = 0;
  for (const chunk of chunks) {
    crc = zlib.crc32(chunk, crc);
  }
  return crc;
}

const chunks = ['Hello', ', ', 'World', '!'];
const streamCrc = calculateStreamingCRC(chunks);
const directCrc = zlib.crc32('Hello, World!');

console.log('Streaming CRC:', streamCrc);
console.log('Direct CRC:', directCrc);
console.log('Match:', streamCrc === directCrc);
```

### JSON Compression for API

```javascript
const zlib = require('react-zlib-js');

// Compress JSON data
function compressJSON(obj) {
  const json = JSON.stringify(obj);
  return zlib.gzipSync(json);
}

// Decompress JSON data
function decompressJSON(compressed) {
  const json = zlib.gunzipSync(compressed);
  return JSON.parse(json.toString());
}

// Example
const data = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  metadata: {
    total: 2,
    page: 1
  }
};

const compressed = compressJSON(data);
const decompressed = decompressJSON(compressed);

console.log('Original JSON size:', JSON.stringify(data).length);
console.log('Compressed size:', compressed.length);
console.log('Data preserved:', JSON.stringify(data) === JSON.stringify(decompressed));
```

## Compression Comparison

Typical compression ratios for text data (2KB Lorem Ipsum):

| Algorithm | Compressed Size | Reduction | Speed |
|-----------|-----------------|-----------|-------|
| Gzip | 1052 bytes | 47.9% | Fast |
| Deflate | 1040 bytes | 48.5% | Fast |
| DeflateRaw | 1034 bytes | 48.8% | Fast |
| **Brotli** | **751 bytes** | **62.8%** | Slower |

### When to Use Each Algorithm

| Algorithm | Best For |
|-----------|----------|
| **Gzip** | HTTP compression, general purpose, wide compatibility |
| **Deflate** | ZIP files, PNG images, HTTP (older) |
| **DeflateRaw** | Custom protocols, embedded systems |
| **Brotli** | Static content, web assets, when size matters most |

## React Native Usage

```javascript
import zlib from 'react-zlib-js';

// Compress API request body
async function sendCompressedData(data) {
  const jsonString = JSON.stringify(data);
  const compressed = zlib.gzipSync(jsonString);

  const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    },
    body: compressed
  });

  return response.json();
}

// Decompress API response
async function receiveCompressedData(url) {
  const response = await fetch(url);
  const compressed = await response.arrayBuffer();
  const decompressed = zlib.gunzipSync(Buffer.from(compressed));
  return JSON.parse(decompressed.toString());
}

// Compress for local storage
function saveCompressed(key, data) {
  const compressed = zlib.gzipSync(JSON.stringify(data));
  const base64 = compressed.toString('base64');
  AsyncStorage.setItem(key, base64);
}

// Decompress from local storage
async function loadCompressed(key) {
  const base64 = await AsyncStorage.getItem(key);
  if (!base64) return null;
  const compressed = Buffer.from(base64, 'base64');
  const decompressed = zlib.gunzipSync(compressed);
  return JSON.parse(decompressed.toString());
}
```

## Browser Usage

### With Webpack/Browserify

```javascript
const zlib = require('react-zlib-js');

// Works in browser environment
const compressed = zlib.deflateSync('Browser data');
const decompressed = zlib.inflateSync(compressed);
console.log(decompressed.toString());
```

### Direct Script Include

```html
<script src="path/to/index.js"></script>
<script src="path/to/buffer.js"></script>
<script>
  // zlib is available globally
  const compressed = zlib.gzipSync('Hello from browser');
  console.log('Compressed size:', compressed.length);
</script>
```

## Building from Source

```bash
# Clone repository
git clone https://github.com/anuraghkp1/zlib.git
cd zlib

# Install dependencies
npm install

# Build bundles
npm run build           # Build index.js (main bundle)
npm run build:buffer    # Build buffer.js

# Run tests
npm test
```

### Project Structure

```
zlib/
├── src/
│   ├── binding.js        # Low-level zlib binding using pako
│   ├── brotli-binding.js # Brotli binding using brotli npm package
│   ├── zlib.js           # Main zlib module with all exports
│   └── entry.js          # Browserify entry point
├── index.js              # Browserified main bundle (~1.3MB)
├── buffer.js             # Buffer implementation (~55KB)
├── test.js               # Comprehensive test suite (121 tests)
├── package.json          # Package configuration
└── README.md             # This documentation
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `pako` | Pure JS deflate/inflate implementation |
| `brotli` | Pure JS Brotli implementation |
| `browserify` | Bundle for browser (dev dependency) |

## Migration from v1.x

### New in v2.0.0

#### 1. Brotli Compression Support

```javascript
// New methods available
zlib.brotliCompress(data, callback);
zlib.brotliCompressSync(data);
zlib.brotliDecompress(data, callback);
zlib.brotliDecompressSync(data);
zlib.createBrotliCompress();
zlib.createBrotliDecompress();

// New classes
new zlib.BrotliCompress(options);
new zlib.BrotliDecompress(options);
```

#### 2. CRC32 Function

```javascript
// Calculate checksums
const crc = zlib.crc32('data');
const chainedCrc = zlib.crc32('more data', crc);
```

#### 3. Brotli Constants

```javascript
// All Brotli constants now available
zlib.BROTLI_OPERATION_PROCESS
zlib.BROTLI_OPERATION_FLUSH
zlib.BROTLI_OPERATION_FINISH
zlib.BROTLI_PARAM_MODE
zlib.BROTLI_PARAM_QUALITY
zlib.BROTLI_MODE_TEXT
zlib.BROTLI_MODE_GENERIC
zlib.BROTLI_MODE_FONT
// ... and more
```

#### 4. Constants Object

```javascript
// Access all constants via zlib.constants
zlib.constants.Z_BEST_COMPRESSION
zlib.constants.BROTLI_MAX_QUALITY
```

### Breaking Changes

**None!** Version 2.0.0 is fully backward compatible with v1.x. All existing code will continue to work without modifications.

## Troubleshooting

### "Not a string or buffer" Error

**Problem:** Input data is not a valid type.

**Solution:** Ensure input is a string, Buffer, or Uint8Array:

```javascript
// Wrong
zlib.gzipSync(123);
zlib.gzipSync({ data: 'test' });

// Correct
zlib.gzipSync('123');
zlib.gzipSync(Buffer.from('123'));
zlib.gzipSync(JSON.stringify({ data: 'test' }));
```

### Brotli Fails on Very Short Data

**Problem:** Brotli library may have issues with very short inputs (<10 bytes).

**Solution:** Use Gzip/Deflate for very short strings:

```javascript
const data = 'Hi';

// May fail with very short data
// zlib.brotliCompressSync(data);

// Use gzip instead for short data
const compressed = zlib.gzipSync(data);
```

### Memory Issues with Large Data

**Problem:** Out of memory when compressing large data.

**Solution:** Use streaming for large data:

```javascript
// Instead of sync methods for large data
// const compressed = zlib.gzipSync(hugeData); // May run out of memory

// Use streaming
const gzip = zlib.createGzip();
const chunks = [];

gzip.on('data', chunk => chunks.push(chunk));
gzip.on('end', () => {
  const compressed = Buffer.concat(chunks);
  // Process compressed data
});

// Process in chunks
const chunkSize = 64 * 1024; // 64KB chunks
for (let i = 0; i < hugeData.length; i += chunkSize) {
  gzip.write(hugeData.slice(i, i + chunkSize));
}
gzip.end();
```

### Decompression Errors

**Problem:** "invalid header" or "data error" when decompressing.

**Solution:** Ensure you're using the correct decompression method:

```javascript
// Wrong: Using gunzip for deflate data
const deflated = zlib.deflateSync('test');
// zlib.gunzipSync(deflated); // Error!

// Correct: Match compression and decompression methods
const deflated = zlib.deflateSync('test');
const result = zlib.inflateSync(deflated); // Works!

// Or use unzip for auto-detection
const result = zlib.unzipSync(deflated); // Also works!
```

### Performance Tips

1. **Use Brotli for static content** - Better compression, slower
2. **Use Gzip for dynamic content** - Good compression, fast
3. **Use sync methods sparingly** - They block the event loop
4. **Set appropriate compression level** - Balance size vs speed
5. **Reuse streams when possible** - Avoid creating new instances

## License

MIT License

Copyright (c) 2020-2025 Anuragh K.P

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Author

**Anuragh K.P**

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Links

- [npm Package](https://www.npmjs.com/package/react-zlib-js)
- [GitHub Repository](https://github.com/anuraghkp1/zlib)
- [Issue Tracker](https://github.com/anuraghkp1/zlib/issues)
- [Node.js zlib Documentation](https://nodejs.org/api/zlib.html)

---

**Made with JavaScript for JavaScript**
