import type { ISpeechRecognition, ISpeechRecognitionConstructor, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from './types'
import { browserSupportsPolyfills, concatTranscripts, parseResultsToTranscript } from './utils'

/**
 * Callback functions for recognition events
 */
interface RecognitionCallbacks {
  onListeningChange?: (listening: boolean) => void
  onMicrophoneAvailabilityChange?: (available: boolean) => void
  onTranscriptChange?: (interimTranscript: string, finalTranscript: string) => void
  onClearTranscript?: () => void
  onInterimTranscriptChange?: (interimTranscript: string) => void
  onFinalTranscriptChange?: (finalTranscript: string) => void
  onBrowserSupportsSpeechRecognitionChange?: (supported: boolean) => void
  onBrowserSupportsContinuousListeningChange?: (supported: boolean) => void
}

/**
 * Manages the speech recognition instance and handles global state
 */
export class RecognitionManager {
  private recognition: ISpeechRecognition | null = null
  private pauseAfterDisconnect = false
  private interimTranscript = ''
  private finalTranscriptState = ''
  private listening = false
  private isMicrophoneAvailable = true
  private subscribers: Record<string, RecognitionCallbacks> = {}
  private onStopListening: () => void = () => {}
  private previousResultWasFinalOnly = false

  constructor(SpeechRecognition?: ISpeechRecognitionConstructor) {
    this.setSpeechRecognition(SpeechRecognition)
  }

  /**
   * Set or update the speech recognition implementation
   */
  setSpeechRecognition(SpeechRecognition?: ISpeechRecognitionConstructor): void {
    const browserSupportsRecogniser =
      !!SpeechRecognition &&
      (this.isNative(SpeechRecognition) || browserSupportsPolyfills())

    if (browserSupportsRecogniser) {
      this.disableRecognition()
      this.recognition = new SpeechRecognition()
      if (this.recognition) {
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.onresult = this.updateTranscript.bind(this)
        this.recognition.onend = this.onRecognitionDisconnect.bind(this)
        this.recognition.onerror = this.onError.bind(this)
      }
    }

    this.emitBrowserSupportsSpeechRecognitionChange(browserSupportsRecogniser)
  }

  /**
   * Check if the given SpeechRecognition is native browser implementation
   */
  private isNative(SpeechRecognition: ISpeechRecognitionConstructor): boolean {
    const NativeSpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        (window as unknown as { mozSpeechRecognition?: ISpeechRecognitionConstructor }).mozSpeechRecognition ||
        (window as unknown as { msSpeechRecognition?: ISpeechRecognitionConstructor }).msSpeechRecognition ||
        (window as unknown as { oSpeechRecognition?: ISpeechRecognitionConstructor }).oSpeechRecognition)

    return SpeechRecognition === NativeSpeechRecognition
  }

  /**
   * Subscribe to recognition events
   */
  subscribe(id: string, callbacks: RecognitionCallbacks): void {
    this.subscribers[id] = callbacks
  }

  /**
   * Unsubscribe from recognition events
   */
  unsubscribe(id: string): void {
    delete this.subscribers[id]
  }

  /**
   * Emit listening state change to all subscribers
   */
  private emitListeningChange(listening: boolean): void {
    this.listening = listening
    Object.keys(this.subscribers).forEach(id => {
      const { onListeningChange } = this.subscribers[id]
      if (onListeningChange) onListeningChange(listening)
    })
  }

  /**
   * Emit microphone availability change to all subscribers
   */
  private emitMicrophoneAvailabilityChange(isMicrophoneAvailable: boolean): void {
    this.isMicrophoneAvailable = isMicrophoneAvailable
    Object.keys(this.subscribers).forEach(id => {
      const { onMicrophoneAvailabilityChange } = this.subscribers[id]
      if (onMicrophoneAvailabilityChange) onMicrophoneAvailabilityChange(isMicrophoneAvailable)
    })
  }

  /**
   * Emit transcript change to all subscribers
   */
  private emitTranscriptChange(interimTranscript: string, finalTranscript: string): void {
    Object.keys(this.subscribers).forEach(id => {
      const { onTranscriptChange } = this.subscribers[id]
      if (onTranscriptChange) onTranscriptChange(interimTranscript, finalTranscript)
    })
  }

  /**
   * Emit clear transcript to all subscribers
   */
  private emitClearTranscript(): void {
    Object.keys(this.subscribers).forEach(id => {
      const { onClearTranscript } = this.subscribers[id]
      if (onClearTranscript) onClearTranscript()
    })
  }

  /**
   * Emit browser support change to all subscribers
   */
  private emitBrowserSupportsSpeechRecognitionChange(browserSupportsSpeechRecognition: boolean): void {
    Object.keys(this.subscribers).forEach(id => {
      const { 
        onBrowserSupportsSpeechRecognitionChange,
        onBrowserSupportsContinuousListeningChange 
      } = this.subscribers[id]
      
      if (onBrowserSupportsSpeechRecognitionChange) {
        onBrowserSupportsSpeechRecognitionChange(browserSupportsSpeechRecognition)
      }
      if (onBrowserSupportsContinuousListeningChange) {
        onBrowserSupportsContinuousListeningChange(browserSupportsSpeechRecognition)
      }
    })
  }

  /**
   * Disconnect recognition with specified type
   */
  private disconnect(disconnectType: 'ABORT' | 'RESET' | 'STOP'): void {
    if (this.recognition && this.listening) {
      switch (disconnectType) {
        case 'ABORT':
          this.pauseAfterDisconnect = true
          this.abort()
          break
        case 'RESET':
          this.pauseAfterDisconnect = false
          this.abort()
          break
        case 'STOP':
        default:
          this.pauseAfterDisconnect = true
          this.stop()
      }
    }
  }

  /**
   * Disable recognition completely
   */
  private disableRecognition(): void {
    if (this.recognition) {
      this.recognition.onresult = () => {}
      this.recognition.onend = () => {}
      this.recognition.onerror = () => {}
      if (this.listening) {
        this.stopListening()
      }
    }
  }

  /**
   * Handle recognition errors
   */
  private onError(event: SpeechRecognitionErrorEvent): void {
    if (event && event.error && event.error === 'not-allowed') {
      this.emitMicrophoneAvailabilityChange(false)
      this.disableRecognition()
    }
  }

  /**
   * Handle recognition disconnect/end
   */
  private onRecognitionDisconnect(): void {
    this.onStopListening()
    this.listening = false
    
    if (this.pauseAfterDisconnect) {
      this.emitListeningChange(false)
    } else if (this.recognition) {
      if (this.recognition.continuous) {
        this.startListening({ continuous: this.recognition.continuous })
      } else {
        this.emitListeningChange(false)
      }
    }
    
    this.pauseAfterDisconnect = false
  }

  /**
   * Update transcript from recognition results
   */
  private updateTranscript({ results, resultIndex }: SpeechRecognitionEvent): void {
    const { interimTranscript, finalTranscript } = parseResultsToTranscript(results, resultIndex)
    
    this.interimTranscript = interimTranscript
    
    if (finalTranscript) {
      this.updateFinalTranscript(finalTranscript)
    }

    // Emit only if this is not a duplicate result
    const isDuplicateResult = 
      this.previousResultWasFinalOnly && 
      results.length === 1 && 
      results[0].isFinal && 
      !this.interimTranscript

    this.previousResultWasFinalOnly = 
      results.length === 1 && 
      results[0].isFinal && 
      !this.interimTranscript

    if (!isDuplicateResult) {
      this.emitTranscriptChange(this.interimTranscript, this.finalTranscriptState)
    }
  }

  /**
   * Update the final transcript
   */
  private updateFinalTranscript(newFinalTranscript: string): void {
    this.finalTranscriptState = concatTranscripts(this.finalTranscriptState, newFinalTranscript)
  }

  /**
   * Reset transcript and abort current recognition
   */
  resetTranscript(): void {
    this.disconnect('RESET')
  }

  /**
   * Start listening for speech
   */
  async startListening({ continuous = false, language }: { continuous?: boolean; language?: string } = {}): Promise<void> {
    if (!this.recognition) {
      return
    }

    const isContinuousChanged = continuous !== this.recognition.continuous
    const isLanguageChanged = language && language !== this.recognition.lang

    if (isContinuousChanged || isLanguageChanged) {
      if (this.listening) {
        await this.stopListening()
      }
      
      this.recognition.continuous = isContinuousChanged ? continuous : this.recognition.continuous
      this.recognition.lang = isLanguageChanged ? language : this.recognition.lang
    }

    if (!this.listening) {
      if (!this.recognition.continuous) {
        this.resetTranscriptState()
        this.emitClearTranscript()
      }
      
      try {
        await this.start()
        this.emitListeningChange(true)
      } catch (e) {
        // DOMExceptions indicate a redundant microphone start - safe to swallow
        if (!(e instanceof DOMException)) {
          this.emitMicrophoneAvailabilityChange(false)
        }
      }
    }
  }

  /**
   * Stop listening and finish processing current speech
   */
  async stopListening(): Promise<void> {
    this.disconnect('STOP')
    this.emitListeningChange(false)
    
    // Only wait if actually listening
    if (this.listening) {
      await new Promise<void>(resolve => {
        this.onStopListening = resolve
        // Add timeout to prevent hanging
        setTimeout(() => resolve(), 100)
      })
    }
  }

  /**
   * Abort listening and cancel processing current speech
   */
  async abortListening(): Promise<void> {
    this.disconnect('ABORT')
    this.emitListeningChange(false)
    
    // Only wait if actually listening
    if (this.listening) {
      await new Promise<void>(resolve => {
        this.onStopListening = resolve
        // Add timeout to prevent hanging
        setTimeout(() => resolve(), 100)
      })
    }
  }

  /**
   * Get the current recognition instance
   */
  getRecognition(): ISpeechRecognition | null {
    return this.recognition
  }

  /**
   * Start the recognition engine
   */
  private async start(): Promise<void> {
    if (this.recognition && !this.listening) {
      await this.recognition.start()
      this.listening = true
    }
  }

  /**
   * Stop the recognition engine
   */
  private stop(): void {
    if (this.recognition && this.listening) {
      this.recognition.stop()
      this.listening = false
    }
  }

  /**
   * Abort the recognition engine
   */
  private abort(): void {
    if (this.recognition && this.listening) {
      this.recognition.abort()
      this.listening = false
    }
  }

  /**
   * Reset internal transcript state
   */
  private resetTranscriptState(): void {
    this.interimTranscript = ''
    this.finalTranscriptState = ''
  }

  // Getters for current state
  get currentInterimTranscript(): string {
    return this.interimTranscript
  }

  get currentFinalTranscript(): string {
    return this.finalTranscriptState
  }

  get isListening(): boolean {
    return this.listening
  }

  get microphoneAvailable(): boolean {
    return this.isMicrophoneAvailable
  }
}
