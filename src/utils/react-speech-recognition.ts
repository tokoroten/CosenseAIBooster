/**
 * React-friendly speech recognition service
 */

interface SpeechRecognitionOptions {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
}

interface SpeechRecognitionAPI {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionAPI, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionAPI, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionAPI, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionAPI, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionAPI | null = null;
  private isListening: boolean = false;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private resultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private endCallback: (() => void) | null = null;
  private pauseDetectionTimer: number | null = null;
  private pauseTimeout: number = 2000; // 2 seconds of silence to detect a pause

  constructor(options?: SpeechRecognitionOptions) {
    // Get the SpeechRecognition constructor (browser-specific)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech Recognition is not supported in this browser.');
    }

    // Create a new SpeechRecognition instance
    this.recognition = new SpeechRecognition();

    // Set options
    this.recognition.lang = options?.language || 'ja-JP';
    this.recognition.continuous = options?.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults =
      options?.interimResults !== undefined ? options.interimResults : true;
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for the SpeechRecognition API
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.finalTranscript = '';
      this.interimTranscript = '';
    };

    this.recognition.onresult = (event: any) => {
      this.interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript;
          if (this.resultCallback) {
            this.resultCallback(transcript, true);
          }
          // ★確定時にfinalTranscriptをリセット
          this.finalTranscript = '';
        } else {
          this.interimTranscript += transcript;
        }
      }
      if (this.interimTranscript && this.resultCallback) {
        this.resultCallback(this.interimTranscript, false);
      }
      this.resetPauseDetection();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      this.isListening = false;

      // Call the end callback
      if (this.endCallback) {
        this.endCallback();
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;

      // Auto-restart if we were still listening
      // This is needed because the SpeechRecognition API will stop after a while
      if (this.isListening) {
        this.start();
      } else if (this.endCallback) {
        this.endCallback();
      }
    };
  }

  /**
   * Reset the pause detection timer
   */
  private resetPauseDetection(): void {
    if (this.pauseDetectionTimer) {
      window.clearTimeout(this.pauseDetectionTimer);
    }
    this.pauseDetectionTimer = window.setTimeout(() => {
      // すでにfinalTranscriptが空なら何もしない（onresultで確定済み）
      if (this.isListening && this.finalTranscript) {
        this.stop();
        if (this.resultCallback) {
          this.resultCallback(this.finalTranscript, true);
        }
        this.finalTranscript = '';
        this.interimTranscript = '';
        setTimeout(() => {
          this.start();
        }, 500);
      }
    }, this.pauseTimeout);
  }

  /**
   * Start listening
   */
  start(): void {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      this.resetPauseDetection();
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      if (this.pauseDetectionTimer) {
        window.clearTimeout(this.pauseDetectionTimer);
        this.pauseDetectionTimer = null;
      }
      this.recognition.stop();
    }
  }

  /**
   * Set the callback for speech recognition results
   * @param callback Function to call with the recognized text
   */
  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.resultCallback = callback;
  }

  /**
   * Set the callback for when speech recognition ends
   * @param callback Function to call when speech recognition ends
   */
  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }

  /**
   * Check if the service is currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

// Add missing properties to Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionAPI;
    webkitSpeechRecognition?: new () => SpeechRecognitionAPI;
  }
}
