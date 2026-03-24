/// <reference types="node" />

import { Transform } from 'stream';

/**
 * Options for zlib compression methods (deflate, gzip, deflateRaw)
 */
export interface ZlibOptions {
  /** The flush flag - one of the Z_*_FLUSH constants */
  flush?: number;
  /** The finish flush flag */
  finishFlush?: number;
  /** Chunk size for streaming (default: 16 * 1024) */
  chunkSize?: number;
  /** Window bits (default: 15) */
  windowBits?: number;
  /** Compression level (0-9 or -1) */
  level?: number;
  /** Memory level (1-9, default: 8) */
  memLevel?: number;
  /** Compression strategy (Z_DEFAULT_STRATEGY, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE) */
  strategy?: number;
  /** Compression dictionary */
  dictionary?: Buffer | Uint8Array;
}

/**
 * Options for Brotli compression methods
 */
export interface BrotliOptions {
  /** The flush flag */
  flush?: number;
  /** The finish flush flag */
  finishFlush?: number;
  /** Chunk size for streaming */
  chunkSize?: number;
  /** Brotli encoder/decoder parameters object */
  params?: Record<number, number>;
}

/**
 * Zlib constants
 */
// Compression levels
export const Z_NO_COMPRESSION: number;
export const Z_BEST_SPEED: number;
export const Z_BEST_COMPRESSION: number;
export const Z_DEFAULT_COMPRESSION: number;

// Flush flags
export const Z_NO_FLUSH: number;
export const Z_PARTIAL_FLUSH: number;
export const Z_SYNC_FLUSH: number;
export const Z_FULL_FLUSH: number;
export const Z_FINISH: number;
export const Z_BLOCK: number;

// Return codes
export const Z_OK: number;
export const Z_STREAM_END: number;
export const Z_NEED_DICT: number;
export const Z_ERRNO: number;
export const Z_STREAM_ERROR: number;
export const Z_DATA_ERROR: number;
export const Z_MEM_ERROR: number;
export const Z_BUF_ERROR: number;
export const Z_VERSION_ERROR: number;

// Strategies
export const Z_FILTERED: number;
export const Z_HUFFMAN_ONLY: number;
export const Z_RLE: number;
export const Z_DEFAULT_STRATEGY: number;

// Window bits
export const Z_MIN_WINDOWBITS: number;
export const Z_MAX_WINDOWBITS: number;
export const Z_DEFAULT_WINDOWBITS: number;

// Chunk size
export const Z_MIN_CHUNK: number;
export const Z_MAX_CHUNK: number;
export const Z_DEFAULT_CHUNK: number;

// Memory level
export const Z_MIN_MEMLEVEL: number;
export const Z_MAX_MEMLEVEL: number;
export const Z_DEFAULT_MEMLEVEL: number;

// Compression level limits
export const Z_MIN_LEVEL: number;
export const Z_MAX_LEVEL: number;
export const Z_DEFAULT_LEVEL: number;

// Brotli constants (Node.js 11.7.0+)
// Brotli operations
export const BROTLI_OPERATION_PROCESS: number;
export const BROTLI_OPERATION_FLUSH: number;
export const BROTLI_OPERATION_FINISH: number;
export const BROTLI_OPERATION_EMIT_METADATA: number;

// Brotli modes
export const BROTLI_MODE_GENERIC: number;
export const BROTLI_MODE_TEXT: number;
export const BROTLI_MODE_FONT: number;

// Brotli quality
export const BROTLI_MIN_QUALITY: number;
export const BROTLI_MAX_QUALITY: number;
export const BROTLI_DEFAULT_QUALITY: number;

// Brotli window bits
export const BROTLI_MIN_WINDOW_BITS: number;
export const BROTLI_MAX_WINDOW_BITS: number;
export const BROTLI_LARGE_MAX_WINDOW_BITS: number;
export const BROTLI_DEFAULT_WINDOW: number;

// Brotli input block bits
export const BROTLI_MIN_INPUT_BLOCK_BITS: number;
export const BROTLI_MAX_INPUT_BLOCK_BITS: number;

// Brotli encoder parameters
export const BROTLI_PARAM_MODE: number;
export const BROTLI_PARAM_QUALITY: number;
export const BROTLI_PARAM_LGWIN: number;
export const BROTLI_PARAM_LGBLOCK: number;
export const BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: number;
export const BROTLI_PARAM_SIZE_HINT: number;
export const BROTLI_PARAM_LARGE_WINDOW: number;
export const BROTLI_PARAM_NPOSTFIX: number;
export const BROTLI_PARAM_NDIRECT: number;

