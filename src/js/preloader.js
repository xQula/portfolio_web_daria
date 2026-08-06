import { prefersReducedMotion } from "./device.js";

const SESSION_KEY = "sof_preloader_shown";
const MIN_VISIBLE_MS = 400;
const SAFETY_TIMEOUT_MS = 4000;

// ----------------------------------------------------
// ЭКРАН ЗАГРУЗКИ: показывается один раз за сессию вкладки, пока не готовы
// критичные ресурсы (шрифты + hero-изображение). Прогресс — «трикл»-анимация
// (как в nprogress), без привязки к фиксированному таймеру: на тёплом кэше
// сплэш быстро домигивает до 100% и уходит, при проблемах с сетью —
// принудительно скрывается по safety-таймауту.
// ----------------------------------------------------
export function initPreloader() {
  const el = document.getElementById("page-preloader");
  if (!el) return;

  if (sessionStorage.getItem(SESSION_KEY)) {
    el.remove();
    return;
  }

  document.body.style.overflow = "hidden";
  const startedAt = performance.now();
  const reduced = prefersReducedMotion();

  const ringEl = el.querySelector(".preloader-ring-progress");
  const digitEl = document.getElementById("preloader-digit");
  const circumference = 2 * Math.PI * 52;
  ringEl.style.strokeDasharray = `${circumference}`;
  ringEl.style.strokeDashoffset = `${circumference}`;

  let progress = 0;
  let trickleTimer = null;

  function render(p) {
    ringEl.style.strokeDashoffset = `${circumference * (1 - p)}`;
    digitEl.textContent = p < 0.33 ? "3" : p < 0.66 ? "2" : p < 1 ? "1" : "0";
  }

  if (!reduced) {
    trickleTimer = setInterval(() => {
      progress += (0.95 - progress) * (0.05 + Math.random() * 0.1);
      render(progress);
    }, 180);
  }

  const heroImg = document.querySelector(".featured-thumbnail-img");
  const imgReady = new Promise((resolve) => {
    if (!heroImg || heroImg.complete) return resolve();
    heroImg.addEventListener("load", () => resolve(), { once: true });
    heroImg.addEventListener("error", () => resolve(), { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const safetyTimeout = new Promise((resolve) => setTimeout(resolve, SAFETY_TIMEOUT_MS));

  function hide() {
    el.classList.add("page-preloader--hidden");
    document.body.style.overflow = "";
    sessionStorage.setItem(SESSION_KEY, "1");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    // Фолбэк на случай, если transitionend не сработает
    setTimeout(() => el.remove(), 800);
  }

  Promise.race([Promise.all([imgReady, fontsReady]), safetyTimeout]).then(() => {
    if (trickleTimer) clearInterval(trickleTimer);
    render(1);
    if (!reduced) el.classList.add("is-ready");

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setTimeout(hide, wait + (reduced ? 0 : 200));
  });
}
