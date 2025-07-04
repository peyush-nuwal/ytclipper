import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ytClipper - YouTube Timestamp Collector for Researchers',
  description:
    'Chrome extension for researchers to collect timestamps, highlights, and notes from YouTube videos like lectures and podcasts. Join the waitlist for early access.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-Z07N440G59" />
      </body>
    </html>
  );
}
