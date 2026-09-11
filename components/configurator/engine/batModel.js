/**
 * The bat itself: loading, measuring, shaping.
 *
 * The demo we studied ships ten finished blades in one file and hides nine of
 * them. We ship one blade and reshape it. Profile, edge and toe are applied as a
 * deformation of the modelled vertices, which means the customer gets shapes
 * that blend rather than shapes that snap — and the download carries one blade,
 * not ten.
 *
 * Shaping runs on the CPU on change (not per frame) so normals can be rebuilt
 * properly; a vertex-shader deformation would light the new spine incorrectly.
 *
 * See README for the provenance of the mesh this loads.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ASSET_BASE } from './assets.js';

/**
 * Faces meeting at less than this angle are treated as one smooth surface when
 * normals are averaged. Above it the edge stays crisp.
 */
const SMOOTH_ANGLE = 46;

/** How deep a round toe's arc is, relative to the blade's half-width. */
const TOE_ARC_RATIO = 0.62;

/**
 * The bat is normalised to this height in scene units on load, whatever the
 * source model was authored at. A full-size bat is 838 mm, which fixes the
 * scene's millimetre — the number the print pipeline eventually needs.
 */
export const TARGET_HEIGHT = 4.8;
export const REAL_HEIGHT_MM = 838;
export const UNITS_PER_MM = TARGET_HEIGHT / REAL_HEIGHT_MM;
export const MM = (mm) => mm * UNITS_PER_MM;

export class BatModel {
  constructor() {
    this.root = new THREE.Group();
    this.blade = null;
    this.grip = null;
    this.bounds = null;
  }

  async load(onProgress) {
    const loader = new GLTFLoader();

    // The blade ships Draco-compressed — 0.61 MB instead of 2.78 MB. Only the
    // wasm decoder is served (the asm.js fallback and the encoder are stripped
    // in prep), so the decoder itself costs ~336 KB, once, cached.
    const draco = new DRACOLoader();
    draco.setDecoderPath(`${ASSET_BASE}/draco/`);
    draco.setDecoderConfig({ type: 'wasm' });
    loader.setDRACOLoader(draco);

    const gltf = await loader.loadAsync(`${ASSET_BASE}/models/kis-bat.glb`, (e) => {
      if (onProgress && e.total) onProgress(e.loaded / e.total);
    });
    draco.dispose();

    const scene = gltf.scene;
    scene.updateWorldMatrix(true, true);

    // Two meshes: the blade (which also carries the handle stick) and the grip.
    const meshes = [];
    scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    meshes.sort((a, b) => count(b) - count(a));
    this.blade = meshes[0];
    this.grip = meshes[1] ?? null;

    // Bake the hierarchy's transforms into the geometry so bat-space and
    // object-space are the same thing. Everything downstream — the projection,
    // the shaping, the camera framing — is simpler for it.
    for (const m of meshes) {
      m.updateWorldMatrix(true, false);
      // This GLB stores attributes interleaved. Everything downstream — the
      // shaping loop, the `aOrig` snapshot — indexes raw arrays at stride 3, so
      // flatten first rather than scatter `isInterleavedBufferAttribute` checks
      // through the rest of the file.
      m.geometry = flatten(m.geometry);
      m.geometry.applyMatrix4(m.matrixWorld);
      m.position.set(0, 0, 0);
      m.quaternion.identity();
      m.scale.set(1, 1, 1);
      m.castShadow = true;
      m.receiveShadow = true;
      this.root.add(m);
    }

    this._normalise(meshes);
    this._measure();
    this._prepareShaping();
    return this;
  }

