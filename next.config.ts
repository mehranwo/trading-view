import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  reactStrictMode: false, // غیرفعال کردن Strict Mode برای جلوگیری از double mount
};

export default nextConfig;
