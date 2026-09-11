/**
 * Where the studio's binaries live.
 *
 * One constant, because these are fetched by the engine at runtime rather than
 * imported — the GLB, the Draco decoder, the willow scans and the sticker cutouts are
 * all served from `public/` and none of them go through the bundler. Keeping the base
 * in one place is what lets the whole folder move without hunting through the engine
 * for string literals.
 *
 * Root-relative, not a full URL: the studio has to work on localhost, on a preview
 * deployment and on the live domain without being told which it is.
 */
export const ASSET_BASE = "/configurator";
