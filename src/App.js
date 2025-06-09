import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FaExchangeAlt, FaGlobeAsia, FaSpinner, FaVolumeUp, FaUser, FaClock, FaHistory } from 'react-icons/fa';

// API base URL - change this to your Flask backend URL
const API_URL = 'http://localhost:5000/api';

function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [translationHistory, setTranslationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch supported languages and system info on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_URL}/languages`);
        if (response.data.success) {
          setLanguages(response.data.languages);
        }
      } catch (err) {
        setError('Failed to fetch supported languages');
        console.error(err);
      }
    };

    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/system-info`);
        if (response.data.success) {
          setCurrentDateTime(response.data.timestamp);
          setCurrentUser(response.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    };

    fetchLanguages();
    fetchSystemInfo();

    // Update time every minute
    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toISOString().replace('T', ' ').substring(0, 19));
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Initialize with current date time
  

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setCharCount(text.length);
  };

  const swapLanguages = () => {
    if (!translatedText) return;
    
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText('');
  };

  const copyToClipboard = () => {
    if (!translatedText) return;
    
    navigator.clipboard.writeText(translatedText);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  const clearAll = () => {
    setInputText('');
    setTranslatedText('');
    setCharCount(0);
    setError('');
  };

  const speakText = async () => {
    if (!translatedText) return;
    
    setIsSpeaking(true);
    
    try {
      const response = await axios.post(`${API_URL}/text-to-speech`, {
        text: translatedText,
        languageCode: SUPPORTED_LANGUAGES[targetLang]
      });
      
      if (response.data.success && response.data.audio_data) {
        // Create audio from base64 data
        const audio = new Audio(`data:audio/wav;base64,${response.data.audio_data}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setError('Failed to play audio');
          setIsSpeaking(false);
        };
        audio.play();
      } else {
        throw new Error(response.data.message || 'Failed to generate speech');
      }
    } catch (err) {
      setError(`Text-to-speech error: ${err.message}`);
      setIsSpeaking(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const selectFromHistory = (item) => {
    setInputText(item.originalText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setShowHistory(false);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate');
      return;
    }

    if (sourceLang === targetLang) {
      setError('Source and target languages are the same');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/translate`, {
        text: inputText,
        sourceLang,
        targetLang
      });

      if (response.data.success) {
        setTranslatedText(response.data.translated_text);
        setCurrentDateTime(response.data.timestamp || currentDateTime);
        setCurrentUser(response.data.user || currentUser);
        
        // Add to translation history
        setTranslationHistory(prev => [
          {
            id: Date.now(),
            originalText: inputText,
            translatedText: response.data.translated_text,
            sourceLang,
            targetLang,
            timestamp: response.data.timestamp || new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only 10 most recent translations
        ]);
      } else {
        setError(response.data.message || 'Translation failed');
      }
    } catch (err) {
      setError('Error connecting to the translation service');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="background-animation"></div>
      
      <header className="header">
        <div className="logo">
          <FaGlobeAsia className="logo-icon" />
          <h1>Bharat Bhasha Translator</h1>
        </div>
        <p className="subtitle">Bridging language barriers across India</p>
        
        <div className="system-info">
          <div className="info-item">
            <FaClock /> <span>{currentDateTime}</span>
          </div>
          <div className="info-item">
            <FaUser /> <span>{currentUser}</span>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="translator-card">
          <div className="card-header">
            <h2>Language Translator</h2>
            <button className="history-button" onClick={toggleHistory} title="Translation History">
              <FaHistory />
            </button>
          </div>
          
          {showHistory && (
            <div className="history-panel">
              <h3>Recent Translations</h3>
              {translationHistory.length > 0 ? (
                <ul className="history-list">
                  {translationHistory.map(item => (
                    <li key={item.id} onClick={() => selectFromHistory(item)}>
                      <div className="history-item">
                        <div className="history-text">{item.originalText.substring(0, 30)}{item.originalText.length > 30 ? '...' : ''}</div>
                        <div className="history-langs">{item.sourceLang} → {item.targetLang}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-history">No translation history yet</p>
              )}
            </div>
          )}

          <div className="language-controls">
            <div className="language-selector">
              <label>From</label>
              <select 
                value={sourceLang} 
                onChange={(e) => setSourceLang(e.target.value)}
                className="language-dropdown"
              >
                {languages.map(lang => (
                  <option key={`source-${lang}`} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            
            <button className="swap-button" onClick={swapLanguages} title="Swap languages">
              <FaExchangeAlt />
            </button>
            
            <div className="language-selector">
              <label>To</label>
              <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                className="language-dropdown"
              >
                {languages.map(lang => (
                  <option key={`target-${lang}`} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="translation-area">
            <div className="text-panel">
              <textarea
                className="text-input"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type your text here..."
                maxLength={5000}
              />
              <div className="text-actions">
                <span className="char-count">{charCount}/5000</span>
                <button className="action-button" onClick={clearAll}>Clear</button>
              </div>
            </div>

            <div className="text-panel">
              <div className={`text-output ${translatedText ? 'has-content' : ''}`}>
                {translatedText ? translatedText : 'Translation will appear here...'}
              </div>
              <div className="text-actions">
                {translatedText && (
                  <>
                    <button 
                      className={`action-button speak-button ${isSpeaking ? 'speaking' : ''}`} 
                      onClick={speakText}
                      disabled={isSpeaking}
                    >
                      <FaVolumeUp /> {isSpeaking ? 'Playing...' : 'Listen'}
                    </button>
                    <button className="action-button copy-button" onClick={copyToClipboard}>
                      {showCopiedMessage ? 'Copied!' : 'Copy'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="translate-button" 
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinner" /> Translating...
              </>
            ) : (
              'Translate Now'
            )}
          </button>
        </div>

        <div className="features-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>10+ Indian Languages</h3>
              <p>Translate between English and major Indian languages including Hindi, Tamil, Telugu, and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Translation</h3>
              <p>Powered by Sarvam AI's advanced neural machine translation technology.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔊</div>
              <h3>Text-to-Speech</h3>
              <p>Listen to your translations with natural-sounding voice output.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Bharat Bhasha Translator</p>
          <p>Powered by <a href="https://sarvam.ai" target="_blank" rel="noopener noreferrer">Sarvam AI</a></p>
        </div>
      </footer>
    </div>
  );
}

// Language code mapping (same as backend)
const SUPPORTED_LANGUAGES = {
  "English": "en-IN",
  "Hindi": "hi-IN",
  "Tamil": "ta-IN",
  "Telugu": "te-IN",
  "Kannada": "kn-IN",
  "Malayalam": "ml-IN",
  "Bengali": "bn-IN",
  "Marathi": "mr-IN",
  "Gujarati": "gu-IN",
  "Punjabi": "pa-IN"
};

export default App;