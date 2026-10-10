// GPU / device capability detection for the intro.

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const WEAK_GPU = /(swiftshader|llvmpipe|softpipe|mali-4|mali-t[67]|adreno \(tm\) [2-5]\d\d|powervr sgx|intel\(r\) (hd|uhd) graphics [2-5]\d{2,3}\b)/i;

// 'high' = desktop quality (shadows, more vines, post blur); 'low' = phones / weak GPUs.
export function detectTier(gl) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;
  let renderer = '';
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch {
    /* ignore */
  }
  const weak = WEAK_GPU.test(renderer);
  if (weak || coarse || small || cores <= 4 || memory <= 4) return { tier: 'low', renderer };
  return { tier: 'high', renderer };
}
