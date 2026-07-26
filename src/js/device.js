/**
 * Утилиты для определения возможностей устройства.
 */
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasHover = () =>
  window.matchMedia("(hover: hover)").matches;
