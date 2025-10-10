import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * NOTE:
   * Removed `output: "export"` because the project contains a dynamic route
   * at `app/pages/pay/[id]/page.tsx` that depends on runtime (on‑chain) data.
   * Static export requires every dynamic segment to be enumerated via
   * `generateStaticParams()`. Since invoice IDs are not known at build time
   * (they come from the blockchain), a static export cannot faithfully
   * reproduce this behavior. Keeping `output: "export"` caused the build
   * error: missing generateStaticParams().
   *
   * If you later introduce a deterministic list of IDs, you can re-add:
   *   output: "export"
   * and implement `export const generateStaticParams = async () => [...]` in
   * the dynamic page file. Until then we ship a normal server / standalone build.
   */
  images: {
    unoptimized: true, // keep unoptimized images if desired; remove if using the Image Optimization Loader
  },
  trailingSlash: true,
};

export default nextConfig;
