'use strict';

// Package entry point for Node. Kept separate from zlib.js so that the
// browserify build (whose entry is zlib.js) is never itself rewritten by the
// "browser" field, which redirects the package main to the prebuilt bundle.
module.exports = require('./zlib');
