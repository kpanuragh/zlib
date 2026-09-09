'use strict';

// Zlib, Brotli and Zstd constants, matching Node.js core `zlib.constants`.
//
// Hardcoded on purpose: this package exists to run where there is no zlib
// module to read them from, and pako's table is missing several of them.
// Regenerate with scripts/gen-constants.js against a current Node.

// Flush values
exports.Z_NO_FLUSH =      0;
exports.Z_PARTIAL_FLUSH = 1;
exports.Z_SYNC_FLUSH =    2;
exports.Z_FULL_FLUSH =    3;
exports.Z_FINISH =        4;
exports.Z_BLOCK =         5;
exports.Z_TREES =         6;

// Return codes
exports.Z_OK =            0;
exports.Z_STREAM_END =    1;
exports.Z_NEED_DICT =     2;
exports.Z_ERRNO =         -1;
exports.Z_STREAM_ERROR =  -2;
exports.Z_DATA_ERROR =    -3;
exports.Z_MEM_ERROR =     -4;
exports.Z_BUF_ERROR =     -5;
exports.Z_VERSION_ERROR = -6;

// Compression levels
exports.Z_NO_COMPRESSION =      0;
exports.Z_BEST_SPEED =          1;
exports.Z_BEST_COMPRESSION =    9;
exports.Z_DEFAULT_COMPRESSION = -1;

// Compression strategies
exports.Z_FILTERED =         1;
exports.Z_HUFFMAN_ONLY =     2;
exports.Z_RLE =              3;
exports.Z_FIXED =            4;
exports.Z_DEFAULT_STRATEGY = 0;

// Data types
exports.Z_BINARY =   0;
exports.Z_TEXT =     1;
exports.Z_UNKNOWN =  2;
exports.Z_DEFLATED = 8;

// Limits and defaults
exports.Z_MIN_WINDOWBITS =     8;
exports.Z_MAX_WINDOWBITS =     15;
exports.Z_DEFAULT_WINDOWBITS = 15;
exports.Z_MIN_CHUNK =          64;
exports.Z_MAX_CHUNK =          Infinity;
exports.Z_DEFAULT_CHUNK =      16384;
exports.Z_MIN_MEMLEVEL =       1;
exports.Z_MAX_MEMLEVEL =       9;
exports.Z_DEFAULT_MEMLEVEL =   8;
exports.Z_MIN_LEVEL =          -1;
exports.Z_MAX_LEVEL =          9;
exports.Z_DEFAULT_LEVEL =      -1;
exports.ZLIB_VERNUM =          4880;

// Engine modes
exports.NONE =            0;
exports.DEFLATE =         1;
exports.INFLATE =         2;
exports.GZIP =            3;
exports.GUNZIP =          4;
exports.DEFLATERAW =      5;
exports.INFLATERAW =      6;
exports.UNZIP =           7;
exports.BROTLI_DECODE =   8;
exports.BROTLI_ENCODE =   9;
exports.ZSTD_COMPRESS =   10;
exports.ZSTD_DECOMPRESS = 11;

// Brotli operations
exports.BROTLI_OPERATION_PROCESS =       0;
exports.BROTLI_OPERATION_FLUSH =         1;
exports.BROTLI_OPERATION_FINISH =        2;
exports.BROTLI_OPERATION_EMIT_METADATA = 3;

// Brotli encoder parameters
exports.BROTLI_PARAM_MODE =                             0;
exports.BROTLI_PARAM_QUALITY =                          1;
exports.BROTLI_PARAM_LGWIN =                            2;
exports.BROTLI_PARAM_LGBLOCK =                          3;
exports.BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING = 4;
exports.BROTLI_PARAM_SIZE_HINT =                        5;
exports.BROTLI_PARAM_LARGE_WINDOW =                     6;
exports.BROTLI_PARAM_NPOSTFIX =                         7;
exports.BROTLI_PARAM_NDIRECT =                          8;

// Brotli encoder modes
exports.BROTLI_MODE_GENERIC = 0;
exports.BROTLI_MODE_TEXT =    1;
exports.BROTLI_MODE_FONT =    2;
exports.BROTLI_DEFAULT_MODE = 0;

// Brotli quality and window limits
exports.BROTLI_MIN_QUALITY =           0;
exports.BROTLI_MAX_QUALITY =           11;
exports.BROTLI_DEFAULT_QUALITY =       11;
exports.BROTLI_MIN_WINDOW_BITS =       10;
exports.BROTLI_MAX_WINDOW_BITS =       24;
exports.BROTLI_LARGE_MAX_WINDOW_BITS = 30;
exports.BROTLI_DEFAULT_WINDOW =        22;
exports.BROTLI_MIN_INPUT_BLOCK_BITS =  16;
exports.BROTLI_MAX_INPUT_BLOCK_BITS =  24;

// Brotli decoder parameters
exports.BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION = 0;
exports.BROTLI_DECODER_PARAM_LARGE_WINDOW =                     1;

// Brotli decoder results
exports.BROTLI_DECODER_RESULT_ERROR =             0;
exports.BROTLI_DECODER_RESULT_SUCCESS =           1;
exports.BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT =  2;
exports.BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT = 3;
exports.BROTLI_DECODER_NO_ERROR =                 0;
exports.BROTLI_DECODER_SUCCESS =                  1;
exports.BROTLI_DECODER_NEEDS_MORE_INPUT =         2;
exports.BROTLI_DECODER_NEEDS_MORE_OUTPUT =        3;

