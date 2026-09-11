/**
 * The willow material.
 *
 * The system we reverse-engineered bakes the sticker into the blade's colour map
 * and swaps whole 3 MB textures, which is why it can show four fixed designs and
 * can never show a customer's name. We do the opposite: the blade keeps a plain
 * grain map, and the sticker and the engraving are *projected onto it* in the
 * shader from two live canvases.
 *
 * The projection is planar along the bat's local Z — which is exactly how a
 * laser and a sticker press meet a real blade, straight onto the face — so it
 * needs no second UV set and no decal geometry.
 *
 * Engraving is not drawn as dark paint. A laser burns wood: the surface loses
 * its sheen, darkens towards a scorched umber, and sits fractionally below the
 * face. So the burn signal drives albedo, roughness *and* a normal perturbation
 * derived from its own gradient. That third term is what stops it reading as a
 * sticker of some text.
 */
import * as THREE from 'three';

const PARS = /* glsl */`
  uniform sampler2D uDecal;      // sticker artwork, RGBA, projected on the face
  uniform sampler2D uEngrave;    // R = burn amount, G = rim, projected on the face
  uniform sampler2D uDecalBack;
  uniform sampler2D uEngraveBack;
  uniform vec2  uBatMinXY;       // bat-space origin of the projection rect
  uniform vec2  uBatSizeXY;      // bat-space size of the projection rect
  uniform float uDecalOn;
  uniform float uEngraveOn;
  uniform float uBurnDepth;      // how hard the laser was driven, 0..1
  uniform vec3  uBurnColour;
  uniform vec3  uTanX;           // bat local +X, in world space
  uniform vec3  uTanY;           // bat local +Y, in world space
  uniform float uGrainTint;
  uniform vec4  uMarkRect;       // u0, v0, u1, v1 in projected face space
  uniform float uMarkOn;         // 0 hidden, 1 armed, 2 being dragged
  uniform vec3  uMarkColour;

  varying vec3 vBatPos;
  varying vec3 vBatNrm;

  // Projected coordinates on the face (front) or the spine (back).
  vec2 kisProject(bool back) {
    float u = (vBatPos.x - uBatMinXY.x) / uBatSizeXY.x;
    float v = 1.0 - (vBatPos.y - uBatMinXY.y) / uBatSizeXY.y;
    if (back) u = 1.0 - u;              // mirrored, we are looking from behind
    return vec2(u, v);
  }

  // How squarely this fragment faces the press. Feathered so the artwork dies
  // away around the edges of the blade instead of smearing down the sides.
  float kisFacing(bool back) {
    float n = back ? -vBatNrm.z : vBatNrm.z;
    return smoothstep(0.25, 0.62, n);
  }
`;

const VERTEX_HEAD = /* glsl */`
  attribute vec3 aOrig;
  varying vec3 vBatPos;
  varying vec3 vBatNrm;
`;

/**
 * Projection reads from `aOrig`, the vertex position as modelled, not the
 * shaped one. The blade is reshaped on the CPU when the profile or edge
 * changes; without this the artwork would slide across the face every time.
 */
const VERTEX_BODY = /* glsl */`
  vBatPos = aOrig;
  vBatNrm = normalize(normal);
`;

/**
 * Every texture read happens here, unconditionally.
 *
 * This is deliberate and load-bearing. Sampling inside `if (inside) { … }` puts
 * the fetch in non-uniform control flow, where the implicit derivatives that
 * pick the mip level are undefined — the hardware then reads a near-1×1 mip and
 * the engraved letters melt into a single dark slab. Sampling first and masking
 * afterwards costs a few fetches on fragments that discard the result, and
 * keeps the text legible.
 */
