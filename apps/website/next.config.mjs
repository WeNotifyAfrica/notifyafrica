/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@notifyafrica/api-client",
    "@notifyafrica/config-client",
    "@notifyafrica/design-system",
    "@notifyafrica/types",
    "@notifyafrica/ui",
  ],
};

export default nextConfig;
