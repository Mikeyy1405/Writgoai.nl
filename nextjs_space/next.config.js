const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/client-portal/blog-generator',
        destination: '/client-portal/content-hub',
        permanent: false,
      },
      {
        source: '/client-portal/topical-mapping',
        destination: '/client-portal/content-hub',
        permanent: false,
      },
      {
        source: '/client-portal/content-research',
        destination: '/client-portal/content-hub',
        permanent: false,
      },
      {
        source: '/client-portal/auto-writer',
        destination: '/client-portal/content-hub',
        permanent: false,
      },
      {
        source: '/client-portal/content-library',
        destination: '/client-portal/content-hub',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
