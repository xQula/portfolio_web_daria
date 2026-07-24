import { initLanguage, toggleLanguage } from "./i18n.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo, renderTrust, renderStats } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";
import { initMotion, animateHeroTitle } from "./motion.js";

const langToggleBtn = document.getElementById("lang-toggle");
const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
const burgerBtn = document.getElementById("mobile-menu-trigger");
const mobileDrawer = document.getElementById("mobile-drawer");
const drawerLinks = document.querySelectorAll(".drawer-link");

async function init() {
  // Настройка языка
  initLanguage();
  renderHeroWords();
  document.addEventListener("languagechanged", renderHeroWords);

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
  initMotion();
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
// КИНЕТИЧЕСКИЙ ЗАГОЛОВОК HERO: символы проявляются по очереди при загрузке
// (анимацию делает motion.js через GSAP). При смене языка текст
// переустанавливается без повторного проигрывания анимации.
// ----------------------------------------------------
let heroTitleAnimated = false;

function renderHeroWords() {
  const el = document.querySelector(".hero-title");
  if (!el) return;

  // Символы группируются по словам (.word, white-space: nowrap в CSS),
  // иначе перенос строки мог бы разорвать слово посередине —
  // GSAP всё равно анимирует все .ch разом, независимо от вложенности.
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((word) => {
      const chars = [...word].map((c) => `<span class="ch">${c}</span>`).join("");
      return `<span class="word">${chars}</span>`;
    })
    .join(" ");

  if (!heroTitleAnimated) {
    animateHeroTitle(el.querySelectorAll(".ch"));
    heroTitleAnimated = true;
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
