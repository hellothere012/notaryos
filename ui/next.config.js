/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes: true,  // Disabled until all components use typed route params
  turbopack: {
    root: __dirname,
    resolveAlias: {
      // CesiumJS references Node's fs module — shim to empty for client builds
      fs: { browser: './scripts/empty-module.js' },
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.agenttownsquare.com' },
      { protocol: 'https', hostname: 'notaryos.org' },
    ],
  },
  // Production builds use webpack (not Turbopack) — handle CesiumJS fs shim
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
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
