import React from 'react'
import { createRoot } from 'react-dom/client'
import SpeechRecognition, { useSpeechRecognition } from '../src/'

const VoiceDemo = () => {
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎤 Feo Speech Recognition Demo</h1>
      <h2>✨ Now with Duplicate Word Filtering!</h2>
      <p>
        Microphone: <strong>{listening ? '🔴 ON' : '⚫ OFF'}</strong>
      </p>
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => SpeechRecognition.startListening({ continuous: true })}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Start Listening
        </button>
        <button 
          onClick={SpeechRecognition.stopListening}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Stop
        </button>
        <button 
          onClick={resetTranscript}
          style={{ padding: '10px 20px' }}
        >
          Reset
        </button>
      </div>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        minHeight: '100px',
        backgroundColor: '#f9f9f9',
        borderRadius: '5px'
      }}>
        <h3>Transcript (with duplicate filtering):</h3>
        <p>{transcript || 'Start speaking...'}</p>
      </div>
      <div style={{ 
        marginTop: '20px',
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '5px'
      }}>
        <h3>🔧 What's New:</h3>
        <ul>
          <li><strong>Duplicate Word Filtering:</strong> Consecutive duplicate words are automatically removed</li>
          <li><strong>Better Transcript Handling:</strong> Improved processing of speech recognition results</li>
          <li><strong>Example:</strong> "Hello Hello Hello Hello How you doing" becomes "Hello How you doing"</li>
        </ul>
        
        <h4>Try saying something with repeated words to see the filtering in action!</h4>
      </div>
    </div>
  )
}

// Only run demo if we're in a browser environment
if (typeof window !== 'undefined') {
  const container = document.getElementById('root')
  if (container) {
    const root = createRoot(container)
    root.render(<VoiceDemo />)
  }
}

export default VoiceDemo
