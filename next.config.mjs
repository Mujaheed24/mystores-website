/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    // The site's own pictures change rarely: keep them a day, and let browsers show the old one for a week while fetching a new one.
    const day = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/images/:path*", headers: day },
      { source: "/icons/:path*", headers: day },
    ];
  },
};
export default nextConfig;