// Brotli decoder parameters
export const BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: number;
export const BROTLI_DECODER_PARAM_LARGE_WINDOW: number;

// Brotli decoder result codes
export const BROTLI_DECODER_RESULT_ERROR: number;
export const BROTLI_DECODER_RESULT_SUCCESS: number;
export const BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: number;
export const BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: number;

/**
 * Constants object containing all zlib and Brotli constants (Node.js 7.0.0+)
 */
export interface ConstantsType {
  Z_NO_COMPRESSION: number;
  Z_BEST_SPEED: number;
  Z_BEST_COMPRESSION: number;
  Z_DEFAULT_COMPRESSION: number;
  Z_NO_FLUSH: number;
  Z_PARTIAL_FLUSH: number;
  Z_SYNC_FLUSH: number;
  Z_FULL_FLUSH: number;
  Z_FINISH: number;
  Z_BLOCK: number;
  Z_OK: number;
  Z_STREAM_END: number;
  Z_NEED_DICT: number;
  Z_ERRNO: number;
  Z_STREAM_ERROR: number;
  Z_DATA_ERROR: number;
  Z_MEM_ERROR: number;
  Z_BUF_ERROR: number;
  Z_VERSION_ERROR: number;
  Z_FILTERED: number;
  Z_HUFFMAN_ONLY: number;
  Z_RLE: number;
  Z_DEFAULT_STRATEGY: number;
  Z_MIN_WINDOWBITS: number;
  Z_MAX_WINDOWBITS: number;
  Z_DEFAULT_WINDOWBITS: number;
  Z_MIN_CHUNK: number;
  Z_MAX_CHUNK: number;
  Z_DEFAULT_CHUNK: number;
  Z_MIN_MEMLEVEL: number;
  Z_MAX_MEMLEVEL: number;
  Z_DEFAULT_MEMLEVEL: number;
  Z_MIN_LEVEL: number;
  Z_MAX_LEVEL: number;
  Z_DEFAULT_LEVEL: number;
  BROTLI_OPERATION_PROCESS: number;
  BROTLI_OPERATION_FLUSH: number;
  BROTLI_OPERATION_FINISH: number;
  BROTLI_OPERATION_EMIT_METADATA: number;
  BROTLI_MODE_GENERIC: number;
  BROTLI_MODE_TEXT: number;
  BROTLI_MODE_FONT: number;
  BROTLI_MIN_QUALITY: number;
  BROTLI_MAX_QUALITY: number;
  BROTLI_DEFAULT_QUALITY: number;
  BROTLI_MIN_WINDOW_BITS: number;
  BROTLI_MAX_WINDOW_BITS: number;
  BROTLI_LARGE_MAX_WINDOW_BITS: number;
  BROTLI_DEFAULT_WINDOW: number;
  BROTLI_MIN_INPUT_BLOCK_BITS: number;
  BROTLI_MAX_INPUT_BLOCK_BITS: number;
  BROTLI_PARAM_MODE: number;
  BROTLI_PARAM_QUALITY: number;
  BROTLI_PARAM_LGWIN: number;
  BROTLI_PARAM_LGBLOCK: number;
  BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: number;
  BROTLI_PARAM_SIZE_HINT: number;
  BROTLI_PARAM_LARGE_WINDOW: number;
  BROTLI_PARAM_NPOSTFIX: number;
  BROTLI_PARAM_NDIRECT: number;
  BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: number;
  BROTLI_DECODER_PARAM_LARGE_WINDOW: number;
  BROTLI_DECODER_RESULT_ERROR: number;
  BROTLI_DECODER_RESULT_SUCCESS: number;
  BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: number;
  BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: number;
}

export const constants: ConstantsType;

/**
 * Error codes mapping
 */
export interface CodesType {
  Z_OK: number;
  Z_STREAM_END: number;
  Z_NEED_DICT: number;
  Z_ERRNO: number;
  Z_STREAM_ERROR: number;
  Z_DATA_ERROR: number;
  Z_MEM_ERROR: number;
  Z_BUF_ERROR: number;
  Z_VERSION_ERROR: number;
  [key: number]: string;
}

