"use client";

import { useState } from "react";

export default function TestLogoPage() {
  const [fontSize, setFontSize] = useState(42);
  const [width, setWidth] = useState(90);
  const [height, setHeight] = useState(32);
  const [viewBoxWidth, setViewBoxWidth] = useState(180);
  const [viewBoxHeight, setViewBoxHeight] = useState(64);
  const [yPosition, setYPosition] = useState(44);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Logo Size Testing
        </h1>

        {/* Reddit-style header comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Reddit-Style Header (Reference)
          </h2>
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            {/* Mock Reddit icon */}
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">r</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              reddit
            </span>
          </div>
        </div>

        {/* Current Wizel Logo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Current Wizel Logo
          </h2>
          <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            {/* Robot icon matching sidebar */}
            <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <defs>
                <filter id="test-logo-shadow">
                  <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#8B5CF6" floodOpacity="0.3"/>
                </filter>
              </defs>
              <text
                x={viewBoxWidth / 2}
                y={yPosition}
                fontFamily="var(--font-rajdhani), Rajdhani, sans-serif"
                fontSize={fontSize}
                fontWeight="700"
                fontStyle="italic"
                fill="#8B5CF6"
                textAnchor="middle"
                filter="url(#test-logo-shadow)"
              >
                Wizel
              </text>
            </svg>
          </div>
        </div>

        {/* Reddit-sized Wizel Logo (Target) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-vivid-violet">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Reddit-Sized Wizel Logo (Target Size)
          </h2>
          <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            {/* Robot icon matching sidebar */}
            <div className="w-8 h-8 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <svg
              width="85"
              height="28"
              viewBox="0 0 170 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <defs>
                <filter id="reddit-size-shadow">
                  <feDropShadow dx="1.5" dy="1.5" stdDeviation="0" floodColor="#8B5CF6" floodOpacity="0.3"/>
                </filter>
              </defs>
              <text
                x="85"
                y="38"
                fontFamily="var(--font-rajdhani), Rajdhani, sans-serif"
                fontSize="36"
                fontWeight="700"
                fontStyle="italic"
                fill="#8B5CF6"
                textAnchor="middle"
                filter="url(#reddit-size-shadow)"
              >
                Wizel
              </text>
            </svg>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Adjust Logo Parameters
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {fontSize}
              </label>
              <input
                type="range"
                min="20"
                max="60"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Width: {width}
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height: {height}
              </label>
              <input
                type="range"
                min="20"
                max="50"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ViewBox Width: {viewBoxWidth}
              </label>
              <input
                type="range"
                min="100"
                max="250"
                value={viewBoxWidth}
                onChange={(e) => setViewBoxWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ViewBox Height: {viewBoxHeight}
              </label>
              <input
                type="range"
                min="40"
                max="100"
                value={viewBoxHeight}
                onChange={(e) => setViewBoxHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Y Position: {yPosition}
              </label>
              <input
                type="range"
                min="20"
                max="70"
                value={yPosition}
                onChange={(e) => setYPosition(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Code Output */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Generated Code
          </h2>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`<svg
  width="${width}"
  height="${height}"
  viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className="flex-shrink-0 -ml-1"
>
  <defs>
    <filter id="sidebar-logo-shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#8B5CF6" floodOpacity="0.3"/>
    </filter>
  </defs>
  <text
    x="${viewBoxWidth / 2}"
    y="${yPosition}"
    fontFamily="var(--font-rajdhani), Rajdhani, sans-serif"
    fontSize="${fontSize}"
    fontWeight="700"
    fontStyle="italic"
    fill="#8B5CF6"
    textAnchor="middle"
    filter="url(#sidebar-logo-shadow)"
  >
    Wizel
  </text>
</svg>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
