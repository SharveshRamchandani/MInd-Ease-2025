// Browser-based Text-to-Speech with Indian voices
// Fallback when Google Cloud TTS is not available

interface BrowserTTSOptions {
  text: string;
  language?: 'en-IN' | 'hi-IN' | 'ta-IN' | 'en-GB' | 'en-US';
  rate?: number;
  pitch?: number;
  volume?: number;
}

class BrowserTTS {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoices();
  }

  private initializeVoices() {
    // Load voices when they become available
    if (this.synthesis.getVoices().length > 0) {
      this.voices = this.synthesis.getVoices();
      this.isInitialized = true;
    } else {
      this.synthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
        this.isInitialized = true;
        console.log('Browser TTS voices loaded:', this.voices.length);
      };
    }
  }

  private findIndianVoice(language: string): SpeechSynthesisVoice | null {
    if (!this.isInitialized) {
      console.warn('Browser TTS voices not yet loaded');
      return null;
    }

    // Priority order for Indian voices
    const voicePriorities = [
      // Indian English voices
      { lang: 'en-IN', name: 'Google हिन्दी' },
      { lang: 'en-IN', name: 'Google हिंदी' },
      { lang: 'en-IN', name: 'Microsoft Neerja' },
      { lang: 'en-IN', name: 'Microsoft Heera' },
      { lang: 'en-IN', name: 'Microsoft Priya' },
      // Hindi voices
      { lang: 'hi-IN', name: 'Google हिन्दी' },
      { lang: 'hi-IN', name: 'Google हिंदी' },
      // Tamil voices
      { lang: 'ta-IN', name: 'Google தமிழ்' },
      // Fallback to any Indian voice
      { lang: 'en-IN' },
      { lang: 'hi-IN' },
      { lang: 'ta-IN' },
      // British English as fallback
      { lang: 'en-GB' },
      // US English as last resort
      { lang: 'en-US' }
    ];

    for (const priority of voicePriorities) {
      const voice = this.voices.find(v => {
        if (priority.name) {
          return v.lang.startsWith(priority.lang) && v.name.includes(priority.name);
        }
        return v.lang.startsWith(priority.lang);
      });
      
      if (voice) {
        console.log(`Found Indian voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    // If no Indian voice found, return the first available voice
    const fallbackVoice = this.voices.find(v => v.lang.startsWith('en-')) || this.voices[0];
    if (fallbackVoice) {
      console.log(`Using fallback voice: ${fallbackVoice.name} (${fallbackVoice.lang})`);
    }
    return fallbackVoice;
  }

  public speak(options: BrowserTTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(options.text);
        
        // Find the best Indian voice
        const voice = this.findIndianVoice(options.language || 'en-IN');
        if (voice) {
          utterance.voice = voice;
        }

        // Set speech parameters for natural, friendly Indian voice
        utterance.rate = options.rate || 0.85;  // Slightly slower for calm tone
        utterance.pitch = options.pitch || 0.9;  // Slightly lower for warm voice
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.language || 'en-IN';

        // Event handlers
        utterance.onend = () => {
          console.log('Browser TTS: Speech completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Browser TTS error:', event);
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        utterance.onstart = () => {
          console.log('Browser TTS: Speech started');
        };

        // Start speaking
        this.synthesis.speak(utterance);

      } catch (error) {
        console.error('Browser TTS initialization error:', error);
        reject(error);
      }
    });
  }

  public stop(): void {
    this.synthesis.cancel();
  }

  public pause(): void {
    this.synthesis.pause();
  }

  public resume(): void {
    this.synthesis.resume();
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.startsWith('en-IN') || 
      voice.lang.startsWith('hi-IN') || 
      voice.lang.startsWith('ta-IN') ||
      voice.lang.startsWith('en-GB') ||
      voice.lang.startsWith('en-US')
    );
  }

  public getVoiceInfo(): { total: number; indian: number; languages: string[] } {
    const indianVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-IN') || 
      voice.lang.startsWith('hi-IN') || 
      voice.lang.startsWith('ta-IN')
    );
    
    const languages = [...new Set(this.voices.map(v => v.lang.split('-')[0]))];
    
    return {
      total: this.voices.length,
      indian: indianVoices.length,
      languages
    };
  }
}

// Create a singleton instance
const browserTTS = new BrowserTTS();

export default browserTTS;
export { BrowserTTS, BrowserTTSOptions };
