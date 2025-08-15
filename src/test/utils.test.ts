import { describe, it, expect } from 'vitest'
import type { SpeechRecognitionResultList, SpeechRecognitionResult } from '../types'
import { 
  concatTranscripts, 
  browserSupportsPolyfills, 
  isAndroid, 
  commandToRegExp, 
  compareTwoStringsUsingDiceCoefficient,
  parseResultsToTranscript,
  matchCommand
} from '../utils'

describe('Utils', () => {
  describe('concatTranscripts', () => {
    it('should concatenate transcripts with proper spacing', () => {
      expect(concatTranscripts('hello', 'world')).toBe('hello world')
      expect(concatTranscripts('  hello  ', '  world  ')).toBe('hello world')
      expect(concatTranscripts('', 'world')).toBe('world')
      expect(concatTranscripts('hello', '')).toBe('hello')
      expect(concatTranscripts('', '')).toBe('')
    })
  })

  describe('browserSupportsPolyfills', () => {
    it('should return a boolean', () => {
      const result = browserSupportsPolyfills()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isAndroid', () => {
    it('should return a boolean', () => {
      const result = isAndroid()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('commandToRegExp', () => {
    it('should convert simple string to regex', () => {
      const regex = commandToRegExp('hello world')
      expect(regex).toBeInstanceOf(RegExp)
      expect(regex.test('hello world')).toBe(true)
      expect(regex.test('HELLO WORLD')).toBe(true) // case insensitive
    })

    it('should handle regex input', () => {
      const inputRegex = /test pattern/i
      const outputRegex = commandToRegExp(inputRegex)
      expect(outputRegex).toBeInstanceOf(RegExp)
      expect(outputRegex.flags).toContain('i')
    })

    it('should handle named parameters', () => {
      const regex = commandToRegExp('I am :name')
      expect(regex.test('I am John')).toBe(true)
      expect(regex.test('I am Mary Smith')).toBe(false) // named params match single words
    })

    it('should handle splat parameters', () => {
      const regex = commandToRegExp('I want *')
      expect(regex.test('I want pizza')).toBe(true)
      expect(regex.test('I want pizza and fries')).toBe(true)
    })

    it('should handle optional parameters', () => {
      const regex = commandToRegExp('Hello (there)')
      expect(regex.test('Hello')).toBe(true)
      expect(regex.test('Hello there')).toBe(true)
    })
  })

  describe('compareTwoStringsUsingDiceCoefficient', () => {
    it('should return 1 for identical strings', () => {
      expect(compareTwoStringsUsingDiceCoefficient('hello', 'hello')).toBe(1)
    })

    it('should return 0 for completely different strings', () => {
      const result = compareTwoStringsUsingDiceCoefficient('abc', 'xyz')
      expect(result).toBe(0)
    })

    it('should return value between 0 and 1 for similar strings', () => {
      const result = compareTwoStringsUsingDiceCoefficient('hello', 'helo')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should handle empty strings', () => {
      expect(compareTwoStringsUsingDiceCoefficient('', '')).toBe(1)
      expect(compareTwoStringsUsingDiceCoefficient('hello', '')).toBe(0)
      expect(compareTwoStringsUsingDiceCoefficient('', 'hello')).toBe(0)
    })

    it('should handle single character strings', () => {
      expect(compareTwoStringsUsingDiceCoefficient('a', 'b')).toBe(0)
      expect(compareTwoStringsUsingDiceCoefficient('a', 'a')).toBe(1)
    })
  })

  describe('parseResultsToTranscript', () => {
    it('should parse results correctly', () => {
      const mockResults = {
        length: 2,
        0: { isFinal: true, 0: { transcript: 'Hello ' } },
        1: { isFinal: false, 0: { transcript: 'world' } },
        item: (index: number) => mockResults[index as keyof typeof mockResults]
      } as unknown as SpeechRecognitionResultList

      const result = parseResultsToTranscript(mockResults)
      expect(result.finalTranscript).toBe('Hello ')
      expect(result.interimTranscript).toBe('world')
    })

    it('should handle empty results', () => {
      const mockResults = {
        length: 0,
        item: () => ({} as SpeechRecognitionResult)
      } as unknown as SpeechRecognitionResultList
      
      const result = parseResultsToTranscript(mockResults)
      expect(result.finalTranscript).toBe('')
      expect(result.interimTranscript).toBe('')
    })
  })

  describe('matchCommand', () => {
    it('should match exact string commands', () => {
      const result = matchCommand('hello world', 'hello world')
      expect(result.isMatch).toBe(true)
      expect(result.parameters).toEqual([])
    })

    it('should not match different strings', () => {
      const result = matchCommand('hello world', 'goodbye world')
      expect(result.isMatch).toBe(false)
    })

    it('should handle fuzzy matching', () => {
      const result = matchCommand('hello', 'helo', true, 0.5)
      expect(result.isMatch).toBe(true)
      expect(result.similarity).toBeGreaterThan(0.5)
    })

    it('should handle array of commands', () => {
      const result = matchCommand(['hello', 'hi'], 'hi')
      expect(result.isMatch).toBe(true)
    })

    it('should extract parameters from commands', () => {
      const result = matchCommand('I am :name', 'I am John')
      expect(result.isMatch).toBe(true)
      expect(result.parameters).toEqual(['John'])
    })
  })
})
