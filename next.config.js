
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // NOTE: The `distDir` is NOT set here. 
  // This allows the build to output to the default 'out' directory,
  // which is expected by the GitHub Pages deployment action.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "child_process": false,
        "dns": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
