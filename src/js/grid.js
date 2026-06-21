import { projects, getYoutubeId, artTemplates } from "./api.js";
import { openLightbox } from "./lightbox.js";
import { INITIAL_ITEMS_COUNT } from "./config.js";
import { getLocalized, t } from "./i18n.js";

let projectGrid, filterButtons, showMoreBtn;
let currentFilter = "all";
let showingAll = false;

export function initGrid() {
  projectGrid = document.getElementById("project-grid");
  filterButtons = document.querySelectorAll(".filter-btn");
  showMoreBtn = document.getElementById("show-more-btn");

  if (!projectGrid || !filterButtons || !showMoreBtn) return;

  // Добавление слушателей для фильтрации
  filterButtons.forEach(btn => {
    btn.addEventListener("click", handleFilterClick);
  });
  
  // Кнопка "Show More"
  showMoreBtn.addEventListener("click", toggleShowMore);

  // Слушатель смены языка для авто-обновления сетки
  document.addEventListener("languagechanged", () => {
    renderGrid();
    setupFeaturedVideo();
  });
}

// Вспомогательная функция создания карточки проекта
export function createCard(project) {
  const card = document.createElement("div");
  
  if (project.type === "art") {
    const aspect = project.aspect === "vertical" ? "vertical" : (project.aspect === "wide" ? "wide" : "horizontal");
    card.className = `project-card art-block ${aspect}`;
    card.innerHTML = `
      <div class="art-title serif-text">${getLocalized(project.title)}</div>
      <div class="art-subtitle">${getLocalized(project.subtitle)}</div>
    `;
  } else {
    const aspect = project.aspect === "vertical" ? "vertical" : (project.aspect === "wide" ? "wide" : "horizontal");
    card.className = `project-card ${aspect}`;
    card.dataset.projectId = project.id;
    
    // Резервная ссылка на hqdefault для видео с YouTube (если maxresdefault вернет 404)
    const ytId = getYoutubeId(project.videoUrl);
    const onerrorAttr = ytId ? `onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg';"` : '';
    
    card.innerHTML = `
      <div class="card-thumbnail-container">
        <div class="featured-noise-overlay"></div>
        <img src="${project.preview}" alt="${getLocalized(project.title)}" class="card-thumbnail-img" loading="lazy" ${onerrorAttr}>
        <button class="play-btn-small" aria-label="${t("aria_play_video")}" data-i18n-aria="aria_play_video">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
        <div class="card-duration-badge">${project.duration}</div>
      </div>
      <div class="card-info">
        <div class="card-info-header">
          <h3 class="card-title">${getLocalized(project.title)}</h3>
          <span class="card-time-label">${project.duration}</span>
        </div>
        <span class="card-meta">${getLocalized(project.subCategory)} | ${project.client}</span>
      </div>
    `;
    
    card.setAttribute("tabindex", "0");
    card.addEventListener("click", () => openLightbox(project));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(project);
      }
    });
  }
  
  return card;
}

// Рендеринг карточек проектов
export function renderGrid() {
  if (!projectGrid || !showMoreBtn) return;
  projectGrid.innerHTML = "";
  
  // Фильтруем скрытые из сетки проекты
  const gridProjects = projects.filter(p => !p.hideFromGrid && p.type !== "art");
  
  // Фильтрация проектов по категориям
  let filteredVideos = gridProjects;
  if (currentFilter !== "all") {
    filteredVideos = gridProjects.filter(p => {
      if (!p.category) return false;
      if (Array.isArray(p.category)) {
        return p.category.includes(currentFilter);
      }
      return p.category === currentFilter;
    });
  }
  
  // Ограничение по количеству видео
  const videosToShow = showingAll ? filteredVideos : filteredVideos.slice(0, INITIAL_ITEMS_COUNT);
  
  // Массив для итогового рендеринга (подмешиваем арт-блоки каждые 3 видео, только во вкладке "Все проекты")
  const itemsToRender = [];
  let artCardIndex = 0;
  
  videosToShow.forEach((video, index) => {
    itemsToRender.push(video);
    
    // Вставляем арт-блок после каждых 3 видео (но не в самом конце и только во вкладке "Все проекты")
    if (currentFilter === "all" && (index + 1) % 3 === 0 && index !== videosToShow.length - 1 && artTemplates && artTemplates.length > 0) {
      const template = artTemplates[artCardIndex % artTemplates.length];
      itemsToRender.push({
        ...template,
        id: `art-filler-${template.id || artCardIndex}`,
        type: "art"
      });
      artCardIndex++;
    }
  });
  
  // Рендерим плоскую сетку
  itemsToRender.forEach(item => {
    projectGrid.appendChild(createCard(item));
  });
  
  // Скрытие/показ кнопки Show More
  if (filteredVideos.length <= INITIAL_ITEMS_COUNT || showingAll) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn.style.display = "inline-flex";
  }
  
  // Оповещаем об обновлении сетки для переподключения эффектов
  document.dispatchEvent(new CustomEvent("gridrendered"));
}

