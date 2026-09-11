/**
 * The studio controller: everything imperative, in one object React can hold in a ref.
 *
 * This is the boundary. React owns the configuration and the panel; this owns the
 * WebGL context, the mesh, the four canvases and the camera, and it is driven by
 * exactly one method — `apply(config, changed)`.
 *
 * `changed` is not an optimisation detail, it is the reason this design works.
 * Reshaping the blade walks every vertex and re-derives cross sections; repainting the
 * burn canvas is a few hundred glyph fills. Typing a name must do the second and not
 * the first, or every keystroke costs a mesh rebuild. So each concern declares which
 * configuration keys it depends on, and `apply` does the least work those keys allow.
 *
 * Nothing here touches the DOM outside the host element it is given, and nothing here
 * imports React — which is what makes it testable and what kept the port honest.
 */
import * as THREE from "three";
import { Viewer } from "./viewer.js";
import { BatModel, createGripMaterial, UNITS_PER_MM } from "./batModel.js";
import { createWillowMaterial } from "./willowMaterial.js";
import {
  BatCanvas,
  drawSticker,
  drawEngraving,
  stickerBottomV,
  loadImage,
} from "./artwork.js";
import { PlacementController } from "./placement.js";
import { ASSET_BASE } from "./assets.js";

/* Which configuration keys each concern depends on. `model` appears in three of them
   because the bat's own name is burnt into the blade: changing the product has to
   redraw the engraving and re-tint the willow, not just swap a price. */
const SHAPE_KEYS = ["profile", "edge", "toe", "handle", "weight", "size"];
const ART_KEYS = ["sticker", "model"];
const ENGRAVE_KEYS = ["engrave", "model", "sticker"];
const MATERIAL_KEYS = ["model", "grip", "toeGuard"];

/** px per bat unit on the front canvases, ≈ 5 px/mm. The back pair is half this: the
 *  spine carries no sticker and only ever an engraving, so the resolution there buys
 *  nothing but memory. */
const CANVAS_RES = 900;

export class BatStudio {
  /**
   * @param host      the element the canvas is appended to
   * @param handlers  { onProgress, onFps, onPlacement, onPlacementEnd, onPlacementStart }
   */
  constructor(host, handlers = {}) {
    this.host = host;
    this.handlers = handlers;
    this.viewer = new Viewer(host);
    this.bat = null;
    this.stickers = new Map();
    this.views = {};
    this.ready = false;
    this.disposed = false;
    this._lastShapeKey = "";
    this._config = null;

    // An idle stage legitimately draws zero frames, because it renders on demand.
    // Reporting "0 fps" would read as a fault, so the state is reported instead.
    this.viewer.onFps = (fps) => handlers.onFps?.(fps);
  }

  /* ── Loading ─────────────────────────────────────────────────────────────── */

