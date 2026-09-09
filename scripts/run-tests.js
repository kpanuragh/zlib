'use strict';

// Runs the suite once per entry point: the raw source that Node loads, and
// the browserify bundle that browsers and React Native load. Spawning keeps
// the two module graphs apart and works the same on every platform.
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var path = require('path');

var testDir = path.join(__dirname, '..', 'test');
var testFiles = fs.readdirSync(testDir)
  .filter(function (name) { return name.endsWith('.test.js'); })
  .sort()
  .map(function (name) { return path.join('test', name); });

var entries = process.argv.slice(2);
if (entries.length === 0) entries = ['src', 'bundle'];

var failed = [];

entries.forEach(function (entry) {
  process.stdout.write('\n=== test entry: ' + entry + ' ===\n');

  var result = spawnSync(process.execPath, ['--test'].concat(testFiles), {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { ZLIB_ENTRY: entry })
  });

  if (result.status !== 0) failed.push(entry);
});

if (failed.length > 0) {
  process.stderr.write('\nFAILED for entry: ' + failed.join(', ') + '\n');
  process.exit(1);
}

process.stdout.write('\nAll entries passed.\n');
