import React, { useState } from 'react';
import './ChatButton.css';

interface ChatButtonProps {
  onOpenChat: () => void;
  isMinimized?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onOpenChat, isMinimized = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="chat-button-container">
      <button
        className={`chat-button ${isMinimized ? 'minimized' : 'expanded'}`}
        onClick={onOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Plan your trip with AI"
      >
        <span className="chat-icon">💬</span>
        {!isMinimized && (
          <span className="chat-text">Plan Trip</span>
        )}
        {isHovered && isMinimized && (
          <div className="chat-tooltip">
            Plan your trip with AI
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatButton; 