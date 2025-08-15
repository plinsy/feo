# Changelog

All notable changes to the Feo speech recognition library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-28

### Added
- 🎯 **TypeScript First**: Complete TypeScript implementation with full type safety
- 🪝 **Modern React Hook**: `useSpeechRecognition` hook for functional components
- 🎛️ **Command Recognition**: Sophisticated voice command matching with pattern support
- 🔧 **Configurable Options**: Extensive customization through hook options
- 🌐 **Cross-browser Support**: Built-in polyfill support for enhanced compatibility
- ⚡ **Lightweight Bundle**: Minimal footprint with tree-shaking support
- 🔄 **Continuous Listening**: Support for continuous speech recognition mode
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest

### Features
- **Voice Commands**: Support for string patterns, regex, and fuzzy matching
- **Pattern Matching**: Wildcard (`*`) and named parameter (`:param`) support
- **Optional Phrases**: Parentheses syntax for optional command parts
- **Multiple Formats**: String arrays for command variations
- **Real-time Transcription**: Live transcript updates with interim and final results
- **Browser Detection**: Automatic detection of speech recognition capabilities
- **Microphone Management**: Automatic microphone availability detection
- **Error Handling**: Comprehensive error handling for various scenarios

### API
- `useSpeechRecognition(options)` - Main React hook
- `SpeechRecognition.startListening(options)` - Start speech recognition
- `SpeechRecognition.stopListening()` - Stop speech recognition
- `SpeechRecognition.abortListening()` - Abort current recognition
- `SpeechRecognition.browserSupportsSpeechRecognition()` - Check browser support
- `SpeechRecognition.applyPolyfill(polyfill)` - Apply polyfill for unsupported browsers
- `SpeechRecognition.removePolyfill()` - Remove applied polyfill

### Technical Details
- Built with Vite and modern build toolchain
- ES modules and UMD bundle formats
- TypeScript declaration files included
- React 19.x compatible
- Zero runtime dependencies (except React)
- Modern browser APIs with graceful degradation

### Browser Support
- Chrome 25+ (with `webkitSpeechRecognition`)
- Firefox (with polyfill)
- Safari (with polyfill)
- Edge 79+ (Chromium-based)
- Mobile browsers with polyfill support

### Bundle Sizes
- ES Module: 13.74 kB (3.74 kB gzipped)
- UMD Bundle: 9.63 kB (3.09 kB gzipped)

[1.0.0]: https://github.com/yourusername/feojs/releases/tag/v1.0.0
