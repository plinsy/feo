/**
 * Utility functions for speech recognition
 */

/**
 * Remove consecutive duplicate words from a transcript
 */
export const removeDuplicateWords = (transcript: string): string => {
  if (!transcript || !transcript.trim()) return ''
  
  const words = transcript.trim().split(/\s+/)
  const filteredWords: string[] = []
  
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i].toLowerCase().replace(/[^\w]/g, '')
    const previousWord = i > 0 ? words[i - 1].toLowerCase().replace(/[^\w]/g, '') : null
    
    // Only add the word if it's different from the previous word (ignoring punctuation)
    if (currentWord !== previousWord) {
      filteredWords.push(words[i])
    }
  }
  
  return filteredWords.join(' ')
}

/**
 * Concatenate transcript parts with proper spacing and duplicate removal
 */
export const concatTranscripts = (...transcriptParts: string[]): string => {
  const combined = transcriptParts
    .map(t => t.trim())
    .join(' ')
    .trim()
    
  return removeDuplicateWords(combined)
}

/**
 * Check if browser supports polyfills (has necessary APIs)
 */
export const browserSupportsPolyfills = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.navigator !== undefined &&
    window.navigator.mediaDevices !== undefined &&
    window.navigator.mediaDevices.getUserMedia !== undefined &&
    (window.AudioContext !== undefined || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== undefined)
  )
}

/**
 * Detect if running on Android
 */
export const isAndroid = (): boolean => {
  return /(android)/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )
}

/**
 * Convert command to RegExp for matching
 * Modified version inspired by Backbone.Router
 */
const optionalParam = /\s*\((.*?)\)\s*/g
const optionalRegex = /(\(\?:[^)]+\))\?/g
const namedParam = /(\(\?)?:\w+/g
const splatParam = /\*/g
const escapeRegExp = /[-{}[\]+?.,\\^$|#]/g

export const commandToRegExp = (command: string | RegExp): RegExp => {
  if (command instanceof RegExp) {
    return new RegExp(command.source, 'i')
  }
  
  const processedCommand = command
    .replace(escapeRegExp, '\\$&')
    .replace(optionalParam, '(?:$1)?')
    .replace(namedParam, (match, optional) => {
      return optional ? match : '([^\\s]+)'
    })
    .replace(splatParam, '(.*?)')
    .replace(optionalRegex, '\\s*$1?\\s*')
  
  return new RegExp(`^${processedCommand}$`, 'i')
}

/**
 * Calculate similarity between two strings using Dice coefficient
 */
export const compareTwoStringsUsingDiceCoefficient = (first: string, second: string): number => {
  first = first.replace(/\s+/g, '')
  second = second.replace(/\s+/g, '')

  if (first === second) return 1
  if (first.length < 2 || second.length < 2) return 0

  const firstBigrams = new Map<string, number>()
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram)! + 1 : 1
    firstBigrams.set(bigram, count)
  }

  let intersectionSize = 0
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram)! : 0

    if (count > 0) {
      firstBigrams.set(bigram, count - 1)
      intersectionSize++
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2)
}

import type { SpeechRecognitionResultList } from './types'

/**
 * Parse speech recognition results into text
 */
export const parseResultsToTranscript = (results: SpeechRecognitionResultList, resultIndex: number = 0) => {
  let interimTranscript = ''
  let finalTranscript = ''

  for (let i = resultIndex; i < results.length; i++) {
    const result = results[i]
    const transcript = removeDuplicateWords(result[0].transcript)
    
    if (result.isFinal) {
      finalTranscript += transcript
    } else {
      interimTranscript += transcript
    }
  }

  return { 
    interimTranscript: removeDuplicateWords(interimTranscript), 
    finalTranscript: removeDuplicateWords(finalTranscript) 
  }
}

/**
 * Check if a command matches the given transcript
 */
export const matchCommand = (
  command: string | RegExp | string[],
  transcript: string,
  isFuzzyMatch = false,
  fuzzyMatchingThreshold = 0.8
): { isMatch: boolean; parameters?: string[]; similarity?: number } => {
  const commands = Array.isArray(command) ? command : [command]
  
  for (const cmd of commands) {
    if (isFuzzyMatch) {
      const cmdStr = typeof cmd === 'object' ? cmd.toString() : cmd
      const cleanCmd = cmdStr.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
      const similarity = compareTwoStringsUsingDiceCoefficient(cleanCmd, transcript)
      
      if (similarity >= fuzzyMatchingThreshold) {
        return { isMatch: true, similarity }
      }
    } else {
      const regex = commandToRegExp(cmd)
      const match = transcript.match(regex)
      
      if (match) {
        return { isMatch: true, parameters: match.slice(1) }
      }
    }
  }
  
  return { isMatch: false }
}
