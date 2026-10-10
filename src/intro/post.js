// Lightweight post-processing for the high tier: radial (zoom) motion blur driven by camera speed,
// a warm vignette, and tone mapping. One full-screen pass, 10 taps.
import * as THREE from 'three';

export function createPost(renderer, { samples = 4 } = {}) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples });
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: rt.texture },
      uBlur: { value: 0 },
      uVignette: { value: 0.55 },
      uFlash: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uBlur, uVignette, uFlash; varying vec2 vUv;
      void main(){
        vec2 c = vec2(0.5);
        vec2 dir = vUv - c;
        vec3 col = vec3(0.0);
        float tot = 0.0;
        for (int i = 0; i < 10; i++) {
          float k = float(i) / 9.0;
          float w = 1.0 - k * 0.6;
          col += texture2D(tDiffuse, vUv - dir * uBlur * k * length(dir) * 2.0).rgb * w;
          tot += w;
        }
        col /= tot;
        float v = smoothstep(0.95, 0.25, length(dir) * (1.0 + uVignette * 0.6));
        col *= mix(1.0, v, uVignette);
        col += vec3(1.0, 0.86, 0.6) * uFlash;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false,
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  return {
    uniforms: mat.uniforms,
    setSize(w, h) {
      rt.setSize(w, h);
    },
    render(scene, camera) {
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
    },
    dispose() {
      rt.dispose();
      mat.dispose();
      quadScene.children[0].geometry.dispose();
    },
  };
}
