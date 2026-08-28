/* Headless capture rig for the mobile hero.
 *
 * Not part of the app. It exists because the in-editor preview pane would not
 * composite frames, and Chrome's own `--screenshot` flag cannot produce a viewport
 * narrower than 500px on Windows — the OS clamps the window, the page lays out at
 * 500, and the capture is a 390px-wide crop of it, which is exactly the "content
 * looks shifted right" artefact that sent me looking for a bug that was not there.
 *
 * Emulation.setDeviceMetricsOverride sets the layout viewport directly and ignores
 * the window entirely, and `mobile: true` is what makes svh/dvh and the viewport
 * meta behave the way they do on a phone rather than on a narrow desktop.
 *
 * Usage: node scripts/shoot-mobile.mjs 390x844 393x852 414x896
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const URL = process.env.SHOT_URL ?? "http://localhost:3000/";
const OUT = process.env.SHOT_OUT ?? ".analysis/mobile";
const SCROLL = Number(process.env.SHOT_SCROLL ?? 0);
const TAG = process.env.SHOT_TAG ?? "";

const sizes = process.argv.slice(2).map((s) => {
  const [w, h] = s.split("x").map(Number);
  return { w, h };
});
if (!sizes.length) {
  console.error("give one or more WxH");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=C:/Users/DeLL/AppData/Local/Temp/chr-cdp",
    "about:blank",
  ],
  { stdio: "ignore" },
);

/** The debugging endpoint takes a moment to bind. */
async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("chrome never opened its debugging port");
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.waiting = new Map();
    this.events = [];
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.waiting.has(msg.id)) {
        const { resolve, reject } = this.waiting.get(msg.id);
        this.waiting.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg.method);
      }
    };
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolve(new CDP(ws));
    ws.onerror = reject;
  });
}

const browser = await connect(await endpoint());
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await browser.send("Target.attachToTarget", {
  targetId,
  flatten: true,
});
const send = (m, p) => browser.send(m, p, sessionId);

await send("Page.enable");
await send("Runtime.enable");

// SHOT_RM=1 asserts prefers-reduced-motion: reduce, which is the one media state
// that can change whether content is visible at all — every entrance animation in
// the mobile hero is switched off under it, so this proves the resting states are
// the visible ones rather than trusting that the keyframes always run.
if (process.env.SHOT_RM === "1") {
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
}

for (const { w, h } of sizes) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 2,
    // Chrome's mobile emulation clamps the layout width to 360, so a true 320px
    // check has to opt out of it. SHOT_MOBILE=0 does that; everything else keeps
    // `mobile: true`, which is what makes svh/dvh and the viewport meta behave the
    // way they do on a phone rather than in a narrow desktop window.
    mobile: process.env.SHOT_MOBILE !== "0",
    screenWidth: w,
    screenHeight: h,
  });
  await send("Page.navigate", { url: URL });

  // Next dev compiles on first hit; give it room, then let the load-time
  // entrance animations finish before capturing.
  await sleep(3500);
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, ${SCROLL})`,
    awaitPromise: false,
  });
  await sleep(1400);

  const probe = await send("Runtime.evaluate", {
    expression: `(() => {
      const sec = document.querySelector('[data-hero-sequence]');
      const mob = sec && sec.querySelector(':scope > div.md\\\\:hidden');
      const eff = (el) => { let o = 1, n = el; while (n && n !== document.documentElement) { const s = getComputedStyle(n); if (s.display === 'none') return 'NONE'; if (s.visibility === 'hidden') return 'HID'; o *= parseFloat(s.opacity); n = n.parentElement; } return +o.toFixed(3); };
      const rep = (k, el) => { if (!el) return k + '=MISSING'; const r = el.getBoundingClientRect();
        const inV = r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1;
        return k + '=' + (inV ? 'in' : 'OUT[' + Math.round(r.top) + '..' + Math.round(r.bottom) + ']') + '/op' + eff(el) + '/' + Math.round(r.width) + 'x' + Math.round(r.height); };
      const txt = (t) => [...mob.querySelectorAll('h1,p,span,a')].find(e => e.textContent.trim().toLowerCase().startsWith(t));
      if (!mob) return 'NO_MOBILE_TREE';
      const bat = mob.querySelector('img');
      return JSON.stringify({
        iw: innerWidth, ih: innerHeight,
        sw: document.documentElement.scrollWidth,
        hOverflow: document.documentElement.scrollWidth > innerWidth,
        secTop: Math.round(sec.getBoundingClientRect().top),
        secH: Math.round(sec.getBoundingClientRect().height),
        batVw: bat ? +(bat.getBoundingClientRect().width / innerWidth * 100).toFixed(1) : null,
        tilt: bat ? getComputedStyle(bat).transform : null,
        items: [rep('eyebrow', txt('handcrafted')), rep('h1', mob.querySelector('h1')), rep('support', txt('crafted from')), rep('bat', bat), rep('shop', txt('shop now')), rep('explore', txt('explore'))],
      }, null, 1);
    })()`,
    returnByValue: true,
  });
  console.log(`--- ${w}x${h}\n${probe.result.value}`);

  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const file = `${OUT}/${TAG}${w}x${h}.png`;
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log("  wrote", file);
}

chrome.kill();
process.exit(0);
