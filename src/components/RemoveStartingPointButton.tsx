import React from 'react';

interface RemoveStartingPointButtonProps {
  onRemove: () => void;
}

const RemoveStartingPointButton: React.FC<RemoveStartingPointButtonProps> = ({ onRemove }) => {
  return (
    <button
      className="map-control-button remove-starting-point-btn"
      onClick={onRemove}
      title="Remove starting point"
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        width: '40px',
        height: '40px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#dc2626';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#ef4444';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      ❌
    </button>
  );
};

export default RemoveStartingPointButton; 