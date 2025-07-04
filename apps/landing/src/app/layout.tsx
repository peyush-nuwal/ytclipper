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
  keywords: [
    'YouTube Timestamp Collector',
    'YouTube Highlights',
    'YouTube Notes',
    'YouTube Research Tool',
    'YouTube Lecture Highlights',
    'YouTube Podcast Highlights',
    'Chrome Extension for YouTube',
    'Research Tools for YouTube',
    'YouTube Video Notes',
    'YouTube Timestamp Organizer',
  ],
  openGraph: {
    title: 'ytClipper - YouTube Timestamp Collector for Researchers',
    description:
      'Chrome extension for researchers to collect timestamps, highlights, and notes from YouTube videos like lectures and podcasts. Join the waitlist for early access.',
    url: 'https://ytclipper.com',
    siteName: 'ytClipper',
    images: [
      {
        url: 'https://ytclipper.com/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'ytClipper Interface Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ytClipper - YouTube Timestamp Collector for Researchers',
    description:
      'Chrome extension for researchers to collect timestamps, highlights, and notes from YouTube videos like lectures and podcasts. Join the waitlist for early access.',
    images: ['https://ytclipper.com/og-image.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://ytclipper.com',
  },
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
