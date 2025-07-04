import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Clock, Plus, X } from 'lucide-react';

interface TimestampCollector {
  isVisible: boolean;
  currentTime: number;
}

const TimestampCollector: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOW_TIMESTAMP_COLLECTOR') {
        setCurrentTime(event.data.currentTime);
        setIsVisible(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Send message to content script to save timestamp
      window.postMessage(
        {
          type: 'SAVE_TIMESTAMP_FROM_UI',
          data: {
            timestamp: currentTime,
            title: title || `Timestamp at ${formatTime(currentTime)}`,
            note,
          },
        },
        '*'
      );

      // Reset form and hide
      setTitle('');
      setNote('');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save timestamp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '320px',
        background: 'white',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        zIndex: 10000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#ff6b35" />
          <span style={{ fontWeight: '600', color: '#1a1a1a' }}>
            Add Timestamp
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: '#666',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              padding: '8px 12px',
              background: '#fff5f2',
              border: '1px solid #ff6b35',
              borderRadius: '6px',
              color: '#ff6b35',
              fontFamily: 'Monaco, Menlo, monospace',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {formatTime(currentTime)}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Timestamp title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <textarea
            placeholder="Notes about this timestamp..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '60px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              flex: '1',
              padding: '10px',
              background: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              fontSize: '14px',
            }}
          >
            {isLoading ? 'Saving...' : 'Save Timestamp'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '10px 16px',
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Create and inject the component
const createTimestampCollector = () => {
  const container = document.createElement('div');
  container.id = 'ytclipper-timestamp-collector';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<TimestampCollector />);
};

// Initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createTimestampCollector);
} else {
  createTimestampCollector();
}
