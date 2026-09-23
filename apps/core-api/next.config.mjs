/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@notifyafrica/auth",
    "@notifyafrica/config-seed",
    "@notifyafrica/domain",
    "@notifyafrica/observability",
    "@notifyafrica/queue",
    "@notifyafrica/types",
    "@notifyafrica/validation",
    "@notifyafrica/design-system",
  ],
  webpack: (config) => {
    // bullmq optionally supports Valkey via `@valkey/valkey-glide`, which
    // isn't installed since we only use ioredis — harmless at runtime
    // (confirmed: campaign enqueue/processing works), but noisy at build
    // time without this.
    config.resolve.alias["@valkey/valkey-glide"] = false;
    return config;
  },
};

export default nextConfig;
