// Mock for Chrome API
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    storage: {
      sync: {
        get: jest.fn(),
        set: jest.fn(),
      },
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
    },
    contextMenus: {
      create: jest.fn(),
      removeAll: jest.fn(),
      update: jest.fn(),
    },
  },
  writable: true,
});

// Mock for document
Object.defineProperty(global.document, 'querySelector', {
  value: jest.fn(),
  writable: true,
});

// Mock for SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'ja-JP';
  maxAlternatives = 1;

  onstart = null;
  onresult = null;
  onerror = null;
  onend = null;

  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();
}

// @ts-expect-error - Add SpeechRecognition to window
window.SpeechRecognition = MockSpeechRecognition;
// @ts-expect-error - Add webkitSpeechRecognition for Chrome
window.webkitSpeechRecognition = MockSpeechRecognition;
