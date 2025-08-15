import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { 
  SpeechRecognitionHookOptions, 
  SpeechRecognitionHookState,
  SpeechRecognitionCommand,
  StartListeningOptions,
  FeoSpeechRecognition,
  ISpeechRecognition,
  ISpeechRecognitionConstructor
} from './types'
import { RecognitionManager } from './recognition-manager'
import { 
  concatTranscripts, 
  matchCommand, 
  isAndroid, 
  browserSupportsPolyfills 
} from './utils'

// Types for transcript reducer
interface TranscriptState {
  interimTranscript: string
  finalTranscript: string
}

interface TranscriptAction {
  type: 'APPEND_TRANSCRIPT' | 'CLEAR_TRANSCRIPT'
  payload?: {
    interimTranscript: string
    finalTranscript: string
  }
}

// Transcript reducer
const transcriptReducer = (state: TranscriptState, action: TranscriptAction): TranscriptState => {
  switch (action.type) {
    case 'CLEAR_TRANSCRIPT':
      return {
        interimTranscript: '',
        finalTranscript: ''
      }
    case 'APPEND_TRANSCRIPT':
      return {
        interimTranscript: action.payload!.interimTranscript,
        finalTranscript: concatTranscripts(state.finalTranscript, action.payload!.finalTranscript)
      }
    default:
      return state
  }
}

// Action creators
const appendTranscript = (interimTranscript: string, finalTranscript: string): TranscriptAction => ({
  type: 'APPEND_TRANSCRIPT',
  payload: { interimTranscript, finalTranscript }
})

const clearTranscript = (): TranscriptAction => ({
  type: 'CLEAR_TRANSCRIPT'
})

// Get native speech recognition
const getNativeSpeechRecognition = (): ISpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null
  
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    (window as unknown as { mozSpeechRecognition?: typeof window.SpeechRecognition }).mozSpeechRecognition ||
    (window as unknown as { msSpeechRecognition?: typeof window.SpeechRecognition }).msSpeechRecognition ||
    (window as unknown as { oSpeechRecognition?: typeof window.SpeechRecognition }).oSpeechRecognition
  ) || null
}

// Global state
let _browserSupportsSpeechRecognition = !!getNativeSpeechRecognition()
let _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid()
let recognitionManager: RecognitionManager | null = null

// Counter for unique hook instances
let counter = 0

/**
 * React hook for speech recognition
 */
