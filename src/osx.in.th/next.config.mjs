/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
    const backend = (process.env.PHP_BACKEND_URL || 'http://127.0.0.1').replace(/\/$/, '');
    return { fallback: [
      {
        source: '/verify',
        destination: `${backend}/api/verify.php`,
      },
      {
        source: '/api/get-script',
        destination: `${backend}/api/get-script.php`,
      },
      {
        source: '/api/loader',
        destination: `${backend}/api/loader.php`,
      },
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ] };
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  allowedDevOrigins: ['osx.in.th', 'subduing-dawdler-happening.ngrok-free.dev'],
};

export default nextConfig;
