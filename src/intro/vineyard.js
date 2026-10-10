// Procedural golden-hour vineyard: rolling terrain, trellis posts and wires, leafy canopy and
// grape clusters — all instanced. Leaves move in the wind in the vertex shader.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const ROW_SPACING = 2.6;
export const ROW_START_Z = 14;
export const ROW_END_Z = -250;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Deterministic pseudo-random (so the scene looks the same on every visit).
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Terrain height: a gentle slope where the rows are, rolling Fruška gora hills further away.
export function terrainHeight(x, z) {
  const near = 0.5 * Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.03) + 0.45 * Math.sin(z * 0.021 + 0.5) + z * -0.012;
  const hills = 16 * Math.sin(x * 0.011 + 0.8) * Math.sin(z * 0.008 + 2.1) + 9 * Math.cos(x * 0.019 - z * 0.012) + 6 * Math.sin(x * 0.041 + z * 0.023);
  const side = smooth(34, 170, Math.abs(x));
  const ahead = smooth(240, 420, -z);
  return near + Math.max(side, ahead) * (hills + 22);
}

function groundTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  // Golden dry grass between rows, darker soil strip under the vines (centre of the tile).
  g.fillStyle = '#8a7a3c';
  g.fillRect(0, 0, 128, 128);
  const r = rng(7);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 128;
    const y = r() * 128;
    const shade = r();
    g.fillStyle = shade > 0.6 ? 'rgba(170,150,80,0.55)' : shade > 0.3 ? 'rgba(96,104,48,0.5)' : 'rgba(70,60,30,0.45)';
    g.fillRect(x, y, 1 + r() * 2, 2 + r() * 5);
  }
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0.3, 'rgba(78,56,34,0)');
  grad.addColorStop(0.42, 'rgba(78,56,34,0.9)');
  grad.addColorStop(0.58, 'rgba(78,56,34,0.9)');
  grad.addColorStop(0.7, 'rgba(78,56,34,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

// Grape-leaf texture (5 lobes, veins) drawn on a canvas — used with alpha test on leaf cards.
function leafTexture(maxAniso) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.translate(S / 2, S * 0.9);
  const lobe = (angle, len, width) => {
    g.save();
    g.rotate(angle);
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(width, -len * 0.3, width * 0.8, -len * 0.85, 0, -len);
    g.bezierCurveTo(-width * 0.8, -len * 0.85, -width, -len * 0.3, 0, 0);
    g.fill();
    g.restore();
  };
  const grad = g.createLinearGradient(0, -S * 0.8, 0, 0);
  grad.addColorStop(0, '#d8e0a8');
  grad.addColorStop(1, '#b8c47e');
  g.fillStyle = grad;
  lobe(0, S * 0.78, S * 0.26);
  lobe(-0.85, S * 0.62, S * 0.22);
  lobe(0.85, S * 0.62, S * 0.22);
  lobe(-1.6, S * 0.42, S * 0.18);
  lobe(1.6, S * 0.42, S * 0.18);
  g.strokeStyle = 'rgba(90,100,50,0.55)';
  g.lineWidth = 3;
  [0, -0.85, 0.85, -1.6, 1.6].forEach((a, i) => {
    g.save();
    g.rotate(a);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -S * (i === 0 ? 0.7 : i < 3 ? 0.55 : 0.36));
    g.stroke();
    g.restore();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

// A clump of randomly oriented leaf cards merged into one geometry (instanced along the rows).
function leafClump(cards, seed) {
  const r = rng(seed);
  const parts = [];
  for (let i = 0; i < cards; i++) {
    const g = new THREE.PlaneGeometry(0.2 + r() * 0.08, 0.2 + r() * 0.08);
    g.rotateX((r() - 0.5) * 2.2);
    g.rotateY(r() * Math.PI * 2);
    g.rotateZ((r() - 0.5) * 1.2);
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.3;
    g.translate(Math.cos(a) * rad * 0.7, (r() - 0.5) * 0.5, Math.sin(a) * rad);
    parts.push(g);
  }
  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  return geo;
}

function grapeCluster() {
  const parts = [];
  const r = rng(11);
  const rows = [4, 3, 3, 2, 1];
  let y = 0;
  rows.forEach((n, ri) => {
    for (let i = 0; i < n; i++) {
      const g = new THREE.IcosahedronGeometry(0.034, 1);
      const a = (i / n) * Math.PI * 2 + ri;
      const rad = n > 1 ? 0.034 * (n * 0.5) : 0;
      g.translate(Math.cos(a) * rad + (r() - 0.5) * 0.01, y, Math.sin(a) * rad);
      parts.push(g);
    }
    y -= 0.045;
  });
  return mergeGeometries(parts);
}

/**
 * @param {{ tier: 'high'|'low', maxAniso: number, time: { value: number } }} o
 */
export function createVineyard(o) {
  const high = o.tier === 'high';
  const group = new THREE.Group();
  const disposables = [];

  // ---------- Terrain ----------
  const size = 1000;
  const seg = high ? 200 : 110;
  const tgeo = new THREE.PlaneGeometry(size, size, seg, seg);
  tgeo.rotateX(-Math.PI / 2);
  tgeo.translate(0, 0, -size / 2 + 120);
  const tp = tgeo.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, terrainHeight(tp.getX(i), tp.getZ(i)));
  tgeo.computeVertexNormals();
  // UVs aligned so one texture tile = one row spacing, soil strip centred under each row.
  const uv = tgeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (tp.getX(i) - ROW_SPACING / 2) / ROW_SPACING + 0.5, tp.getZ(i) / 9);
  const groundTex = groundTexture(o.maxAniso);
  const terrain = new THREE.Mesh(tgeo, new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95, metalness: 0 }));
  terrain.receiveShadow = high;
  group.add(terrain);

  // ---------- Rows ----------
  const rows = high ? 26 : 14;
  const leafStep = high ? 0.32 : 0.48;
  const postStep = 6;
  const r = rng(3);
  // Sorted from the flight path outwards, so lowering an instance count removes the outer rows first.
  const rowXs = Array.from({ length: rows }, (_, i) => (i - (rows - 1) / 2) * ROW_SPACING).sort((a, b) => Math.abs(a) - Math.abs(b));

  // Posts
  const postGeo = new THREE.BoxGeometry(0.07, 1.95, 0.07);
  postGeo.translate(0, 0.975 - 0.15, 0);
  const postsPerRow = Math.floor((ROW_START_Z - ROW_END_Z) / postStep) + 1;
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.9 }), rows * postsPerRow);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  let k = 0;
  const wirePts = [];
  const wireHeights = [0.75, 1.15, 1.55];
  rowXs.forEach((x) => {
    let prev = null;
    for (let z = ROW_START_Z; z >= ROW_END_Z; z -= postStep) {
      const h = terrainHeight(x, z);
      e.set((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.04);
      q.setFromEuler(e);
      m.compose(p.set(x, h, z), q, s.set(1, 1, 1));
      posts.setMatrixAt(k++, m);
      if (prev) wireHeights.forEach((wh) => wirePts.push(x, prev.h + wh, prev.z, x, h + wh, z));
      prev = { h, z };
    }
  });
  posts.count = k;
  posts.castShadow = high;
  group.add(posts);

  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
  const wires = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x5a5148, transparent: true, opacity: 0.7 }));
  group.add(wires);

  // Leafy canopy (instanced clumps of leaf cards) with wind sway in the vertex shader.
  const leafGeo = leafClump(high ? 9 : 7, 5);
  const leafTex = leafTexture(o.maxAniso);
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, metalness: 0 });
  disposables.push(leafTex);
  leafMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = o.time;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 ip = vec3(0.0);
      #endif
      float sway = sin(uTime * 1.6 + ip.z * 0.35 + ip.x * 0.9) * 0.07 + sin(uTime * 3.3 + ip.z * 1.7) * 0.03;
      float w = clamp(position.y + 0.4, 0.0, 1.5);
      transformed.x += sway * w;
      transformed.z += sway * 0.4 * w;
      transformed.y += sin(uTime * 2.4 + ip.x + ip.z) * 0.015 * w;`,
    );
  };
  const leafCount = rows * (Math.floor((ROW_START_Z - ROW_END_Z) / leafStep) + 1);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  const palette = ['#4f6e26', '#5c7a2b', '#6b8a31', '#7a9236', '#8e9a3c', '#a39a45', '#456222'].map((c) => new THREE.Color(c));
  k = 0;
  rowXs.forEach((x) => {
    for (let z = ROW_START_Z; z >= ROW_END_Z; z -= leafStep) {
      const zz = z + (r() - 0.5) * 0.3;
      const h = terrainHeight(x, zz);
      e.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4);
      q.setFromEuler(e);
      const sc = 0.95 + r() * 0.35;
      m.compose(p.set(x + (r() - 0.5) * 0.14, h + 0.95 + r() * 0.75, zz), q, s.set(sc, sc, sc));
      leaves.setMatrixAt(k, m);
      leaves.setColorAt(k, palette[Math.floor(r() * palette.length)]);
      k++;
    }
  });
  leaves.count = k;
  leaves.castShadow = high;
  leaves.receiveShadow = high;
  leaves.frustumCulled = false;
  group.add(leaves);

  // Dark red grape clusters — only on the rows near the flight path.
  const grapeGeo = grapeCluster();
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x3a0a1c, roughness: 0.32, metalness: 0.05 });
  const nearRows = rowXs.filter((x) => Math.abs(x) < (high ? 9 : 5));
  const grapeStep = high ? 0.75 : 1.2;
  const grapes = new THREE.InstancedMesh(grapeGeo, grapeMat, Math.ceil((nearRows.length * 2 * (ROW_START_Z + 120)) / grapeStep));
  k = 0;
  nearRows.forEach((x) => {
    for (let z = ROW_START_Z; z >= -120; z -= grapeStep) {
      for (const side of [-1, 1]) {
        if (r() < 0.35) continue;
        const zz = z + (r() - 0.5) * 0.5;
        const h = terrainHeight(x, zz);
        e.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3);
        q.setFromEuler(e);
        const sc = 0.8 + r() * 0.5;
        m.compose(p.set(x + side * (0.22 + r() * 0.08), h + 1.02 + r() * 0.1, zz), q, s.set(sc, sc, sc));
        if (k < grapes.instanceMatrix.count) grapes.setMatrixAt(k++, m);
      }
    }
  });
  grapes.count = k;
  grapes.castShadow = false;
  grapes.receiveShadow = high;
  group.add(grapes);

  disposables.push(tgeo, groundTex, postGeo, wireGeo, leafGeo, grapeGeo);

  return {
    group,
    leaves,
    grapes,
    rowXs,
    // Halve the instance counts when the GPU struggles.
    degrade() {
      leaves.count = Math.floor(leaves.count * 0.55);
      grapes.count = Math.floor(grapes.count * 0.5);
    },
  };
}
