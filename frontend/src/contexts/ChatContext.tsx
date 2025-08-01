import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        content: "Hello! I'm Solari, your AI wellness companion. I'm here to support your mental wellness journey. How are you feeling today? Feel free to share anything that's on your mind.",
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
      console.log('Loading conversations...');
      const response = await fetch('http://localhost:5000/api/conversations?userId=anonymous');
      const data = await response.json();
      
      console.log('Conversations response:', data);
      
      if (data.success) {
        setConversations(data.data.conversations);
        console.log('Conversations loaded:', data.data.conversations);
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
      console.log('Selecting conversation:', conversationId);
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`);
      const data = await response.json();
      
      console.log('Conversation data:', data);
      
      if (data.success) {
        setCurrentConversationId(conversationId);
        const messages = data.data.messages || [];
        
        console.log('Messages in conversation:', messages);
        
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
          console.log('Formatted messages:', formattedMessages);
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