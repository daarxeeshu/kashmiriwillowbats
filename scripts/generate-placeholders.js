/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public");

function batSvg(label, w, h) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<defs>`,
    `<linearGradient id="studio" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#faf8f5"/><stop offset="100%" stop-color="#ebe4da"/></linearGradient>`,
    `<linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#c4a574"/><stop offset="50%" stop-color="#e8d4a8"/><stop offset="100%" stop-color="#a8844a"/></linearGradient>`,
    `</defs>`,
    `<rect width="100%" height="100%" fill="url(#studio)"/>`,
    `<path d="M${w / 2 - 15} ${h * 0.12} C${w / 2 + 15} ${h * 0.12} ${w / 2 + 25} ${h * 0.25} ${w / 2 + 30} ${h * 0.45} C${w / 2 + 35} ${h * 0.65} ${w / 2 + 28} ${h * 0.82} ${w / 2 + 10} ${h * 0.88} L${w / 2 - 10} ${h * 0.88} C${w / 2 - 28} ${h * 0.82} ${w / 2 - 35} ${h * 0.65} ${w / 2 - 30} ${h * 0.45} C${w / 2 - 25} ${h * 0.25} ${w / 2 - 15} ${h * 0.12} Z" fill="url(#wood)" opacity="0.95"/>`,
    `<rect x="${w / 2 - 12}" y="${h * 0.88}" width="24" height="${h * 0.07}" rx="3" fill="#3d2914"/>`,
    `<text x="50%" y="${h * 0.96}" fill="#8a847c" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">${label}</text>`,
    `</svg>`,
  ].join("");
}

function logoSvg(label) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" width="200" height="48">`,
    `<rect width="200" height="48" fill="#faf8f5"/>`,
    `<text x="100" y="30" fill="#1c1b19" font-family="system-ui,sans-serif" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="1">${label}</text>`,
    `</svg>`,
  ].join("");
}

function categorySvg(label, w, h) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0ebe6"/><stop offset="100%" stop-color="#ddd5ca"/></linearGradient></defs>`,
    `<rect width="100%" height="100%" fill="url(#g)"/>`,
    `<rect x="20%" y="25%" width="60%" height="50%" rx="4" fill="#1e3d32" opacity="0.08"/>`,
    `<text x="50%" y="88%" fill="#5c5752" font-family="system-ui,sans-serif" font-size="13" font-weight="600" text-anchor="middle">${label}</text>`,
    `</svg>`,
  ].join("");
}

["brands", "products", "hero", "categories"].forEach((d) =>
  fs.mkdirSync(path.join(root, d), { recursive: true }),
);

const brands = ["kis", "jk", "valleywoods", "sls", "woodford", "whiteduck", "ib", "a-star"];
brands.forEach((b) => {
  const label = b.replace("a-star", "A STAR").replace(/-/g, " ").toUpperCase();
  fs.writeFileSync(path.join(root, "brands", `${b}.svg`), logoSvg(label));
  fs.writeFileSync(path.join(root, "brands", `${b}-cover.svg`), categorySvg(label, 800, 600));
});
fs.writeFileSync(path.join(root, "brands", "placeholder.svg"), logoSvg("BRAND"));

const categories = [
  "kashmir-willow",
  "english-willow",
  "batting-gloves",
  "batting-pads",
  "thigh-guards",
  "helmets",
  "cricket-balls",
  "cricket-shoes",
  "cricket-bags",
  "accessories",
];
categories.forEach((c) =>
  fs.writeFileSync(
    path.join(root, "categories", `${c}.svg`),
    categorySvg(c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), 600, 800),
  ),
);

const products = [
  "kis-mh7000-plus",
  "kis-mh7000",
  "kis-bazuka",
  "kis-game-changer",
  "kis-players-special",
  "kis-master-pro",
  "kis-finisher",
  "jk-pro-willow",
];
products.forEach((p) =>
  fs.writeFileSync(
    path.join(root, "products", `${p}.svg`),
    batSvg(p.replace(/-/g, " ").toUpperCase(), 800, 1000),
  ),
);

fs.writeFileSync(
  path.join(root, "hero", "engraving.svg"),
  categorySvg("Laser Engraving", 1200, 900),
);
fs.writeFileSync(
  path.join(root, "hero", "brand-story.svg"),
  categorySvg("From Kashmir", 1000, 1250),
);

console.log("Studio placeholders regenerated.");
