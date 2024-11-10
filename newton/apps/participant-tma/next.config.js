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
        `${process.env.IP_PARTICIPANT_TMA}:${process.env.PARTICIPANT_TMA_PORT}`,
        `${process.env.IP_MINI_APP}:${process.env.MINI_APP_PORT}`,
        "test-samy-1.alaki.store",
        "test-keyhan-1.alaki.store",
        "onton.live",
        "stage.onton.live",
      ],
    },
  },
};
