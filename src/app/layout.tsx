import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/navbar';

export const metadata: Metadata = {
  title: 'All in One Apps by Harsh',
  description: 'A sleek, modern, and intuitive desktop application featuring a collection of essential calculators. Built for speed and simplicity.',
};

import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <LanguageProvider>
            <Navbar />
            <main>
              {children}
            </main>
            <Toaster />
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
