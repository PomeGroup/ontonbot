declare namespace NodeJS {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface process {
    DATABASE_URL: string;
    BOT_TOKEN: string;
    TONAPI_API_KEY: string;
    TON_SOCIETY_API_KEY: string;
    TON_SOCIETY_BASE_URL: string;
    NEXT_PUBLIC_BOT_USERNAME: string;
    NFT_MANAGER_BASE_URL: string;
    NEXT_PUBLIC_APP_BASE_URL: string;
    ONTON_API_SECRET: string;
    TG_NOTIFICATION_CHANELL: string;
    ENV: "development" | "production" | "staging" | "local";
    UNDICI_CONNECT_TIMEOUT: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    CACHE_ENABLED: boolean;
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_BOT_USERNAME: string;
    NEXT_PUBLIC_ONTON_WALLET_ADDRESS: string;
    BOT_TOKEN: string;
    ONTON_API_KEY: string;
    NEXT_PUBLIC_GTM?: string; // Optional environment variable
    NODE_ENV: "development" | "production" | "test"; // Built-in env variable for Node.js
  }
}
