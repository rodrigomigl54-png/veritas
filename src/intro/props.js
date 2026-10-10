// Hero props of the intro: oak barrel with the branded logo, two crystal glasses with wine,
// the pouring stream, splash droplets and the golden spark burst. Plus the dusk sky dome.
import * as THREE from 'three';
import { rng } from './vineyard.js';

// ---------- Sky ----------
export function createSky() {
  const geo = new THREE.SphereGeometry(900, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: new THREE.Vector3(0.62, 0.05, -1).normalize() },
      uHorizon: { value: new THREE.Color('#F0C27E') },
      uGold: { value: new THREE.Color('#E2C98F') },
      uMid: { value: new THREE.Color('#B4605A') },
      uTop: { value: new THREE.Color('#2B0F2A') },
      uHaze: { value: new THREE.Color('#D9A46C') },
    },
    vertexShader: `varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `varying vec3 vDir; uniform vec3 uSun, uHorizon, uGold, uMid, uTop, uHaze;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uGold, smoothstep(0.0, 0.08, h));
        col = mix(col, uMid, smoothstep(0.06, 0.32, h));
        col = mix(col, uTop, smoothstep(0.25, 0.85, h));
        float sun = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.78, 0.48) * pow(sun, 900.0) * 3.0;
        col += vec3(1.0, 0.62, 0.32) * pow(sun, 12.0) * 0.45;
        col += vec3(0.9, 0.55, 0.3) * pow(sun, 3.0) * 0.12;
        col = mix(col, uHaze, smoothstep(0.02, -0.12, h));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

// ---------- Barrel ----------
const BARREL_LEN = 1.2;
const BARREL_R = 0.48;
const BULGE = 0.09;
const radiusAt = (y) => BARREL_R + BULGE * (1 - Math.pow((2 * y) / BARREL_LEN, 2));

function staveTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const r = rng(21);
  const staves = 26;
  const w = c.width / staves;
  for (let i = 0; i < staves; i++) {
    const tone = 0.85 + r() * 0.3;
    g.fillStyle = `rgb(${Math.round(112 * tone)},${Math.round(68 * tone)},${Math.round(38 * tone)})`;
    g.fillRect(i * w, 0, w, c.height);
    // grain
    for (let j = 0; j < 14; j++) {
      g.strokeStyle = `rgba(${40 + r() * 30},${20 + r() * 15},${8},${0.25 + r() * 0.25})`;
      g.lineWidth = 0.6 + r() * 1.2;
      g.beginPath();
      const x0 = i * w + r() * w;
      g.moveTo(x0, 0);
      for (let y = 0; y <= c.height; y += 32) g.lineTo(x0 + Math.sin(y * 0.02 + j) * (2 + r() * 3), y);
      g.stroke();
    }
    g.fillStyle = 'rgba(25,12,6,0.85)';
    g.fillRect(i * w, 0, 2, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

// Barrel head: horizontal planks, chime ring, and the Veritas logo burned into the wood.
function headTexture(logoImage, maxAniso) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const r = rng(33);
  const planks = 7;
  for (let i = 0; i < planks; i++) {
    const tone = 0.85 + r() * 0.25;
    g.fillStyle = `rgb(${Math.round(128 * tone)},${Math.round(80 * tone)},${Math.round(45 * tone)})`;
    g.fillRect(0, (i * S) / planks, S, S / planks);
    for (let j = 0; j < 18; j++) {
      g.strokeStyle = `rgba(60,30,12,${0.15 + r() * 0.25})`;
      g.lineWidth = 0.8 + r() * 1.5;
      g.beginPath();
      const y0 = (i * S) / planks + r() * (S / planks);
      g.moveTo(0, y0);
      for (let x = 0; x <= S; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.015 + j) * (2 + r() * 4));
      g.stroke();
    }
    g.fillStyle = 'rgba(25,12,6,0.9)';
    g.fillRect(0, (i * S) / planks, S, 3);
  }
  // Vignette / darker edge where the head meets the chime.
  const rad = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.5);
  rad.addColorStop(0, 'rgba(0,0,0,0)');
  rad.addColorStop(1, 'rgba(20,8,2,0.75)');
  g.fillStyle = rad;
  g.fillRect(0, 0, S, S);

  // Burned logo (dark scorch with a soft edge).
  const burn = document.createElement('canvas');
  burn.width = burn.height = S;
  const b = burn.getContext('2d');
  if (logoImage) {
    const maxW = S * 0.62;
    const maxH = S * 0.42;
    const k = Math.min(maxW / logoImage.width, maxH / logoImage.height);
    const w = logoImage.width * k;
    const h = logoImage.height * k;
    b.drawImage(logoImage, (S - w) / 2, (S - h) / 2, w, h);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = '#1e0d05';
    b.fillRect(0, 0, S, S);
  } else {
    // TODO: replaced automatically by the real logo once `npm run assets` has downloaded it.
    b.fillStyle = '#1e0d05';
    b.textAlign = 'center';
    b.textBaseline = 'middle';
    b.font = `600 ${S * 0.12}px "Cormorant Garamond", Georgia, serif`;
    if (b.letterSpacing !== undefined) b.letterSpacing = `${S * 0.03}px`;
    b.fillText('VERITAS', S / 2, S / 2);
    b.fillRect(S * 0.3, S * 0.6, S * 0.4, 3);
  }
  g.save();
  g.shadowColor = 'rgba(30,10,2,0.9)';
  g.shadowBlur = 14;
  g.globalAlpha = 0.86;
  g.drawImage(burn, 0, 0);
  g.restore();
  // Subtle gold inlay on top of the burn.
  g.save();
  g.globalAlpha = 0.18;
  g.globalCompositeOperation = 'lighter';
  const gold = document.createElement('canvas');
  gold.width = gold.height = S;
  const gg = gold.getContext('2d');
  gg.drawImage(burn, 0, 0);
  gg.globalCompositeOperation = 'source-in';
  gg.fillStyle = '#C6A15B';
  gg.fillRect(0, 0, S, S);
  g.drawImage(gold, 0, 0);
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createBarrel({ logoImage, maxAniso }) {
  const group = new THREE.Group();
  const pts = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const y = -BARREL_LEN / 2 + (i / steps) * BARREL_LEN;
    pts.push(new THREE.Vector2(radiusAt(y), y));
  }
  const bodyGeo = new THREE.LatheGeometry(pts, 64);
  const staves = staveTexture(maxAniso);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ map: staves, roughness: 0.72, metalness: 0, bumpMap: staves, bumpScale: 0.6 }));
  group.add(body);

  const hoopMat = new THREE.MeshStandardMaterial({ color: 0x24201e, roughness: 0.42, metalness: 0.85 });
  [-0.5, -0.36, 0.36, 0.5].forEach((t) => {
    const y = t * BARREL_LEN;
    const hoop = new THREE.Mesh(new THREE.CylinderGeometry(radiusAt(y) + 0.008, radiusAt(y) + 0.008, 0.055, 64, 1, true), hoopMat);
    hoop.position.y = y * 0.985;
    group.add(hoop);
  });

  const headTex = headTexture(logoImage, maxAniso);
  const headMat = new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.75 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.8 });
  const headR = radiusAt(BARREL_LEN / 2) - 0.02;
  const front = new THREE.Mesh(new THREE.CircleGeometry(headR, 64), headMat);
  front.rotation.x = -Math.PI / 2;
  front.position.y = BARREL_LEN / 2 - 0.035;
  group.add(front);
  const back = new THREE.Mesh(new THREE.CircleGeometry(headR, 32), backMat);
  back.rotation.x = Math.PI / 2;
  back.position.y = -BARREL_LEN / 2 + 0.035;
  group.add(back);

  // Brass tap at the bottom of the front head.
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08a4a, roughness: 0.3, metalness: 1 });
  const tapBody = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 20), brass);
  tapBody.position.set(0, BARREL_LEN / 2 + 0.03, 0);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.08, 16), brass);
  spout.position.set(0, BARREL_LEN / 2 + 0.08, 0);
  spout.rotation.x = Math.PI / 2;
  spout.position.z = 0.035;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.018), brass);
  handle.position.set(0, BARREL_LEN / 2 + 0.07, -0.035);
  const tap = new THREE.Group();
  tap.add(tapBody, spout, handle);
  tap.position.z = headR - 0.1; // local +z = world down once the barrel lies on its side
  group.add(tap);

  // Lie the barrel on its side: lathe axis (y) → world z, head facing the camera (+z);
  // local +z → world -y.
  group.rotation.x = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(group);

  const tapTip = new THREE.Object3D();
  tapTip.position.set(0, BARREL_LEN / 2 + 0.085, headR - 0.1 + 0.075);
  group.add(tapTip);

  return { object: holder, tapTip };
}

