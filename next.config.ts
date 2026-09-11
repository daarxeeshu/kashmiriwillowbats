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

  /* ── Security headers ──────────────────────────────────────────────────────────
   *
   * Here rather than in `vercel.json`, deliberately. Vercel honours both, but
   * headers declared here also apply to `next dev` and `next start`, which means a
   * Content-Security-Policy can be *tested* before it reaches production. A CSP is
   * exactly the wrong thing to ship untested: when it is too strict nothing throws,
   * the browser just silently refuses to load whatever the policy forgot.
   *
   * Every allowance below is here because something in this app needs it, and the
   * comments say what — so the next person to tighten it knows what they would
   * break. */
  async headers() {
    const dev = process.env.NODE_ENV !== "production";

    const csp = [
      "default-src 'self'",

      /* `wasm-unsafe-eval` is for the Draco decoder: the bat GLB is Draco-compressed
         and `public/configurator/draco/draco_decoder.wasm` cannot be instantiated
         without it. Drop it and the 3D studio loads nothing.

         `unsafe-inline` is for Next's hydration bootstrap. Removing it needs
         per-request nonces threaded through middleware, which is a real change
         rather than a config tweak.

         `unsafe-eval` is dev-only — React Fast Refresh needs it. Production does
         not, so production does not get it. */
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,

      // Tailwind and Next both inject style tags.
      "style-src 'self' 'unsafe-inline'",

      /* `blob:` is the Bat Doctor photo previews (`URL.createObjectURL`), `data:` is
         the inline SVG placeholders in `BrandCoverflow`. */
      "img-src 'self' data: blob:",

      // `next/font` self-hosts at build time, so no external font origin is needed.
      "font-src 'self' data:",

      /* Same-origin only. The browser never talks to Supabase — the client lives in
         a `server-only` module — so `*.supabase.co` is deliberately absent. `ws:` is
         the dev HMR socket. */
      `connect-src 'self'${dev ? " ws: wss:" : ""}`,

      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Nothing here is meant to be framed, by anyone.
      "frame-ancestors 'none'",
      ...(dev ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          {
            /* Two years, subdomains included, preload-eligible. Only meaningful over
               HTTPS — which is not optional here, because `/admin` is HTTP Basic and
               sends its password on every request. */
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Redundant next to `frame-ancestors`, kept for browsers that predate it.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            /* `camera=(self)` and not `camera=()`. Nothing calls `getUserMedia`, but
               `PhotoUpload` has `<input type="file" capture="environment">` for the
               Bat Doctor, and browsers disagree about whether this header gates that
               input. Denying outright risks silently removing the "take a photo"
               affordance on a phone, which is the whole point of that control. */
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
