import { projects, getYoutubeId } from "./api.js";
import { openLightbox } from "./lightbox.js";
import { INITIAL_ITEMS_COUNT } from "./config.js";

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
}

// Вспомогательная функция создания карточки проекта
export function createCard(project) {
  const card = document.createElement("div");
  
  if (project.type === "art") {
    const aspect = project.aspect === "vertical" ? "vertical" : (project.aspect === "wide" ? "wide" : "horizontal");
    card.className = `project-card art-block ${aspect}`;
    card.innerHTML = `
      <div class="art-title serif-text">${project.title}</div>
      <div class="art-subtitle">${project.subtitle}</div>
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
        <img src="${project.preview}" alt="${project.title}" class="card-thumbnail-img" loading="lazy" ${onerrorAttr}>
        <button class="play-btn-small" aria-label="Смотреть видео">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
        <div class="card-duration-badge">${project.duration}</div>
      </div>
      <div class="card-info">
        <div class="card-info-header">
          <h3 class="card-title">${project.title}</h3>
          <span class="card-time-label">${project.duration}</span>
        </div>
        <span class="card-meta">${project.subCategory} | ${project.client}</span>
      </div>
    `;
    
    card.addEventListener("click", () => openLightbox(project));
  }
  
  return card;
}

// Рендеринг карточек проектов
export function renderGrid() {
  if (!projectGrid || !showMoreBtn) return;
  projectGrid.innerHTML = "";
  
  // Фильтруем скрытые из сетки проекты
  const gridProjects = projects.filter(p => !p.hideFromGrid);
  
  // Фильтрация проектов
  let filtered = gridProjects;
  if (currentFilter !== "all") {
    filtered = gridProjects.filter(p => p.category === currentFilter || p.type === "art");
  }
  
  // Ограничение по количеству
  const itemsToShow = showingAll ? filtered : filtered.slice(0, INITIAL_ITEMS_COUNT);
  
  // Копия пула проектов для группировки
  const pool = [...itemsToShow];
  let isLeftVertical = true;
  
  while (pool.length > 0) {
    // 1. Если проект широкоформатный, выводим его отдельной строкой во всю ширину
    if (pool[0].aspect === "wide") {
      const project = pool.shift();
      const groupDiv = document.createElement("div");
      groupDiv.className = "portfolio-group wide-group";
      groupDiv.appendChild(createCard(project));
      projectGrid.appendChild(groupDiv);
      continue;
    }
    
    // 2. Ищем 1 вертикальный и 2 горизонтальных проекта
    const vIndex = pool.findIndex(p => p.aspect === "vertical");
    const h1Index = pool.findIndex(p => p.aspect !== "vertical" && p.aspect !== "wide");
    let h2Index = -1;
    if (h1Index !== -1) {
      h2Index = pool.findIndex((p, idx) => idx > h1Index && p.aspect !== "vertical" && p.aspect !== "wide");
    }
    
    // Если нашли полный комплект для группы
    if (vIndex !== -1 && h1Index !== -1 && h2Index !== -1) {
      const vProject = pool[vIndex];
      const h1Project = pool[h1Index];
      const h2Project = pool[h2Index];
      
      // Удаляем из пула в порядке убывания индексов, чтобы избежать смещения
      const indicesToRemove = [vIndex, h1Index, h2Index].sort((a, b) => b - a);
      indicesToRemove.forEach(idx => pool.splice(idx, 1));
      
      const groupDiv = document.createElement("div");
      groupDiv.className = `portfolio-group ${isLeftVertical ? "left-vertical" : "right-vertical"}`;
      
      if (isLeftVertical) {
        // Вертикальный слева, два горизонтальных справа
        groupDiv.appendChild(createCard(vProject));
        groupDiv.appendChild(createCard(h1Project));
        groupDiv.appendChild(createCard(h2Project));
      } else {
        // Два горизонтальных слева, вертикальный справа
        groupDiv.appendChild(createCard(h1Project));
        groupDiv.appendChild(createCard(h2Project));
        groupDiv.appendChild(createCard(vProject));
      }
      
      projectGrid.appendChild(groupDiv);
      isLeftVertical = !isLeftVertical; // Чередуем стороны для следующего блока
    } else if (vIndex !== -1 && h1Index !== -1) {
      // Блок из 2-х проектов: 1 вертикальный + 1 горизонтальный (сохраняем чередование)
      const vProject = pool[vIndex];
      const hProject = pool[h1Index];
      
      const indicesToRemove = [vIndex, h1Index].sort((a, b) => b - a);
      indicesToRemove.forEach(idx => pool.splice(idx, 1));
      
      const groupDiv = document.createElement("div");
      groupDiv.className = `portfolio-group ${isLeftVertical ? "left-vertical" : "right-vertical"}`;
      
      if (isLeftVertical) {
        groupDiv.appendChild(createCard(vProject));
        groupDiv.appendChild(createCard(hProject));
      } else {
        groupDiv.appendChild(createCard(hProject));
        groupDiv.appendChild(createCard(vProject));
      }
      
      projectGrid.appendChild(groupDiv);
      isLeftVertical = !isLeftVertical; // Чередуем стороны
    } else {
      // 3. Фолбек: если не получается собрать полную группу (1 вертикальный + 2 горизонтальных),
      // просто выводим оставшиеся проекты в обычном 2-колоночном потоке
      const remaining = pool.splice(0, pool.length);
      const groupDiv = document.createElement("div");
      groupDiv.className = "portfolio-group fallback-group";
      
      remaining.forEach(project => {
        groupDiv.appendChild(createCard(project));
      });
      projectGrid.appendChild(groupDiv);
    }
  }
  
  // Скрытие/показ кнопки Show More
  if (filtered.length <= INITIAL_ITEMS_COUNT || showingAll) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn.style.display = "inline-flex";
  }
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
      img.src = featuredProject.preview;
      img.alt = featuredProject.title;
      
      const ytId = getYoutubeId(featuredProject.videoUrl);
      if (ytId) {
        img.onerror = function() {
          img.onerror = null;
          img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        };
      }
    }
    if (titleSpan) {
      titleSpan.textContent = featuredProject.title;
    }
    
    featuredCard.addEventListener("click", () => {
      openLightbox(featuredProject);
    });
  } else {
    // Дефолтный фолбек
    featuredCard.addEventListener("click", () => {
      openLightbox({
        title: "SHOWREEL 2026 | EDITING SHOWCASE",
        subCategory: "Editing Showreel",
        client: "Daria Evstigneeva Portfolio",
        videoUrl: "https://www.youtube.com/embed/n9xhJrPXy4g", // Ссылка на шоурил
        aspect: "horizontal",
        soft: "Premiere Pro · After Effects · DaVinci Resolve",
        desc: "Официальный шоурил режиссера монтажа Евстигнеевой Дарьи. Демонстрация ключевых приемов динамичного склеивания кадров, звукового дизайна, цветокоррекции и анимационной графики."
      });
    });
  }
}
