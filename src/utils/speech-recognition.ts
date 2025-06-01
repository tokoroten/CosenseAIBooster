export interface SpeechRecognitionOptions {
  language: string; // 'ja-JP', 'en-US', etc.
  continuous: boolean;
  interimResults: boolean;
}

export interface SpeechRecognitionEvent {
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
  
  constructor(options?: Partial<SpeechRecognitionOptions>) {
    // WebSpeech API の非標準な型のため、any を使用
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition is not supported in this browser.');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = options?.language || 'ja-JP';
    this.recognition.continuous = options?.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults = options?.interimResults !== undefined ? options.interimResults : true;
  }
  
  public start(): void {
    if (this.isListening) return;
    
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isListening = true;
    this.recognition.start();
  }
  
  public stop(): string {
    if (!this.isListening) return this.finalTranscript;
    
    this.isListening = false;
    this.recognition.stop();
    return this.finalTranscript;
  }
  
  public onResult(callback: (final: string, interim: string, isFinal: boolean) => void): void {
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript;
        } else {
          this.interimTranscript += event.results[i][0].transcript;
        }
      }
      
      callback(this.finalTranscript, this.interimTranscript, !!event.results[event.results.length - 1]?.isFinal);
    };
  }
  
  public onEnd(callback: () => void): void {
    this.recognition.onend = () => {
      this.isListening = false;
      callback();
    };
  }
  
  public onError(callback: (event: any) => void): void {
    this.recognition.onerror = callback;
  }
  
  public setLanguage(language: string): void {
    this.recognition.lang = language;
  }
  
  public isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
