/**
 * Dragging the engraving around the blade.
 *
 * The preset positions (above the toe, below the sticker, on the spine) are
 * shortcuts, not the whole story — a customer who wants their name off to one
 * side, or higher up the blade, should be able to just move it. So the mark is
 * grabbable: press on it and drag, and it follows the surface under the pointer.
 *
 * The hit point comes back in world space; converting it to the same projected
 * face coordinates the shader uses is what keeps the mark under the cursor
 * however the bat is rotated.
 */
import * as THREE from 'three';

export class PlacementController {
  /**
   * @param opts.viewer   the Viewer (for camera, controls, canvas)
   * @param opts.bat      the BatModel
   * @param opts.uniforms the willow material's uniforms
   * @param opts.getMark  () => {rect:[u0,v0,u1,v1], face} | null
   * @param opts.onMove   ({u, v, face}) => void
   * @param opts.onEnd    () => void
   */
  constructor(opts) {
    Object.assign(this, opts);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragging = false;
    this.armed = false;
    this.grabOffset = { u: 0, v: 0 };

    const el = this.viewer.renderer.domElement;
    this._down = this.onDown.bind(this);
    this._move = this.onMove_.bind(this);
    this._up = this.onUp.bind(this);
    el.addEventListener('pointerdown', this._down);
    el.addEventListener('pointermove', this._move);
    addEventListener('pointerup', this._up);
    el.addEventListener('pointerleave', () => { if (!this.dragging) this.setArmed(false); });
  }

  /** Where on the blade is the pointer, in projected face coordinates? */
  probe(event) {
    const el = this.viewer.renderer.domElement;
    const r = el.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewer.camera);
    const hits = this.raycaster.intersectObject(this.bat.blade, false);
    if (!hits.length) return null;

    const hit = hits[0];
    // Back into the bat's own space, then into the projection rectangle.
    const local = this.bat.root.worldToLocal(hit.point.clone());
    const b = this.bat.bounds;
    const u = (local.x - b.min.x) / b.width;
    const v = 1 - (local.y - b.toeY) / b.bladeLength;

    // Which side did we land on? The face normal decides, in bat space.
    const n = hit.face
      ? hit.face.normal.clone().applyMatrix3(
          new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld),
        )
      : null;
    const localNormal = hit.face ? hit.face.normal : null;
    const face = localNormal && localNormal.z < 0 ? 'back' : 'front';

    return { u: face === 'back' ? 1 - u : u, v, face, point: hit.point, worldNormal: n };
  }

  setArmed(on) {
    if (this.armed === on) return;
    this.armed = on;
    if (!this.dragging) {
      this.uniforms.uMarkOn.value = on ? 1 : 0;
      this.viewer.renderer.domElement.style.cursor = on ? 'grab' : '';
      this.viewer.invalidate();
    }
  }

  /** Is this projected point inside the current mark, with a little slack? */
  overMark(probe) {
    const mark = this.getMark();
    if (!mark || probe.face !== mark.face) return false;
    const [u0, v0, u1, v1] = mark.rect;
    const pad = 0.03;
    return probe.u > u0 - pad && probe.u < u1 + pad
        && probe.v > v0 - pad && probe.v < v1 + pad;
  }

  onDown(event) {
    if (event.button !== 0) return;
    const probe = this.probe(event);
    if (!probe || !this.overMark(probe)) return;

    const mark = this.getMark();
    // Grab from wherever they took hold, so the mark does not jump to the
    // cursor on the first pixel of movement.
    this.grabOffset = {
      u: probe.u - (mark.rect[0] + mark.rect[2]) / 2,
      v: probe.v - (mark.rect[1] + mark.rect[3]) / 2,
    };

    this.dragging = true;
    this.uniforms.uMarkOn.value = 2;
    this.viewer.controls.enabled = false;      // orbit must not fight the drag
    this.viewer.renderer.domElement.style.cursor = 'grabbing';
    // Capture keeps the drag alive if the pointer leaves the canvas. It throws
    // on an id the browser never issued, which synthetic events have.
    try { this.viewer.renderer.domElement.setPointerCapture(event.pointerId); } catch {}
    event.preventDefault();
  }

  onMove_(event) {
    if (!this.dragging) {
      const probe = this.probe(event);
      this.setArmed(!!probe && this.overMark(probe));
      return;
    }
    const probe = this.probe(event);
    if (!probe) return;
    // v in the shader runs from the shoulder down; the config stores it from
    // the toe up, which is how the workshop measures.
    this.onMove({
      u: probe.u - this.grabOffset.u,
      v: 1 - (probe.v - this.grabOffset.v),
      face: probe.face,
    });
  }

  onUp(event) {
    if (!this.dragging) return;
    this.dragging = false;
    this.viewer.controls.enabled = true;
    this.uniforms.uMarkOn.value = this.armed ? 1 : 0;
    this.viewer.renderer.domElement.style.cursor = this.armed ? 'grab' : '';
    try { this.viewer.renderer.domElement.releasePointerCapture(event.pointerId); } catch {}
    this.onEnd?.();
    this.viewer.invalidate();
  }

  /** Keep the shader's marker in step with the laid-out engraving. */
  syncMark() {
    const mark = this.getMark();
    if (!mark) {
      if (!this.dragging) this.uniforms.uMarkOn.value = 0;
      return;
    }
    this.uniforms.uMarkRect.value.set(...mark.rect);
  }

  dispose() {
    const el = this.viewer.renderer.domElement;
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointermove', this._move);
    removeEventListener('pointerup', this._up);
  }
}
