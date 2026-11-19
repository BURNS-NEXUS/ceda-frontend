import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Django's NinjaAPI and Next disagree on trailing slashes for API routes.
  // Let the /api/backend proxy forward the exact requested path instead of
  // bouncing between Next's 308 and Django's APPEND_SLASH redirect.
  skipTrailingSlashRedirect: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  redirects() {
    return [
      {
        source: "/buttons-group",
        destination: "/buttons",
        permanent: true,
      },
      {
        source: "/modals",
        destination: "/dialogs",
        permanent: true,
      },
      {
        source: "/text-generator",
        destination: "/ai-chat/text",
        permanent: true,
      },
      {
        source: "/image-generator",
        destination: "/ai-chat/image",
        permanent: true,
      },
      {
        source: "/code-generator",
        destination: "/ai-chat/code",
        permanent: true,
      },
      {
        source: "/video-generator",
        destination: "/ai-chat/video",
        permanent: true,
      },
      {
        source: "/ai-settings",
        destination: "/ai-settings/account",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
