import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHover = () => window.matchMedia("(hover: hover)").matches;

let projectGridTriggers = [];

export function initMotion() {
  if (!prefersReducedMotion()) {
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initMagneticButtons();
  initTiltCard();
  initScrollReveal();
  refreshProjectGridReveal();
  initScrollCue();

  document.addEventListener("gridrendered", refreshProjectGridReveal);
}

// ----------------------------------------------------
// SCROLL CUE: подсказка "листайте вниз" исчезает после первого
// реального скролла — дальше она не нужна и не должна маячить.
// ----------------------------------------------------
function initScrollCue() {
  const cue = document.getElementById("scroll-cue");
  if (!cue) return;

  window.addEventListener(
    "scroll",
    () => cue.classList.add("is-hidden"),
    { passive: true, once: true }
  );
}

// ----------------------------------------------------
// КИНЕТИЧЕСКИЙ ЗАГОЛОВОК HERO: посимвольное проявление.
// Вызывается из main.js (renderHeroWords) после того как разметка
// уже разбита на span.ch — начальное состояние ставит сам GSAP,
// поэтому без анимации (reduced motion) символы просто видны сразу.
// ----------------------------------------------------
export function animateHeroTitle(chars) {
  if (prefersReducedMotion() || !chars || chars.length === 0) return;
  gsap.fromTo(
    chars,
    { opacity: 0, y: 16, rotateX: -40 },
    { opacity: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.02, ease: "expo.out" }
  );
}

// ----------------------------------------------------
// МАГНИТНЫЕ КНОПКИ (.btn-magnet): плавное притяжение к курсору через
// gsap.quickTo — интерполяция вместо мгновенной установки transform.
// ----------------------------------------------------
function initMagneticButtons() {
  if (prefersReducedMotion() || !hasHover()) return;

  document.querySelectorAll(".btn-magnet").forEach((btn) => {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "elastic.out(1,0.4)" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "elastic.out(1,0.4)" });

    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      xTo((e.clientX - rect.left - rect.width / 2) * 0.25);
      yTo((e.clientY - rect.top - rect.height / 2) * 0.3);
    });
    btn.addEventListener("mouseleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

// ----------------------------------------------------
// 3D-TILT КАРТОЧКА ШОУРИЛА: тот же наклон за курсором, но через
// gsap.quickTo — инерционное сглаживание вместо резкого transform.
// ----------------------------------------------------
function initTiltCard() {
  const wrap = document.getElementById("tilt-wrap");
  const card = document.getElementById("featured-card-element");
  if (!wrap || !card || prefersReducedMotion() || !hasHover()) return;

  // Каждое transform-свойство ставим ОТДЕЛЬНЫМ вызовом gsap.set — если
  // задать их одним объектом, quickTo потом не может корректно сбросить
  // отдельную компоненту в 0 (предупреждение "not eligible for reset...
  // Try splitting into individual properties" — ровно этот сплит и нужен).
  // rotationX/rotationY — канонические имена GSAP для CSS-трансформов.
  gsap.set(card, { transformPerspective: 800 });
  gsap.set(card, { rotationX: 0 });
  gsap.set(card, { rotationY: 0 });
  gsap.set(card, { y: 0 });

  const rxTo = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
  const ryTo = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
  const yTo = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });

  wrap.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ryTo(px * 10);
    rxTo(-py * 10);
    yTo(-6);
  });
  wrap.addEventListener("mouseleave", () => {
    rxTo(0);
    ryTo(0);
    yTo(0);
  });
}

// ----------------------------------------------------
// SCROLL REVEAL: те же .reveal/.in-view из base.css, но триггер —
// ScrollTrigger вместо IntersectionObserver. Карточки портфолио
// пересоздаются при фильтрации/языке — их триггеры пересобираются
// отдельно в refreshProjectGridReveal() по событию "gridrendered".
//
// На высоких/широких экранах секция может физически влезать в
// стартовый экран целиком — ScrollTrigger в этом случае считает её
// "уже вошедшей" и проявляет мгновенно при загрузке, без скролла.
// Такие элементы вместо этого ждут первого реального скролла
// (attachReveal ниже), а не позиции на странице.
// ----------------------------------------------------
function attachReveal(el) {
  const alreadyInView = el.getBoundingClientRect().top < window.innerHeight * 0.9;

  if (alreadyInView) {
    window.addEventListener(
      "scroll",
      () => el.classList.add("in-view"),
      { passive: true, once: true }
    );
    return null;
  }

  return ScrollTrigger.create({
    trigger: el,
    start: "top 90%",
    onEnter: () => el.classList.add("in-view"),
    onEnterBack: () => el.classList.add("in-view"),
  });
}

function initScrollReveal() {
  const staticEls = Array.from(document.querySelectorAll(".reveal")).filter(
    (el) => !el.closest("#project-grid")
  );

  if (prefersReducedMotion()) {
    staticEls.forEach((el) => el.classList.add("in-view"));
    return;
  }

  staticEls.forEach((el) => attachReveal(el));
}

function refreshProjectGridReveal() {
  projectGridTriggers.forEach((st) => st.kill());
  projectGridTriggers = [];

  const cards = document.querySelectorAll("#project-grid .reveal");

  if (prefersReducedMotion()) {
    cards.forEach((el) => el.classList.add("in-view"));
    return;
  }

  cards.forEach((el) => {
    // Сетка перерисовывается по действию пользователя (Show More, смена
    // фильтра/языка). Карточки, уже попавшие в зону видимости, показываем
    // сразу — иначе они висят с opacity:0 до первого скролла ("всё пусто").
    // Ждать скролла имеет смысл только для карточек ниже вьюпорта.
    const alreadyInView = el.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (alreadyInView) {
      el.classList.add("in-view");
      return;
    }
    const trigger = attachReveal(el);
    if (trigger) projectGridTriggers.push(trigger);
  });
}
