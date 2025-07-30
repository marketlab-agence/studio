/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    // Enable experimental features for WebAssembly.
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ensure module.rules is an array and add the rule for WebAssembly files.
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

module.exports = nextConfig;
