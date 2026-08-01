/**
 * Утилиты для определения возможностей устройства.
 */
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasHover = () => {
  const mqMatches = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isTouchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  return mqMatches && !isTouchCapable;
};
