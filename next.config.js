/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Only set output mode if explicitly configured
  ...(process.env.NEXT_OUTPUT_MODE && { output: process.env.NEXT_OUTPUT_MODE }),
  
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  
  // Remove experimental outputFileTracingRoot as it's not needed in Docker
  // and can cause issues when the path resolves incorrectly
  experimental: {},
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Image optimization configuration
  images: { 
    unoptimized: true,
    domains: [],
    formats: ['image/webp'],
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
