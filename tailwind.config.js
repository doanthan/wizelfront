/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Background colors
    'bg-sky-blue',
    'bg-royal-blue',
    'bg-vivid-violet',
    'bg-deep-purple',
    'bg-lilac-mist',
    'bg-sky-tint',
    'bg-cool-gray',
    'bg-slate-gray',
    'bg-neutral-gray',
    // Background with opacity
    'bg-sky-blue/10',
    'bg-sky-blue/20',
    'bg-vivid-violet/10',
    'bg-deep-purple/10',
    'bg-cool-gray/50',
    'bg-sky-tint/30',
    'bg-sky-tint/50',
    'bg-lilac-mist/50',
    // Text colors
    'text-sky-blue',
    'text-royal-blue',
    'text-vivid-violet',
    'text-deep-purple',
    'text-slate-gray',
    'text-neutral-gray',
    // Border colors
    'border-sky-blue',
    'border-royal-blue',
    'border-neutral-gray',
    'border-slate-gray',
    'border-sky-blue/20',
    'border-neutral-gray/30',
    'border-vivid-violet/20',
    // Hover states
    'hover:bg-royal-blue',
    'hover:bg-deep-purple',
    'hover:bg-sky-tint',
    'hover:bg-lilac-mist',
    'hover:bg-sky-tint/50',
    'hover:text-sky-blue',
    'hover:text-royal-blue',
    'hover:text-vivid-violet',
    'hover:border-sky-blue',
    // Focus states
    'focus-visible:ring-sky-blue',
    'focus-visible:ring-vivid-violet',
    'focus-visible:ring-royal-blue',
    // Gradient colors
    'from-sky-blue',
    'to-vivid-violet',
    'from-royal-blue',
    'to-deep-purple',
    'via-vivid-violet/10',
    // Data states
    'data-[state=selected]:bg-lilac-mist/50',
  ],
  theme: {
    extend: {
      colors: {
        'pure-white': '#FFFFFF',
        'cool-gray': '#F1F5F9',
        'slate-gray': '#1e293b',
        'sky-blue': '#60A5FA',
        'royal-blue': '#2563EB',
        'vivid-violet': '#8B5CF6',
        'deep-purple': '#7C3AED',
        'lilac-mist': '#C4B5FD',
        'sky-tint': '#E0F2FE',
        'neutral-gray': '#475569',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-blue-purple': 'linear-gradient(135deg, #60A5FA, #8B5CF6)',
        'gradient-royal-deep': 'linear-gradient(135deg, #2563EB, #7C3AED)',
      },
      fontFamily: {
        'sans': ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        'inter': ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};