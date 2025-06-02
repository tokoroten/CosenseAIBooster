import { StorageService, Settings } from '../utils/storage';

describe('StorageService', () => {
  let mockChromeStorage: jest.Mock;
  let mockChromeGet: jest.Mock;

  beforeEach(() => {
    // Mock chrome.storage.sync.get
    mockChromeGet = jest.fn();
    chrome.storage.sync.get = mockChromeGet;

    // Mock chrome.storage.sync.set
    mockChromeStorage = jest.fn();
    chrome.storage.sync.set = mockChromeStorage;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('initializeSettings', () => {
    it('should return default settings when no settings exist', async () => {
      // Mock chrome.storage.sync.get to return null
      mockChromeGet.mockImplementation((key, callback) => {
        callback({});
      });

      // Call the method
      const result = await StorageService.initializeSettings();

      // Verify default settings
      expect(result).toBeDefined();
      expect(result.prompts.length).toBeGreaterThan(0);
      expect(result.speechLang).toBe('ja-JP');
      expect(result.insertPosition).toBe('below');
      expect(result.apiProvider).toBe('openai');

      // Verify chrome.storage.sync.set was called
      expect(mockChromeStorage).toHaveBeenCalledTimes(1);
    });

    it('should return existing settings when they exist', async () => {
      // Mock existing settings
      const existingSettings: Settings = {
        prompts: [
          {
            id: 'test-id',
            name: 'Test Prompt',
            content: 'Test content',
            model: 'test-model',
          },
        ],
        insertPosition: 'bottom',
        speechLang: 'en-US',
        apiProvider: 'openrouter',
        openaiKey: 'test-key',
        openaiModel: 'test-model',
        openrouterKey: 'test-router-key',
        openrouterModel: 'test-router-model',
        customEndpoint: 'test-endpoint',
        customKey: 'test-custom-key',
        customModel: 'test-custom-model',
      };

      // Mock chrome.storage.sync.get to return the existing settings
      mockChromeGet.mockImplementation((key, callback) => {
        callback(existingSettings);
      });

      // Call the method
      const result = await StorageService.initializeSettings();

      // Verify the result is the existing settings
      expect(result).toEqual(existingSettings);

      // Verify chrome.storage.sync.set was NOT called
      expect(mockChromeStorage).not.toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should return settings from chrome storage', async () => {
      // Mock settings
      const mockSettings: Settings = {
        prompts: [],
        insertPosition: 'below',
        speechLang: 'ja-JP',
        apiProvider: 'openai',
        openaiKey: '',
        openaiModel: '',
        openrouterKey: '',
        openrouterModel: '',
        customEndpoint: '',
        customKey: '',
        customModel: '',
      };

      // Mock chrome.storage.sync.get to return the settings
      mockChromeGet.mockImplementation((key, callback) => {
        callback(mockSettings);
      });

      // Call the method
      const result = await StorageService.getSettings();

      // Verify the result
      expect(result).toEqual(mockSettings);
    });

    it('should return null when chrome.runtime.lastError occurs', async () => {
      // Mock chrome.runtime.lastError
      Object.defineProperty(chrome.runtime, 'lastError', {
        value: new Error('Test error'),
        configurable: true,
      });

      // Mock chrome.storage.sync.get
      mockChromeGet.mockImplementation((key, callback) => {
        callback({});
      });

      // Call the method
      const result = await StorageService.getSettings();

      // Verify the result
      expect(result).toBeNull();

      // Restore chrome.runtime.lastError
      Object.defineProperty(chrome.runtime, 'lastError', { value: null });
    });
  });

  describe('saveSettings', () => {
    it('should save settings to chrome storage', async () => {
      // Mock settings
      const mockSettings: Settings = {
        prompts: [],
        insertPosition: 'below',
        speechLang: 'ja-JP',
        apiProvider: 'openai',
        openaiKey: '',
        openaiModel: '',
        openrouterKey: '',
        openrouterModel: '',
        customEndpoint: '',
        customKey: '',
        customModel: '',
      };

      // Mock chrome.storage.sync.set to be successful
      mockChromeStorage.mockImplementation((settings, callback) => {
        callback();
      });

      // Call the method
      await StorageService.saveSettings(mockSettings);

      // Verify chrome.storage.sync.set was called with the settings
      expect(mockChromeStorage).toHaveBeenCalledWith(mockSettings, expect.any(Function));
    });
  });
});
