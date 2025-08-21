import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Mic, MicOff, Volume2 } from "lucide-react";
import { cn, stripMarkdown } from "@/lib/utils";
import { useVoice } from "@/hooks/use-voice";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<string>;
  isLoading?: boolean;
  initialMessages?: any[];
  messages: Message[];
  onAddMessage: (message: Message) => void;
}

export const ChatInterface = ({ onSendMessage, isLoading = false, initialMessages = [], messages, onAddMessage }: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
    isSupported: voiceSupported,
  } = useVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update input message when transcript changes during listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputMessage(transcript);
    }
  }, [transcript, isListening]);

  const handleSendMessage = async () => {
    const messageToSend = inputMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageToSend,
      sender: "user",
      timestamp: new Date(),
    };

    onAddMessage(userMessage);
    setInputMessage("");
    resetTranscript();
    stopListening();
    setIsTyping(true);

    try {
      const aiResponse = await onSendMessage(messageToSend);
      
      setTimeout(() => {
        const aiMessage: Message = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: stripMarkdown(aiResponse),
          sender: "ai",
          timestamp: new Date(),
        };
        onAddMessage(aiMessage);
        setIsTyping(false);
        
        // Remove auto-speak - only speak when speaker button is clicked
      }, 1000); // Simulate typing delay
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      onAddMessage(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      // When stopping, set the transcript as the input message
      if (transcript.trim()) {
        setInputMessage(transcript.trim());
      }
    } else {
      startListening();
    }
  };



  const handleReadMessage = (messageContent: string, messageId: string) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // Speak just this specific message with AI voice
    speak(messageContent, undefined, true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2 mb-4", // Adjusted margin and alignment
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === "ai" && (
              <div className="flex-shrink-0 w-8 h-8 mb-1 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            <div className="flex flex-col gap-1 max-w-[75%]"> {/* Constrained width */}
              <Card className={cn(
                "px-3 py-2", // Adjusted padding
                message.sender === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card"
              )}>
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] leading-5 break-words">
                    {message.content}
                  </p>
                  <span className="text-[10px] opacity-70 self-end"> {/* Aligned timestamp */}
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </Card>

              {message.sender === "ai" && voiceSupported && (
                <Button
                  onClick={() => handleReadMessage(message.content, message.id)}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="self-start h-6 px-2 text-xs hover:bg-muted/50"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Read
                </Button>
              )}
            </div>

            {message.sender === "user" && (
              <div className="flex-shrink-0 w-8 h-8 mb-1 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <Card className="p-2.5 shadow-card">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            value={isListening ? transcript : inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Share what's on your mind..."}
            className="resize-none min-h-[40px] max-h-[80px]"
            disabled={isLoading}
          />
          
          {/* Voice input button */}
          {voiceSupported && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleVoiceToggle}
                disabled={isLoading}
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                className={cn(
                  "transition-all duration-200",
                  isListening && "animate-pulse"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
          )}
          

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-primary hover:opacity-90 transition-gentle"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Voice status indicator */}
        {voiceSupported && (isListening || isSpeaking) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {isListening && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Speaking...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};