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
  let artCardIndex = 0;
  
  // Функция для динамического получения очередной арт-плашки нужного формата
  function getNextArtCard(aspect) {
    if (!artTemplates || artTemplates.length === 0) {
      return {
        id: `art-filler-${artCardIndex++}`,
        type: "art",
        title: {
          ru: "МОЖЕТ БЫТЬ ДРУГИМ",
          en: "CAN BE DIFFERENT"
        },
        subtitle: "SENSE OF FORM",
        aspect: aspect
      };
    }
    const template = artTemplates[artCardIndex % artTemplates.length];
    artCardIndex++;
    return {
      id: `art-filler-${template.id || artCardIndex}`,
      type: "art",
      title: template.title,
      subtitle: template.subtitle,
      aspect: aspect
    };
  }
  
  // Фильтруем скрытые из сетки проекты и исключаем арт-блоки (они используются только как заполнители)
  const gridProjects = projects.filter(p => !p.hideFromGrid && p.type !== "art");
  
  // Фильтрация проектов по категориям
  let filteredVideos = gridProjects;
  if (currentFilter !== "all") {
    filteredVideos = gridProjects.filter(p => {
      // Исключаем статические арт-блоки из конкретных категорий видео
      if (p.type === "art") return false;
      
      if (!p.category) return false;
      if (Array.isArray(p.category)) {
        return p.category.includes(currentFilter);
      }
      return p.category === currentFilter;
    });
  }
  
  // Ограничение по количеству
  const videosToShow = showingAll ? filteredVideos : filteredVideos.slice(0, INITIAL_ITEMS_COUNT);
  
  // Разделяем проекты по форматам
  const wideVideos = videosToShow.filter(p => p.aspect === "wide");
  const verticalVideos = videosToShow.filter(p => p.aspect === "vertical");
  const horizontalVideos = videosToShow.filter(p => p.aspect !== "vertical" && p.aspect !== "wide");
  
  let isLeftVertical = true;
  let groupCount = 0;
  const ART_INJECT_EVERY = 2; // Вставлять арт-карточку каждые N видео-групп
  const MAX_ART_INJECTIONS = 2; // Максимум арт-вставок за весь грид
  let artInjectionsUsed = 0;
  
  // Вспомогательная функция: вставить арт-карточку между видео-группами
  function maybeInjectArtCard() {
    groupCount++;
    if (
      groupCount % ART_INJECT_EVERY === 0 &&
      artInjectionsUsed < MAX_ART_INJECTIONS &&
      artTemplates && artTemplates.length > 0
    ) {
      artInjectionsUsed++;
      const artProject = getNextArtCard("horizontal");
      const artGroupDiv = document.createElement("div");
      artGroupDiv.className = "portfolio-group wide-group";
      artGroupDiv.appendChild(createCard(artProject));
      projectGrid.appendChild(artGroupDiv);
    }
  }
  
  // Группируем проекты в идеальные строки/блоки без пустот
  while (wideVideos.length > 0 || verticalVideos.length > 0 || horizontalVideos.length > 0) {
    // 1. Широкоформатные видео (Wide)
    if (wideVideos.length > 0) {
      const project = wideVideos.shift();
      const groupDiv = document.createElement("div");
      groupDiv.className = "portfolio-group wide-group";
      groupDiv.appendChild(createCard(project));
      projectGrid.appendChild(groupDiv);
      maybeInjectArtCard();
      continue;
    }
    
    // 2. Асимметричное трио (1V + 2H), если есть горизонтальное видео для пары
    if (verticalVideos.length > 0 && horizontalVideos.length > 0) {
      const vProject = verticalVideos.shift();
      const h1Project = horizontalVideos.shift();
      let h2Project = null;
      
      if (horizontalVideos.length > 0) {
        h2Project = horizontalVideos.shift();
      } else {
        h2Project = getNextArtCard("horizontal");
      }
      
      const groupDiv = document.createElement("div");
      groupDiv.className = `portfolio-group ${isLeftVertical ? "left-vertical" : "right-vertical"}`;
      
      if (isLeftVertical) {
        groupDiv.appendChild(createCard(vProject));
        groupDiv.appendChild(createCard(h1Project));
        groupDiv.appendChild(createCard(h2Project));
      } else {
        groupDiv.appendChild(createCard(h1Project));
        groupDiv.appendChild(createCard(h2Project));
        groupDiv.appendChild(createCard(vProject));
      }
      
      projectGrid.appendChild(groupDiv);
      isLeftVertical = !isLeftVertical;
      maybeInjectArtCard();
      continue;
    }
    
    // 3. Если остались вертикальные видео, но горизонтальных видео больше нет -> группируем по парам (2V)
    if (verticalVideos.length > 0 && horizontalVideos.length === 0) {
      const v1Project = verticalVideos.shift();
      let v2Project = null;
      
      if (verticalVideos.length > 0) {
        v2Project = verticalVideos.shift();
      } else {
        v2Project = getNextArtCard("vertical");
      }
      
      const groupDiv = document.createElement("div");
      groupDiv.className = "portfolio-group";
      groupDiv.appendChild(createCard(v1Project));
      groupDiv.appendChild(createCard(v2Project));
      projectGrid.appendChild(groupDiv);
      maybeInjectArtCard();
      continue;
    }
    
    // 4. Если остались только горизонтальные видео -> группируем по парам (2H)
    if (horizontalVideos.length > 0) {
      const h1Project = horizontalVideos.shift();
      let h2Project = null;
      
      if (horizontalVideos.length > 0) {
        h2Project = horizontalVideos.shift();
      } else {
        h2Project = getNextArtCard("horizontal");
      }
      
      const groupDiv = document.createElement("div");
      groupDiv.className = "portfolio-group";
      groupDiv.appendChild(createCard(h1Project));
      groupDiv.appendChild(createCard(h2Project));
      projectGrid.appendChild(groupDiv);
      maybeInjectArtCard();
      continue;
    }
  }
  
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
