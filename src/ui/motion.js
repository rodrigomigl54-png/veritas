// Shared motion helpers.
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;
export const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
