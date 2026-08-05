import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/parafarmacia-demo" : undefined,
  trailingSlash: isGitHubPages,
  images: isGitHubPages ? { unoptimized: true } : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