const COLOUR_BODY = /* glsl */`
  {
    vec2 pf = kisProject(false);
    vec2 pb = kisProject(true);

    vec4 decalF = texture2D(uDecal, pf);
    vec4 decalB = texture2D(uDecalBack, pb);
    float burnF = texture2D(uEngrave, pf).r;
    float burnB = texture2D(uEngraveBack, pb).r;

    // Slope of the burn on each face, for the relief of the cut. Sampled here
    // rather than in the normal chunk for the same non-uniform-flow reason.
    float e = 1.0 / 640.0;
    vec2 gradFront = vec2(
      texture2D(uEngrave, pf + vec2(e, 0.0)).r - texture2D(uEngrave, pf - vec2(e, 0.0)).r,
      texture2D(uEngrave, pf + vec2(0.0, e)).r - texture2D(uEngrave, pf - vec2(0.0, e)).r
    );
    vec2 gradBack = vec2(
      texture2D(uEngraveBack, pb + vec2(e, 0.0)).r - texture2D(uEngraveBack, pb - vec2(e, 0.0)).r,
      texture2D(uEngraveBack, pb + vec2(0.0, e)).r - texture2D(uEngraveBack, pb - vec2(0.0, e)).r
    );

    float ff = kisFacing(false);
    float fb = kisFacing(true);
    float inside = step(0.0, pf.x) * step(pf.x, 1.0) * step(0.0, pf.y) * step(pf.y, 1.0);

    // Subtle warmth so grade changes read even before the sticker goes on.
    diffuseColor.rgb *= mix(vec3(1.0), vec3(1.06, 1.0, 0.92), uGrainTint);

    // ---- sticker ---------------------------------------------------
    vec4 d = decalF * ff;
    vec4 db = decalB * fb;
    d = mix(d, db, step(d.a, db.a) * step(0.001, db.a));
    float da = d.a * uDecalOn * inside;
    diffuseColor.rgb = mix(diffuseColor.rgb, d.rgb, da);
    vStickerAlpha = da;

    // ---- laser burn ------------------------------------------------
    float burn = max(burnF * ff, burnB * fb) * uEngraveOn * uBurnDepth * inside;

    // Darken *multiplicatively* rather than replacing the colour. A laser chars
    // the surface of the grain, it does not paint over it — so the figure of the
    // willow still runs through the letter, which is the detail that separates a
    // burn from a black decal. The shoulder of the cut stays tan; the core goes
    // almost to charcoal, so the signal is squared before it bites.
    float core = burn * burn;
    vec3 char_ = mix(uBurnColour, uBurnColour * 0.30, core);
    diffuseColor.rgb *= mix(vec3(1.0), char_, clamp(burn * 1.25, 0.0, 1.0));
    vBurn = burn;

    // The relief has to be masked by which face you are looking at, exactly as
    // the colour is. Without this the front's engraving embosses a ghost of
    // itself through to the spine — the burn map is projected straight through
    // the blade, so a fragment on the back samples the front's letters too.
    //
    // The back projection mirrors u, so its slope across the blade runs the
    // opposite way in bat space and has to be negated to match.
    vBurnGrad = (gradFront * ff + vec2(-gradBack.x, gradBack.y) * fb)
      * uEngraveOn * inside;

    // ---- placement marker -------------------------------------------
    // Shows the customer where the laser will run before it runs, and gives
    // them something to grab. Drawn on the face the mark belongs to.
    if (uMarkOn > 0.5) {
      vec2 mp = (uEngraveOn > 0.5 && fb > ff) ? pb : pf;
      float onFace = max(ff, fb) * inside;
      vec2 lo = uMarkRect.xy, hi = uMarkRect.zw;
      float insideRect =
        step(lo.x, mp.x) * step(mp.x, hi.x) *
        step(lo.y, mp.y) * step(mp.y, hi.y);
      float edgeDist = min(
        min(mp.x - lo.x, hi.x - mp.x) * uBatSizeXY.x,
        min(mp.y - lo.y, hi.y - mp.y) * uBatSizeXY.y
      );
      float border = 1.0 - smoothstep(0.0, 0.006, edgeDist);
      float fill = insideRect * (uMarkOn > 1.5 ? 0.16 : 0.08);
      float line = insideRect * border * (uMarkOn > 1.5 ? 0.95 : 0.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, uMarkColour, (fill + line) * onFace);
    }
  }
`;

const ROUGH_BODY = /* glsl */`
  // Burnt wood is dead matte; the sticker is a printed, laminated film.
  roughnessFactor = mix(roughnessFactor, 0.94, vBurn);
  roughnessFactor = mix(roughnessFactor, 0.24, vStickerAlpha);
`;

// Gradients were sampled above, outside any branch; here we only use them.
// The cut is a depression, so its walls lean *into* the letter.
const NORMAL_BODY = /* glsl */`
  normal = normalize(normal
    + (uTanX * vBurnGrad.x - uTanY * vBurnGrad.y) * uBurnDepth * 5.5);
`;

export function createWillowMaterial({ colourMap, normalMap }) {
  const material = new THREE.MeshPhysicalMaterial({
    map: colourMap,
    normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.52,
    metalness: 0.0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.5,
    color: 0xffffff,
  });

  const blank = blankTexture();

  const uniforms = {
    uDecal: { value: blank },
    uEngrave: { value: blank },
    uDecalBack: { value: blank },
    uEngraveBack: { value: blank },
    uBatMinXY: { value: new THREE.Vector2(-0.5, -3) },
    uBatSizeXY: { value: new THREE.Vector2(1, 4) },
    uDecalOn: { value: 1 },
    uEngraveOn: { value: 1 },
    uBurnDepth: { value: 0.75 },
    uBurnColour: { value: new THREE.Color('#2e1a0b').convertSRGBToLinear() },
    uTanX: { value: new THREE.Vector3(1, 0, 0) },
    uTanY: { value: new THREE.Vector3(0, 1, 0) },
    uGrainTint: { value: 0.4 },
    uMarkRect: { value: new THREE.Vector4(0.4, 0.8, 0.6, 0.9) },
    uMarkOn: { value: 0 },
    uMarkColour: { value: new THREE.Color('#2f7ad6').convertSRGBToLinear() },
  };

  material.userData.uniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_BODY}`);

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${PARS}\nfloat vBurn = 0.0;\nfloat vStickerAlpha = 0.0;\nvec2 vBurnGrad = vec2(0.0);`,
      )
      .replace('#include <map_fragment>', `#include <map_fragment>\n${COLOUR_BODY}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${ROUGH_BODY}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${NORMAL_BODY}`);

    material.userData.shader = shader;
  };

  // Any change to the injected source needs a distinct cache key or three.js
  // hands back the previously compiled program.
  material.customProgramCacheKey = () => 'kis-willow-v6';

  return material;
}

function blankTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 2, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