  async load() {
    const progress = (p, message) => this.handlers.onProgress?.(p, message);
    progress(0.05, "Loading the blade…");

    const texLoader = new THREE.TextureLoader();
    const loadTex = (url, srgb) =>
      new Promise((resolve, reject) => {
        texLoader.load(
          url,
          (t) => {
            t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            // The blade is often small in frame; without generous anisotropy the
            // grain aliases into false horizontal banding at a distance.
            t.anisotropy = this.viewer.renderer.capabilities.getMaxAnisotropy();
            resolve(t);
          },
          undefined,
          reject,
        );
      });

    const bat = new BatModel();
    const [, willowColour, willowNormal, gripNormal, stickers] = await Promise.all([
      bat.load((p) => progress(0.05 + p * 0.45, "Loading the blade…")),
      loadTex(`${ASSET_BASE}/textures/willow-colour.webp`, true),
      loadTex(`${ASSET_BASE}/textures/willow-normal.webp`, false),
      loadTex(`${ASSET_BASE}/textures/grip-normal.webp`, false),
      loadStickers(),
    ]);

    // Disposed while we were awaiting — React unmounted the section mid-load. Give
    // the GPU objects back rather than finishing a setup nobody is looking at.
    if (this.disposed) {
      willowColour.dispose();
      willowNormal.dispose();
      gripNormal.dispose();
      return;
    }

    progress(0.72, "Preparing the finish…");

    /* The grain in the source scan already runs vertically, so it only needs
       repeating *across* the blade to set the grain spacing. Repeating along the
       length as well tiled the scan's own tonal variation into visible horizontal
       bands — the blade read as stacked planks rather than one cleft. */
    willowColour.repeat.set(2.4, 1.0);
    willowNormal.repeat.set(2.4, 1.0);

    this.bat = bat;
    this.stickers = stickers;
    this.willow = createWillowMaterial({
      colourMap: willowColour,
      normalMap: willowNormal,
    });
    this.grip = createGripMaterial(gripNormal);
    bat.setMaterials({ willow: this.willow, grip: this.grip });

    const uniforms = this.willow.userData.uniforms;
    bat.configureProjection(uniforms);

    // The canvases cover the blade exactly, at a resolution that keeps px/unit equal
    // in both axes so nothing drawn on them is stretched.
    const b = bat.bounds;
    const rect = { x: b.min.x, y: b.toeY, w: b.width, h: b.bladeLength };
    this.decalFront = new BatCanvas(rect, CANVAS_RES, { srgb: true });
    this.engraveFront = new BatCanvas(rect, CANVAS_RES, { srgb: false });
    this.decalBack = new BatCanvas(rect, CANVAS_RES * 0.5, { srgb: true });
    this.engraveBack = new BatCanvas(rect, CANVAS_RES * 0.5, { srgb: false });

    uniforms.uDecal.value = this.decalFront.texture;
    uniforms.uEngrave.value = this.engraveFront.texture;
    uniforms.uDecalBack.value = this.decalBack.texture;
    uniforms.uEngraveBack.value = this.engraveBack.texture;

    this.viewer.scene.add(bat.root);
    this.viewer.setGroundY(b.min.y - 0.02);

    progress(0.9, "Almost there…");
    // Engraving is type. Drawing it before the webfont exists bakes the fallback
    // into a canvas that is never repainted on load.
    if (document.fonts?.ready) await document.fonts.ready;
    if (this.disposed) return;

    this.placement = new PlacementController({
      viewer: this.viewer,
      bat,
      uniforms,
      getMark: () => this._currentMark(),
      onMove: ({ u, v, face }) => this.handlers.onPlacement?.({ u, v, face }),
      onEnd: () => this.handlers.onPlacementEnd?.(),
    });
    // Capture phase, so the caller can snapshot before the drag begins and the whole
    // move collapses into one undo step.
    this._onPointerDown = () => this.handlers.onPlacementStart?.();
    this.viewer.renderer.domElement.addEventListener(
      "pointerdown",
      this._onPointerDown,
      true,
    );

    this.ready = true;
    progress(1, "");
  }

  /* ── The one entry point ─────────────────────────────────────────────────── */

  /**
   * @param config   the whole configuration
   * @param changed  which top-level keys differ from last time; pass every key on the
   *   first call. An empty list is a no-op, which is what makes it safe to call from
   *   a React effect that may re-run for unrelated reasons.
   */
  apply(config, changed) {
    if (!this.ready || this.disposed) return;
    this._config = config;
    const touched = (keys) => keys.some((k) => changed.includes(k));

    if (touched(SHAPE_KEYS)) this._applyShape(config);
    if (touched(MATERIAL_KEYS)) this._applyMaterials(config);
    if (touched(ART_KEYS)) this._applyStickers(config);
    // Placement lives inside `engrave` and it moves where the close-up looks, so the
    // views are rebuilt with it and not only when the bat is reshaped.
    if (touched(ENGRAVE_KEYS)) {
      this._applyEngraving(config);
      this._computeViews();
    }

    this.bat.updateTangents(this.willow.userData.uniforms);
    this.viewer.invalidate();
  }

  _applyShape(config) {
    const shape = config.shape;
    // Reshaping walks every vertex. Scaling is a transform. Only the first is worth
    // guarding, and the key is exactly the parameters the reshape reads.
    const key = JSON.stringify([
      shape.swell,
      shape.spine,
      shape.toeDrop,
      shape.edge,
      shape.round,
      shape.oval,
      shape.egg,
      shape.mass,
    ]);
    if (key !== this._lastShapeKey) {
      this.bat.applyShape(shape);
      this._lastShapeKey = key;
    }
    this.bat.applyScale({ scale: shape.scale });
    this.viewer.setGroundY(this.bat.bounds.min.y * shape.scale - 0.02);
    this._computeViews();
  }