export const useSpeechRecognition = ({
  transcribing = true,
  clearTranscriptOnListen = true,
  commands = []
}: SpeechRecognitionHookOptions = {}): SpeechRecognitionHookState => {
  const [recognitionManagerInstance] = useState(() => getRecognitionManager())
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = 
    useState(_browserSupportsSpeechRecognition)
  const [browserSupportsContinuousListening, setBrowserSupportsContinuousListening] = 
    useState(_browserSupportsContinuousListening)
  
  const [{ interimTranscript, finalTranscript }, dispatch] = useReducer(
    transcriptReducer,
    {
      interimTranscript: recognitionManagerInstance.currentInterimTranscript,
      finalTranscript: ''
    }
  )
  
  const [listening, setListening] = useState(recognitionManagerInstance.isListening)
  const [isMicrophoneAvailable, setMicrophoneAvailable] = useState(recognitionManagerInstance.microphoneAvailable)
  
  const commandsRef = useRef(commands)
  commandsRef.current = commands

  const dispatchClearTranscript = () => {
    dispatch(clearTranscript())
  }

  const resetTranscript = useCallback(() => {
    recognitionManagerInstance.resetTranscript()
    dispatchClearTranscript()
  }, [recognitionManagerInstance])

  const testFuzzyMatch = (command: string | RegExp, input: string, fuzzyMatchingThreshold: number) => {
    const commandToString = typeof command === 'object' ? command.toString() : command
    const commandWithoutSpecials = commandToString
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    const { isMatch, similarity } = matchCommand(commandWithoutSpecials, input, true, fuzzyMatchingThreshold)
    return { isMatch, similarity: similarity || 0, cleanCommand: commandWithoutSpecials }
  }

  const matchCommands = useCallback(
    (interimTranscript: string, finalTranscript: string) => {
      const transcript = concatTranscripts(finalTranscript, interimTranscript)
      
      commandsRef.current.forEach((commandItem: SpeechRecognitionCommand) => {
        const { command, callback, matchInterim, isFuzzyMatch, fuzzyMatchingThreshold = 0.8, bestMatchOnly } = commandItem
        const commandsToTest = Array.isArray(command) ? command : [command]
        
        if ((interimTranscript && !matchInterim) || (!transcript.trim())) {
          return
        }

        const testTranscript = matchInterim ? transcript : finalTranscript
        if (!testTranscript.trim()) return

        if (isFuzzyMatch) {
          const matches = commandsToTest.map(cmd => {
            const { isMatch, similarity, cleanCommand } = testFuzzyMatch(cmd, testTranscript, fuzzyMatchingThreshold)
            return { command: cmd, isMatch, similarity: similarity || 0, cleanCommand }
          }).filter(match => match.isMatch)

          if (matches.length > 0) {
            if (bestMatchOnly) {
              const bestMatch = matches.reduce((best, current) => 
                current.similarity > best.similarity ? current : best
              )
              callback(bestMatch.cleanCommand, testTranscript, bestMatch.similarity, {
                command: bestMatch.command,
                resetTranscript
              })
            } else {
              matches.forEach(match => {
                callback(match.cleanCommand, testTranscript, match.similarity, {
                  command: match.command,
                  resetTranscript
                })
              })
            }
          }
        } else {
          commandsToTest.forEach(cmd => {
            const { isMatch, parameters } = matchCommand(cmd, testTranscript)
            if (isMatch) {
              if (parameters) {
                callback(...parameters, { command: cmd, resetTranscript })
              } else {
                callback({ command: cmd, resetTranscript })
              }
            }
          })
        }
      })
    },
    [resetTranscript]
  )

  const handleTranscriptChange = useCallback(
    (newInterimTranscript: string, newFinalTranscript: string) => {
      if (transcribing) {
        dispatch(appendTranscript(newInterimTranscript, newFinalTranscript))
      }
      matchCommands(newInterimTranscript, newFinalTranscript)
    },
    [matchCommands, transcribing]
  )

  const handleClearTranscript = useCallback(() => {
    if (clearTranscriptOnListen) {
      dispatchClearTranscript()
    }
  }, [clearTranscriptOnListen])

  useEffect(() => {
    const id = counter
    counter += 1
    
    const callbacks = {
      onListeningChange: setListening,
      onMicrophoneAvailabilityChange: setMicrophoneAvailable,
      onTranscriptChange: handleTranscriptChange,
      onClearTranscript: handleClearTranscript,
      onBrowserSupportsSpeechRecognitionChange: setBrowserSupportsSpeechRecognition,
      onBrowserSupportsContinuousListeningChange: setBrowserSupportsContinuousListening
    }
    
    recognitionManagerInstance.subscribe(id.toString(), callbacks)

    return () => {
      recognitionManagerInstance.unsubscribe(id.toString())
    }
  }, [
    transcribing,
    clearTranscriptOnListen,
    recognitionManagerInstance,
    handleTranscriptChange,
    handleClearTranscript
  ])

  const transcript = concatTranscripts(finalTranscript, interimTranscript)
  
  return {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    isMicrophoneAvailable,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening
  }
}

/**
 * Get or create the global recognition manager
 */
const getRecognitionManager = (): RecognitionManager => {
  if (!recognitionManager) {
    const speechRecognition = getNativeSpeechRecognition()
    recognitionManager = new RecognitionManager(speechRecognition || undefined)
  }
  return recognitionManager
}

/**
 * Main speech recognition object with static methods
 */
export const SpeechRecognition: FeoSpeechRecognition = {
  startListening: async (options: StartListeningOptions = {}) => {
    const manager = getRecognitionManager()
    await manager.startListening(options)
  },
  
  stopListening: async () => {
    const manager = getRecognitionManager()
    await manager.stopListening()
  },
  
  abortListening: async () => {
    const manager = getRecognitionManager()
    await manager.abortListening()
  },
  
  browserSupportsSpeechRecognition: () => _browserSupportsSpeechRecognition,
  
  browserSupportsContinuousListening: () => _browserSupportsContinuousListening,
  
  applyPolyfill: (PolyfillSpeechRecognition: ISpeechRecognitionConstructor) => {
    if (recognitionManager) {
      recognitionManager.setSpeechRecognition(PolyfillSpeechRecognition)
    } else {
      recognitionManager = new RecognitionManager(PolyfillSpeechRecognition)
    }
    
    const browserSupportsPolyfill = !!PolyfillSpeechRecognition && browserSupportsPolyfills()
    _browserSupportsSpeechRecognition = browserSupportsPolyfill
    _browserSupportsContinuousListening = browserSupportsPolyfill
  },
  
  removePolyfill: () => {
    const nativeSpeechRecognition = getNativeSpeechRecognition()
    if (recognitionManager) {
      recognitionManager.setSpeechRecognition(nativeSpeechRecognition || undefined)
    } else {
      recognitionManager = new RecognitionManager(nativeSpeechRecognition || undefined)
    }
    
    _browserSupportsSpeechRecognition = !!nativeSpeechRecognition
    _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid()
  },
  
  getRecognition: (): ISpeechRecognition | null => {
    const manager = getRecognitionManager()
    return manager.getRecognition()
  }
}

export default SpeechRecognition
