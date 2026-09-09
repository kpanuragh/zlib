# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | :white_check_mark: |
| 2.x     | :x:                |
| < 2.0   | :x:                |

Only the latest 3.x release receives security updates. 2.x is no longer
maintained; see [Migration to v3.x](README.md#migration-to-v3x).

## Reporting a Vulnerability

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/kpanuragh/zlib/security/advisories/new),
or by email to the maintainer listed in `package.json`. Please do not open a
public issue for a security problem.

Include the package version, a minimal reproduction, and the impact you
believe it has. You can expect an acknowledgement within a week. If the report
is accepted, a fix and an advisory follow; if it is declined, you will get an
explanation of why.

## Scope

This package decompresses untrusted input, so the risks worth reporting are
mainly:

- Input that causes unbounded memory growth or fails to terminate.
- Input that produces output differing from what Node's native `zlib`
  produces for the same bytes.
- Any way to escape the `maxOutputLength` cap.

Decompression bombs are a known hazard of the format rather than a defect in
this package. Pass `maxOutputLength` whenever you decompress data you did not
produce yourself:

```javascript
zlib.gunzipSync(untrusted, { maxOutputLength: 10 * 1024 * 1024 });
```

Note that Zstd compression is not implemented and throws by design; that is a
documented limitation, not a vulnerability.

## Dependency advisories

`npm audit --omit=dev` reports no vulnerabilities. The package's runtime
dependencies are `pako`, `brotli` and `fzstd`.

Advisories you may see against this repository come from the `browserify`
devDependency tree, which is used only to build `index.js`. In particular
`elliptic` currently has an advisory covering every published version, so
there is nothing to upgrade to. It reaches no shipped file: nothing in `src/`
requires `crypto`, so the crypto shims are never bundled, and the published
tarball contains only `src/`, the built bundle, the type definitions and the
documentation.
