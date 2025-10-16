// next.config.mjs
const nextConfig = {
  // Disable static export of built-in error pages
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Configure webpack to handle build issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress specific warnings during server build
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*', // Apply to all routes, or change to specific routes
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              style-src 'self' 'unsafe-inline' https://static-forms.klaviyo.com;
              style-src-elem 'self' 'unsafe-inline' https://static-forms.klaviyo.com;
              font-src 'self' https://static-forms.klaviyo.com https://fonts.klaviyo.com;
              img-src 'self' data: https:;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  },
  // ... your other config options
}

export default nextConfig;