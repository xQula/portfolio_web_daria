import { initTheme, toggleTheme } from "./theme.js";
import { initLanguage, toggleLanguage } from "./i18n.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";

const themeToggleBtn = document.getElementById("theme-toggle");
const langToggleBtn = document.getElementById("lang-toggle");
const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
const burgerBtn = document.getElementById("mobile-menu-trigger");
const mobileDrawer = document.getElementById("mobile-drawer");
const drawerLinks = document.querySelectorAll(".drawer-link");

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

  // Переключатель тем
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
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

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
