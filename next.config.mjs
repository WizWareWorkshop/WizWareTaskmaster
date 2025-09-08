
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  // This is the crucial part that solves the build errors.
  // It tells Webpack to provide empty fallbacks for Node.js core modules
  // on the client-side, which prevents 'Module not found' errors.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        tls: false,
        net: false,
        child_process: false, // In case any dependency uses this
      };
    }

    return config;
  },
};

export default nextConfig;
