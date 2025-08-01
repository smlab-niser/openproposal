/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/project/openproposal',
  assetPrefix: '/project/openproposal',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
