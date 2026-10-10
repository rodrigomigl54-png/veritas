// The cinematic 3D intro:
//   Shot 1  drone flight between vine rows at golden hour (~3.5 s)
//   Shot 2  sharp rise into the dusk sky, a branded oak barrel appears (~1.5 s)
//   Shot 3  the barrel pours wine into two crystal glasses — the pour IS the loader (≥ 2 s)
//   Shot 4  the glasses rise and clink; gold flash + sparks → `onContact` (the logo reveal is HTML)
import * as THREE from 'three';
import { createVineyard, terrainHeight } from './vineyard.js';
import { createSky, createBarrel, createGlasses, createStream, createDroplets, createSparks, GLASS_RIM_Y } from './props.js';
import { createPost } from './post.js';
import { detectTier } from './quality.js';

const FLIGHT = 3.5;
const RISE = 1.5;
const MIN_POUR = 2.6; // whole pour (both glasses); each glass ≥ 1.3 s
const TOAST = 2.0;
const CONTACT_AT = 0.95; // seconds into the toast

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ logoImage?: HTMLImageElement, progress: () => number, manager: THREE.LoadingManager,
 *           onPercent: (p: number, visible: boolean) => void, onContact: (screen: {x:number,y:number}) => void,
 *           onClink?: () => void, forceTier?: string }} o
 */
