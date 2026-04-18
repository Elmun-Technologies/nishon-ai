/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@performa/shared'],
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig