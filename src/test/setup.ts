import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Speech API
const mockSpeechRecognition = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onerror: null,
  onend: null,
  onresult: null,
  onstart: null,
  onspeechend: null,
  onspeechstart: null,
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  serviceURI: '',
  grammars: null
}

// Mock SpeechRecognition constructor
const MockSpeechRecognition = vi.fn().mockImplementation(() => ({
  ...mockSpeechRecognition
}))

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition
})

// Mock MediaDevices.getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({} as MediaStream)
  }
})

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({}))
})