  /**
   * Put the bat into a known pose and a known size.
   *
   * The source is an FBX import: it arrives Z-up, at the exporter's scale, and
   * off-centre. Rather than hard-code the correction — which silently breaks the
   * day someone re-exports the model — we measure it: the longest axis is the
   * bat, the widest of the remaining two is the face, the wide end is the blade,
   * and the flat side is the hitting face.
   */
  _normalise(meshes) {
    // Union the *geometry* boxes. Object-level helpers would fold in each mesh's
    // matrixWorld, which is stale here — the transforms were just baked away.
    const unionBox = () => {
      const out = new THREE.Box3();
      for (const m of meshes) {
        m.geometry.computeBoundingBox();
        out.union(m.geometry.boundingBox);
      }
      return out;
    };

    // 1. Straighten. The source arrives rotated by its export wrapper, and the
    //    rotation is not a multiple of 90°, so swapping axes cannot fix it.
    //    Principal component analysis finds the bat's own axes from the vertices:
    //    the direction of greatest spread *is* the length of a cricket bat.
    const rot = new THREE.Matrix4().makeBasis(...principalAxes(meshes));
    rot.invert();
    for (const m of meshes) m.geometry.applyMatrix4(rot);

    // 2. Of the two remaining axes, the wider is the blade face; rotate about Y
    //    if the wide one ended up as Z.
    let box2 = unionBox();
    let s2 = new THREE.Vector3(); box2.getSize(s2);
    if (s2.z > s2.x) {
      const spin = new THREE.Matrix4().makeRotationY(Math.PI / 2);
      for (const m of meshes) m.geometry.applyMatrix4(spin);
      box2 = unionBox();
      box2.getSize(s2);
    }

    // 3. Scale to a working size and centre on the Y axis.
    const k = TARGET_HEIGHT / s2.y;
    const centre = new THREE.Vector3(); box2.getCenter(centre);
    const fix = new THREE.Matrix4()
      .makeScale(k, k, k)
      .multiply(new THREE.Matrix4().makeTranslation(-centre.x, -box2.min.y, -centre.z));
    for (const m of meshes) m.geometry.applyMatrix4(fix);

    // 4. Which end is the toe? The blade end is far wider than the handle.
    const blade = this.blade.geometry;
    const bb = new THREE.Box3().setFromBufferAttribute(blade.attributes.position);
    const spanAt = (lo, hi) => {
      const p = blade.attributes.position;
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y < lo || y > hi) continue;
        const x = p.getX(i);
        if (x < min) min = x;
        if (x > max) max = x;
      }
      return max - min;
    };
    const h = bb.max.y - bb.min.y;
    const lowWidth = spanAt(bb.min.y, bb.min.y + h * 0.18);
    const highWidth = spanAt(bb.max.y - h * 0.18, bb.max.y);
    if (highWidth > lowWidth) {
      const flip = new THREE.Matrix4().makeRotationZ(Math.PI);
      for (const m of meshes) m.geometry.applyMatrix4(flip);
      const shift = new THREE.Matrix4().makeTranslation(0, TARGET_HEIGHT, 0);
      for (const m of meshes) m.geometry.applyMatrix4(shift);
    }

    // 5. Which side is the hitting face? It is flat, so far more of its vertices
    //    sit near the extreme plane than on the curved spine side.
    const p = blade.attributes.position;
    const bb2 = new THREE.Box3().setFromBufferAttribute(p);
    const band = (bb2.max.z - bb2.min.z) * 0.09;
    let nearMax = 0, nearMin = 0;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i);
      if (z > bb2.max.z - band) nearMax++;
      if (z < bb2.min.z + band) nearMin++;
    }
    if (nearMin > nearMax) {
      const spin = new THREE.Matrix4().makeRotationY(Math.PI);
      for (const m of meshes) m.geometry.applyMatrix4(spin);
    }

    for (const m of meshes) {
      m.geometry.computeVertexNormals();
      m.geometry.computeBoundingBox();
      m.geometry.computeBoundingSphere();
    }
  }

  _measure() {
    const g = this.blade.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const pos = g.attributes.position;

    // Where does the blade stop and the handle stick begin? Scan for the
    // highest point that is still nearly full width.
    const halfWidth = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x));
    let shoulderY = bb.min.y;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      if (Math.abs(x) > halfWidth * 0.8 && y > shoulderY) shoulderY = y;
    }

    this.bounds = {
      min: bb.min.clone(),
      max: bb.max.clone(),
      shoulderY,
      toeY: bb.min.y,
      bladeLength: shoulderY - bb.min.y,
      width: bb.max.x - bb.min.x,
      // The face is the flat side. It is whichever Z extreme has more of the
      // blade's area sitting on a single plane; the spine bulges from the other.
      faceZ: bb.max.z,
      backZ: bb.min.z,
      depth: bb.max.z - bb.min.z,
    };
    return this.bounds;
  }

  _prepareShaping() {
    for (const mesh of [this.blade, this.grip]) {
      if (!mesh) continue;
      const g = mesh.geometry;
      const p = g.attributes.position;
      // `aOrig` is the as-modelled position. The shader projects artwork from
      // it so the sticker does not crawl across the face when the blade
      // is reshaped.
      g.setAttribute('aOrig', new THREE.BufferAttribute(p.array.slice(), 3));
      mesh.userData.base = p.array.slice();
      mesh.userData.baseNormal = g.attributes.normal.array.slice();
    }
    this._measureCrossSections();
    this._buildNormalGroups();
  }

  /**
   * Index vertices that sit at the same point in space.
   *
   * The source blade carries 49,278 vertices for 24,640 triangles — four times
   * what a closed surface needs — because the FBX export split them almost
   * everywhere. Split vertices cannot share a normal, so `computeVertexNormals`
   * shades nearly every triangle as its own facet, and the blade reads as
   * faceted and rough however smooth the geometry underneath actually is.
   *
   * Grouping by position lets us average across those seams afterwards. The
   * groups are built once: identical positions get identical treatment from the
   * shaping, so vertices that are coincident now stay coincident.
   */
  _buildNormalGroups() {
    const base = this.blade.userData.base;
    const q = 1e-5;                               // ~2 µm at bat scale
    const buckets = new Map();

    for (let i = 0; i < base.length; i += 3) {
      const key = `${Math.round(base[i] / q)},${Math.round(base[i + 1] / q)},${Math.round(base[i + 2] / q)}`;
      const list = buckets.get(key);
      if (list) list.push(i / 3);
      else buckets.set(key, [i / 3]);
    }

    // Only groups with something to merge are worth keeping.
    this.normalGroups = [...buckets.values()].filter((g) => g.length > 1);
  }

  /**
   * Average normals across coincident vertices, but only where the surface is
   * genuinely continuous. Faces meeting at more than `SMOOTH_ANGLE` — the
   * corner between the blade's face and its edge, the rim of the toe — keep
   * their own normals, so hard edges stay hard.
   */
  _smoothNormals() {
    if (!this.normalGroups) return;
    const n = this.blade.geometry.attributes.normal;
    const a = n.array;
    const limit = Math.cos((SMOOTH_ANGLE * Math.PI) / 180);

    for (const group of this.normalGroups) {
      // Cluster the group's normals; each cluster becomes one shared normal.
      const clusters = [];
      for (const v of group) {
        const x = a[v * 3], y = a[v * 3 + 1], z = a[v * 3 + 2];
        let placed = false;
        for (const c of clusters) {
          if ((x * c.x + y * c.y + z * c.z) / (Math.hypot(c.x, c.y, c.z) || 1) >= limit) {
            c.x += x; c.y += y; c.z += z; c.members.push(v);
            placed = true;
            break;
          }
        }
        if (!placed) clusters.push({ x, y, z, members: [v] });
      }
      for (const c of clusters) {
        if (c.members.length < 2) continue;
        const len = Math.hypot(c.x, c.y, c.z) || 1;
        const nx = c.x / len, ny = c.y / len, nz = c.z / len;
        for (const v of c.members) {
          a[v * 3] = nx; a[v * 3 + 1] = ny; a[v * 3 + 2] = nz;
        }
      }
    }
    n.needsUpdate = true;
  }

  /**
   * Measure the blade's own cross-sections, sliced along its length.
   *
   * The station count matters more than it looks. Each station's figures are
   * maxima over the vertices that land in its slice, so slicing finer than the
   * mesh can fill leaves stations empty or decided by one stray vertex — and at
   * 192 stations that is exactly what happened: neighbouring readings swung by
   * 18 mm and every correction built on them was fighting noise. Forty-eight
   * gives each slice a few hundred vertices and a figure worth trusting.
   *
   * This is what lets the shaping stay honest. The first version scaled each
   * vertex's depth by a factor that fell off towards the edges, which — once the
   * factor dropped below 1 — pulled the middle of the back in faster than the
   * edges and turned the spine into a scoop. A cricket blade's back is always a
   * convex dome, so instead of moving vertices freely we measure the envelope
   * (spine depth and half-width at every station) and reshape *within* it.
   */
  _measureCrossSections(bins = 48) {
    const b = this.bounds;
    const p = this.blade.userData.base;

    const halfWidth = new Float32Array(bins);
    const faceZ = new Float32Array(bins).fill(-Infinity);
    const spineDepth = new Float32Array(bins);

    const binOf = (y) => {
      const t = (y - b.toeY) / b.bladeLength;
      return Math.max(0, Math.min(bins - 1, Math.floor(t * bins)));
    };

    for (let i = 0; i < p.length; i += 3) {
      const y = p[i + 1];
      if (y > b.shoulderY) continue;                 // blade only, not the stick
      const k = binOf(y);
      halfWidth[k] = Math.max(halfWidth[k], Math.abs(p[i]));
      faceZ[k] = Math.max(faceZ[k], p[i + 2]);
    }

    // Empty or degenerate bins would divide by zero further down.
    const patch = (arr, floor) => {
      for (let k = 0; k < bins; k++) {
        if (arr[k] > floor && Number.isFinite(arr[k])) continue;
        let lo = k, hi = k;
        while (lo > 0 && !(arr[lo] > floor)) lo--;
        while (hi < bins - 1 && !(arr[hi] > floor)) hi++;
        arr[k] = Math.max(arr[lo] || 0, arr[hi] || 0) || floor + 1e-4;
      }
    };
    patch(halfWidth, 1e-5);
    for (let k = 0; k < bins; k++) if (!Number.isFinite(faceZ[k])) faceZ[k] = b.faceZ;

    /*
     * Smooth these hard — much harder than looks necessary.
     *
     * Each station's figure is a *maximum* over the vertices that fell in its
     * slice, so it carries the sampling noise of the mesh. When the shaping
     * multiplies by them, that noise lands on the back surface, and over a blade
     * this long a few hundredths of a millimetre of wobble is enough to flip the
     * surface normal back and forth — which reads as banding, not as texture.
     *
     * A real blade's spine and width are smooth functions of length, so there is
     * nothing to lose by filtering aggressively. Endpoints are held so the toe
     * and shoulder do not creep.
     */
    const smooth = (arr, passes) => {
      for (let n = 0; n < passes; n++) {
        const copy = arr.slice();
        for (let k = 1; k < bins - 1; k++) {
          arr[k] = (copy[k - 1] + copy[k] * 2 + copy[k + 1]) / 4;
        }
      }
    };
    /*
     * Each of the three wants a different amount.
     *
     * `halfWidth` sets the toe arc, so it wants to be smooth.
     *
     * `faceZ` takes a lighter touch. It is the reference depth is measured from,
     * and a real blade's face is gently bowed along its length; over-smoothing
     * flattens that bow.
     *
     * The spine is kept twice — as measured, and as it ought to be — because the
     * ratio between them is what straightens the source's lumpy profile.
     */
    smooth(halfWidth, 5);
    smooth(faceZ, 2);

    // Depth is measured from the *smoothed* face, so every later comparison —
    // the reshape, the ratio below, `measureBlade` — is against the same datum.
    for (let i = 0; i < p.length; i += 3) {
      const y = p[i + 1];
      if (y > b.shoulderY) continue;
      const k = binOf(y);
      spineDepth[k] = Math.max(spineDepth[k], faceZ[k] - p[i + 2]);
    }
    patch(spineDepth, 1e-5);

    // The measured spine, barely filtered: what the mesh actually is.
    const spineActual = spineDepth.slice();
    smooth(spineActual, 1);

    /*
     * And the spine it ought to be.
     *
     * The source mesh's spine is not a smooth curve — it dips and swells by up
     * to 9 mm from station to station, which is what made the finished bat look
     * lumpy and hand-whittled rather than machined. A real blade tapers
     * smoothly from the swell to the toe.
     *
     * So we build an idealised profile by filtering the same curve, then put its
     * peak back where it was. Filtering flattens a peak, and scaling the curve
     * back up by that alone would deepen the whole blade — which is exactly the
     * trap that turned a 63 mm spine into a 90 mm one on the first attempt. The
     * bat keeps its own depth; only the lumps go.
     */
    const spineIdeal = spineDepth.slice();
    smooth(spineIdeal, 18);

    let peakActual = 0, peakIdeal = 0;
    for (let k = 0; k < bins; k++) {
      peakActual = Math.max(peakActual, spineActual[k]);
      peakIdeal = Math.max(peakIdeal, spineIdeal[k]);
    }
    const restore = peakIdeal > 1e-6 ? peakActual / peakIdeal : 1;
    for (let k = 0; k < bins; k++) spineIdeal[k] *= restore;

    this.section = { bins, halfWidth, faceZ, spineActual, spineIdeal };
  }

  /** Linear sample of a per-station array at t (0 = toe, 1 = shoulder). */
  _sample(arr, t) {
    const n = this.section.bins;
    const f = Math.max(0, Math.min(n - 1.001, t * n - 0.5));
    const i = Math.floor(f);
    const k = f - i;
    return arr[i] * (1 - k) + arr[Math.min(n - 1, i + 1)] * k;
  }

  /**
   * The finished blade's headline dimensions, in millimetres — the three
   * figures a bat is actually specified by, and the ones KIS's own product
   * photography quotes. Measured off the reshaped mesh, so they describe the
   * bat the customer is looking at rather than the one we started from.
   */
  measureBlade() {
    const b = this.bounds;
    const p = this.blade.geometry.attributes.position.array;
    const toMm = 1 / UNITS_PER_MM;

    let spine = 0, edge = 0, width = 0;
    const edgeBand = b.width * 0.42;      // out near the side, clear of the spine

    for (let i = 0; i < p.length; i += 3) {
      const y = p[i + 1];
      // Judge on the middle of the blade, where a bat is measured.
      const t = (y - b.toeY) / b.bladeLength;
      if (t < 0.30 || t > 0.60) continue;
      const depth = this._sample(this.section.faceZ, t) - p[i + 2];
      if (Math.abs(p[i]) < b.width * 0.10) spine = Math.max(spine, depth);
      if (Math.abs(p[i]) > edgeBand) edge = Math.max(edge, depth);
      width = Math.max(width, Math.abs(p[i]) * 2);
    }
    return {
      spineMm: +(spine * toMm).toFixed(0),
      edgeMm: +(edge * toMm).toFixed(0),
      widthMm: +(width * toMm * this.root.scale.x).toFixed(0),
    };
  }

  /**
   * Reshape the blade and handle from the configuration.
   *
   * @param {object} shape
   *   swell   0..1  where along the blade the wood sits (profile)
   *   spine   ~1    how proud the spine stands
   *   edge    ~1    edge thickness multiplier
   *   round   0..1  toe rounding
   *   oval    0..1  handle cross-section, round → oval
   *   mass    0..1  weight band; adds wood everywhere
   */
  applyShape(shape) {
    const b = this.bounds;
    const sec = this.section;
    const {
      swell = 0.5, spine = 1, edge = 1, round = 0,
      oval = 0, egg = 0, mass = 0.5, toeDrop = 0,
    } = shape;

    const massGain = 0.90 + mass * 0.22;

    /* ---------------- blade ---------------- */
    const g = this.blade.geometry;
    const pos = g.attributes.position;
    const base = this.blade.userData.base;

    /*
     * Displace the modelled surface; never rebuild it.
     *
     * An earlier version reconstructed each vertex from the measured station
     * envelope. That made every measurement error a surface error: filtering the
     * envelope hard enough to stop the back rippling also flattened the face's
     * real bow, which pushed the hitting face out of true by up to 3 mm and left
     * exactly the lumpy, faceted profile a bat must not have.
     *
     * So instead every option is a *gain on the depth a vertex already has*:
     *
     *     z = z0 + depth0 * (1 - gain)
     *
     * Two properties fall out of that shape, and they are the whole point:
     *
     *   - A vertex on the face has depth0 = 0, so it cannot move. The face stays
     *     exactly as modelled no matter what the customer picks, and no matter
     *     how noisy the reference is.
     *   - Reference error reaches the surface multiplied by (1 - gain), which is
     *     small. There is nothing left to amplify.
     *
     * `gain` is a smooth function of position, so the result is as smooth as the
     * mesh it started from.
     */
    for (let i = 0; i < pos.count; i++) {
      const x0 = base[i * 3], y0 = base[i * 3 + 1], z0 = base[i * 3 + 2];
      let x = x0, y = y0, z = z0;

      // t: 0 at the toe, 1 at the shoulder.
      const t = (y0 - b.toeY) / b.bladeLength;

      if (t <= 1.001) {
        const faceZ = this._sample(sec.faceZ, t);
        const halfWidth = this._sample(sec.halfWidth, t);
        const depth0 = Math.max(0, faceZ - z0);

        // Where the wood sits along the blade. Duckbill and toe-to-spine both
        // carry it low; a full profile sits mid-blade.
        const d = (t - swell) / 0.30;
        const bell = Math.exp(-d * d);

        // Edge thickness is a property of how far across the blade you are, so
        // that is what drives it: no change on the spine, full effect at the
        // side. The dome is scaled, never inverted.
        const across = Math.min(1, Math.abs(x0) / Math.max(1e-6, halfWidth));

        // Straighten the source's lumpy spine onto the idealised curve before
        // anything the customer chose is applied. Clamped, because near the toe
        // and the shoulder the measurement has little to work with and the
        // ratio would otherwise run away.
        const actual = this._sample(sec.spineActual, t);
        const ideal = this._sample(sec.spineIdeal, t);
        // Bounded, so a station with almost no depth to divide by cannot throw
        // a wild ratio at the surface.
        const trueUp = actual > 1e-5
          ? Math.max(0.80, Math.min(1.25, ideal / actual))
          : 1;

        let gain = trueUp
          * massGain
          * (1 + (spine - 1) * bell)
          * (1 + (edge - 1) * across * across);

        // Toe-to-spine keeps timber right down to the toe instead of tapering
        // away from it — the spine line runs off the end of the blade.
        if (toeDrop > 0.001 && t < 0.34) {
          const k = 1 - t / 0.34;
          gain *= 1 + toeDrop * k * k;
        }

        /* --- round toe -------------------------------------------------
           A round toe is not chamfered corners: the blade's outline runs
           out on a true arc of roughly its own half-width, which is what
           the reference photo shows. So we retarget the half-width over
           the last radius of the blade to that arc and scale x into it. */
        if (round > 0.001) {
          const radius = this._sample(sec.halfWidth, 0.06);
          // An ellipse, not a half-circle: a real round toe is shallower than
          // it is wide — the sides run almost to the bottom before turning.
          const arcHeight = radius * TOE_ARC_RATIO;
          const arcTop = b.toeY + arcHeight;
          if (y0 < arcTop) {
            const dy = (arcTop - y0) / arcHeight;
            const arcHalf = radius * Math.sqrt(Math.max(0, 1 - dy * dy));
            const ratio = Math.min(1, arcHalf / Math.max(1e-6, halfWidth));
            const pull = round * (1 - ratio);
            x = x0 * (1 - pull);
            // The cap rolls off in depth too, or the rounded outline would
            // finish on a knife edge.
            gain *= 1 - pull * 0.45;
          }
        }

        z = z0 + depth0 * (1 - gain);
      }

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    this._smoothNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();

    /* ---------------- handle ---------------- */
    if (this.grip) {
      const gg = this.grip.geometry;
      const gp = gg.attributes.position;
      const gbase = this.grip.userData.base;

      // Oval and semi-oval handles are deeper front-to-back — face to spine —
      // and narrower across. That axis is what resists the bat twisting in the
      // hands; widening it across the face (as the first version did) would do
      // the opposite.
      const sx = 1 - oval * 0.15;
      const sz = 1 + oval * 0.22;
      const cz = (b.faceZ + b.backZ) / 2;

      for (let i = 0; i < gp.count; i++) {
        const x = gbase[i * 3], y = gbase[i * 3 + 1], z = gbase[i * 3 + 2];
        let dz = (z - cz) * sz;
        // Semi-oval is the egg: full round on the face side, flatter behind.
        if (egg > 0.001 && dz < 0) dz *= 1 - egg * 0.30;
        gp.setXYZ(i, x * sx, y, cz + dz);
      }
      gp.needsUpdate = true;
      gg.computeVertexNormals();
      gg.computeBoundingBox();
      gg.computeBoundingSphere();
    }
  }

  /** Overall size of the finished bat (Short Handle, Harrow, …). */
  applyScale({ scale = 1 }) {
    this.root.scale.setScalar(scale);
    this.root.updateWorldMatrix(true, true);
  }

  setMaterials({ willow, grip }) {
    this.blade.material = willow;
    if (this.grip) this.grip.material = grip;
  }

  /**
   * Feed the shader the projection rectangle. It covers the blade only —
   * artwork has no business creeping up the handle.
   */
  configureProjection(uniforms) {
    const b = this.bounds;
    uniforms.uBatMinXY.value.set(b.min.x, b.toeY);
    uniforms.uBatSizeXY.value.set(b.width, b.bladeLength);
  }

  /** World-space directions of the bat's own X and Y, for the burn relief. */
  updateTangents(uniforms) {
    this.root.updateWorldMatrix(true, false);
    const m = new THREE.Matrix3().setFromMatrix4(this.root.matrixWorld);
    uniforms.uTanX.value.set(1, 0, 0).applyMatrix3(m).normalize();
    uniforms.uTanY.value.set(0, 1, 0).applyMatrix3(m).normalize();
  }
}

