<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Feo Development Guidelines

This is a TypeScript React library called "feojs" that provides speech recognition capabilities using the Web Speech API. It's designed as a modern, type-safe alternative to react-speech-recognition.

## Key Design Principles

1. **Type Safety**: All components should be fully typed with TypeScript
2. **Modern React**: Use hooks and functional components exclusively
3. **Cross-browser Support**: Support polyfills for enhanced browser compatibility
4. **Test Coverage**: Maintain comprehensive test coverage with Vitest
5. **Performance**: Optimize for minimal re-renders and efficient event handling

## Architecture

- `types.ts`: TypeScript type definitions and interfaces
- `utils.ts`: Utility functions for speech processing and text matching
- `recognition-manager.ts`: Core class managing Web Speech API interactions
- `speech-recognition.ts`: Main React hook and public API
- `index.ts`: Library entry point with exports

## Code Style

- Use functional programming patterns where appropriate
- Prefer immutable data structures
- Write clear, self-documenting code with JSDoc comments
- Follow React best practices for hooks and state management
- Use consistent error handling patterns

## Testing

- Test all public APIs thoroughly
- Mock Web Speech API for consistent testing
- Cover edge cases and error conditions
- Use descriptive test names that explain the behavior

## When implementing new features:

1. Add appropriate TypeScript types first
2. Write tests before implementation (TDD approach)
3. Ensure cross-browser compatibility
4. Update documentation as needed
5. Follow the established patterns for state management and event handling
