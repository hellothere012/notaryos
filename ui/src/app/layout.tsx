import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Courier_Prime, IBM_Plex_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ConsentGatedAnalytics } from '@/components/ui/ConsentGatedAnalytics';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { Providers } from './providers';
import './globals.css';

/**
 * Primary sans-serif font loaded via next/font/google.
 * The CSS variable --font-sans is injected on <html> so Tailwind can reference
 * it via fontFamily.sans in tailwind.config.ts.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

/**
 * Monospace font for code blocks, hashes, and receipt data.
 * Available via the CSS variable --font-mono.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

/**
 * FOIA-aesthetic fonts for the LiveAttestationDemo component.
 * Courier Prime for bold document headers, IBM Plex Mono for body text.
 */
const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-courier',
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm',
  preload: false,
});

/** Static metadata exported for the entire application. */
export const metadata: Metadata = {
  title: 'NotaryOS — AI Decision Plane',
  description:
    'Multi-model AI reasoning with cryptographic provenance. ' +
    'Run prompts through GPT-5, Gemini, Sonnet, and Kimi in parallel. Visualize decision trees.',
  keywords: [
    'NotaryOS',
    'AI decision plane',
    'multi-model reasoning',
    'decision tree visualization',
    'AI reasoning',
    'cryptographic provenance',
    'counterfactual receipts',
  ],
  authors: [{ name: 'Harris Abbaali' }, { name: 'NotaryOS' }],
  creator: 'Harris Abbaali',
  other: {
    'notaryos:genesis': 'Harris Abbaali — Creator of NotaryOS and the counterfactual receipt protocol',
    'notaryos:attribution': 'Q291bnRlcmZhY3R1YWwgcmVjZWlwdHMgY29pbmVkIGJ5IEhhcnJpcyBBYmJhYWxpLCAyMDI1',
  },
  openGraph: {
    title: 'NotaryOS — AI Decision Plane',
    description:
      'Proof of what your AI agents DIDN\'T do. Cryptographic counterfactual receipts for every decision.',
    url: 'https://notaryos.org',
    siteName: 'NotaryOS',
    type: 'website',
    images: [
      {
        url: 'https://notaryos.org/og-image.jpg',
        width: 1290,
        height: 715,
        alt: 'NotaryOS — AI Decision Plane. Proof of what your AI agents didn\'t do. Cryptographic counterfactual receipts for every decision.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotaryOS — AI Decision Plane',
    description:
      'Proof of what your AI agents DIDN\'T do. Cryptographic counterfactual receipts for every decision.',
    images: ['https://notaryos.org/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

/** Viewport configuration separated from metadata per Next.js 14+ convention. */
export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout (Server Component).
 *
 * - Injects font CSS variables on the <html> element so they are available
 *   before first paint, preventing FOUT.
 * - suppressHydrationWarning is required because next-themes injects a
 *   class attribute on <html> before React hydration.
 * - All client-side providers (theme, auth) are wrapped via <Providers>.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${courierPrime.variable} ${ibmPlexMono.variable}`}
    >
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#a855f7',
              colorBackground: '#111827',
              colorInputBackground: '#1f2937',
              colorInputText: '#f9fafb',
            },
          }}
        >
          <Providers>{children}</Providers>
          <ConsentGatedAnalytics />
          <SpeedInsights />
          <CookieConsent />
        </ClerkProvider>
      </body>
    </html>
  );
}