// ---------- Wine glass ----------
// Profile (x = radius, y = height). Outer wall up to the rim, then the inner wall back down.
const OUTER = [
  [0.0, 0.0], [0.105, 0.0], [0.108, 0.006], [0.02, 0.016], [0.011, 0.04], [0.009, 0.2], [0.014, 0.235],
  [0.05, 0.262], [0.1, 0.29], [0.135, 0.33], [0.152, 0.39], [0.148, 0.45], [0.136, 0.51], [0.126, 0.555],
];
const INNER = [
  [0.121, 0.555], [0.131, 0.51], [0.142, 0.45], [0.146, 0.39], [0.129, 0.334], [0.095, 0.297], [0.046, 0.272], [0.0, 0.266],
];
export const GLASS_RIM_Y = 0.555;
export const GLASS_RIM_R = 0.126;
const BOWL_BOTTOM = 0.266;
const FILL_TOP = 0.39; // ≈ one third of the glass — a proper wine pour

// Inner radius at a given local height (interpolated on the inner profile).
function innerRadius(y) {
  const pts = [...INNER].reverse();
  for (let i = 0; i < pts.length - 1; i++) {
    const [r0, y0] = pts[i];
    const [r1, y1] = pts[i + 1];
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return y < BOWL_BOTTOM ? 0 : pts[pts.length - 1][0];
}

export function createGlasses({ tier, envMap, timeUniform }) {
  const high = tier === 'high';
  const profile = [...OUTER, ...INNER].map(([x, y]) => new THREE.Vector2(x, y));
  const glassGeo = new THREE.LatheGeometry(profile, high ? 96 : 48);
  glassGeo.computeVertexNormals();
  const glassMat = high
    ? new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        ior: 1.5,
        thickness: 0.012,
        specularIntensity: 1,
        envMap,
        envMapIntensity: 1.4,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transparent: true,
        opacity: 0.12,
        envMap,
        envMapIntensity: 2.2,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

  const wineColor = new THREE.Color('#5c0a1c');
  const wineMat = new THREE.MeshPhysicalMaterial({
    color: wineColor,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 0.9,
    emissive: new THREE.Color('#2a0208'),
    side: THREE.DoubleSide,
    clippingPlanes: [],
  });

  // Liquid body: inner bowl profile, clipped by a horizontal world-space plane = wine surface.
  const liquidProfile = [...INNER].reverse().map(([x, y]) => new THREE.Vector2(Math.max(0, x - 0.002), y));
  const liquidGeo = new THREE.LatheGeometry(liquidProfile, high ? 64 : 32);
  const capGeo = new THREE.CircleGeometry(1, high ? 64 : 32, 0, Math.PI * 2);
  capGeo.rotateX(-Math.PI / 2);
  // Small waves on the wine surface.
  const capMat = wineMat.clone();
  capMat.clippingPlanes = null;
  capMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float rr = length(position.xz);
      transformed.y += (sin(rr * 18.0 - uTime * 7.0) * 0.004 + sin(position.x * 9.0 + uTime * 3.0) * 0.003) * (1.0 - rr) + rr * rr * 0.012;`,
    );
  };

  const make = () => {
    const pivot = new THREE.Group(); // pivot at the bowl centre so the toast tilt looks natural
    const glass = new THREE.Group();
    glass.position.y = -0.4;
    pivot.add(glass);
    const shell = new THREE.Mesh(glassGeo, glassMat);
    shell.renderOrder = 2;
    glass.add(shell);
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const mat = wineMat.clone();
    mat.clippingPlanes = [plane];
    const liquid = new THREE.Mesh(liquidGeo, mat);
    liquid.renderOrder = 1;
    glass.add(liquid);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.renderOrder = 1;
    pivot.add(cap);
    return { pivot, glass, liquid, cap, plane, fill: 0, slosh: 0, sloshV: 0 };
  };
  const left = make();
  const right = make();

  const tmp = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  // Places the wine surface for a fill fraction (0..1), keeping it horizontal in world space.
  const updateLiquid = (gl, dt) => {
    const f = Math.max(0, Math.min(1, gl.fill));
    const visible = f > 0.002;
    gl.liquid.visible = gl.cap.visible = visible;
    if (!visible) return;
    const localH = BOWL_BOTTOM + (FILL_TOP - BOWL_BOTTOM) * Math.pow(f, 0.62);
    gl.glass.updateWorldMatrix(true, false);
    tmp.set(0, localH, 0);
    gl.glass.localToWorld(tmp);
    // Slosh: damped spring on the surface tilt.
    gl.sloshV += (-gl.slosh * 90 - gl.sloshV * 6) * dt;
    gl.slosh += gl.sloshV * dt;
    const n = new THREE.Vector3(Math.sin(gl.slosh), -Math.cos(gl.slosh), 0).normalize();
    gl.plane.normal.copy(n);
    gl.plane.constant = -n.dot(tmp);
    // Cap (in pivot space): convert the world point back.
    const capLocal = gl.pivot.worldToLocal(tmp.clone());
    gl.cap.position.copy(capLocal);
    const worldQ = gl.pivot.getWorldQuaternion(new THREE.Quaternion()).invert();
    gl.cap.quaternion.setFromUnitVectors(up, n.clone().negate()).premultiply(worldQ);
    const rad = innerRadius(localH) - 0.003;
    gl.cap.scale.set(rad, 1, rad);
  };

  return {
    left,
    right,
    updateLiquid,
    rimWorld(gl, target = new THREE.Vector3()) {
      gl.glass.updateWorldMatrix(true, false);
      return gl.glass.localToWorld(target.set(0, GLASS_RIM_Y, 0));
    },
    surfaceWorld(gl, target = new THREE.Vector3()) {
      const f = Math.max(0, Math.min(1, gl.fill));
      const localH = BOWL_BOTTOM + (FILL_TOP - BOWL_BOTTOM) * Math.pow(f, 0.62);
      gl.glass.updateWorldMatrix(true, false);
      return gl.glass.localToWorld(target.set(0, localH, 0));
    },
    wineMat,
  };
}

// ---------- Stream ----------
export function createStream(material) {
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  return {
    mesh,
    update(from, to, radius, t) {
      // Ballistic arc: leaves the tap moving forward, falls into the glass.
      a.copy(from);
      c.copy(to);
      b.set(from.x + (to.x - from.x) * 0.25, from.y - (from.y - to.y) * 0.08, from.z + (to.z - from.z) * 0.9 + 0.05);
      const curve = new THREE.QuadraticBezierCurve3(a, b, c);
      const geo = new THREE.TubeGeometry(curve, 36, radius * (0.92 + Math.sin(t * 40) * 0.08), 10, false);
      mesh.geometry.dispose();
      mesh.geometry = geo;
    },
  };
}

// ---------- Splash droplets ----------
export function createDroplets(material, max = 70) {
  const geo = new THREE.IcosahedronGeometry(0.011, 1);
  const mesh = new THREE.InstancedMesh(geo, material, max);
  mesh.frustumCulled = false;
  mesh.count = 0;
  const drops = [];
  const m = new THREE.Matrix4();
  const r = rng(99);
  return {
    mesh,
    spawn(at, n = 2) {
      for (let i = 0; i < n && drops.length < max; i++) {
        drops.push({
          p: at.clone(),
          v: new THREE.Vector3((r() - 0.5) * 0.5, 0.35 + r() * 0.55, (r() - 0.5) * 0.5),
          life: 0.28 + r() * 0.25,
          s: 0.6 + r() * 0.8,
        });
      }
    },
    update(dt, floorY) {
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life -= dt;
        d.v.y -= 4.2 * dt;
        d.p.addScaledVector(d.v, dt);
        if (d.life <= 0 || d.p.y < floorY - 0.02) drops.splice(i, 1);
      }
      drops.forEach((d, i) => {
        m.makeScale(d.s, d.s * 1.3, d.s).setPosition(d.p);
        mesh.setMatrixAt(i, m);
      });
      mesh.count = drops.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------- Gold spark burst ----------
function sparkSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,245,220,1)');
  grad.addColorStop(0.25, 'rgba(226,201,143,0.9)');
  grad.addColorStop(1, 'rgba(198,161,91,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createSparks(count = 260) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = sparkSprite();
  const mat = new THREE.PointsMaterial({
    size: 0.035,
    map: tex,
    color: 0xffe2a8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const vel = Array.from({ length: count }, () => new THREE.Vector3());
  const r = rng(5);
  let age = 99;
  return {
    points,
    burst(at) {
      age = 0;
      for (let i = 0; i < count; i++) {
        pos[i * 3] = at.x;
        pos[i * 3 + 1] = at.y;
        pos[i * 3 + 2] = at.z;
        const dir = new THREE.Vector3(r() - 0.5, r() - 0.4, r() - 0.5).normalize();
        vel[i].copy(dir).multiplyScalar(0.4 + r() * 1.4);
      }
      geo.attributes.position.needsUpdate = true;
    },
    update(dt) {
      if (age > 3) return;
      age += dt;
      for (let i = 0; i < count; i++) {
        vel[i].multiplyScalar(1 - 2.4 * dt);
        vel[i].y -= 0.35 * dt;
        pos[i * 3] += vel[i].x * dt;
        pos[i * 3 + 1] += vel[i].y * dt;
        pos[i * 3 + 2] += vel[i].z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - age / 1.6);
    },
  };
}
