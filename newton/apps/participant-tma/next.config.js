import "./env.mjs";

const transpilePackages = ["@repo/ui"];

/** @type {import('next').NextConfig} */
export default {
  transpilePackages,
  basePath: "/ptma",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "localhost:3000",
        "test-samy-1.alaki.store",
        "test-keyhan-1.alaki.store",
        "onton.live",
        "stage.onton.live",
      ],
    },
  },
};
