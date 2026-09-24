/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off specifically because /docs embeds swagger-ui-react, whose internal
  // ModelCollapse component still uses UNSAFE_componentWillReceiveProps (a
  // long-standing upstream issue, not fixable from here) — StrictMode's
  // double-invoke diagnostics surface it as a console warning on every
  // render. This app's only client-rendered React is that one page, so
  // there's no other interactive logic StrictMode would be protecting.
  reactStrictMode: false,
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
