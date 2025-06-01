export interface SpeechRecognitionOptions {
  language: string; // 'ja-JP', 'en-US', etc.
  continuous: boolean;
  interimResults: boolean;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [index: number]: {
      transcript: string;
    };
  }[];
}

export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private recognitionTimeout: number | null = null;
  private pauseDetected: boolean = false;
  private lastResultTimestamp: number = 0;
  private _onEndCallback: (() => void) | null = null;

  constructor(options?: Partial<SpeechRecognitionOptions>) {
    // WebSpeech API の非標準な型のため、any を使用
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech Recognition is not supported in this browser.');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = options?.language || 'ja-JP';
    this.recognition.continuous = options?.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults =
      options?.interimResults !== undefined ? options.interimResults : true;

    // Set up automatic restart for longer sessions
    this.recognition.onend = this.onRecognitionEnd.bind(this);
  }

  /**
   * 音声認識の開始
   */
  public start(): void {
    if (this.isListening) return;

    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isListening = true;
    this.pauseDetected = false;
    this.lastResultTimestamp = Date.now();

    try {
      this.recognition.start();
      // Set up pause detection
      this.startPauseDetection();
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  /**
   * 音声認識の停止
   */
  public stop(): string {
    if (!this.isListening) return this.finalTranscript;

    this.isListening = false;
    this.clearPauseDetection();

    try {
      this.recognition.stop();
    } catch (error) {
      // Handle the error silently
    }

    return this.finalTranscript;
  }

  /**
   * 音声認識の一時停止
   */
  public pause(): boolean {
    if (!this.isListening) return false;

    try {
      this.pauseDetected = true;
      this.recognition.stop();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 音声認識の再開
   */
  public resume(): boolean {
    if (!this.pauseDetected) return false;

    try {
      this.pauseDetected = false;
      this.recognition.start();
      this.startPauseDetection();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 認識結果のハンドリング
   */
  public onResult(callback: (final: string, interim: string, isFinal: boolean) => void): void {
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.interimTranscript = '';
      this.lastResultTimestamp = Date.now();

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript;
        } else {
          this.interimTranscript += event.results[i][0].transcript;
        }
      }

      const isFinal = !!event.results[event.results.length - 1]?.isFinal;
      callback(this.finalTranscript, this.interimTranscript, isFinal);

      // 結果が確定したら一時停止検出タイマーをリセット
      if (isFinal) {
        this.resetPauseDetection();
      }
    };
  }

  /**
   * 音声認識終了時のハンドラ設定
   */
  public onEnd(callback: () => void): void {
    this._onEndCallback = callback;
  }

  /**
   * エラー発生時のハンドラ設定
   */
  public onError(callback: (event: any) => void): void {
    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      callback(event);
    };
  }

  /**
   * 言語設定の変更
   */
  public setLanguage(language: string): void {
    this.recognition.lang = language;

    // 認識中の場合は再起動して新しい言語設定を適用
    if (this.isListening) {
      const wasListening = this.isListening;
      this.stop();

      if (wasListening) {
        setTimeout(() => this.start(), 300);
      }
    }
  }

  /**
   * トランスクリプトのクリア
   */
  public clearTranscript(): void {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  /**
   * 音声認識がサポートされているかどうか
   */
  public isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  /**
   * 音声認識のステータス取得
   */
  public getStatus(): {
    isListening: boolean;
    isPaused: boolean;
    finalText: string;
    interimText: string;
  } {
    return {
      isListening: this.isListening,
      isPaused: this.pauseDetected,
      finalText: this.finalTranscript,
      interimText: this.interimTranscript,
    };
  }

  /**
   * 音声認識終了時の内部ハンドラ
   */
  private onRecognitionEnd(): void {
    // 手動で停止した場合や一時停止の場合は何もしない
    if (!this.isListening || this.pauseDetected) {
      if (this._onEndCallback) this._onEndCallback();
      return;
    }

    // 自動的に終了した場合は再起動する
    // (5秒の制限などでブラウザが停止させた場合)
    setTimeout(() => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (error) {
          this.isListening = false;
          if (this._onEndCallback) this._onEndCallback();
        }
      }
    }, 300);
  }

  /**
   * 一時停止検出の開始
   * 一定時間発話がない場合に一時停止とみなす
   */
  private startPauseDetection(): void {
    this.clearPauseDetection();
    this.recognitionTimeout = window.setTimeout(() => {
      const timeSinceLastResult = Date.now() - this.lastResultTimestamp;
      if (timeSinceLastResult > 1500 && this.isListening) {
        // 1.5秒間発話がなければ自動的に一時停止
        this.pause();
      }
    }, 2000);
  }

  /**
   * 一時停止検出タイマーのクリア
   */
  private clearPauseDetection(): void {
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  /**
   * 一時停止検出タイマーのリセット
   */
  private resetPauseDetection(): void {
    this.clearPauseDetection();
    if (this.isListening && !this.pauseDetected) {
      this.startPauseDetection();
    }
  }
}
