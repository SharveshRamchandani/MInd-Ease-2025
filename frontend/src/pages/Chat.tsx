import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Brain, Heart, Shield, MessageCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useChat } from "@/contexts/ChatContext";

export default function Chat() {
  const [showSidebar, setShowSidebar] = useState(false);
  const {
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
  } = useChat();



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