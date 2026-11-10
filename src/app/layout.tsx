import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/navbar';
import UpdateModal from '@/components/update-modal';
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';

export const metadata: Metadata = {
  title: 'Universal Apps by Harsh',
  description: 'An offline-first desktop and web utility suite with 75 verified tools for calculators, converters, developer utilities, and PDF processing.',
};

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
            <UpdateModal />
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
