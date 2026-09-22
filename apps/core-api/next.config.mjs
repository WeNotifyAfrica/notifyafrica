/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@notifyafrica/auth",
    "@notifyafrica/config-seed",
    "@notifyafrica/observability",
    "@notifyafrica/types",
    "@notifyafrica/validation",
    "@notifyafrica/design-system",
  ],
};

export default nextConfig;
