/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API routes work on Render
  output: 'standalone',
  
  // Disable static optimization for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'no-store, must-revalidate' 
          },
        ],
      },
    ];
  },
};

export default nextConfig;
