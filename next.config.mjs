/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // If NEXT_PUBLIC_API_BASE_URL points to Go backend, proxy requests cleanly if needed
    const goBackendUrl = process.env.GO_BACKEND_URL;
    if (goBackendUrl) {
      return [
        {
          source: '/api/v1/go/:path*',
          destination: `${goBackendUrl}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
