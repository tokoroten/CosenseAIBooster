// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Import the necessary components and utilities
import { useSettingsStore, useSpeechStore, useUIStore } from '../store';

export default defineContentScript({
  matches: ['*://scrapbox.io/*', '*://cosen.se/*'],
  main() {
    console.log('Content script running');
    
    // Create a container for our React components
    const container = document.createElement('div');
    container.id = 'cosense-ai-booster-container';
    document.body.appendChild(container);
    
    // Initialize React app for content script
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ContentApp />
      </React.StrictMode>
    );
  },
});

// Simple placeholder component - needs to be replaced with actual content script UI
const ContentApp: React.FC = () => {
  return (
    <div style={{ display: 'none' }}>
      {/* Invisible container for React context */}
    </div>
  );
};
