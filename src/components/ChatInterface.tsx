import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateTrip: (userInput: string) => void;
  isLoading: boolean;
  messages: ChatMessage[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  onGenerateTrip,
  isLoading,
  messages
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onGenerateTrip(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-interface-overlay">
      <div className="chat-interface">
        <div className="chat-header">
          <h3>🤖 AI Trip Planner</h3>
          <button className="chat-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">🗺️</div>
              <h4>Plan Your Perfect Trip</h4>
              <p>Tell me about your ideal leisure trip! I'll create a personalized route with:</p>
              <ul>
                <li>🏛️ Historical attractions</li>
                <li>🍽️ Food & coffee breaks</li>
                <li>⏱️ Realistic timing estimates</li>
                <li>🚶 Walking routes</li>
              </ul>
              <p className="example-prompts">
                <strong>Try:</strong> "I want a 3-hour cultural tour with lunch"<br/>
                <strong>Or:</strong> "Plan a half-day adventure with coffee stops"<br/>
                <strong>Note:</strong> I'll create 2 personalized trip options for you
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.type}`}
            >
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message ai">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Planning your perfect trip...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your ideal trip..."
            disabled={isLoading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="chat-send-btn"
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface; 