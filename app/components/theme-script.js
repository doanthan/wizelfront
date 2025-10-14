// This script runs before React hydration to prevent theme flash
export default function ThemeScript() {
  const themeScript = `
    (function() {
      const storedTheme = localStorage.getItem('theme');
      // Default to light mode instead of system preference
      const theme = storedTheme || 'light';

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}