// Brotli decoder error codes
exports.BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE =        -1;
exports.BROTLI_DECODER_ERROR_FORMAT_RESERVED =                -2;
exports.BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE =   -3;
exports.BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET = -4;
exports.BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME =     -5;
exports.BROTLI_DECODER_ERROR_FORMAT_CL_SPACE =                -6;
exports.BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE =           -7;
exports.BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT =      -8;
exports.BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1 =          -9;
exports.BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2 =          -10;
exports.BROTLI_DECODER_ERROR_FORMAT_TRANSFORM =               -11;
exports.BROTLI_DECODER_ERROR_FORMAT_DICTIONARY =              -12;
exports.BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS =             -13;
exports.BROTLI_DECODER_ERROR_FORMAT_PADDING_1 =               -14;
exports.BROTLI_DECODER_ERROR_FORMAT_PADDING_2 =               -15;
exports.BROTLI_DECODER_ERROR_FORMAT_DISTANCE =                -16;
exports.BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET =             -19;
exports.BROTLI_DECODER_ERROR_INVALID_ARGUMENTS =              -20;
exports.BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES =            -21;
exports.BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS =              -22;
exports.BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP =              -25;
exports.BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1 =            -26;
exports.BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2 =            -27;
exports.BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES =         -30;
exports.BROTLI_DECODER_ERROR_UNREACHABLE =                    -31;

// Zstd end directives
exports.ZSTD_e_continue = 0;
exports.ZSTD_e_flush =    1;
exports.ZSTD_e_end =      2;

// Zstd compression parameters
exports.ZSTD_c_compressionLevel =           100;
exports.ZSTD_c_windowLog =                  101;
exports.ZSTD_c_hashLog =                    102;
exports.ZSTD_c_chainLog =                   103;
exports.ZSTD_c_searchLog =                  104;
exports.ZSTD_c_minMatch =                   105;
exports.ZSTD_c_targetLength =               106;
exports.ZSTD_c_strategy =                   107;
exports.ZSTD_c_enableLongDistanceMatching = 160;
exports.ZSTD_c_ldmHashLog =                 161;
exports.ZSTD_c_ldmMinMatch =                162;
exports.ZSTD_c_ldmBucketSizeLog =           163;
exports.ZSTD_c_ldmHashRateLog =             164;
exports.ZSTD_c_contentSizeFlag =            200;
exports.ZSTD_c_checksumFlag =               201;
exports.ZSTD_c_dictIDFlag =                 202;
exports.ZSTD_c_nbWorkers =                  400;
exports.ZSTD_c_jobSize =                    401;
exports.ZSTD_c_overlapLog =                 402;

// Zstd decompression parameters
exports.ZSTD_d_windowLogMax = 100;

// Zstd strategies
exports.ZSTD_fast =     1;
exports.ZSTD_dfast =    2;
exports.ZSTD_greedy =   3;
exports.ZSTD_lazy =     4;
exports.ZSTD_lazy2 =    5;
exports.ZSTD_btlazy2 =  6;
exports.ZSTD_btopt =    7;
exports.ZSTD_btultra =  8;
exports.ZSTD_btultra2 = 9;

// Zstd compression levels
exports.ZSTD_CLEVEL_DEFAULT = 3;

// Zstd error codes
exports.ZSTD_error_no_error =                          0;
exports.ZSTD_error_GENERIC =                           1;
exports.ZSTD_error_prefix_unknown =                    10;
exports.ZSTD_error_version_unsupported =               12;
exports.ZSTD_error_frameParameter_unsupported =        14;
exports.ZSTD_error_frameParameter_windowTooLarge =     16;
exports.ZSTD_error_corruption_detected =               20;
exports.ZSTD_error_checksum_wrong =                    22;
exports.ZSTD_error_literals_headerWrong =              24;
exports.ZSTD_error_dictionary_corrupted =              30;
exports.ZSTD_error_dictionary_wrong =                  32;
exports.ZSTD_error_dictionaryCreation_failed =         34;
exports.ZSTD_error_parameter_unsupported =             40;
exports.ZSTD_error_parameter_combination_unsupported = 41;
exports.ZSTD_error_parameter_outOfBound =              42;
exports.ZSTD_error_tableLog_tooLarge =                 44;
exports.ZSTD_error_maxSymbolValue_tooLarge =           46;
exports.ZSTD_error_maxSymbolValue_tooSmall =           48;
exports.ZSTD_error_stabilityCondition_notRespected =   50;
exports.ZSTD_error_stage_wrong =                       60;
exports.ZSTD_error_init_missing =                      62;
exports.ZSTD_error_memory_allocation =                 64;
exports.ZSTD_error_workSpace_tooSmall =                66;
exports.ZSTD_error_dstSize_tooSmall =                  70;
exports.ZSTD_error_srcSize_wrong =                     72;
exports.ZSTD_error_dstBuffer_null =                    74;
exports.ZSTD_error_noForwardProgress_destFull =        80;
exports.ZSTD_error_noForwardProgress_inputEmpty =      82;
