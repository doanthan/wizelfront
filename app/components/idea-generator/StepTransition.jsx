'use client';

import { useEffect, useState } from 'react';

/**
 * StepTransition Component
 *
 * Provides smooth horizontal slide transitions between idea generator steps
 * Uses CSS transitions for smooth animations
 */
export default function StepTransition({ children, step }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount and step change
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div
      className={`transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
