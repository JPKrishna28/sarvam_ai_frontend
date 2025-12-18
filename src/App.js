import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { FaPaperPlane, FaGlobeAsia, FaSpinner, FaVolumeUp, FaUser, FaRobot, FaTrash } from 'react-icons/fa';

// API base URL - change this to your Flask backend URL
const API_URL = 'http://localhost:5000/api';

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'నమస్కారం! నేను మీ తెలుగు AI సహాయకుడను. దయచేసి ఆంగ్లంలో మీ ప్రశ్న అడగండి, నేను తెలుగులో సహజంగా సమాధానం ఇస్తాను.',
      englishText: 'Hello! I am your Telugu AI assistant. Please ask your question in English, and I will respond naturally in Telugu.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        text: 'నమస్కారం! నేను మీ తెలుగు AI సహాయకుడను. దయచేసి ఆంగ్లంలో మీ ప్రశ్న అడగండి, నేను తెలుగులో సహజంగా సమాధానం ఇస్తాను.',
        englishText: 'Hello! I am your Telugu AI assistant. Please ask your question in English, and I will respond naturally in Telugu.',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const speakText = async (text) => {
    setIsSpeaking(true);
    
    try {
      const response = await axios.post(`${API_URL}/text-to-speech`, {
        text: text,
        languageCode: 'te-IN' // Telugu language code
      });
      
      if (response.data.success && response.data.audio_data) {
        // Create audio from base64 data
        const audio = new Audio(`data:audio/wav;base64,${response.data.audio_data}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          console.error('Failed to play audio');
          setIsSpeaking(false);
        };
        audio.play();
      } else {
        throw new Error(response.data.message || 'Failed to generate speech');
      }
    } catch (err) {
      console.error(`Text-to-speech error: ${err.message}`);
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        question: currentInput,
        session_id: sessionId
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.data.telugu_response,
          englishText: currentInput,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.data.telugu_response || 'క్షమించండి, సమాధానం ఇవ్వడంలో లోపం ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
          englishText: 'Sorry, there was an error generating response. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'AI సేవతో కనెక్షన్ లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.',
        englishText: 'Connection error with AI service. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-app">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <div className="logo">
            <FaGlobeAsia className="logo-icon" />
            <div>
              <h1>Telugu AI Assistant</h1>
              <span className="subtitle">Ask in English • Get Telugu Responses</span>
            </div>
          </div>
          <button className="clear-chat-btn" onClick={clearChat} title="Clear chat">
            <FaTrash />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="chat-messages">
        <div className="messages-container">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type}-message`}>
              <div className="message-avatar">
                {message.type === 'user' ? <FaUser /> : <FaRobot />}
              </div>
              <div className="message-content">
                <div className={`message-bubble ${message.isError ? 'error' : ''}`}>
                  <div className="message-text">{message.text}</div>
                  {message.englishText && message.type === 'bot' && (
                    <div className="english-text">English: {message.englishText}</div>
                  )}
                  <div className="message-actions">
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.type === 'bot' && !message.isError && (
                      <button
                        className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
                        onClick={() => speakText(message.text)}
                        disabled={isSpeaking}
                        title="Listen to Telugu text"
                      >
                        <FaVolumeUp />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot-message">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <FaSpinner className="spinner" />
                    <span>Thinking in Telugu...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="chat-input-area">
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask your question in English..."
              className="chat-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="send-btn"
              title="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
          <div className="input-hint">
            Press Enter to send • Ask questions in English for Telugu responses
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;