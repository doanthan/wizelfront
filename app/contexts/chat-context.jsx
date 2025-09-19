"use client";

import { createContext, useContext, useState } from "react";

const ChatContext = createContext({
  isChatOpen: false,
  setIsChatOpen: () => {},
  activeTab: "ai",
  setActiveTab: () => {},
  openSupportChat: () => {},
});

export function ChatProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  const openSupportChat = () => {
    setIsChatOpen(true);
    setActiveTab("support");
  };

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      setIsChatOpen,
      activeTab,
      setActiveTab,
      openSupportChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};