export function createIntroScene(canvas, o) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  const gl = renderer.getContext();
  const detected = detectTier(gl);
  const tier = o.forceTier === 'high' || o.forceTier === 'low' ? o.forceTier : detected.tier;
  const high = tier === 'high';

  let dprCap = high ? 2 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#D9A46C');
  scene.fog = new THREE.FogExp2(fogColor, 0.0085);
  scene.background = fogColor;

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 2000);
  const time = { value: 0 };

  // ---------- Environment (warm studio from a procedural sky — used for glass reflections) ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = createSky();
  envScene.add(envSky);
  const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.4, 3), side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), panelMat);
  panel.position.set(160, 120, 300);
  panel.lookAt(0, 0, 0);
  const panel2 = panel.clone();
  panel2.position.set(-260, 60, -200);
  panel2.lookAt(0, 0, 0);
  envScene.add(panel, panel2);
  const envRT = pmrem.fromScene(envScene, 0.02);
  const envMap = envRT.texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;

  // ---------- World ----------
  const sky = createSky();
  scene.add(sky);
  const vineyard = createVineyard({ tier, maxAniso, time });
  scene.add(vineyard.group);

  const sunDir = new THREE.Vector3(0.62, 0.05, -1).normalize();
  const sun = new THREE.DirectionalLight(new THREE.Color('#FFC27A'), 3.4);
  sun.castShadow = high;
  if (high) {
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -22;
    sc.right = 22;
    sc.top = 22;
    sc.bottom = -22;
    sc.near = 1;
    sc.far = 260;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
  }
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(new THREE.Color('#F2C894'), new THREE.Color('#3B2A1C'), 0.9);
  scene.add(hemi);

  // ---------- Sky set (barrel + glasses), high above the end of the flight ----------
  const SET = new THREE.Vector3(0, 82, -78);
  const set = new THREE.Group();
  set.position.copy(SET);
  scene.add(set);

  const barrel = createBarrel({ logoImage: o.logoImage, maxAniso });
  const barrelHome = new THREE.Vector3(0, 1.05, -0.3);
  barrel.object.position.copy(barrelHome);
  const BARREL_YAW = -0.62; // turned so the staves, hoops and the branded head all read
  barrel.object.rotation.y = BARREL_YAW;
  set.add(barrel.object);

  const glasses = createGlasses({ tier, envMap, timeUniform: time });
  const GS = 1.7; // glass scale — the glasses are the heroes of the shot
  const GL_X = 0.215 * GS;
  const GL_Y = -0.2; // pivot (bowl centre) height in the set
  const GL_Z = 0.42;
  glasses.left.pivot.scale.setScalar(GS);
  glasses.right.pivot.scale.setScalar(GS);
  glasses.left.pivot.position.set(-GL_X, GL_Y, GL_Z);
  glasses.right.pivot.position.set(GL_X, GL_Y, GL_Z);
  set.add(glasses.left.pivot, glasses.right.pivot);

  const streamMat = glasses.wineMat.clone();
  streamMat.clippingPlanes = null;
  streamMat.emissive = new THREE.Color('#3a0410');
  const stream = createStream(streamMat);
  scene.add(stream.mesh);
  const droplets = createDroplets(streamMat);
  scene.add(droplets.mesh);
  const sparks = createSparks(high ? 320 : 160);
  scene.add(sparks.points);

  const keyLight = new THREE.PointLight(new THREE.Color('#FFD9A0'), 0, 8, 1.6);
  keyLight.position.copy(SET).add(new THREE.Vector3(1.4, 1.6, 2.2));
  const flashLight = new THREE.PointLight(new THREE.Color('#FFE2A8'), 0, 4, 2);
  scene.add(keyLight, flashLight);

  const post = high ? createPost(renderer, { samples: 4 }) : null;

  // ---------- Camera path ----------
  const camStart = new THREE.Vector3(0, 0, 10);
  const flightSpeed = 15; // m/s
  const flightEnd = new THREE.Vector3(0, 0, camStart.z - flightSpeed * FLIGHT);
  const setCam = () => {
    const portrait = camera.aspect < 0.9;
    return {
      pos: SET.clone().add(new THREE.Vector3(0, -0.45, portrait ? 7.6 : 6.0)),
      look: SET.clone().add(new THREE.Vector3(0, 0.42, 0)),
      fov: portrait ? 44 : 32,
    };
  };
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  const qC = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  const lookQ = (from, to, roll = 0, out = new THREE.Quaternion()) => {
    m4.lookAt(from, to, up);
    out.setFromRotationMatrix(m4);
    if (roll) out.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
    return out;
  };

  const flightPose = (t) => {
    const z = camStart.z - flightSpeed * t;
    const x = Math.sin(t * 1.35) * 0.22 + Math.sin(t * 3.1) * 0.05;
    const y = terrainHeight(x, z) + 1.75 + Math.sin(t * 2.2) * 0.06;
    const pos = new THREE.Vector3(x, y, z);
    const look = new THREE.Vector3(x * 0.4, terrainHeight(0, z - 12) + 1.55, z - 12);
    const roll = Math.sin(t * 1.35 + 0.6) * 0.035;
    return { pos, look, roll };
  };

  // ---------- State ----------
  let phase = 'flight';
  let phaseT = 0;
  let elapsed = 0;
  let pourShown = 0; // displayed (smoothed) progress 0..1
  let percentY = null;
  let contactDone = false;
  let stopped = false;
  let raf = 0;
  let last = performance.now();
  let frames = 0;
  let slowFrames = 0;
  let degraded = 0;
  const v = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const prevCam = new THREE.Vector3();

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (post) {
      const s = renderer.getDrawingBufferSize(new THREE.Vector2());
      post.setSize(s.x, s.y);
    }
  };
  window.addEventListener('resize', resize);

  // Automatic degradation if the GPU struggles (first seconds).
  const adapt = (dt) => {
    frames++;
    if (dt > 1 / 40) slowFrames++;
    if (frames % 45 !== 0 || degraded >= 2) return;
    if (slowFrames > 22) {
      degraded++;
      if (degraded === 1) {
        dprCap = 1;
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        sun.castShadow = false;
        resize();
      } else {
        vineyard.degrade();
      }
    }
    slowFrames = 0;
  };

  const updateSun = () => {
    // Shadow camera follows the drone; the sun stays low ahead of us (long shadows towards camera).
    sun.target.position.copy(camera.position).add(new THREE.Vector3(0, -2, -14));
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 120);
    sun.target.updateMatrixWorld();
  };

  // ---------- Shots ----------
  const shotFlight = (t) => {
    const p = flightPose(t);
    camera.position.copy(p.pos);
    lookQ(p.pos, p.look, p.roll, camera.quaternion);
    camera.fov = 55;
  };

  const shotRise = (t) => {
    const k = clamp01(t / RISE);
    const start = flightPose(FLIGHT);
    const end = setCam();
    // Position: strong ease-in-out climb, keeps drifting forward.
    const e = easeInOut(k);
    camera.position.set(lerp(start.pos.x, end.pos.x, e), lerp(start.pos.y, end.pos.y, e), lerp(start.pos.z, end.pos.z, easeOut(k)));
    // Orientation: pitch up sharply into the sky, then settle on the barrel.
    lookQ(start.pos, start.look, start.roll, qA);
    qB.copy(lookQ(camera.position, camera.position.clone().add(new THREE.Vector3(0, 3, -1.2)), 0));
    lookQ(camera.position, end.look, 0, qC);
    if (k < 0.5) camera.quaternion.slerpQuaternions(qA, qB, easeInOut(k / 0.5));
    else camera.quaternion.slerpQuaternions(qB, qC, easeInOut((k - 0.5) / 0.5));
    camera.fov = lerp(55, end.fov, e);
    scene.fog.density = lerp(0.0085, 0.0045, e);
    keyLight.intensity = lerp(0, 6, e);
  };

  const holdSetCam = (push = 0) => {
    const end = setCam();
    const toward = end.look.clone().sub(end.pos).normalize();
    camera.position.copy(end.pos).addScaledVector(toward, push);
    camera.position.y += Math.sin(elapsed * 0.9) * 0.02;
    lookQ(camera.position, end.look, 0, camera.quaternion);
    camera.fov = end.fov;
  };

  const pourTarget = (gl) => glasses.surfaceWorld(gl, v2).clone();

  // Sequential pour: the barrel fills the LEFT glass first, the stream stops, the barrel moves over
  // the RIGHT glass and fills it. The pour is the loader: 0–50 % = left glass, 50–100 % = right glass.
  // Wine only rises while the stream is actually running.
  let side = 0; // animated barrel position: 0 = over the left glass, 1 = over the right glass
  let tilt = 0;
  const shotPour = (t, dt) => {
    holdSetCam(Math.min(t, 4) * 0.08);
    const real = clamp01(o.progress());
    const tiltIn = clamp01(t / 0.55);
    const targetSide = pourShown < 0.4999 ? 0 : 1;
    const step = dt / 0.8; // ~0.8 s to travel between the glasses
    side += THREE.MathUtils.clamp(targetSide - side, -step, step);
    const settled = Math.abs(side - targetSide) < 1e-3;
    const halfEnd = targetSide === 0 ? 0.5 : 1;
    const canPour = tiltIn >= 1 && settled;
    // Each glass takes at least MIN_POUR / 2; never faster than the real loading.
    if (canPour) pourShown = Math.min(real, halfEnd, pourShown + dt / MIN_POUR);
    const pouring = canPour && pourShown < halfEnd - 1e-4;
    o.onPercent(pourShown, true, percentY);

    // Tilt forward to pour, ease back a little while travelling to the second glass.
    const tiltTarget = tiltIn < 1 ? easeOut(tiltIn) * 0.34 : settled ? 0.34 : 0.14;
    tilt += (tiltTarget - tilt) * Math.min(1, dt * 6);
    const sideE = easeInOut(side);
    barrel.object.rotation.x = tilt;
    barrel.object.position.y = barrelHome.y + Math.sin(elapsed * 1.2) * 0.02;
    barrel.object.rotation.z = (sideE - 0.5) * 0.05;
    barrel.object.rotation.y = BARREL_YAW + (sideE - 0.5) * 0.1;
    // Keep the tap exactly above the glass being filled.
    barrel.object.position.x = 0;
    barrel.object.updateWorldMatrix(true, true);
    const tapW = barrel.tapTip.getWorldPosition(v);
    barrel.object.position.x = SET.x + lerp(-GL_X, GL_X, sideE) - tapW.x;

    glasses.left.fill = clamp01(pourShown * 2);
    glasses.right.fill = clamp01(pourShown * 2 - 1);
    // A little slosh in the glass that is being filled.
    const active = targetSide === 0 ? glasses.left : glasses.right;
    if (pouring) active.sloshV += (Math.random() - 0.5) * dt * 3;

    stream.mesh.visible = pouring;
    if (pouring) {
      barrel.tapTip.updateWorldMatrix(true, false);
      const from = barrel.tapTip.getWorldPosition(v).clone();
      const to = pourTarget(active);
      stream.update(from, to, 0.016, elapsed);
      droplets.spawn(to, high ? 2 : 1);
    }
    return tiltIn >= 1 && pourShown >= 0.999 && t > MIN_POUR;
  };

  const toastStart = { left: new THREE.Vector3(), right: new THREE.Vector3() };
  const shotToast = (t, dt) => {
    holdSetCam(0.32 + easeInOut(clamp01(t / TOAST)) * 0.7);
    o.onPercent(1, false);
    stream.mesh.visible = false;
    // Barrel leaves the frame upwards.
    const b = clamp01(t / 0.7);
    barrel.object.position.y = barrelHome.y + easeIn(b) * 3.2;
    barrel.object.rotation.x = 0.32 * (1 - b);
    barrel.object.position.x *= 1 - b * 0.2;

    // Glasses rise and tilt towards each other, rims touch at CONTACT_AT.
    const a = clamp01(t / CONTACT_AT);
    const ea = easeInOut(a);
    const tilt = 0.3 * ea;
    // Rim offset from the pivot after tilting (pivot = bowl centre, rim 0.155 above it).
    const rimDx = (0.126 * Math.cos(tilt) + (GLASS_RIM_Y - 0.4) * Math.sin(tilt)) * GS;
    const contactX = rimDx;
    let bounce = 0;
    if (t > CONTACT_AT) {
      const s = t - CONTACT_AT;
      bounce = Math.sin(s * 22) * Math.exp(-s * 7) * 0.012 + (1 - Math.exp(-s * 4)) * 0.03;
    }
    const lx = lerp(toastStart.left.x, -contactX, ea) - bounce;
    const rx = lerp(toastStart.right.x, contactX, ea) + bounce;
    const ly = toastStart.left.y + ea * 0.3;
    glasses.left.pivot.position.set(lx, ly, GL_Z);
    glasses.right.pivot.position.set(rx, ly, GL_Z);
    glasses.left.pivot.rotation.z = -tilt;
    glasses.right.pivot.rotation.z = tilt;

    if (!contactDone && t >= CONTACT_AT) {
      contactDone = true;
      glasses.left.sloshV += 2.8;
      glasses.right.sloshV -= 2.8;
      const contact = glasses.rimWorld(glasses.left, new THREE.Vector3());
      contact.x = SET.x;
      contact.y += Math.sin(tilt) * 0.0;
      sparks.burst(contact);
      flashLight.position.copy(contact);
      flashT = 0;
      o.onClink?.();
      const ndc = contact.clone().project(camera);
      o.onContact({ x: (ndc.x * 0.5 + 0.5) * window.innerWidth, y: (-ndc.y * 0.5 + 0.5) * window.innerHeight });
    }
    return t >= TOAST;
  };

  let flashT = 99;
  const updateFlash = (dt) => {
    flashT += dt;
    const f = flashT < 0.08 ? flashT / 0.08 : Math.exp(-(flashT - 0.08) * 6);
    flashLight.intensity = flashT < 3 ? f * 22 : 0;
    if (post) post.uniforms.uFlash.value = flashT < 3 ? f * 0.35 : 0;
  };

  // ---------- Loop ----------
  const frame = (now) => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    // The timeline follows wall-clock time (shots keep their duration on slow GPUs);
    // physics uses a clamped step.
    const realDt = Math.min(0.25, (now - last) / 1000);
    const dt = Math.min(0.05, realDt);
    last = now;
    elapsed += realDt;
    phaseT += realDt;
    time.value = elapsed;
    if (elapsed > 0.5 && elapsed < 6) adapt(realDt);

    if (phase === 'flight') {
      shotFlight(phaseT);
      if (phaseT >= FLIGHT) {
        phase = 'rise';
        phaseT = 0;
      }
    } else if (phase === 'rise') {
      shotRise(phaseT);
      if (phaseT >= RISE) {
        phase = 'pour';
        phaseT = 0;
      }
    } else if (phase === 'pour') {
      if (shotPour(phaseT, realDt)) {
        phase = 'toast';
        phaseT = 0;
        toastStart.left.copy(glasses.left.pivot.position);
        toastStart.right.copy(glasses.right.pivot.position);
      }
    } else if (phase === 'toast') {
      if (shotToast(phaseT, dt)) phase = 'hold';
    } else if (phase === 'hold') {
      holdSetCam(1.02 + phaseT * 0.05);
    }

    camera.updateProjectionMatrix();
    sky.position.copy(camera.position);
    updateSun();
    glasses.updateLiquid(glasses.left, dt);
    glasses.updateLiquid(glasses.right, dt);
    droplets.update(dt, SET.y + GL_Y - 0.5);
    if (phase === 'pour') {
      // Keep the percentage just below the glasses' feet.
      v.set(SET.x, SET.y + GL_Y - 0.4 * GS - 0.06, SET.z + GL_Z).project(camera);
      percentY = (-v.y * 0.5 + 0.5) * window.innerHeight;
    }
    sparks.update(dt);
    updateFlash(dt);

    if (post) {
      const speed = prevCam.distanceTo(camera.position) / Math.max(dt, 1e-3);
      post.uniforms.uBlur.value = THREE.MathUtils.clamp(speed / 900, 0, 0.06) * (degraded ? 0 : 1);
      post.render(scene, camera);
    } else {
      renderer.render(scene, camera);
    }
    prevCam.copy(camera.position);
  };

  // Compile shaders up-front to avoid hitches mid-flight.
  try {
    renderer.compile(scene, camera);
  } catch {
    /* ignore */
  }

  return {
    tier,
    renderer: detected.renderer,
    // startPhase 'pour': shots 1–2 were played by a real drone video; start in the sky set.
    start(startPhase) {
      last = performance.now();
      if (startPhase === 'pour') {
        phase = 'pour';
        shotRise(RISE);
        prevCam.copy(camera.position);
        raf = requestAnimationFrame(frame);
        return;
      }
      shotFlight(0);
      prevCam.copy(camera.position);
      raf = requestAnimationFrame(frame);
    },
    get phase() {
      return phase;
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      const seen = new Set();
      const disposeMat = (m) => {
        if (!m || seen.has(m)) return;
        seen.add(m);
        Object.values(m).forEach((val) => val?.isTexture && val.dispose());
        m.dispose();
      };
      [scene, envScene].forEach((root) =>
        root.traverse((obj) => {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach(disposeMat);
          else disposeMat(obj.material);
        }),
      );
      envRT.dispose();
      pmrem.dispose();
      post?.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
