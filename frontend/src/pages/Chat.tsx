import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Brain, Heart, Shield, MessageCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function Chat() {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();

  // Initialize with welcome message only if no conversation is selected
  useEffect(() => {
    if (currentMessages.length === 0 && !currentConversationId) {
      setCurrentMessages([{
        id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: "Hello! I'm Solari, your AI wellness companion. I'm here to support your mental wellness journey. How are you feeling today? Feel free to share anything that's on your mind.",
        sender: "ai",
        timestamp: new Date(),
      }]);
    }
  }, [currentConversationId]);

  // Load conversations and create default conversation on component mount
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversations();
    };
    initializeChat();
  }, []);

  // Create default conversation if none exists after loading
  useEffect(() => {
    if (!isLoadingConversations && conversations.length === 0 && !isCreatingConversation) {
      createNewConversation();
    }
  }, [isLoadingConversations, conversations.length, isCreatingConversation]);

  const loadConversations = async () => {
    if (isLoadingConversations) return; // Prevent multiple simultaneous loads
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch('http://localhost:5000/api/conversations?userId=anonymous');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    if (isCreatingConversation) return; // Prevent multiple simultaneous creations
    
    setIsCreatingConversation(true);
    try {
      const response = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'anonymous',
          title: `New Chat ${new Date().toLocaleTimeString()}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newConversationId = data.data.conversation_id;
        setCurrentConversationId(newConversationId);
        
        // Clear messages and let the useEffect handle the welcome message
        setCurrentMessages([]);
        
        // Add the new conversation to the list without reloading
        setConversations(prev => [{
          id: newConversationId,
          title: `New Chat ${new Date().toLocaleTimeString()}`,
          updated_at: new Date().toISOString(),
          messages: []
        }, ...prev]);
        
        toast({
          title: "New conversation created",
          description: "You can start chatting now!",
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error creating conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentConversationId(conversationId);
        const messages = data.data.messages || [];
        
        if (messages.length === 0) {
          // If no messages, let the useEffect handle the welcome message
          setCurrentMessages([]);
        } else {
          const formattedMessages = messages.map((msg: any, index: number) => ({
            id: `msg-${index}`,
            content: msg.content,
            sender: msg.type === 'user' ? 'user' : 'ai',
            timestamp: new Date(msg.timestamp || Date.now()),
          }));
          setCurrentMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error loading conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // If this was the current conversation, clear it
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setCurrentMessages([]);
        }
        
        toast({
          title: "Conversation deleted",
          description: "The conversation has been removed.",
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error deleting conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const addMessage = (message: Message) => {
    setCurrentMessages(prev => {
      // Check if message with same ID already exists to prevent duplicates
      const messageExists = prev.some(msg => msg.id === message.id);
      if (messageExists) {
        return prev;
      }
      return [...prev, message];
    });
  };

  // AI response function - now works with conversations
  const handleSendMessage = async (message: string): Promise<string> => {
    let conversationId = currentConversationId;
    
    // Create a new conversation if none exists
    if (!conversationId) {
      if (isCreatingConversation) {
        return "I'm sorry, I'm still creating a conversation. Please wait a moment.";
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'anonymous',
            title: `New Chat ${new Date().toLocaleTimeString()}`
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          conversationId = data.data.conversation_id;
          setCurrentConversationId(conversationId);
          
          // Clear messages and let the useEffect handle the welcome message
          setCurrentMessages([]);
          
          // Add the new conversation to the list without reloading
          setConversations(prev => [{
            id: conversationId,
            title: `New Chat ${new Date().toLocaleTimeString()}`,
            updated_at: new Date().toISOString(),
            messages: []
          }, ...prev]);
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        return "I'm sorry, I'm having trouble creating a new conversation. Please try again.";
      }
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: 'anonymous'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the conversation in the list without reloading
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        ));
        
        return data.data.message;
      } else {
        throw new Error(data.error || 'Failed to get response from AI');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      return "I'm sorry, I'm having trouble connecting to my AI brain right now. Please check if the backend server is running and try again.";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 p-4 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Centered Chat Heading */}
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:mb-6">
          <h1 className="text-3xl font-bold text-center">Chat</h1>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:items-start">
          {/* Left Sidebar - Conversations */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Link to="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <Card className="shadow-card h-[calc(100vh-200px)]">
              <ConversationSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={selectConversation}
                onCreateNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
                isLoading={isLoadingConversations}
              />
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-4">
            <Card className="shadow-card h-[calc(100vh-200px)]">
              <ChatInterface 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
                messages={currentMessages}
                onAddMessage={addMessage}
              />
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Centered Chat Heading for Mobile */}
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl font-bold text-center">Chat</h1>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Mobile Chat Area */}
            <Card className="shadow-card h-[calc(100vh-220px)]">
              <ChatInterface 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
                messages={currentMessages}
                onAddMessage={addMessage}
              />
            </Card>
          </div>

          {/* Mobile Back Arrow - Fixed to top left */}
          <Link to="/home">
            <Button 
              variant="ghost" 
              size="sm"
              className="fixed top-4 left-4 z-50 lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {/* Mobile Sidebar - Fixed to right side */}
          {showSidebar && (
            <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Chats</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ConversationSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={selectConversation}
                onCreateNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
                isLoading={isLoadingConversations}
              />
            </div>
          )}

          {/* Mobile Menu Button - Fixed to top right */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="fixed top-4 right-4 z-50 lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}