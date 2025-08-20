import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void, useAIVoice?: boolean) => void;
  stopSpeaking: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  aiVoiceName: string;
  setAIVoiceName: (name: string) => void;
}

export const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [aiVoiceName, setAIVoiceNameState] = useState<string>('');
  const [aiFixedName, setAiFixedName] = useState<string>(() => localStorage.getItem('voice:aiFixedName') || '');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech recognition and synthesis are supported
  useEffect(() => {
    const recognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const synthesisSupported = 'speechSynthesis' in window;
    setIsSupported(recognitionSupported && synthesisSupported);

    if (synthesisSupported) {
      const populate = () => {
        const v = window.speechSynthesis.getVoices();
        setVoices(v);
        // Lock to a single Indian female voice once, if not already fixed
        if (!aiFixedName && v.length) {
          const preferredOrder = [
            (vv: SpeechSynthesisVoice) => /\bhi-IN\b/i.test(vv.lang) && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\ben-IN\b/i.test(vv.lang) && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\ben-IN\b/i.test(vv.lang),
            (vv: SpeechSynthesisVoice) => /\bhi-IN\b/i.test(vv.lang),
          ];
          let chosen: SpeechSynthesisVoice | undefined;
          for (const rule of preferredOrder) {
            chosen = v.find(rule);
            if (chosen) break;
          }
          if (!chosen) {
            chosen = v.find(vv => /^en/i.test(vv.lang) && /aria|jenny|zira|female|neural/i.test(vv.name)) || v.find(vv => /^en/i.test(vv.lang)) || v[0];
          }
          if (chosen) {
            setAiFixedName(chosen.name);
            localStorage.setItem('voice:aiFixedName', chosen.name);
          }
        }
      };
      populate();
      window.speechSynthesis.onvoiceschanged = populate;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const setAIVoiceName = useCallback((name: string) => {
    setAIVoiceNameState(name);
  }, []);

  const resolveVoice = (preferAI: boolean): SpeechSynthesisVoice | undefined => {
    if (!voices.length) return undefined;

    // STRICT: Only Indian voices allowed, no foreign fallback
    const indianVoices = voices.filter(v => 
      /\b(hi-IN|en-IN|ta-IN)\b/i.test(v.lang) || 
      /aditi|heera|neerja|swara|kajal|hema|asha|ananya|indra|meera|sangeeta|lekha/i.test(v.name.toLowerCase())
    );

    if (indianVoices.length === 0) {
      console.warn('No Indian voices found - TTS disabled');
      return undefined;
    }

    // If we have a fixed choice, always return it
    if (aiFixedName) {
      const fixed = indianVoices.find(v => v.name === aiFixedName);
      if (fixed) return fixed;
    }

    // Pick the best Indian female voice
    const indianFemale = indianVoices.find(v => 
      /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|sangeeta|lekha/i.test(v.name.toLowerCase())
    );

    return indianFemale || indianVoices[0];
  };

  const detectLanguage = (t: string): 'en-IN' | 'hi-IN' | 'ta-IN' => {
    if ([...t].some(ch => /[\u0900-\u097F]/.test(ch))) return 'hi-IN';
    if ([...t].some(ch => /[\u0B80-\u0BFF]/.test(ch))) return 'ta-IN';
    return 'en-IN';
  };

  const speak = useCallback(async (text: string, onEnd?: () => void, useAIVoice: boolean = false) => {
    if (!isSupported || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    const chosen = resolveVoice(useAIVoice);
    if (chosen) {
      utterance.voice = chosen;
    }
    if (useAIVoice) {
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      // Ignore benign 'interrupted' errors when user clicks to stop or new speech starts
      if ((event as any).error !== 'interrupted') {
        console.error('Speech synthesis error:', (event as any).error);
      }
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    // Try server-side TTS first if available
    try {
      const { http } = await import('@/lib/api');
      const language = detectLanguage(text);
      const tts = await http<any>('/api/tts/synthesize', {
        method: 'POST',
        body: {
          text,
          language,
          voiceHint: language === 'en-IN' ? 'en-IN-Neural2-A' : (language === 'hi-IN' ? 'hi-IN-Neural2-A' : 'ta-IN-Standard-A'),
          rate: utterance.rate,
          pitch: utterance.pitch,
        }
      });
      if (tts?.success && tts?.data?.audioBase64) {
        const audio = new Audio(`data:${tts.data.mime};base64,${tts.data.audioBase64}`);
        audio.onended = () => {
          setIsSpeaking(false);
          onEnd && onEnd();
        };
        setIsSpeaking(true);
        audio.play().catch(() => {
          // Fallback to client TTS if playback fails
          if (chosen) {
            synthesisRef.current = utterance;
            window.speechSynthesis.speak(utterance);
          }
        });
        return;
      }
    } catch (e) {
      // Ignore and fallback to client-side TTS
    }

    // Only use client TTS if we have an Indian voice
    if (!chosen) {
      console.warn('No Indian voice available - speech disabled');
      return;
    }

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
    isSupported,
    voices,
    aiVoiceName,
    setAIVoiceName,
  };
}; 