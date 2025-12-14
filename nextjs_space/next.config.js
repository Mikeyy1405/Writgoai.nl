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
  images: {
    unoptimized: true,
    // Local images only now
    remotePatterns: [],
  },
  async redirects() {
    return [
      // Dashboard routes
      {
        source: '/dashboard/blogs',
        destination: '/dashboard/blog',
        permanent: true,
      },
      // Writer routes - redirect to ultimate-writer
      {
        source: '/client-portal/ai-writer',
        destination: '/client-portal/ultimate-writer',
        permanent: true,
      },
      {
        source: '/client-portal/blog-writer',
        destination: '/client-portal/ultimate-writer',
        permanent: true,
      },
      {
        source: '/client-portal/content-writer',
        destination: '/client-portal/ultimate-writer',
        permanent: true,
      },
      // Video routes - redirect to video-generator
      {
        source: '/client-portal/video-studio',
        destination: '/client-portal/video-generator',
        permanent: true,
      },
      {
        source: '/client-portal/video-creator-pro',
        destination: '/client-portal/video-generator',
        permanent: true,
      },
      {
        source: '/client-portal/simple-video-generator',
        destination: '/client-portal/video-generator',
        permanent: true,
      },
      {
        source: '/client-portal/ai-video-maker',
        destination: '/client-portal/video-generator',
        permanent: true,
      },
      // Social media routes - redirect to social-media-suite
      {
        source: '/client-portal/social-media',
        destination: '/client-portal/social-media-suite',
        permanent: true,
      },
      {
        source: '/client-portal/social-media-studio',
        destination: '/client-portal/social-media-suite',
        permanent: true,
      },
      {
        source: '/client-portal/social-media-planner',
        destination: '/client-portal/social-media-suite',
        permanent: true,
      },
      // Content planner routes - redirect to content-planner
      {
        source: '/client-portal/content-planning',
        destination: '/client-portal/content-planner',
        permanent: true,
      },
      {
        source: '/client-portal/content-plan-generator',
        destination: '/client-portal/content-planner',
        permanent: true,
      },
      // Content library routes
      {
        source: '/client-portal/content-library-new',
        destination: '/client-portal/content-library',
        permanent: true,
      },
      // Existing content-hub redirects
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
    ];
  },
};

module.exports = nextConfig;
