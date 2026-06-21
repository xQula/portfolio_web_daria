import { initTheme, toggleTheme } from "./theme.js";
import { initLanguage, toggleLanguage } from "./i18n.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";

const themeToggleBtn = document.getElementById("theme-toggle");
const mobileThemeToggleBtn = document.getElementById("mobile-theme-toggle");
const langToggleBtn = document.getElementById("lang-toggle");
const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
const burgerBtn = document.getElementById("mobile-menu-trigger");
const mobileDrawer = document.getElementById("mobile-drawer");
const drawerLinks = document.querySelectorAll(".drawer-link");

// Глобальные переменные для плавного скролла и курсора
let lenisInstance;

async function init() {
  // Настройка темы и языка
  initTheme();
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
  
  // Рендеринг сетки и главного видео
  renderGrid();
  setupFeaturedVideo();

  // Инициализация Lenis и кастомного курсора
  initScroll();
  initCustomCursor();

  // Переключатель тем (кнопка скрыта в CSS, но обработчики оставляем для совместимости)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }
  if (mobileThemeToggleBtn) {
    mobileThemeToggleBtn.addEventListener("click", toggleTheme);
  }

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
// ЛОГИКА ПЛАВНОГО СКРОЛЛА (Lenis)
// ----------------------------------------------------
function initScroll() {
  if (typeof Lenis !== "undefined") {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Плавный скролл до якорей через Lenis API
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          lenisInstance.scrollTo(targetEl, {
            offset: -84 // Высота липкого хедера
          });
        }
      });
    });
  }
}

// ----------------------------------------------------
// ЛОГИКА КАСТОМНОГО МАГНИТНОГО КУРСОРA И СВЕЧЕНИЯ
// ----------------------------------------------------
function initCustomCursor() {
  const cursor = document.getElementById("custom-cursor");
  const glow = document.getElementById("cursor-glow");
  if (!cursor) return;

  // Отключаем на устройствах без мыши (тач-экраны)
  if (window.matchMedia("(hover: none)").matches) {
    cursor.style.display = "none";
    if (glow) glow.style.display = "none";
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  
  // Координаты для сглаженного следования внешнего круга
  let circleX = mouseX;
  let circleY = mouseY;

  let hasMoved = false;

  window.addEventListener("pointermove", (e) => {
    // Игнорируем тач-события
    if (e.pointerType === "touch") return;

    if (!hasMoved) {
      hasMoved = true;
      cursor.classList.add("custom-cursor--visible");
      if (glow) glow.classList.add("cursor-glow--visible");
    }

    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
      cursor.classList.remove("custom-cursor--visible");
      if (glow) glow.classList.remove("cursor-glow--visible");
    }
  });

  // Цикл отрисовки через requestAnimationFrame
  function updatePhysics() {
    // Внешний круг следует с инерцией
    const circleEase = 0.15;
    circleX += (mouseX - circleX) * circleEase;
    circleY += (mouseY - circleY) * circleEase;

    // Контейнер курсора следует мгновенно
    cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

    // Круг и текстовая метка смещаются относительно начала координат контейнера
    const dx = circleX - mouseX;
    const dy = circleY - mouseY;
    
    const circle = cursor.querySelector(".cursor-circle");
    const playLabel = cursor.querySelector(".cursor-play-label");
    
    if (circle) {
      circle.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    }
    if (playLabel) {
      playLabel.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    }

    // Радиальный свет следует за курсором в фоне
    if (glow) {
      glow.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);

  // Делегирование событий наведения мыши для высокой производительности и динамической сетки
  document.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (!target) return;

    // Ссылки и кнопки
    if (target.closest("a, button, [role='button'], .filter-btn, .lang-toggle-btn")) {
      cursor.classList.add("hover-link");
    }

    // Видео-карточки (Главный шоурил и видео в сетке)
    if (target.closest(".featured-card, .project-card:not(.art-block)")) {
      cursor.classList.add("hover-video");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const target = e.target;
    if (!target) return;

    if (target.closest("a, button, [role='button'], .filter-btn, .lang-toggle-btn")) {
      cursor.classList.remove("hover-link");
    }
    if (target.closest(".featured-card, .project-card:not(.art-block)")) {
      cursor.classList.remove("hover-video");
    }
  });
}

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
