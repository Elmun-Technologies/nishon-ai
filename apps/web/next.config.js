const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    externalDir: true,
    /** Monorepo: trace server bundles from repo root so workspace packages resolve on Vercel. */
    outputFileTracingRoot: path.join(__dirname, '../..'),
  },
  transpilePackages: ['@adspectr/shared', '@adspectr/creative-hub-core'],
  staticPageGenerationTimeout: 120,
  typescript: {
    // Type errors now break the build (the codebase is tsc-clean). This is the
    // safety net that previously let undefined-symbol bugs ship to production.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint runs as a required CI gate; keep it out of the build to avoid
    // double-running. Flip to false once the warning backlog is cleared.
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
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