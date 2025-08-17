import { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from './index'
import './App.css'

function App() {
  const [message, setMessage] = useState('')

  const commands = [
    {
      command: 'I would like to order *',
      callback: (food: string) => setMessage(`Your order is for: ${food}`)
    },
    {
      command: 'The weather is :condition today',
      callback: (condition: string) =>
        setMessage(`Today, the weather is ${condition}`)
    },
    {
      command: 'My top sports are * and *',
      callback: (sport1: string, sport2: string) =>
        setMessage(`#1: ${sport1}, #2: ${sport2}`)
    },
    {
      command: 'Pass the salt (please)',
      callback: () => setMessage('My pleasure')
    },
    {
      command: ['Hello', 'Hi'],
      callback: ({ command }: { command: string }) =>
        setMessage(`Hi there! You said: "${command}"`),
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
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening
  } = useSpeechRecognition({ commands })

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>
  }

  const startListening = () =>
    SpeechRecognition.startListening({
      continuous: false,
      language: 'en-US'
    })

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎤 Feo Speech Recognition Demo</h1>

        <div className="status">
          <p>
            <strong>Microphone:</strong> {listening ? '🔴 ON' : '⚫ OFF'}
          </p>
          <p>
            <strong>Browser Support:</strong>{' '}
            {browserSupportsSpeechRecognition ? '✅' : '❌'}
          </p>
          <p>
            <strong>Continuous Listening:</strong>{' '}
            {browserSupportsContinuousListening ? '✅' : '❌'}
          </p>
        </div>

        <div className="controls">
          <button onClick={startListening} disabled={listening}>
            Start Listening
          </button>
          <button
            onClick={SpeechRecognition.stopListening}
            disabled={!listening}>
            Stop Listening
          </button>
          <button
            onClick={SpeechRecognition.abortListening}
            disabled={!listening}>
            Abort
          </button>
          <button onClick={resetTranscript}>Reset</button>
        </div>
      </header>

      <div className="output">
        <h2>Transcript ({transcript.length} letters):</h2>
      </div>

      <div className="transcript-box">
        {transcript || <em>Start speaking...</em>}
      </div>

      {message && (
        <>
          <h2>Command Response:</h2>
          <div className="message-box">{message}</div>
        </>
      )}

      {/* <div className="instructions">
          <h3>Try these commands:</h3>
          <ul>
            <li>"I would like to order pizza"</li>
            <li>"The weather is sunny today"</li>
            <li>"My top sports are football and basketball"</li>
            <li>"Pass the salt please" or "Pass the salt"</li>
            <li>"Hello" or "Hi"</li>
            <li>"clear" (to reset everything)</li>
          </ul>
        </div> */}
    </div>
  )
}

export default App
