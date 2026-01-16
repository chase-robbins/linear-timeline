import React, { useState } from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [showKey, setShowKey] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f3f4f6',
    fontSize: '14px',
    width: '300px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#d1d5db',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  };

  const handleToggleVisibility = () => {
    setShowKey(!showKey);
  };

  const handleClear = () => {
    onApiKeyChange('');
  };

  return (
    <div style={containerStyle}>
      <input
        type={showKey ? 'text' : 'password'}
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="Enter Linear API Key"
        style={inputStyle}
      />
      <button
        onClick={handleToggleVisibility}
        style={buttonStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
        title={showKey ? 'Hide API Key' : 'Show API Key'}
      >
        {showKey ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      {apiKey && (
        <button
          onClick={handleClear}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
          title="Clear API Key"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ApiKeyInput;
