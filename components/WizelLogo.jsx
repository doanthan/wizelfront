"use client";

import { Bot } from 'lucide-react';

/**
 * Wizel AI Logo Component
 *
 * Usage:
 * <WizelLogo /> - Default size (40px)
 * <WizelLogo size="sm" /> - Small (32px)
 * <WizelLogo size="lg" /> - Large (48px)
 * <WizelLogo size="xl" /> - Extra Large (64px)
 * <WizelLogo showText={true} /> - With "Wizel AI" text
 * <WizelLogo className="custom-class" /> - Custom styling
 */

const sizes = {
  sm: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg' },
  md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl' },
  lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl' },
  xl: { box: 'w-16 h-16', icon: 'w-10 h-10', text: 'text-3xl' }
};

export default function WizelLogo({
  size = 'md',
  showText = false,
  className = '',
  textClassName = '',
  iconClassName = ''
}) {
  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeConfig.box} bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg ${iconClassName}`}>
        <Bot className={`${sizeConfig.icon} text-white`} />
      </div>
      {showText && (
        <span className={`${sizeConfig.text} font-bold text-slate-gray dark:text-white ${textClassName}`}>
          Wizel AI
        </span>
      )}
    </div>
  );
}

// Export individual icon component
export function WizelIcon({ size = 'md', className = '' }) {
  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className={`${sizeConfig.box} bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg ${className}`}>
      <Bot className={`${sizeConfig.icon} text-white`} />
    </div>
  );
}

// Export color values for use in other components
export const wizelColors = {
  skyBlue: '#60A5FA',
  royalBlue: '#2563EB',
  vividViolet: '#8B5CF6',
  deepPurple: '#7C3AED',
  slateGray: '#1e293b',
  gradient: 'linear-gradient(135deg, #60A5FA 0%, #8B5CF6 100%)'
};