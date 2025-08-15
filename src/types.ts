// Types for the speech recognition functionality

// Define the SpeechRecognition interface since it might not be available in all TypeScript environments
export interface ISpeechRecognition extends EventTarget {
  start(): void
  stop(): void
  abort(): void
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  grammars: SpeechGrammarList
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null
  onend: ((this: ISpeechRecognition, ev: Event) => unknown) | null
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
  onstart: ((this: ISpeechRecognition, ev: Event) => unknown) | null
  onspeechend: ((this: ISpeechRecognition, ev: Event) => unknown) | null
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => unknown) | null
}

export interface SpeechRecognitionCommand {
  command: string | RegExp | string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...args: any[]) => void
  matchInterim?: boolean
  isFuzzyMatch?: boolean
  fuzzyMatchingThreshold?: number
  bestMatchOnly?: boolean
}

export interface SpeechRecognitionHookOptions {
  transcribing?: boolean
  clearTranscriptOnListen?: boolean
  commands?: SpeechRecognitionCommand[]
}

export interface SpeechRecognitionHookState {
  transcript: string
  interimTranscript: string
  finalTranscript: string
  listening: boolean
  isMicrophoneAvailable: boolean
  resetTranscript: () => void
  browserSupportsSpeechRecognition: boolean
  browserSupportsContinuousListening: boolean
}

export interface StartListeningOptions {
  continuous?: boolean
  language?: string
}

export interface FeoSpeechRecognition {
  startListening: (options?: StartListeningOptions) => Promise<void>
  stopListening: () => Promise<void>
  abortListening: () => Promise<void>
  browserSupportsSpeechRecognition: () => boolean
  browserSupportsContinuousListening: () => boolean
  applyPolyfill: (PolyfillSpeechRecognition: ISpeechRecognitionConstructor) => void
  removePolyfill: () => void
  getRecognition: () => ISpeechRecognition | null
}

// Type for Speech Recognition constructor
export interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition
}

// Define missing browser API types
export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

export interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface SpeechGrammarList {
  readonly length: number
  item(index: number): SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
  [index: number]: SpeechGrammar
}

export interface SpeechGrammar {
  src: string
  weight: number
}

// Extend the global interfaces for better typing
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor
    webkitSpeechRecognition?: ISpeechRecognitionConstructor
  }
}

export interface SpeechRecognitionMatch {
  command?: string
  parameters?: string[]
}

export interface CommandCallbackArgs {
  command: string | RegExp
  resetTranscript: () => void
}
