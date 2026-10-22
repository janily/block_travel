import type { NextConfig } from "next";
const config: NextConfig = {
  async redirects() {
    return [{ source: "/videos.html", destination: "/videos", permanent: true }];
  },
};
export default config;