export const codes: CodesType;

/**
 * Stream classes
 */
export class Deflate extends Transform {
  constructor(options?: ZlibOptions);
}

export class Inflate extends Transform {
  constructor(options?: ZlibOptions);
}

export class Gzip extends Transform {
  constructor(options?: ZlibOptions);
}

export class Gunzip extends Transform {
  constructor(options?: ZlibOptions);
}

export class DeflateRaw extends Transform {
  constructor(options?: ZlibOptions);
}

export class InflateRaw extends Transform {
  constructor(options?: ZlibOptions);
}

export class Unzip extends Transform {
  constructor(options?: ZlibOptions);
}

export class BrotliCompress extends Transform {
  constructor(options?: BrotliOptions);
}

export class BrotliDecompress extends Transform {
  constructor(options?: BrotliOptions);
}

/**
 * Factory functions for creating stream instances
 */
export function createDeflate(options?: ZlibOptions): Deflate;
export function createInflate(options?: ZlibOptions): Inflate;
export function createGzip(options?: ZlibOptions): Gzip;
export function createGunzip(options?: ZlibOptions): Gunzip;
export function createDeflateRaw(options?: ZlibOptions): DeflateRaw;
export function createInflateRaw(options?: ZlibOptions): InflateRaw;
export function createUnzip(options?: ZlibOptions): Unzip;
export function createBrotliCompress(options?: BrotliOptions): BrotliCompress;
export function createBrotliDecompress(options?: BrotliOptions): BrotliDecompress;

/**
 * Deflate: Promise and callback overloads
 */
export function deflate(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function deflate(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function deflate(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function deflate(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * Deflate synchronous
 */
export function deflateSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * Inflate: Promise and callback overloads
 */
export function inflate(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function inflate(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function inflate(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function inflate(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * Inflate synchronous
 */
export function inflateSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * Gzip: Promise and callback overloads
 */
export function gzip(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function gzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function gzip(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function gzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * Gzip synchronous
 */
export function gzipSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * Gunzip: Promise and callback overloads
 */
export function gunzip(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function gunzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function gunzip(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function gunzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * Gunzip synchronous
 */
export function gunzipSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * DeflateRaw: Promise and callback overloads
 */
export function deflateRaw(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function deflateRaw(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function deflateRaw(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function deflateRaw(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * DeflateRaw synchronous
 */
export function deflateRawSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * InflateRaw: Promise and callback overloads
 */
export function inflateRaw(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function inflateRaw(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function inflateRaw(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function inflateRaw(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * InflateRaw synchronous
 */
export function inflateRawSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * Unzip (auto-detect): Promise and callback overloads
 */
export function unzip(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function unzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions): Promise<Buffer>;
export function unzip(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function unzip(buffer: string | Buffer | Uint8Array, options: ZlibOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * Unzip synchronous
 */
export function unzipSync(buffer: string | Buffer | Uint8Array, options?: ZlibOptions): Buffer;

/**
 * BrotliCompress: Promise and callback overloads (Node.js 11.7.0+)
 */
export function brotliCompress(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function brotliCompress(buffer: string | Buffer | Uint8Array, options: BrotliOptions): Promise<Buffer>;
export function brotliCompress(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function brotliCompress(buffer: string | Buffer | Uint8Array, options: BrotliOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * BrotliCompress synchronous
 */
export function brotliCompressSync(buffer: string | Buffer | Uint8Array, options?: BrotliOptions): Buffer;

/**
 * BrotliDecompress: Promise and callback overloads (Node.js 11.7.0+)
 */
export function brotliDecompress(buffer: string | Buffer | Uint8Array): Promise<Buffer>;
export function brotliDecompress(buffer: string | Buffer | Uint8Array, options: BrotliOptions): Promise<Buffer>;
export function brotliDecompress(buffer: string | Buffer | Uint8Array, callback: (error: Error | null, result?: Buffer) => void): void;
export function brotliDecompress(buffer: string | Buffer | Uint8Array, options: BrotliOptions, callback: (error: Error | null, result?: Buffer) => void): void;

/**
 * BrotliDecompress synchronous
 */
export function brotliDecompressSync(buffer: string | Buffer | Uint8Array, options?: BrotliOptions): Buffer;

/**
 * Compute CRC32 checksum
 */
export function crc32(data: string | Buffer | Uint8Array, value?: number): number;
