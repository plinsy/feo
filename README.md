# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🎤 Feo

A modern, TypeScript-first React hook that converts speech from the microphone to text and makes it available to your React components.

Feo is a spiritual successor to `react-speech-recognition`, built from the ground up with TypeScript, modern React patterns, and best practices.

[![npm version](https://img.shields.io/npm/v/feo.svg)](https://www.npmjs.com/package/feo)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **TypeScript First**: Fully typed API with excellent IntelliSense support
- 🪝 **Modern React**: Built with hooks and functional components
- 🌐 **Cross-browser**: Supports polyfills for enhanced browser compatibility
- 🎛️ **Command Recognition**: Sophisticated command matching with fuzzy search
- 🔧 **Configurable**: Extensive customization options
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest
- ⚡ **Lightweight**: Minimal bundle size with tree-shaking support
- 🔄 **Continuous Listening**: Support for continuous speech recognition

## 📦 Installation

```bash
npm install feo
```

```bash
yarn add feo
```

```bash
pnpm add feo
```

## 🚀 Quick Start

```tsx
import React from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'feo'

const VoiceRecorder = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>
  }

  return (
    <div>
      <p>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={() => SpeechRecognition.startListening()}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  )
}

export default VoiceRecorder
```

## 🎯 Voice Commands

Feo supports sophisticated voice command recognition with pattern matching:

```tsx
import React, { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'feo'

const VoiceAssistant = () => {
  const [message, setMessage] = useState('')
  
  const commands = [
    {
      command: 'I would like to order *',
      callback: (food: string) => setMessage(`Your order is for: ${food}`)
    },
    {
      command: 'The weather is :condition today',
      callback: (condition: string) => setMessage(`Today, the weather is ${condition}`)
    },
    {
      command: 'My top sports are * and *',
      callback: (sport1: string, sport2: string) => setMessage(`#1: ${sport1}, #2: ${sport2}`)
    },
    {
      command: 'Pass the salt (please)',
      callback: () => setMessage('My pleasure')
    },
    {
      command: ['Hello', 'Hi'],
      callback: ({ command }: { command: string }) => setMessage(`Hi there! You said: "${command}"`),
      matchInterim: true
    },
    {
      command: 'clear',
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        resetTranscript()
        setMessage('')
      }
    }
  ]

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands })

  const startListening = () => SpeechRecognition.startListening({ 
    continuous: true, 
    language: 'en-US' 
  })

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>
  }

  return (
    <div>
      <p>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={startListening}>Start Listening</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p><strong>Transcript:</strong> {transcript}</p>
      {message && <p><strong>Response:</strong> {message}</p>}
    </div>
  )
}

export default VoiceAssistant
```

## 📚 API Reference

### `useSpeechRecognition(options?)`

React hook that provides speech recognition state and controls.

#### Options
```tsx
interface SpeechRecognitionHookOptions {
  transcribing?: boolean              // Whether to update transcript state (default: true)
  clearTranscriptOnListen?: boolean   // Whether to clear transcript when starting (default: true)
  commands?: SpeechRecognitionCommand[] // Array of voice commands
}
```

#### Returns
```tsx
interface SpeechRecognitionHookState {
  transcript: string                           // Complete transcript
  interimTranscript: string                    // Interim (incomplete) transcript
  finalTranscript: string                      // Final (complete) transcript
  listening: boolean                           // Whether currently listening
  isMicrophoneAvailable: boolean              // Whether microphone is available
  resetTranscript: () => void                 // Function to reset transcript
  browserSupportsSpeechRecognition: boolean   // Whether browser supports speech recognition
  browserSupportsContinuousListening: boolean // Whether browser supports continuous listening
}
```

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by [react-speech-recognition](https://github.com/JamesBrill/react-speech-recognition) by James Brill
- Built with [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/)
- Tested with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/)

---

Made with ❤️ for the React community

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
