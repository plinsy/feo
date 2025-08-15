/**
 * Feo - A React speech recognition library
 * A TypeScript clone of react-speech-recognition with modern best practices
 */

export { useSpeechRecognition, SpeechRecognition } from './speech-recognition'
export type {
  SpeechRecognitionCommand,
  SpeechRecognitionHookOptions,
  SpeechRecognitionHookState,
  StartListeningOptions,
  FeoSpeechRecognition,
  ISpeechRecognition,
  SpeechRecognitionResult,
  CommandCallbackArgs
} from './types'

// Default export is the SpeechRecognition object
export { SpeechRecognition as default } from './speech-recognition'
