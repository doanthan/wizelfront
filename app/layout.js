import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "./components/providers/session-provider";
import ThemeScript from "./components/theme-script";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-inter",
});

export const metadata = {
  title: "Wizel: Marketing Platform",
  description: "AI-powered email marketing automation platform for e-commerce",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/wizel-logo.svg', type: 'image/svg+xml' }
    ],
    apple: '/wizel-logo.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-white dark:bg-gray-900" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${inter.className} antialiased bg-white dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
