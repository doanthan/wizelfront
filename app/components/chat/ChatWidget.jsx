"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  HelpCircle,
  Bug,
  Lightbulb,
  Paperclip,
  Loader2,
  Check,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/hooks/use-toast";
import { useAI } from "@/app/contexts/ai-context";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isXLModal, setIsXLModal] = useState(false);
  const { getAIContext } = useAI();
  
  // AI Chat State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Support Form State
  const [supportType, setSupportType] = useState("bug");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportAttachments, setSupportAttachments] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [pastedImages, setPastedImages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize AI chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: "ai",
        content: "Hi! I'm Wizel, your marketing insights assistant. I can help you analyse the stats on your screen or answer questions about your data. What would you like to know?",
        timestamp: new Date()
      }]);
    }
  }, []);

  const sendAiMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setAiLoading(true);

    try {
      // Get current AI context from the active page
      const aiContext = getAIContext();
      
      // Capture current page context/stats
      const pageContext = {
        url: window.location.pathname,
        aiState: aiContext.aiState,
        formattedContext: aiContext.formattedContext
      };

      const response = await fetch("/api/chat/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          context: pageContext,
          history: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      const data = await response.json();
      
      // Simulate typing effect
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: "ai",
          content: data.response || "I can help you analyse the data shown on your screen. Try asking me about specific metrics or trends you see.",
          timestamp: new Date()
        }]);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: "ai",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const submitSupportTicket = async () => {
    if (!supportMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your issue or request",
        variant: "destructive"
      });
      return;
    }

    setSupportLoading(true);

    try {
      const formData = new FormData();
      formData.append("type", supportType);
      formData.append("message", supportMessage);
      supportAttachments.forEach(file => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSupportSuccess(true);
        setTimeout(() => {
          setSupportMessage("");
          setSupportAttachments([]);
          setPastedImages([]);
          setSupportSuccess(false);
          setIsOpen(false);
          toast({
            title: "Ticket Submitted",
            description: "We'll get back to you as soon as possible",
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSupportAttachments(prev => [...prev, ...files]);
  };

  // Handle paste event for images
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          // Create a preview URL
          const url = URL.createObjectURL(blob);
          const imageFile = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
          
          setPastedImages(prev => [...prev, { file: imageFile, url }]);
          setSupportAttachments(prev => [...prev, imageFile]);
        }
      }
    }
  };

  // Remove pasted image
  const removePastedImage = (index) => {
    setPastedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url); // Clean up the URL
      newImages.splice(index, 1);
      return newImages;
    });
    
    setSupportAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      pastedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  return (
    <>
      {/* Floating Action Button - Best practice positioning */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center rounded-full group hover:scale-105"
          aria-label="Open Wizel AI Assistant"
          title="Chat with Wizel"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <>
          {/* XL Modal Backdrop */}
          {isXLModal && (
            <div className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300" />
          )}
          
          <div 
            className={cn(
              "fixed z-[9999] transition-all duration-300",
              isXLModal 
                ? "inset-4" 
                : isMinimized 
                  ? "bottom-6 right-6 w-80" 
                  : "bottom-6 right-6 w-[440px] max-w-[calc(100vw-48px)]"
            )}
          >
          <Card className={cn(
            "shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-200 flex flex-col bg-white dark:bg-gray-900",
            isXLModal 
              ? "h-full rounded-xl" 
              : isMinimized 
                ? "h-14 rounded-xl" 
                : "h-[600px] max-h-[calc(100vh-48px)] rounded-xl"
          )}>
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-blue to-vivid-violet p-3 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {activeTab === "ai" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="font-medium text-sm">
                    {activeTab === "ai" ? "Wizel" : "Support"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                    onClick={() => {
                      setIsXLModal(!isXLModal);
                      if (isMinimized) setIsMinimized(false);
                    }}
                    title={isXLModal ? "Exit full screen" : "Full screen"}
                  >
                    {isXLModal ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {!isXLModal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                      onClick={() => setIsMinimized(!isMinimized)}
                      title={isMinimized ? "Expand" : "Minimize"}
                    >
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isMinimized ? "rotate-180" : ""
                      )} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col relative">
                  <div className="w-full border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab("ai")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                          activeTab === "ai"
                            ? "border-sky-blue text-sky-blue"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                      >
                        <Bot className="h-4 w-4" />
                        AI Chat
                      </button>
                      <button
                        onClick={() => setActiveTab("support")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                          activeTab === "support"
                            ? "border-sky-blue text-sky-blue"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                      >
                        <HelpCircle className="h-4 w-4" />
                        Support
                      </button>
                    </div>
                  </div>

                  {/* AI Chat Tab */}
                  <div className={cn(
                    "flex-1 flex flex-col mt-0 p-0 min-h-0 absolute inset-0 top-[49px]",
                    activeTab === "ai" ? "flex" : "hidden"
                  )}>
                    <div className={cn(
                      "flex-1 overflow-y-auto min-h-0",
                      isXLModal ? "p-6" : "p-3"
                    )}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              message.type === "user" ? "justify-end" : ""
                            )}
                          >
                            {message.type === "ai" && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "rounded-lg px-4 py-2",
                                isXLModal ? "max-w-[75%]" : "max-w-[85%]",
                                message.type === "user"
                                  ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-slate-gray dark:text-white"
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    
                    <div className={cn(
                      "border-t bg-white dark:bg-gray-900",
                      isXLModal ? "p-6" : "p-3"
                    )}>
                      <div className="flex gap-2">
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                          placeholder="Ask about your data..."
                          className="flex-1"
                          disabled={aiLoading}
                        />
                        <Button
                          onClick={sendAiMessage}
                          disabled={aiLoading || !inputValue.trim()}
                          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {aiLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Support Tab */}
                  <div className={cn(
                    "flex-1 flex flex-col mt-0 p-0 min-h-0 absolute inset-0 top-[49px]",
                    activeTab === "support" ? "flex" : "hidden"
                  )}>
                    <div className={cn(
                      "flex-1 overflow-y-auto min-h-0",
                      isXLModal ? "p-6" : "p-3"
                    )}>
                      {supportSuccess ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">
                            Ticket Submitted!
                          </h3>
                          <p className="text-sm text-neutral-gray dark:text-gray-400 text-center">
                            We'll get back to you as soon as possible
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                        <div>
                          <Label className="text-slate-gray dark:text-white mb-2 block text-sm">
                            What's this about?
                          </Label>
                          <RadioGroup value={supportType} onValueChange={setSupportType}>
                            <div className="space-y-1">
                              <label className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                supportType === "bug" 
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20" 
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              )}>
                                <RadioGroupItem value="bug" className="text-red-500" />
                                <Bug className="h-4 w-4 text-red-500" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-gray dark:text-white">Report a Bug</p>
                                  <p className="text-xs text-neutral-gray dark:text-gray-400">
                                    Something isn't working right
                                  </p>
                                </div>
                              </label>
                              
                              <label className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                supportType === "feature" 
                                  ? "border-vivid-violet bg-purple-50 dark:bg-purple-900/20" 
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              )}>
                                <RadioGroupItem value="feature" className="text-vivid-violet" />
                                <Lightbulb className="h-4 w-4 text-vivid-violet" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-gray dark:text-white">Request a Feature</p>
                                  <p className="text-xs text-neutral-gray dark:text-gray-400">
                                    Suggest an improvement
                                  </p>
                                </div>
                              </label>
                              
                              <label className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                supportType === "question" 
                                  ? "border-sky-blue bg-blue-50 dark:bg-blue-900/20" 
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              )}>
                                <RadioGroupItem value="question" className="text-sky-blue" />
                                <HelpCircle className="h-4 w-4 text-sky-blue" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-gray dark:text-white">Ask a Question</p>
                                  <p className="text-xs text-neutral-gray dark:text-gray-400">
                                    Get help with something
                                  </p>
                                </div>
                              </label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label htmlFor="message" className="text-slate-gray dark:text-white mb-1 block text-sm">
                            Your message
                          </Label>
                          <Textarea
                            id="message"
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            onPaste={handlePaste}
                            placeholder={
                              supportType === "bug" 
                                ? "Describe the issue you're experiencing..."
                                : supportType === "feature"
                                ? "Describe the feature you'd like to see..."
                                : "What can we help you with?"
                            }
                            className="min-h-[100px] resize-none text-sm w-full"
                          />
                          
                          {/* Image Previews */}
                          {pastedImages.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-neutral-gray dark:text-gray-400">Pasted images:</p>
                              <div className="grid grid-cols-4 gap-2">
                                {pastedImages.map((img, index) => (
                                  <div key={index} className="relative group">
                                    <img 
                                      src={img.url} 
                                      alt={`Pasted ${index + 1}`}
                                      className="w-full h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                                    />
                                    <button
                                      onClick={() => removePastedImage(index)}
                                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Attachments */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs transition-colors duration-200"
                          >
                            <Paperclip className="h-3 w-3 mr-1" />
                            Attach files
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {supportAttachments.length > 0 && (
                            <span className="text-xs text-neutral-gray dark:text-gray-400">
                              {supportAttachments.length} file{supportAttachments.length !== 1 ? 's' : ''} attached
                            </span>
                          )}
                        </div>

                        <Button
                          onClick={submitSupportTicket}
                          disabled={supportLoading || !supportMessage.trim()}
                          className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {supportLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Feedback
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    </div>
                  </div>
                </Tabs>
              </div>
            )}
          </Card>
          </div>
        </>
      )}
    </>
  );
}