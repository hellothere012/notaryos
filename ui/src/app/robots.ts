/**
 * Robots.txt generator for NotaryOS
 *
 * Allows all crawlers to access all public pages.
 * References the sitemap for discovery.
 *
 * Next.js App Router automatically serves this at /robots.txt.
 */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',       // API routes should not be crawled
          '/admin',      // Admin panel
          '/profile',    // User profile pages
          '/settings',   // User settings
          '/api-keys',   // API key management
          '/history',    // User verification history
        ],
      },
    ],
    sitemap: 'https://notaryos.org/sitemap.xml',
  };
}
