import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Brain, Heart, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Chat() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock AI response function - replace with actual Gemini API call
  const handleSendMessage = async (message: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock responses based on message content
      const responses = [
        "I understand how you're feeling. It's completely normal to have ups and downs. Can you tell me more about what's been on your mind today?",
        "Thank you for sharing that with me. Your feelings are valid. Have you tried any breathing exercises or mindfulness techniques that might help?",
        "It sounds like you're going through a challenging time. Remember that you're not alone in this. What usually helps you feel more grounded?",
        "I hear you, and I want you to know that reaching out shows real strength. What would feel most supportive for you right now?",
        "That's a very human experience you're describing. Sometimes just naming our feelings can be the first step toward feeling better. How are you taking care of yourself today?",
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
      
    } catch (error) {
      return "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 p-4 lg:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
          {/* Left Sidebar - Chat Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Chat</h1>
            </div>

            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-primary rounded-full">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Wellness Companion</h2>
                  <p className="text-sm text-muted-foreground">Here to listen and support</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI companion is trained to provide emotional support and wellness guidance. 
                Feel free to share anything that's on your mind.
              </p>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Conversation Tips
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Be open and honest about your feelings</p>
                <p>• Ask for specific advice when needed</p>
                <p>• Share what's working or not working</p>
                <p>• Remember this is a safe, judgment-free space</p>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Privacy & Safety
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Your conversations are private</p>
                <p>• For immediate help, contact a mental health professional</p>
                <p>• This AI is not a replacement for professional therapy</p>
              </div>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-card h-[calc(100vh-120px)]">
              <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto h-full">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-full">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Wellness Companion</h1>
                <p className="text-xs text-muted-foreground">Here to listen and support</p>
              </div>
            </div>
          </div>

          <Card className="shadow-card h-[calc(100vh-200px)]">
            <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
          </Card>

          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              💙 This AI provides emotional support and wellness guidance. 
              For immediate help, contact a mental health professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}