// Фильтрация
export function handleFilterClick(e) {
  filterButtons.forEach(btn => btn.classList.remove("active"));
  e.currentTarget.classList.add("active");
  
  currentFilter = e.currentTarget.dataset.filter;
  showingAll = false; // Сбрасываем "Показать все" при смене фильтра
  
  // Анимация сетки при смене категории
  projectGrid.style.opacity = 0;
  setTimeout(() => {
    renderGrid();
    projectGrid.style.opacity = 1;
  }, 200);
}

// Развернуть / Свернуть проекты
export function toggleShowMore() {
  showingAll = true;
  renderGrid();
}

// Настройка клика на Featured Project (Главное промо на Hero)
export function setupFeaturedVideo() {
  const featuredCard = document.getElementById("featured-card-element");
  if (!featuredCard) return;

  // Находим проект с флагом featured
  const featuredProject = projects.find(p => p.featured);
  
  if (featuredProject) {
    // Заполняем HTML карточки данными из файла
    const img = featuredCard.querySelector(".featured-thumbnail-img");
    const titleSpan = featuredCard.querySelector(".featured-title");
    
    if (img) {
      const ytId = getYoutubeId(featuredProject.videoUrl);
      
      // Устранение race condition: обработчик onerror устанавливаем ДО src
      if (ytId) {
        img.onerror = function() {
          img.onerror = null;
          img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        };
      }
      
      img.src = featuredProject.preview;
      img.alt = getLocalized(featuredProject.title);
    }
    if (titleSpan) {
      titleSpan.textContent = getLocalized(featuredProject.title);
    }
    
    const openFeatured = () => openLightbox(featuredProject);
    
    // Очищаем старые слушатели путем замены элемента (чтобы избежать дублирования)
    const newFeaturedCard = featuredCard.cloneNode(true);
    featuredCard.parentNode.replaceChild(newFeaturedCard, featuredCard);
    
    newFeaturedCard.addEventListener("click", openFeatured);
    newFeaturedCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFeatured();
      }
    });
  } else {
    // Дефолтный фолбек
    const fallbackProject = {
      title: {
        ru: "ШОУРИЛ 2026 | ПРИМЕРЫ МОНТАЖА",
        en: "SHOWREEL 2026 | EDITING SHOWCASE"
      },
      subCategory: {
        ru: "Шоурил монтажа",
        en: "Editing Showreel"
      },
      client: "Daria Evstigneeva Portfolio",
      videoUrl: "https://www.youtube.com/embed/n9xhJrPXy4g", // Ссылка на шоурил
      aspect: "horizontal",
      soft: "Premiere Pro · After Effects · DaVinci Resolve",
      desc: {
        ru: "Официальный шоурил режиссера монтажа Евстигнеевой Дарьи. Демонстрация ключевых приемов динамичного склеивания кадров, звукового дизайна, цветокоррекции и анимационной графики.",
        en: "Official video editing showreel of Daria Evstigneeva. Showcasing key techniques of dynamic cutting, sound design, color grading, and motion graphics."
      }
    };
    
    const openFallback = () => openLightbox(fallbackProject);
    
    const newFeaturedCard = featuredCard.cloneNode(true);
    featuredCard.parentNode.replaceChild(newFeaturedCard, featuredCard);
    
    newFeaturedCard.addEventListener("click", openFallback);
    newFeaturedCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFallback();
      }
    });
  }
}
