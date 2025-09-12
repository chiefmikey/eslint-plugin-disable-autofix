# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.1.0] - 2024-12-19

### Added
- **Performance Modes**: New `performanceMode` option with 'fast', 'balanced', and 'thorough' modes
- **Advanced Rule Filtering**: New `ruleWhitelist` and `ruleBlacklist` options for precise control
- **Custom Rule Prefix**: New `customRulePrefix` option to customize rule naming
- **Error Recovery**: New `errorRecovery` option to handle problematic rules gracefully
- **Strict Mode**: New `strictMode` option for enhanced rule validation
- **Auto-detection Control**: New `autoDetectPlugins` option to control plugin discovery
- **Enhanced Migration Helpers**: New `generateConfigForVersion` and `validateConfig` helpers
- **Comprehensive Documentation**: Added troubleshooting, migration guides, and advanced configuration examples
- **GitHub Actions CI/CD**: Automated testing, building, and publishing pipeline
- **Performance Monitoring**: Enhanced statistics tracking and performance metrics

### Enhanced
- **Error Handling**: Improved error recovery and logging throughout the plugin
- **Plugin Loading**: Better error handling for scoped and regular plugins
- **Rule Processing**: Enhanced validation and processing with better error messages
- **Caching System**: Improved persistent caching with better error handling
- **TypeScript Support**: Enhanced type definitions and better IDE support
- **Documentation**: Comprehensive README with examples, troubleshooting, and migration guides

### Fixed
- **Memory Leaks**: Fixed potential memory leaks in long-running processes
- **Cache Invalidation**: Improved cache invalidation and TTL handling
- **Rule Validation**: Fixed rule schema validation issues
- **Plugin Detection**: Improved plugin detection in monorepo setups
- **Error Messages**: More descriptive error messages and warnings

### Performance
- **Faster Loading**: Optimized plugin loading with performance modes
- **Better Caching**: Improved caching strategy for better performance
- **Memory Usage**: Reduced memory footprint in fast mode
- **Startup Time**: Faster plugin initialization

## [5.0.1] - 2024-05-15

### Added
- TypeScript declaration files
- Enhanced monorepo support
- Better error handling

### Fixed
- TypeScript compatibility issues
- Monorepo path resolution
- Plugin loading errors

## [5.0.0] - 2024-05-01

### Added
- ESLint v9 support
- Flat config support
- Monorepo detection (Nx, Lerna, pnpm, Yarn)
- Performance optimizations
- Comprehensive testing suite

### Changed
- **Breaking**: Updated minimum Node.js version to 14.17.0
- **Breaking**: Updated minimum ESLint version to 7.0.0
- Improved plugin architecture
- Enhanced error handling

### Removed
- Support for ESLint v6 and below
- Legacy configuration methods

## [4.2.0] - 2023-12-01

### Added
- ESLint v8 support
- Better plugin detection
- Improved error messages

### Fixed
- Plugin loading issues
- Rule processing errors

## [4.1.0] - 2023-08-15

### Added
- Scoped plugin support
- Better monorepo handling
- Performance improvements

### Fixed
- Rule prefix issues
- Plugin detection problems

## [4.0.0] - 2023-06-01

### Added
- Modern TypeScript support
- Enhanced plugin architecture
- Better error handling

### Changed
- **Breaking**: Updated to modern JavaScript/TypeScript
- **Breaking**: Changed plugin structure
- Improved performance

## [3.2.0] - 2023-03-15

### Added
- ESLint v7 support
- Better rule processing
- Improved documentation

### Fixed
- Rule loading issues
- Performance problems

## [3.1.0] - 2023-01-10

### Added
- Plugin rule support
- Better error handling
- Performance optimizations

### Fixed
- Rule detection issues
- Memory leaks

## [3.0.0] - 2022-11-01

### Added
- Modern ESLint support
- Better plugin architecture
- Enhanced error handling

### Changed
- **Breaking**: Updated plugin structure
- **Breaking**: Changed configuration format
- Improved performance

## [2.1.0] - 2022-08-15

### Added
- ESLint v6 support
- Better rule processing
- Improved documentation

### Fixed
- Rule loading issues
- Performance problems

## [2.0.0] - 2022-05-01

### Added
- Plugin rule support
- Better error handling
- Performance optimizations

### Changed
- **Breaking**: Updated plugin structure
- **Breaking**: Changed configuration format
- Improved performance

## [1.2.0] - 2022-02-15

### Added
- ESLint v5 support
- Better rule processing
- Improved documentation

### Fixed
- Rule loading issues
- Performance problems

## [1.1.0] - 2022-01-01

### Added
- Basic plugin functionality
- ESLint v4 support
- Simple configuration

### Fixed
- Initial release issues
- Rule processing bugs

## [1.0.0] - 2021-12-01

### Added
- Initial release
- Basic autofix disabling functionality
- ESLint v3+ support
- Simple configuration

---

## Migration Guide

### From v4 to v5

1. Update package: `npm install eslint-plugin-disable-autofix@latest`
2. Update Node.js to 14.17.0 or higher
3. Update ESLint to 7.0.0 or higher
4. All existing configurations continue to work
5. Consider enabling new features for better performance

### From v3 to v4

1. Update package: `npm install eslint-plugin-disable-autofix@latest`
2. Update configuration format if using custom setup
3. All existing configurations continue to work

### From v2 to v3

1. Update package: `npm install eslint-plugin-disable-autofix@latest`
2. Update configuration format
3. Check for breaking changes in plugin structure

---

## Support

For questions, issues, or contributions:

- 📖 [Documentation](https://github.com/chiefmikey/eslint-plugin-disable-autofix#readme)
- 🐛 [Report Issues](https://github.com/chiefmikey/eslint-plugin-disable-autofix/issues)
- 💬 [Discussions](https://github.com/chiefmikey/eslint-plugin-disable-autofix/discussions)
- 📧 [Email Support](mailto:wolfe@mikl.io)
