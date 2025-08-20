import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { stripMarkdown } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  messages: any[];
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentMessages: Message[];
  isLoading: boolean;
  isLoadingConversations: boolean;
  isCreatingConversation: boolean;
  loadConversations: () => Promise<void>;
  createNewConversation: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  handleSendMessage: (message: string) => Promise<string>;
  setCurrentMessages: (messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { toast } = useToast();

  // Initialize with welcome message only if no conversation is selected
  useEffect(() => {
    if (currentMessages.length === 0 && !currentConversationId) {
      setCurrentMessages([{
        id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: "Hello! I'm Solari, your quiet companion. I'm here to support your mental wellness. I can help in a number of ways:\n\nEmotional Support: I can listen to you without judgment and validate your feelings.\n\nStress & Anxiety Management: I can guide you through breathing exercises, mindfulness techniques, and even help you create a personalized stress-relief plan.\n\nGeneral Well-Being: I can offer advice on things like hydration, nutrition, sleep, and exercise.\n\nRelationship & Social Advice: I can provide guidance on friendships, romantic relationships, and building self-worth.\n\nA little bit of Fun: I can share jokes and quotes to lighten the mood!\n\nBasically, I'm here to listen, offer helpful tips, and be a supportive presence for you. How are you feeling today? Is there anything specific on your mind?",
        sender: "ai",
        timestamp: new Date(),
      }]);
    }
  }, [currentConversationId, currentMessages.length]);

  // Load conversations on component mount
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversations();
    };
    initializeChat();
  }, []);

  

  const loadConversations = async () => {
    if (isLoadingConversations) return; // Prevent multiple simultaneous loads
    
    setIsLoadingConversations(true);
    try {
      const { http, apiBase } = await import('@/lib/api');
      const data = await http<any>(`/api/conversations?userId=anonymous`);
      
      if (data.success) {
        const loaded = data.data.conversations as Conversation[];
        setConversations(loaded);
        
        // Try to restore the last selected conversation
        const lastId = localStorage.getItem('chat:lastConversationId');
        if (lastId && loaded.some(c => c.id === lastId)) {
          await selectConversation(lastId);
        } else if (loaded.length > 0) {
          // If none saved, do not auto-create; just show list and keep welcome message
          setCurrentConversationId(null);
          setCurrentMessages(prev => prev.length ? prev : []);
        }
      } else {
        console.error('Failed to load conversations:', data.error);
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
      const { http } = await import('@/lib/api');
      const data = await http<any>(`/api/conversations`, {
        method: 'POST',
        body: {
          userId: 'anonymous',
          title: `New Chat ${new Date().toLocaleTimeString()}`
        }
      });
      
      if (data.success) {
        const newConversationId = data.data.conversation_id;
        setCurrentConversationId(newConversationId);
        localStorage.setItem('chat:lastConversationId', newConversationId);
        
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
      console.log('Selecting conversation:', conversationId);
      const { http } = await import('@/lib/api');
      const data = await http<any>(`/api/conversations/${conversationId}`);
      
      console.log('Conversation data:', data);
      
      if (data.success) {
        setCurrentConversationId(conversationId);
        localStorage.setItem('chat:lastConversationId', conversationId);
        const messages = data.data.messages || [];
        
        if (messages.length === 0) {
          // If no messages, let the useEffect handle the welcome message
          setCurrentMessages([]);
        } else {
          const formattedMessages = messages.map((msg: any, index: number) => ({
            id: `msg-${index}`,
            content: stripMarkdown(String(msg.content || "")),
            sender: msg.type === 'user' ? 'user' : 'ai',
            timestamp: new Date(msg.timestamp || Date.now()),
          }));
          setCurrentMessages(formattedMessages);
        }
      } else {
        console.error('Failed to load conversation:', data.error);
        toast({
          title: "Error loading conversation",
          description: "Please try again later.",
          variant: "destructive",
        });
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
      const { http } = await import('@/lib/api');
      const data = await http<any>(`/api/conversations/${conversationId}`, { method: 'DELETE' });
      
      if (data.success) {
        // Remove from local state
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // If this was the current conversation, clear it
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          localStorage.removeItem('chat:lastConversationId');
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
      // Do not auto-create on reload; only create when user starts messaging on chat page
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
          localStorage.setItem('chat:lastConversationId', conversationId);
          
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
      const { http } = await import('@/lib/api');
      const data = await http<any>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: {
          message,
          userId: 'anonymous'
        },
      });
      
      if (data.success) {
        // Update the conversation in the list without reloading
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        ));
        
        return stripMarkdown(String(data.data.message || ""));
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

  const value: ChatContextType = {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading,
    isLoadingConversations,
    isCreatingConversation,
    loadConversations,
    createNewConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    handleSendMessage,
    setCurrentMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 