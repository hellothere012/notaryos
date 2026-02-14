/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes: true,  // Disabled until all components use typed route params
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.agenttownsquare.com' },
      { protocol: 'https', hostname: 'notaryos.org' },
    ],
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }]
  },
}

module.exports = nextConfig
