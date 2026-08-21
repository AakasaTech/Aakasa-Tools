/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TS source, not a compiled dist — Next needs to
  // transpile them itself rather than treating them as pre-built node_modules.
  transpilePackages: ['@aakasa/ui', '@aakasa/tool-shell', '@aakasa/analytics'],
};

module.exports = nextConfig;
