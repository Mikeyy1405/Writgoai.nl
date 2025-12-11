const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for optimal production builds
  // This creates a minimal, self-contained build (~50MB vs ~500MB)
  output: process.env.NEXT_OUTPUT_MODE || 'standalone',
  
  distDir: process.env.NEXT_DIST_DIR || '.next',
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'lodash',
    ],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Image optimization
  images: { 
    unoptimized: true,
    // Minimize image optimization during build
    formats: ['image/webp'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Reduce bundle size
  swcMinify: true,
  
  // Optimize webpack
  webpack: (config, { isServer }) => {
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};

module.exports = nextConfig;
