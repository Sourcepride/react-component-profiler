# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- component search (coming soon...)
- bug fix for windows (cannot show components list)

## [0.0.3] - 2024-12-27

### Fixes

- resolved issues with file extension braking code
- use standard lib for path manipulation

## [0.0.2] - 2024-04-23

### Added

- bundler esbuild
- main in package.json now points to ./dist/extension.js

### Fixes

- command not registered.

## [0.0.1] - 2024-04-22

### Added

- number of components in component folders
- number of components present in every file
- number of times a component is used by other components
- link to possible files component is called from
- list of all hooks used in a component file
- refresh
- show only component files toggle
- show only components toggle

[unreleased]: https://github.com/Sourcepride/react-component-profiler/releases/tag/0.0.2...HEAD
[0.0.1]: https://github.com/Sourcepride/react-component-profiler/releases/tag/0.0.1
[0.0.2]: https://github.com/Sourcepride/react-component-profiler/releases/tag/0.0.2
