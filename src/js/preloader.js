import { prefersReducedMotion } from "./device.js";

const SESSION_KEY = "sof_preloader_shown";
const SAFETY_TIMEOUT_MS = 4000;

// ----------------------------------------------------
// ЭКРАН ЗАГРУЗКИ: диафрагма-ирис, показывается один раз за сессию вкладки,
// пока не готовы критичные ресурсы (шрифты + hero-изображение) — либо до
// safety-таймаута при проблемах с сетью. По готовности круг схлопывается
// к центру (transform: scale, см. preloader.css) — сама длительность этой
// transition и есть минимальное время показа, без искусственного таймера.
// ----------------------------------------------------
export function initPreloader() {
  const el = document.getElementById("page-preloader");
  if (!el) return;

  if (sessionStorage.getItem(SESSION_KEY)) {
    el.remove();
    return;
  }

  document.body.style.overflow = "hidden";
  const reduced = prefersReducedMotion();

  const heroImg = document.querySelector(".featured-thumbnail-img");
  const imgReady = new Promise((resolve) => {
    if (!heroImg || heroImg.complete) return resolve();
    heroImg.addEventListener("load", () => resolve(), { once: true });
    heroImg.addEventListener("error", () => resolve(), { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const safetyTimeout = new Promise((resolve) => setTimeout(resolve, SAFETY_TIMEOUT_MS));

  function hide() {
    document.body.style.overflow = "";
    sessionStorage.setItem(SESSION_KEY, "1");
    el.remove();
  }

  Promise.race([Promise.all([imgReady, fontsReady]), safetyTimeout]).then(() => {
    if (reduced) {
      hide();
      return;
    }
    const irisEl = el.querySelector(".preloader-iris");
    el.classList.add("is-open");
    irisEl.addEventListener("transitionend", hide, { once: true });
    // Фолбэк на случай, если transitionend не сработает
    setTimeout(hide, 700);
  });
}
