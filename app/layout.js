import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "./components/providers/session-provider";
import ThemeScript from "./components/theme-script";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-inter",
});

const rajdhani = Rajdhani({
  weight: ['700'],
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-rajdhani",
});

export const metadata = {
  title: "Wizel: Marketing Platform",
  description: "AI-powered email marketing automation platform for e-commerce",
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-white dark:bg-gray-900" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${rajdhani.variable} ${inter.className} antialiased bg-white dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
