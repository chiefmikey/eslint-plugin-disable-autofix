# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.1.0] - 2024-12-19

### Added
- Performance modes: `fast`, `balanced`, `thorough`
- Advanced rule filtering: `ruleWhitelist` and `ruleBlacklist` options
- Custom rule prefix: `customRulePrefix` option
- Error recovery: `errorRecovery` option for graceful error handling
- Strict mode: `strictMode` option for enhanced validation
- Auto-detection control: `autoDetectPlugins` option
- Migration helpers: `generateConfigForVersion` and `validateConfig`
- GitHub Actions CI/CD pipeline
- Performance monitoring and statistics tracking

### Enhanced
- Error handling and logging throughout the plugin
- Plugin loading for scoped and regular plugins
- Rule processing with better validation and error messages
- Caching system with improved error handling
- TypeScript support with enhanced type definitions
- Documentation with comprehensive examples and troubleshooting

### Fixed
- Memory leaks in long-running processes
- Cache invalidation and TTL handling
- Rule schema validation issues
- Plugin detection in monorepo setups
- Error messages and warnings

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
