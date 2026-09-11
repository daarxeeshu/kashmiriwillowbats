/**
 * The stage: renderer, camera, controls, lighting, and the render loop.
 *
 * Two decisions worth calling out:
 *
 *  1. Render on demand. A configurator is static most of the time. Running a
 *     60 fps loop over a still bat burns a phone battery for nothing, so we
 *     render only when something actually changes.
 *
 *  2. No HDR download. The environment is generated from RoomEnvironment and
 *     pre-filtered on the GPU, which gives image-based lighting for zero bytes.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export class Viewer {
  constructor(host) {
    this.host = host;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
    this.camera.position.set(0, 0, 9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.85;
    this.controls.panSpeed = 0.6;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 14;
    // Stop the customer ending up underneath the bat looking at nothing.
    this.controls.minPolarAngle = 0.18;
    this.controls.maxPolarAngle = Math.PI - 0.18;
    this.controls.addEventListener('change', () => this.invalidate());

    this._buildEnvironment();
    this._buildLights();
    this._buildGround();

    this.needsRender = true;
    this._tween = null;
    this._frames = 0;
    this._fpsAt = performance.now();
    this.onFps = null;

    this._onResize = this._onResize.bind(this);
    addEventListener('resize', this._onResize);
    this._ro = new ResizeObserver(this._onResize);
    this._ro.observe(host);
    this._onResize();

    this.renderer.setAnimationLoop(() => this._tick());
  }

  _buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = env.texture;
    this.scene.environmentIntensity = 0.72;
    pmrem.dispose();
  }

  _buildLights() {
    // A key that rakes across the face so the grain and the engraving read,
    // plus a cool rim to separate the bat from the background.
    const key = new THREE.DirectionalLight(0xfff4e2, 2.5);
    key.position.set(2.6, 4.2, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);
    this.key = key;

    const rim = new THREE.DirectionalLight(0xd8e6ff, 1.15);
    rim.position.set(-4, 1.5, -3.5);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-1.5, -2, 3);
    this.scene.add(fill);
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(30, 30);
    const mat = new THREE.ShadowMaterial({ opacity: 0.22 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
  }

  setGroundY(y) {
    this.ground.position.y = y;
    this.invalidate();
  }

  invalidate() { this.needsRender = true; }

  _onResize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  /**
   * Fly to a named view. Tweening the camera rather than snapping it is what
   * makes "look at the engraving" feel like inspecting a real bat.
   */
  flyTo({ position, target, fov }, ms = 780) {
    this._tween = {
      t: 0, ms,
      fromPos: this.camera.position.clone(),
      toPos: new THREE.Vector3().fromArray(position),
      fromTar: this.controls.target.clone(),
      toTar: new THREE.Vector3().fromArray(target),
      fromFov: this.camera.fov,
      toFov: fov ?? this.camera.fov,
      start: performance.now(),
    };
    this.invalidate();
  }

  _tick() {
    const now = performance.now();

    if (this._tween) {
      const k = Math.min(1, (now - this._tween.start) / this._tween.ms);
      // easeInOutCubic — settles without overshoot, reads as a camera move
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(this._tween.fromPos, this._tween.toPos, e);
      this.controls.target.lerpVectors(this._tween.fromTar, this._tween.toTar, e);
      this.camera.fov = this._tween.fromFov + (this._tween.toFov - this._tween.fromFov) * e;
      this.camera.updateProjectionMatrix();
      if (k >= 1) this._tween = null;
      this.needsRender = true;
    }

    if (this.controls.update()) this.needsRender = true;

    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
      this._frames++;
    }

    if (now - this._fpsAt > 500) {
      const fps = (this._frames * 1000) / (now - this._fpsAt);
      this._frames = 0;
      this._fpsAt = now;
      if (this.onFps) this.onFps(fps);
    }
  }

  dispose() {
    removeEventListener('resize', this._onResize);
    this._ro.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
