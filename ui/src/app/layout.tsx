import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Courier_Prime, IBM_Plex_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
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
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm',
});

/** Static metadata exported for the entire application. */
export const metadata: Metadata = {
  title: 'NotaryOS \u2014 Agent Accountability Infrastructure',
  description:
    'Cryptographic verification and accountability infrastructure for AI agent actions. ' +
    'Tamper-proof receipts, real-time audit trails, and compliance certificates.',
  keywords: [
    'NotaryOS',
    'AI accountability',
    'agent verification',
    'cryptographic receipts',
    'audit trail',
  ],
  authors: [{ name: 'NotaryOS' }],
  openGraph: {
    title: 'NotaryOS \u2014 Agent Accountability Infrastructure',
    description:
      'Cryptographic verification and accountability infrastructure for AI agent actions.',
    type: 'website',
  },
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
        </ClerkProvider>
      </body>
    </html>
  );
}
