/**
 * Dynamic sitemap generator for NotaryOS
 *
 * Generates a sitemap.xml at build time with all static routes.
 * Next.js App Router automatically serves this at /sitemap.xml.
 *
 * Dynamic receipt pages (/r/[hash]) are not included since they are
 * user-specific and not crawlable. Robots.txt references this sitemap.
 */

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://notaryos.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/verify`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
