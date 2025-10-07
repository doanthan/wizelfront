"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import {
  Bot,
  Send,
  User,
  Sparkles,
  MessageSquare,
  Copy,
  RotateCcw,
  Trash2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/hooks/use-toast";
import MorphingLoader from "@/app/components/ui/loading";

export default function GrokPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/grok/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add Grok's response to chat
      const grokMessage = {
        id: Date.now() + 1,
        type: "grok",
        content: data.response,
        timestamp: new Date(),
        usage: data.usage
      };

      setMessages(prev => [...prev, grokMessage]);

    } catch (error) {
      console.error('Error sending message to Grok:', error);

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to send message to Grok",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive"
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared",
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-gray dark:text-white">
                  Grok Chat
                </h1>
                <p className="text-sm text-neutral-gray dark:text-gray-400">
                  Powered by xAI Grok-4-Fast via OpenRouter
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Free Tier
              </Badge>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)] flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat with Grok
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Start a conversation with Grok
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Ask questions, get insights, or just have a chat!
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 group",
                      msg.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.type !== "user" && (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        msg.type === "grok" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-red-500"
                      )}>
                        {msg.type === "grok" ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-white" />
                        )}
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[70%] min-w-0",
                      msg.type === "user" && "flex flex-col items-end"
                    )}>
                      <div
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          msg.type === "user"
                            ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                            : msg.type === "error"
                            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>

                        {msg.usage && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>Tokens: {msg.usage.total_tokens || 'N/A'}</span>
                              <span>Model: grok-4-fast</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyMessage(msg.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {msg.type === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <MorphingLoader size="small" showThemeText={false} />
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Grok anything..."
                    className="min-h-[50px] max-h-[200px] resize-none pr-12"
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {message.length > 0 && `${message.length} chars`}
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className="self-end bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isLoading ? (
                    <MorphingLoader size="small" showThemeText={false} />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Free tier - Rate limited
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}