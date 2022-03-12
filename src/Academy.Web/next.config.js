const withPWA = require("next-pwa");
const dev = process.env.NODE_ENV !== "production";

module.exports = withPWA({
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: true,
  },

  webpack5: true,
  webpack(config, { isServer }) {

    config.resolve.fallback = { ...config.resolve.fallback, fs: false };

    config.module.rules.push({
      test: /\.svg$/,
      use: [{
        loader: '@svgr/webpack',
        options: {
          svgoConfig: {
            plugins: {
              removeViewBox: false
            }
          }
        }
      }]
    });

    return config;
  },
  reactStrictMode: true,
});