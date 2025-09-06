"use client";

import React, { useState, useEffect } from 'react';

const LoadingSpinner = ({ message = null, showMessages = true }) => {
  const loadingMessages = [
    "Demystifying the algorithm...",
    "Calculating Pi to the 1000th digit...",
    "Teaching robots about emotions...",
    "Convincing the servers to cooperate...",
    "Brewing virtual coffee...",
    "Untangling quantum strings...",
    "Negotiating with the cloud...",
    "Counting digital sheep...",
    "Waking up the hamsters in the server room...",
    "Polishing the pixels...",
    "Charging the flux capacitor...",
    "Consulting the magic 8-ball...",
    "Downloading more RAM...",
    "Reticulating splines...",
    "Dividing by zero... just kidding!",
    "Asking ChatGPT for advice...",
    "Mining bitcoin... nah, just loading...",
    "Summoning the data spirits...",
    "Translating binary to human...",
    "Spinning up the hyperdrive...",
    "Calibrating the chaos engine...",
    "Feeding the algorithms...",
    "Debugging the matrix...",
    "Compiling witty responses...",
    "Syncing with the mothership...",
    "Generating random excuses...",
    "Optimizing the optimization...",
    "Baking fresh cookies (digital ones)...",
    "Herding digital cats...",
    "Warming up the tubes...",
    "Aligning the stars...",
    "Consulting ancient scrolls of Stack Overflow...",
    "Bribing the firewall...",
    "Decoding the meaning of life (still 42)...",
    "Watering the server farm...",
    "Teaching AI about sarcasm...",
    "Reversing the polarity...",
    "Adjusting the space-time continuum...",
    "Loading loading screen...",
    "Proving P=NP... almost there!",
    "Asking nicely for more bandwidth...",
    "Converting coffee to code...",
    "Organizing chaos into order...",
    "Negotiating with time itself...",
    "Collecting infinity stones...",
    "Defragmenting the universe...",
    "Consulting the oracle...",
    "Charging creative batteries...",
    "Solving world hunger... after this loads...",
    "Teaching zeros to be ones..."
  ];

  const [currentMessage, setCurrentMessage] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  useEffect(() => {
    if (!showMessages) return;

    const messageInterval = setInterval(() => {
      setFadeClass('opacity-0');
      
      setTimeout(() => {
        setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
        setFadeClass('opacity-100');
      }, 300);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [showMessages, loadingMessages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative">
        {/* Main loader - enhanced gradient spinner */}
        <div className="w-24 h-24 rounded-full animate-pulse bg-gradient-to-r from-sky-blue via-vivid-violet to-deep-purple p-1">
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
            <div className="w-[88px] h-[88px] rounded-full animate-spin" 
                 style={{
                   background: 'conic-gradient(from 0deg, #60A5FA, #8B5CF6, #7C3AED, #2563EB, #60A5FA)',
                   maskImage: 'radial-gradient(circle at center, transparent 40%, black 40%)',
                   WebkitMaskImage: 'radial-gradient(circle at center, transparent 40%, black 40%)',
                   animationDuration: '2s'
                 }}>
            </div>
          </div>
        </div>
        
        {/* Orbiting dots with different speeds */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-spin" style={{animationDuration: '3s'}}>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-sky-blue rounded-full shadow-lg shadow-sky-blue/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{animationDuration: '3s', animationDelay: '1s'}}>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-vivid-violet rounded-full shadow-lg shadow-vivid-violet/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{animationDuration: '3s', animationDelay: '2s'}}>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-deep-purple rounded-full shadow-lg shadow-deep-purple/50"></div>
          </div>
        </div>

        {/* Inner rotating ring */}
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-sky-blue/30 dark:border-sky-blue/20 animate-spin" 
             style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
      </div>
      
      {/* Loading text */}
      <div className="mt-10 space-y-3 text-center max-w-md">
        {message ? (
          <>
            <h3 className="text-xl font-bold bg-gradient-to-r from-sky-blue via-vivid-violet to-deep-purple bg-clip-text text-transparent animate-pulse">
              {message}
            </h3>
            {showMessages && (
              <p className={`text-sm text-neutral-gray dark:text-gray-400 transition-opacity duration-300 ${fadeClass} min-h-[20px]`}>
                {loadingMessages[currentMessage]}
              </p>
            )}
          </>
        ) : (
          <p className={`text-base font-medium bg-gradient-to-r from-sky-blue to-vivid-violet bg-clip-text text-transparent transition-opacity duration-300 ${fadeClass} min-h-[24px]`}>
            {loadingMessages[currentMessage]}
          </p>
        )}
      </div>
      
      {/* Progress dots */}
      <div className="mt-8 flex items-center space-x-3">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-sky-blue rounded-full animate-bounce" style={{animationDelay: '0ms', animationDuration: '1.4s'}}></div>
          <div className="w-2 h-2 bg-vivid-violet rounded-full animate-bounce" style={{animationDelay: '200ms', animationDuration: '1.4s'}}></div>
          <div className="w-2 h-2 bg-deep-purple rounded-full animate-bounce" style={{animationDelay: '400ms', animationDuration: '1.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

// Full screen loading variant
export const FullScreenLoading = ({ message = "Loading awesome things..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <LoadingSpinner message={message} />
    </div>
  );
};

// Inline loading variant (smaller)
export const InlineLoading = ({ text = "Loading..." }) => {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 rounded-full animate-spin"
             style={{
               background: 'conic-gradient(from 0deg, #60A5FA, #8B5CF6, #7C3AED, #2563EB, #60A5FA)',
               maskImage: 'radial-gradient(circle at center, transparent 30%, black 30%)',
               WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 30%)',
             }}>
        </div>
      </div>
      <span className="text-sm font-medium text-neutral-gray dark:text-gray-400">{text}</span>
    </div>
  );
};

// Card loading skeleton
export const CardLoadingSkeleton = () => {
  return (
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-3/4"></div>
      </div>
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-1/2"></div>
    </div>
  );
};

export default LoadingSpinner;