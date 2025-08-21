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
        
        // Find and lock to a beautiful Indian lady voice for calm, soothing speech
        if (!aiFixedName && v.length) {
          const beautifulIndianVoicePriorities = [
            // Indian English voices (most natural and beautiful)
            (vv: SpeechSynthesisVoice) => /\ben-IN\b/i.test(vv.lang) && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya|beautiful|calm|soothing/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\ben-IN\b/i.test(vv.lang),
            // Hindi voices
            (vv: SpeechSynthesisVoice) => /\bhi-IN\b/i.test(vv.lang) && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya|beautiful|calm|soothing/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\bhi-IN\b/i.test(vv.lang),
            // Tamil voices
            (vv: SpeechSynthesisVoice) => /\bta-IN\b/i.test(vv.lang) && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya|beautiful|calm|soothing/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\bta-IN\b/i.test(vv.lang),
            // British English (often has beautiful Indian accents)
            (vv: SpeechSynthesisVoice) => /\ben-GB\b/i.test(vv.lang) && /female|woman|neural|jenny|aria|zira|beautiful|calm|soothing/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\ben-GB\b/i.test(vv.lang),
            // US English as last resort
            (vv: SpeechSynthesisVoice) => /\ben-US\b/i.test(vv.lang) && /female|woman|neural|jenny|aria|zira|beautiful|calm|soothing/i.test(vv.name),
            (vv: SpeechSynthesisVoice) => /\ben-US\b/i.test(vv.lang)
          ];
          
          let chosen: SpeechSynthesisVoice | undefined;
          for (const rule of beautifulIndianVoicePriorities) {
            chosen = v.find(rule);
            if (chosen) {
              console.log(`Found beautiful Indian voice: ${chosen.name} (${chosen.lang})`);
              break;
            }
          }
          
          if (chosen) {
            setAiFixedName(chosen.name);
            localStorage.setItem('voice:aiFixedName', chosen.name);
            console.log(`Locked to beautiful Indian voice: ${chosen.name}`);
          } else {
            console.warn('No beautiful Indian voice found');
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

  const speak = useCallback(async (text: string, onEnd?: () => void, useAIVoice?: boolean) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best Indian voice for beautiful, calm, soothing speech
    const findBeautifulIndianVoice = () => {
      // Priority order for beautiful Indian lady voices
      const voicePriorities = [
        // Indian English voices (most natural)
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-IN') && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-IN'),
        // Hindi voices
        (v: SpeechSynthesisVoice) => v.lang.startsWith('hi-IN') && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('hi-IN'),
        // Tamil voices
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ta-IN') && /female|woman|neural|aditi|heera|neerja|swara|kajal|asha|ananya|meera|priya/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ta-IN'),
        // British English as fallback (often has beautiful Indian accents)
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-GB') && /female|woman|neural|jenny|aria|zira/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-GB'),
        // US English as last resort
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US') && /female|woman|neural|jenny|aria|zira/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US')
      ];

      for (const priority of voicePriorities) {
        const voice = voices.find(priority);
        if (voice) {
          console.log(`Found beautiful Indian voice: ${voice.name} (${voice.lang})`);
          return voice;
        }
      }
      return null;
    };

    const beautifulVoice = findBeautifulIndianVoice();
    
    if (beautifulVoice) {
      utterance.voice = beautifulVoice;
      // Beautiful, calm, soothing settings for natural lady voice
      utterance.rate = 0.8;    // Slower pace for calm, soothing tone
      utterance.pitch = 0.85;  // Lower pitch for warm, beautiful voice
      utterance.volume = 1.0;  // Full volume for clear speech
      utterance.lang = beautifulVoice.lang;
      
      console.log(`Using beautiful Indian voice: ${beautifulVoice.name} with calm, soothing settings`);
    } else {
      console.warn('No beautiful Indian voice found - speech disabled');
      return;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('Beautiful Indian voice started speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('Beautiful Indian voice finished speaking');
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      // Ignore benign 'interrupted' errors when user clicks to stop or new speech starts
      if ((event as any).error !== 'interrupted') {
        console.error('Beautiful voice speech error:', (event as any).error);
      }
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    // Use OS default Indian voices only - no server TTS
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

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