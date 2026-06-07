import { initTheme, toggleTheme } from "./theme.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";

const themeToggleBtn = document.getElementById("theme-toggle");

async function init() {
  // Настройка темы
  initTheme();
  
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
}

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
