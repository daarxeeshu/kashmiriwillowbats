import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ── Testing the dev server from a phone on the same Wi-Fi ──────────────────────
   *
   * `next dev` refuses cross-origin requests to /_next/* from any origin it was not
   * told about: the browser still receives the server-rendered HTML, so the page
   * *looks* correct, but every client bundle comes back 403 and React never
   * hydrates. The symptom is that nothing interactive works — menu, carousels, hero
   * scroll, add-to-cart — while the same build is perfect in a desktop mobile
   * emulator, because that runs on localhost and is allowed by default.
   *
   * Measured: the identical chunk returned 200 from localhost and 403 from
   * 192.168.29.17.
   *
   * The entries below are private LAN ranges only. This is a development-server
   * setting and has no effect on a production build. A LAN IP changes when the
   * machine joins a different network, so whole private ranges are listed rather
   * than one address that goes stale. Hostname patterns, not CIDR - this option
   * matches host strings and a CIDR block is treated as a literal name that never
   * matches (measured: the chunk stayed 403 until these became wildcards). */
  allowedDevOrigins: [
    "192.168.29.17",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    unoptimized: false, // keep optimization ON — local /public images work fine
  },
};

export default nextConfig;
