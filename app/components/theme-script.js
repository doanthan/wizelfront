// This script runs before React hydration to prevent theme flash
export default function ThemeScript() {
  const themeScript = `
    (function() {
      const storedTheme = localStorage.getItem('theme');
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = storedTheme || systemPreference;
      
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