import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ytClipper',
    short_name: 'ytClipper',
    description:
      'Chrome extension for researchers to collect timestamps, highlights, and notes from YouTube videos like lectures and podcasts. Join the waitlist for early access.',
    display: 'standalone',
    start_url: '/',
  };
}
