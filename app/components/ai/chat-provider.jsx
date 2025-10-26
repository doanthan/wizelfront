"use client";

import { useState } from 'react';
import WizelChat from './wizel-chat';

/**
 * Chat Provider - Manages chat state and can be included in layout
 * Place this in your main layout or specific pages where you want the chat
 */
export default function ChatProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  return (
    <>
      {children}
      {isChatOpen && (
        <WizelChat
          isMinimized={isChatMinimized}
          onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
          onClose={() => {
            setIsChatOpen(false);
            setIsChatMinimized(false);
          }}
        />
      )}

      {/* Floating chat button when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white rounded-full p-4 shadow-lg transition-all hover:shadow-xl"
          aria-label="Open Wizel AI Chat"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}
    </>
  );
}
