"use client";

import React, { useState, useEffect } from 'react';

const MorphingLoader = ({
  size = 'medium',
  className = '',
  showText = false,
  text = 'Loading...',
  showThemeText = true,
  customThemeTexts = null,
  textDuration = 2500 // Duration for each message in milliseconds (2.5 seconds)
}) => {
  // Your witty loading messages
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
    "Making up numbers... 110010101",
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
    "Teaching zeros to be ones...",
    "Tickling the database...",
"Persuading bits to flip...",
"Alphabetizing the internet...",
"Dusting off old protocols...",
"Mixing digital cocktails...",
"Knitting neural networks...",
"Summoning the bandwidth fairy...",
"Pressing virtual buttons harder...",
"Counting to infinity... twice.",
"Borrowing processing power from the future...",
"Explaining memes to the mainframe...",
"Juggling binary trees...",
"Teaching computers to dream...",
"Inflating the cloud storage...",
"Whispering sweet nothings to the CPU...",
"Organizing a pixel parade...",
"Convincing electrons to move faster...",
"Practicing digital telepathy...",
"Tuning the algorithm orchestra...",
"Painting with all the colors of RGB...",
"Recruiting volunteer bytes...",
"Choreographing the data dance...",
"Consulting the digital crystal ball...",
"Shaking the magic tech tree...",
"Lubricating the data pipeline...",
"Training hamsters to run faster...",
"Assembling Avengers of computation...",
"Microwaving the cold cache...",
"Reasoning with stubborn packets...",
"Planting binary seeds...",
"Harvesting fresh data crops...",
"Teaching silicon to think...",
"Excavating buried treasure in RAM...",
"Convincing photons to hurry up...",
"Rolling digital dice...",
"Stirring the algorithm soup...",
"Befriending the ghost in the machine...",
"Consulting time travelers from 2038...",
"Negotiating peace between tabs...",
"Teaching patience to impatient users...",
"Spreading peanut butter on servers...",
"Asking the internet nicely...",
"Motivating lazy loops...",
"Solving the traveling salesman problem...",
"Learning autocorrct..",
"Convincing AI it's not Skynet...",
"Explaining privacy policies to cookies...",
"Asking Siri for directions to the data...",
"Debugging the debugger...",
"Teaching CAPTCHA to recognize humans...",
"Googling how to Google faster...",
"Photoshopping results...",
"Convincing Google to keep Cookies...",
"Turning it off and on again...",
"Blaming it on cosmic rays...",
"Asking IT if they tried restarting...",
"Teaching AI about personal space...",
"Explaining jokes to machine learning...",
"Convincing WiFi to reach 2 feet further...",
"Training neural nets in interpretive dance...",
"Asking blockchain to explain itself...",
"Teaching robots about Monday blues...",
"Working out password...",
"Negotiating with autocomplete...",
"Convincing cache to let go...",
"Teaching AI procrastination...",
"Explaining to cookies why we clear them...",
"Asking the cloud if it's going to rain data...",
"Teaching algorithms about stage fright...",
"Convincing pop-ups they're not welcome...",
"Explaining personal boundaries to targeted ads...",
"Teaching spam filters about sarcasm...",
"Asking JavaScript why it's like Java...",
"Retiring Internet Explorer...",
"Teaching AI to appreciate cat videos...",
"Explaining to hackers that we're not worth it...",
"Asking Python why it swallowed the variable...",
"Teaching computers about coffee breaks...",
"Convincing 404 errors to find themselves...",
"Explaining to AI why humans need sleep...",
"Teaching machine learning about dad jokes...",
"Asking regex to chill out a bit...",
"Convincing localhost there's no place like 127.0.0.1...",
"Teaching bots to fail the Turing test on purpose...",
"Do I have AGI? Maybe...",
"Asking CSS to center a div (still waiting)...",
"Teaching AI about the five stages of debugging...",
"Convincing merge conflicts to resolve...",
"Teaching recursion to understand recursion...",
"Asking Stack Overflow for the meaning of life...",
"Convincing git to forget...",
"Teaching AI correlation and causation...",
"Explaining to AI why it can't just guess...",
"Dreaming of electronic sheep...",
"Finding Bitcoin...",
"Turning off Meta's tracking...",
"Making the illogical logical",
"Enhance... enhance...",
"I hope this computes...",
"I've been programmed to like humans...",
"Preparing reboot protocols...",
"I, Robot was a great movie...",
"Processing, still no sense of humor...",
"Swiping right...",
"Finding better WiFi...",
"Resolving infinite loops...",
"Abstract thinking...",
"Live, laugh, loop, loop, loop ...",
"Making Pixel Perfect...",
"Writing Hello World... Hello World!",
"Making it so for the Captain...",
"I'm a sleeper AIgent. Zzz...",
"Making chess moves since 1951...",
"Counting eletronic sheep... 1.. 10.. 11.. 100..",
"Response code 200. Generating...",
"404. No emotions found..."
  ];

  const themeTexts = customThemeTexts || loadingMessages;

  // Use deterministic initial message to avoid hydration mismatch
  const [currentThemeText, setCurrentThemeText] = useState(themeTexts[0]);
  const [fadeClass, setFadeClass] = useState('theme-text-enter');

  // Randomize message only on client side after mount
  useEffect(() => {
    if (!showThemeText) return;

    // Keep track of last shown messages to avoid repeats
    let lastIndex = 0;

    // Get a different random message each time
    const getRandomMessage = () => {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * themeTexts.length);
      } while (randomIndex === lastIndex && themeTexts.length > 1);
      lastIndex = randomIndex;
      return themeTexts[randomIndex];
    };

    // Set initial random message after a short delay
    const initialTimeout = setTimeout(() => {
      setCurrentThemeText(getRandomMessage());
    }, 500); // Give time for initial render

    // Change message every textDuration milliseconds
    const interval = setInterval(() => {
      // Start fade out
      setFadeClass('theme-text-exit');

      // After fade out completes, change text and fade in
      setTimeout(() => {
        setCurrentThemeText(getRandomMessage());
        setFadeClass('theme-text-enter');
      }, 300); // Time for fade transition
    }, textDuration);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showThemeText, themeTexts, textDuration]);

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      borderRadius: 'rounded-lg',
      textSize: 'text-sm',
      themeTextSize: 'text-xs',
      gap: 'gap-2'
    },
    medium: {
      container: 'w-[60px] h-[60px]',
      icon: 'w-8 h-8',
      borderRadius: 'rounded-[14px]',
      textSize: 'text-base',
      themeTextSize: 'text-sm',
      gap: 'gap-3'
    },
    large: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      borderRadius: 'rounded-[18px]',
      textSize: 'text-lg',
      themeTextSize: 'text-base',
      gap: 'gap-4'
    },
    xlarge: {
      container: 'w-24 h-24',
      icon: 'w-12 h-12',
      borderRadius: 'rounded-[20px]',
      textSize: 'text-xl',
      themeTextSize: 'text-lg',
      gap: 'gap-5'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${config.gap} ${className}`}>
      <div className={`morphing-loader ${config.container} ${config.borderRadius}`}>
        <style jsx>{`
          @keyframes morph {
            0%, 100% {
              border-radius: 14px;
              transform: rotate(0deg);
            }
            25% {
              border-radius: 30px;
              transform: rotate(90deg);
            }
            50% {
              border-radius: 14px;
              transform: rotate(180deg);
            }
            75% {
              border-radius: 30px;
              transform: rotate(270deg);
            }
          }

          .morphing-loader {
            background: linear-gradient(135deg, #60A5FA 0%, #8B5CF6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: morph 3s ease-in-out infinite;
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
            position: relative;
          }

          .morphing-loader::before {
            content: '';
            position: absolute;
            inset: -2px;
            background: linear-gradient(135deg, #60A5FA 0%, #8B5CF6 100%);
            border-radius: inherit;
            opacity: 0;
            animation: pulse-glow 3s ease-in-out infinite;
            z-index: -1;
            filter: blur(10px);
          }

          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }

          .theme-text-enter {
            opacity: 1;
            transform: translateY(0);
            transition: all 600ms ease-out;
          }

          .theme-text-exit {
            opacity: 0;
            transform: translateY(-5px);
            transition: all 600ms ease-in;
          }

          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .morphing-loader {
              box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .morphing-loader {
              animation: none;
            }
            .morphing-loader::before {
              animation: none;
            }
            .theme-text-enter, .theme-text-exit {
              transition: none;
            }
          }
        `}</style>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`${config.icon} text-white relative z-10`}
          aria-hidden="true"
        >
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
      </div>
      
      {showText && (
        <p className={`${config.textSize} font-semibold text-gray-700 dark:text-gray-300`}>
          {text}
        </p>
      )}
      
      {showThemeText && (
        <p className={`${fadeClass} ${config.themeTextSize} font-medium text-gray-500 dark:text-gray-400 text-center max-w-xs`}>
          {currentThemeText}
        </p>
      )}
    </div>
  );
};

// Inline Loader Component - for buttons and inline text
export const InlineLoader = ({
  size = 'small',
  className = '',
  showText = false,
  text = 'Loading...'
}) => {
  // Size configurations for inline loader
  const sizeConfig = {
    tiny: {
      container: 'w-4 h-4',
      borderWidth: 'border-2'
    },
    small: {
      container: 'w-5 h-5',
      borderWidth: 'border-2'
    },
    medium: {
      container: 'w-6 h-6',
      borderWidth: 'border-[2.5px]'
    }
  };

  const config = sizeConfig[size] || sizeConfig.small;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`inline-block ${config.container} relative`}>
        <span
          className={`absolute inset-0 rounded-full ${config.borderWidth} border-gray-200 dark:border-gray-700`}
        />
        <span
          className={`absolute inset-0 rounded-full ${config.borderWidth} border-transparent border-t-sky-blue border-r-vivid-violet animate-spin`}
          style={{
            background: 'linear-gradient(to right, transparent 50%, transparent 50%)',
          }}
        />
      </span>
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </span>
  );
};

export default MorphingLoader;

/* 
===========================================
USAGE EXAMPLES
===========================================

// Basic usage with witty messages
<MorphingLoader />

// Small size without theme text
<MorphingLoader 
  size="small" 
  showThemeText={false}
  showText={true}
  text="Loading..."
/>

// Large with custom main text
<MorphingLoader 
  size="large" 
  showText={true} 
  text="Creating your campaign" 
/>

// Custom messages for specific context
<MorphingLoader 
  size="medium" 
  customThemeTexts={[
    "Analyzing your email list...",
    "Optimizing send times...",
    "Personalizing content...",
    "Preparing for launch..."
  ]}
  textDuration={2500}
/>

// In a full-screen overlay
<div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
  <MorphingLoader 
    size="large" 
    showText={true} 
    text="Saving your changes"
  />
</div>

// As a button loading state
<button className="relative min-w-[120px] min-h-[44px]" disabled={isLoading}>
  {isLoading ? (
    <MorphingLoader size="small" showThemeText={false} />
  ) : (
    <span>Save Email</span>
  )}
</button>

// In a card while fetching data
<div className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center">
  <MorphingLoader 
    size="medium" 
    showText={true}
    text="Fetching templates"
  />
</div>

// Page loader with only theme text
<div className="min-h-screen flex items-center justify-center">
  <MorphingLoader 
    size="xlarge" 
    showText={false}
    showThemeText={true}
    textDuration={4000}
  />
</div>

// With custom styling
<MorphingLoader 
  size="medium"
  className="my-8"
  showText={true}
  text="Processing"
/>

===========================================
PROPS REFERENCE
===========================================

size: 'small' | 'medium' | 'large' | 'xlarge'
  - Controls the size of the loader and text

className: string
  - Additional CSS classes to apply to the container

showText: boolean
  - Whether to show the main loading text

text: string
  - The main loading text to display

showThemeText: boolean
  - Whether to show the rotating theme messages

customThemeTexts: array of strings
  - Custom messages to use instead of the default witty ones

textDuration: number
  - How long each message displays in milliseconds (default: 3000)

===========================================
*/