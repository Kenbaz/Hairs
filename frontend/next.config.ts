import type { NextConfig } from "next";

const selectUrl = (urlString?: string, fallback: string = "") => {
  if (!urlString) return fallback;

  const urls = urlString.split(",");
  const isProduction = process.env.NODE_ENV === "production";

  return isProduction ? urls[1] || urls[0] : urls[0] || fallback;
};

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: selectUrl(
      process.env.NEXT_PUBLIC_API_URL,
      "http://localhost:8000"
    ),
    NEXT_PUBLIC_WS_URL: selectUrl(
      process.env.NEXT_PUBLIC_WS_URL,
      "ws://localhost:8000"
    ),
    NEXT_PUBLIC_PAYMENT_CALLBACK_URL: selectUrl(
      process.env.NEXT_PUBLIC_PAYMENT_CALLBACK_URL,
      "http://localhost:3000/payment/callback"
    ),
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || "development",
  },
};

export default nextConfig;
