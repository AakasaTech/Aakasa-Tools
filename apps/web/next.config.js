/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TS source, not a compiled dist — Next needs to
  // transpile them itself rather than treating them as pre-built node_modules.
  transpilePackages: ['@aakasa/ui', '@aakasa/tool-shell', '@aakasa/analytics'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // clean-css's main entry statically requires a source-reader module
      // that imports Node's `fs` (used for resolving local @import files),
      // even though the Code Minifier tool only ever passes it in-memory
      // CSS strings and never triggers that code path. Without this
      // fallback, webpack fails to resolve `fs` entirely for the client
      // bundle. This is the standard, safe fix for a Node-oriented package
      // with an unused fs-dependent branch — it doesn't change behavior for
      // anything this app actually calls.
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

module.exports = nextConfig;
