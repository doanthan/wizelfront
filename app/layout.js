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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
