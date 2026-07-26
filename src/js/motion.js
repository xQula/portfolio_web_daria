import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, hasHover } from "./device.js";

gsap.registerPlugin(ScrollTrigger);

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
  initCardSpotlight();
  initScrollReveal();
  refreshProjectGridReveal();
  document.addEventListener("gridrendered", refreshProjectGridReveal);
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
// SPOTLIGHT BORDER GLOW: подсветка контура плиток портфолио. Позицию
// курсора проецируем в ЛОКАЛЬНЫЕ координаты каждой плитки (--mx/--my,
// px) — их читает .project-card::before в portfolio.css. У ближней к
// курсору плитки центр пятна попадает внутрь, и ярче всего светится
// обращённая к курсору грань; у дальних плиток центр уходит далеко за
// границы, поэтому рамка остаётся тёмной.
//
// Локальные координаты (а не общий вьюпортный фон через
// background-attachment: fixed) выбраны сознательно: transform на hover
// делает плитку containing block и ломает fixed-фон.
//
// Один слушатель на окне + rAF-троттлинг. Внутри кадра сначала читаем
// все геометрии, затем пишем все переменные — чтобы не чередовать
// чтение/запись стилей и не провоцировать лишние reflow.
// ----------------------------------------------------
function initCardSpotlight() {
  if (prefersReducedMotion() || !hasHover()) return;

  const grid = document.getElementById("project-grid");
  if (!grid) return;

  let queued = false;
  let px = 0;
  let py = 0;

  const update = () => {
    queued = false;
    const cards = grid.querySelectorAll(".card-glow-wrap");
    if (cards.length === 0) return;

    // 1) читаем
    const rects = [];
    cards.forEach((card) => rects.push(card.getBoundingClientRect()));

    // 2) пишем — координаты на обёртке (.card-glow-wrap), т.к. гло на ней
    cards.forEach((card, i) => {
      const rect = rects[i];
      if (rect.bottom < -400 || rect.top > window.innerHeight + 400) return;
      card.style.setProperty("--mx", `${(px - rect.left).toFixed(1)}px`);
      card.style.setProperty("--my", `${(py - rect.top).toFixed(1)}px`);
    });
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      px = e.clientX;
      py = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  // Сброс при уходе курсора с сетки
  grid.addEventListener("pointerleave", () => {
    grid.querySelectorAll(".card-glow-wrap").forEach((wrap) => {
      wrap.style.setProperty("--mx", "-500px");
      wrap.style.setProperty("--my", "-500px");
    });
  }, { passive: true });
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