  _applyMaterials(config) {
    const uniforms = this.willow.userData.uniforms;

    /* Willow comes with the bat, not as its own option: an English willow cleft is
       paler and colder than Kashmir and shows a tighter grain, and no customer should
       be able to contradict the product they picked. */
    const english = config.willow === "english";
    this.willow.color.set(english ? 0xfaf0dc : 0xf0d9ad);
    uniforms.uGrainTint.value = english ? 0.12 : 0.55;
    this.willow.normalScale.set(english ? 0.32 : 0.44, english ? 0.32 : 0.44);
    this.willow.roughness = english ? 0.5 : 0.55;

    // A clear toe guard reads as a slightly glossier finish over the toe.
    this.willow.clearcoat = config.toeGuard === "clear" ? 0.42 : 0.16;

    if (config.gripColour) this.grip.color.set(config.gripColour);
  }

  _applyStickers(config) {
    drawSticker(this.decalFront, this.stickers.get(config.sticker));
    // Nothing is printed on the spine. Drawing null still clears the canvas, which
    // matters when a colourway changes.
    drawSticker(this.decalBack, null);
  }

  _applyEngraving(config) {
    const engrave = config.engrave;
    const uniforms = this.willow.userData.uniforms;
    drawEngraving(this.engraveFront, engrave, "front", this._brandMark(config));
    drawEngraving(this.engraveBack, engrave, "back");
    uniforms.uEngraveOn.value = engrave?.on ? 1 : 0;
    uniforms.uBurnDepth.value = engrave?.depth ?? 0.72;
    this.placement?.syncMark();
  }

  /** The bat's own name, burnt below the sticker where KIS's own bats carry it. */
  _brandMark(config) {
    if (!config.brandName) return null;
    const image = this.stickers.get(config.sticker);
    return {
      name: config.brandName,
      v: stickerBottomV(this.decalFront, image) - 0.03,
    };
  }

  /**
   * The engraving's footprint, taken from what was actually drawn rather than from
   * what was requested — so the grab area and the visible mark always agree, even
   * after the layout has shrunk or clamped the text to fit the blade.
   */
  _currentMark() {
    const engrave = this._config?.engrave;
    if (!engrave?.on) return null;
    const canvas = engrave.face === "back" ? this.engraveBack : this.engraveFront;
    const extent = canvas?.extent;
    if (!extent) return null;
    return {
      face: engrave.face === "back" ? "back" : "front",
      rect: [extent.left, 1 - extent.top, extent.right, 1 - extent.bottom],
    };
  }

  /* ── Measurement, for the order ──────────────────────────────────────────── */

  /** The three figures a bat is actually specified by, measured off the mesh the
   *  customer is looking at. */
  measureBlade() {
    return this.ready ? this.bat.measureBlade() : null;
  }

  /**
   * The engraving's placement in millimetres — from the toe, from the centre line,
   * and its cap height. These are the numbers a laser operator sets, and they are
   * what `fromToeId` / `acrossId` / `capHeightId` turn into order option ids.
   */
  engraveMillimetres(engrave) {
    if (!this.ready) return null;
    const b = this.bat.bounds;
    return {
      fromToe: (engrave.pos.v * b.bladeLength) / UNITS_PER_MM,
      across: ((engrave.pos.u - 0.5) * b.width) / UNITS_PER_MM,
      capHeight: (engrave.size * b.width) / UNITS_PER_MM,
    };
  }

  /* ── Camera ──────────────────────────────────────────────────────────────── */

