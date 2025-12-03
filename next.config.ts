import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/isomorphic-git/ },
    ];
    return config;
  },
};

export default nextConfig;
