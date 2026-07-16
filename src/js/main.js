import { initLanguage, toggleLanguage } from "./i18n.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo, renderTrust, renderStats } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";

const langToggleBtn = document.getElementById("lang-toggle");
const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
const burgerBtn = document.getElementById("mobile-menu-trigger");
const mobileDrawer = document.getElementById("mobile-drawer");
const drawerLinks = document.querySelectorAll(".drawer-link");

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHover = () => window.matchMedia("(hover: hover)").matches;

async function init() {
  // Настройка языка
  initLanguage();

  // Загружаем проекты из файлов
  try {
    await loadProjects();
  } catch (err) {
    console.error("Ошибка при загрузке проектов:", err);
  }

  // Инициализация компонентов
  initGrid();
  initLightbox();
  initContactModal();

  // Рендеринг сетки, главного видео и блоков, посчитанных из данных
  renderGrid();
  setupFeaturedVideo();
  renderTrust();
  renderStats();

  // Слой моушна премиального лендинга
  initStickyHeader();
  initScrollReveal();
  initTiltCard();
  initMagneticButtons();
  initScrollHighlight();

  // Переключатели языков
  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", toggleLanguage);
  }
  if (mobileLangToggleBtn) {
    mobileLangToggleBtn.addEventListener("click", toggleLanguage);
  }

  // Логика мобильного меню (Гамбургер)
  if (burgerBtn && mobileDrawer) {
    burgerBtn.addEventListener("click", () => {
      const isActive = mobileDrawer.classList.toggle("active");
      burgerBtn.classList.toggle("active");
      mobileDrawer.setAttribute("aria-hidden", isActive ? "false" : "true");
      document.body.style.overflow = isActive ? "hidden" : "";
    });

    // Закрытие оверлея при переходе по ссылке меню
    drawerLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileDrawer.classList.remove("active");
        burgerBtn.classList.remove("active");
        document.body.style.overflow = "";
        mobileDrawer.setAttribute("aria-hidden", "true");
      });
    });
  }
}

// ----------------------------------------------------
// ЛИПКИЙ ХЕДЕР: прозрачный вверху страницы, уплотняется при скролле
// ----------------------------------------------------
function initStickyHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("site-header--solid", window.scrollY > 40);
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

// ----------------------------------------------------
// SCROLL REVEAL: плавное появление секций (.reveal) через IntersectionObserver
// ----------------------------------------------------
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (prefersReducedMotion()) {
    targets.forEach(el => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}

// ----------------------------------------------------
// 3D-TILT КАРТОЧКА ШОУРИЛА: наклон вслед за курсором
// ----------------------------------------------------
function initTiltCard() {
  const wrap = document.getElementById("tilt-wrap");
  const card = document.getElementById("featured-card-element");
  if (!wrap || !card || prefersReducedMotion() || !hasHover()) return;

  wrap.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });

  wrap.addEventListener("mouseleave", () => {
    card.style.transform = "rotateY(0deg) rotateX(0deg)";
  });
}

// ----------------------------------------------------
// МАГНИТНЫЕ КНОПКИ (.btn-magnet): лёгкое притяжение к курсору
// ----------------------------------------------------
function initMagneticButtons() {
  if (prefersReducedMotion() || !hasHover()) return;

  document.querySelectorAll(".btn-magnet").forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

// ----------------------------------------------------
// АКТИВНЫЕ КАРТОЧКИ ПРИ СКРОЛЛЕ НА МОБИЛЬНЫХ (Scroll Highlight)
// ----------------------------------------------------
function initScrollHighlight() {
  // Запускаем только на мобильных/планшетах
  if (!window.matchMedia("(max-width: 1024px)").matches) return;

  const getCards = () => document.querySelectorAll(".project-card, .featured-card");

  function updateScrollHighlight() {
    const cards = getCards();
    if (cards.length === 0) return;

    const viewportCenter = window.innerHeight / 2;
    let closestCard = null;
    let minDistance = Infinity;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();

      // Игнорируем карточки, которые полностью вне экрана
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        card.classList.remove("active-scroll");
        return;
      }

      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestCard = card;
      }
    });

    // Порог: центр карточки должен быть в пределах 35% от центра экрана
    const threshold = window.innerHeight * 0.35;

    cards.forEach(card => {
      if (card === closestCard && minDistance < threshold) {
        card.classList.add("active-scroll");
      } else {
        card.classList.remove("active-scroll");
      }
    });
  }

  let scrollTimeout;
  window.addEventListener("scroll", () => {
    if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    scrollTimeout = requestAnimationFrame(updateScrollHighlight);
  }, { passive: true });

  // Запуск при рендере сетки и переключении фильтров
  document.addEventListener("gridrendered", updateScrollHighlight);

  // Первый запуск с задержкой, чтобы дать элементам загрузиться
  setTimeout(updateScrollHighlight, 500);
}

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