  /** Recomputed whenever the bat changes size, so "look at the engraving" means the
   *  same thing on a size 5 as on a short handle. */
  _computeViews() {
    const b = this.bat.bounds;
    const s = this.bat.root.scale.x;
    const toe = b.min.y * s;
    const top = b.max.y * s;
    const midY = (toe + top) / 2;
    const height = top - toe;
    const fov = this.viewer.camera.fov * (Math.PI / 180);
    const full = (height / 2 / Math.tan(fov / 2)) * 1.12;
    const faceZ = b.faceZ * s;

    // Frame a close-up by the height it has to show, not by a fixed distance —
    // otherwise a long name or a bigger bat size runs out of the frame.
    const frame = (visibleHeight, fovDeg) =>
      visibleHeight / 2 / Math.tan(((fovDeg * Math.PI) / 180) / 2);

    const engrave = this._config?.engrave;
    const face = engrave?.face ?? "front";
    const drawn = (face === "back" ? this.engraveBack : this.engraveFront)?.extent;
    const engraveHeight = ((drawn ? drawn.height * b.bladeLength : 0.55) + 0.28) * s;
    const engraveCentre = drawn
      ? (b.toeY + ((drawn.top + drawn.bottom) / 2) * b.bladeLength) * s
      : (b.toeY + (engrave?.pos?.v ?? 0.115) * b.bladeLength) * s;

    const stickerY = (b.toeY + 0.8 * b.bladeLength) * s;

    this.views = {
      full: {
        position: [0.35, midY + height * 0.02, full],
        target: [0, midY, 0],
        fov: 32,
      },
      face: {
        position: [0, stickerY, faceZ + frame(1.15 * s, 30)],
        target: [0, stickerY, 0],
        fov: 30,
      },
      engrave: {
        position:
          face === "back"
            ? [0, engraveCentre, -(Math.abs(b.backZ * s) + frame(engraveHeight, 28))]
            : [0, engraveCentre, faceZ + frame(engraveHeight, 28)],
        target: [0, engraveCentre, 0],
        fov: 28,
      },
      /* Profile and edge are judged from the side, on the blade — so frame the blade
         and not the whole bat, or the choice the customer just made is a few pixels
         of silhouette. */
      edge: {
        position: [
          frame(b.bladeLength * 1.06 * s, 30),
          (b.toeY + b.bladeLength * 0.45) * s,
          0,
        ],
        target: [0, (b.toeY + b.bladeLength * 0.45) * s, 0],
        fov: 30,
      },
      back: { position: [-0.4, midY, -full], target: [0, midY, 0], fov: 32 },
    };
  }

  setView(name, animate = true) {
    const view = this.views[name];
    if (!view) return;
    this.viewer.flyTo(view, animate ? 780 : 0);
  }

  /* ── Teardown ────────────────────────────────────────────────────────────── */

  /**
   * A WebGL context is not garbage collected on unmount, and a browser keeps only a
   * handful alive — navigate in and out of the studio a few times without this and
   * the canvas comes back blank. So every GPU object this controller created is
   * released here.
   */
  dispose() {
    this.disposed = true;
    this.ready = false;

    if (this._onPointerDown) {
      this.viewer.renderer.domElement.removeEventListener(
        "pointerdown",
        this._onPointerDown,
        true,
      );
    }
    this.placement?.dispose();

    for (const canvas of [
      this.decalFront,
      this.decalBack,
      this.engraveFront,
      this.engraveBack,
    ]) {
      canvas?.texture.dispose();
    }

    if (this.bat?.root) {
      this.viewer.scene.remove(this.bat.root);
      this.bat.root.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose();
        for (const material of [node.material].flat()) {
          if (!material) continue;
          for (const value of Object.values(material)) {
            if (value && value.isTexture) value.dispose();
          }
          material.dispose();
        }
      });
    }

    this.viewer.scene.environment?.dispose();
    this.viewer.dispose();

    const canvas = this.viewer.renderer.domElement;
    canvas.parentNode?.removeChild(canvas);
  }
}

/** The sticker cutouts, keyed by colourway id. */
async function loadStickers() {
  const manifest = await fetch(`${ASSET_BASE}/stickers/manifest.json`).then((r) =>
    r.json(),
  );
  const map = new Map();
  await Promise.all(
    manifest.map(async (entry) => {
      if (!entry.shield) return;
      map.set(entry.id, await loadImage(`${ASSET_BASE}/${entry.shield.src}`));
    }),
  );
  return map;
}
