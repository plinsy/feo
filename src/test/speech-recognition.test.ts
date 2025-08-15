import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition, SpeechRecognition } from '../speech-recognition'

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    
    expect(result.current.transcript).toBe('')
    expect(result.current.interimTranscript).toBe('')
    expect(result.current.finalTranscript).toBe('')
    expect(result.current.listening).toBe(false)
    expect(result.current.isMicrophoneAvailable).toBe(true)
    expect(typeof result.current.resetTranscript).toBe('function')
    expect(typeof result.current.browserSupportsSpeechRecognition).toBe('boolean')
    expect(typeof result.current.browserSupportsContinuousListening).toBe('boolean')
  })

  it('should handle resetTranscript function', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    
    expect(() => {
      act(() => {
        result.current.resetTranscript()
      })
    }).not.toThrow()
  })

  it('should accept commands configuration', () => {
    const mockCallback = vi.fn()
    const commands = [
      {
        command: 'hello world',
        callback: mockCallback
      }
    ]

    const { result } = renderHook(() => useSpeechRecognition({ commands }))
    
    expect(result.current.transcript).toBe('')
  })

  it('should handle transcribing option', () => {
    const { result } = renderHook(() => useSpeechRecognition({ transcribing: false }))
    
    expect(result.current.transcript).toBe('')
  })

  it('should handle clearTranscriptOnListen option', () => {
    const { result } = renderHook(() => useSpeechRecognition({ clearTranscriptOnListen: false }))
    
    expect(result.current.transcript).toBe('')
  })
})

describe('SpeechRecognition static methods', () => {
  it('should have required static methods', () => {
    expect(typeof SpeechRecognition.startListening).toBe('function')
    expect(typeof SpeechRecognition.stopListening).toBe('function')
    expect(typeof SpeechRecognition.abortListening).toBe('function')
    expect(typeof SpeechRecognition.browserSupportsSpeechRecognition).toBe('function')
    expect(typeof SpeechRecognition.browserSupportsContinuousListening).toBe('function')
    expect(typeof SpeechRecognition.applyPolyfill).toBe('function')
    expect(typeof SpeechRecognition.removePolyfill).toBe('function')
    expect(typeof SpeechRecognition.getRecognition).toBe('function')
  })

  it('should return browser support status', () => {
    const supports = SpeechRecognition.browserSupportsSpeechRecognition()
    expect(typeof supports).toBe('boolean')
  })

  it('should return continuous listening support status', () => {
    const supports = SpeechRecognition.browserSupportsContinuousListening()
    expect(typeof supports).toBe('boolean')
  })

  it('should handle startListening without options', async () => {
    await expect(SpeechRecognition.startListening()).resolves.not.toThrow()
  })

  it('should handle startListening with options', async () => {
    await SpeechRecognition.startListening({ 
      continuous: true, 
      language: 'en-US' 
    })
    // Should not throw
    expect(true).toBe(true)
  })

  it('should handle stopListening', async () => {
    await SpeechRecognition.stopListening()
    // Should not throw
    expect(true).toBe(true)
  })

  it('should handle abortListening', async () => {
    await SpeechRecognition.abortListening()
    // Should not throw
    expect(true).toBe(true)
  })
})