const count = (mesh) => mesh.geometry.attributes.position.count;

/**
 * The model's own axes, longest first, as a basis for THREE.Matrix4.makeBasis:
 * [width → X, length → Y, depth → Z].
 *
 * Covariance of the vertex cloud, diagonalised by cyclic Jacobi rotations. A
 * symmetric 3×3 converges in a handful of sweeps, so this costs nothing and
 * survives the model being re-exported at any orientation.
 */
function principalAxes(meshes) {
  let n = 0;
  const mean = [0, 0, 0];
  const each = (fn) => {
    for (const m of meshes) {
      const p = m.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) fn(p[i], p[i + 1], p[i + 2]);
    }
  };

  each((x, y, z) => { mean[0] += x; mean[1] += y; mean[2] += z; n++; });
  mean[0] /= n; mean[1] /= n; mean[2] /= n;

  const c = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  each((x, y, z) => {
    const d = [x - mean[0], y - mean[1], z - mean[2]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[i][j] += d[i] * d[j];
  });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[i][j] /= n;

  // Jacobi eigenvalue iteration. v accumulates the eigenvectors.
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 24; sweep++) {
    let off = 0;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) off += c[i][j] * c[i][j];
    if (off < 1e-16) break;
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 3; q++) {
        if (Math.abs(c[p][q]) < 1e-18) continue;
        const theta = (c[q][q] - c[p][p]) / (2 * c[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const cs = 1 / Math.sqrt(t * t + 1);
        const sn = t * cs;
        for (let k = 0; k < 3; k++) {
          const ckp = c[k][p], ckq = c[k][q];
          c[k][p] = cs * ckp - sn * ckq;
          c[k][q] = sn * ckp + cs * ckq;
        }
        for (let k = 0; k < 3; k++) {
          const cpk = c[p][k], cqk = c[q][k];
          c[p][k] = cs * cpk - sn * cqk;
          c[q][k] = sn * cpk + cs * cqk;
          const vkp = v[k][p], vkq = v[k][q];
          v[k][p] = cs * vkp - sn * vkq;
          v[k][q] = sn * vkp + cs * vkq;
        }
      }
    }
  }

  const order = [0, 1, 2].sort((a, b) => c[b][b] - c[a][a]);
  const vec = (i) => new THREE.Vector3(v[0][i], v[1][i], v[2][i]).normalize();
  const length = vec(order[0]);   // → Y
  const width = vec(order[1]);    // → X
  let depth = vec(order[2]);      // → Z

  // Guarantee a right-handed basis, or the bake mirrors the bat.
  if (new THREE.Vector3().crossVectors(width, length).dot(depth) < 0) depth.negate();
  return [width, length, depth];
}

/** Copy every attribute into its own tightly packed array. */
function flatten(geometry) {
  const out = new THREE.BufferGeometry();
  if (geometry.index) out.setIndex(geometry.index.clone());

  const readers = ['getX', 'getY', 'getZ', 'getW'];
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const { itemSize, count: n, normalized } = attr;
    const array = new Float32Array(n * itemSize);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < itemSize; k++) array[i * itemSize + k] = attr[readers[k]](i);
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, itemSize, normalized));
  }
  for (const g of geometry.groups) out.addGroup(g.start, g.count, g.materialIndex);
  return out;
}

/** Rubber grip. Colour is tinted at runtime, so five colours cost one texture. */
export function createGripMaterial(normalMap) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xededea,
    normalMap,
    normalScale: new THREE.Vector2(1.35, 1.35),
    roughness: 0.72,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xffffff),
  });
}
