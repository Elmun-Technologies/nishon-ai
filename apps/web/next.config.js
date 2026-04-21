/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@adspectr/shared', '@adspectr/creative-hub-core'],
  staticPageGenerationTimeout: 120,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/leaderboard', destination: '/marketplace/leaderboard', permanent: true },
      { source: '/portfolio', destination: '/marketplace/portfolio', permanent: true },
      { source: '/portfolio/:slug', destination: '/marketplace/portfolio/:slug', permanent: true },
    ]
  },
}

module.exports = nextConfig