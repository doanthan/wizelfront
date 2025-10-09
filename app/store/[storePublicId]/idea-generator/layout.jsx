/**
 * Idea Generator Layout
 *
 * Custom layout for idea generator steps that:
 * - Removes the dashboard sidebar
 * - Provides full-width content area
 * - Shows Exit button to return to setup
 * - Hides horizontal overflow for smooth transitions
 */
export default function IdeaGeneratorLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-tint/30 to-lilac-mist/30 dark:from-gray-900 dark:to-gray-900 overflow-x-hidden">
      {children}
    </div>
  );
}
