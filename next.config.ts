import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/data/vendors.json", "./src/data/vendors-osm.json"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
