import { projects, siteMeta, getYoutubeId } from "./api.js";
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

// Проекты, которые реально показываются в портфолио (без служебного шоурила и т.п.)
function getGridProjects() {
  return projects.filter(p => !p.hideFromGrid);
}

// Вспомогательная функция создания карточки проекта
export function createCard(project) {
  // Обёртка — grid-item + носитель glow-эффекта (::before/::after в CSS).
  // Карточка внутри закрывает градиент изнутри через overflow:hidden + z-index:1,
  // снаружи (inset: -2px) градиент видно как светящийся контур.
  const wrap = document.createElement("div");
  const aspectClass = project.aspect === "vertical" ? "card-glow-wrap--tall" : "card-glow-wrap--wide";
  wrap.className = `card-glow-wrap ${aspectClass} reveal`;
  wrap.dataset.projectId = project.id;

  const card = document.createElement("div");
  card.className = "project-card";

  const ytId = getYoutubeId(project.videoUrl);
  const onerrorAttr = ytId ? `onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg';"` : '';

  card.innerHTML = `
    <div class="card-thumbnail-container">
      <img src="${project.preview}" alt="${getLocalized(project.title)}" class="card-thumbnail-img" loading="lazy" ${onerrorAttr}>
      <button class="play-btn-small" aria-label="${t("aria_play_video")}" data-i18n-aria="aria_play_video">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <div class="card-duration-badge">${project.duration}</div>
      <div class="card-info">
        <div class="card-client">${project.client}</div>
        <h3 class="card-title">${getLocalized(project.title)}</h3>
        <span class="card-meta">${getLocalized(project.subCategory)}</span>
      </div>
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

  wrap.appendChild(card);
  return wrap;
}

// Рендеринг карточек проектов — единый CSS Grid, без ручной упаковки по форматам
export function renderGrid() {
  if (!projectGrid || !showMoreBtn) return;
  projectGrid.innerHTML = "";

  let filteredProjects = getGridProjects();
  if (currentFilter !== "all") {
    filteredProjects = filteredProjects.filter(p => {
      if (!p.category) return false;
      if (Array.isArray(p.category)) {
        return p.category.includes(currentFilter);
      }
      return p.category === currentFilter;
    });
  }

  const projectsToShow = showingAll ? filteredProjects : filteredProjects.slice(0, INITIAL_ITEMS_COUNT);
  projectsToShow.forEach(project => {
    projectGrid.appendChild(createCard(project));
  });

  // Скрытие/показ кнопки Show More
  if (filteredProjects.length <= INITIAL_ITEMS_COUNT || showingAll) {
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

// Настройка клика на Featured Project (Главное промо на Hero) и дублирующую кнопку "Смотреть шоурил"
export function setupFeaturedVideo() {
  const featuredCard = document.getElementById("featured-card-element");
  const showreelBtn = document.getElementById("hero-showreel-btn");
  if (!featuredCard) return;

  // Находим проект с флагом featured
  const featuredProject = projects.find(p => p.featured) || {
    title: {
      ru: "SHOWREEL 2025 | ВСЕ ФИЛЬМЫ ЗА 60 СЕКУНД",
      en: "SHOWREEL 2025 | ALL FILMS IN 60 SECONDS"
    },
    subCategory: {
      ru: "Шоурил монтажа",
      en: "Editing Showreel"
    },
    client: "Daria Evstigneeva Portfolio",
    videoUrl: "https://www.youtube.com/embed/TiMdGOTa48s",
    aspect: "horizontal",
    soft: "Premiere Pro · After Effects · DaVinci Resolve",
    desc: {
      ru: "Официальный шоурил режиссера монтажа Евстигнеевой Дарьи.",
      en: "Official video editing showreel of Daria Evstigneeva."
    }
  };

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

    img.src = featuredProject.preview || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : img.src);
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

  if (showreelBtn) {
    // Тоже избегаем дублирования слушателей при смене языка
    const newShowreelBtn = showreelBtn.cloneNode(true);
    showreelBtn.parentNode.replaceChild(newShowreelBtn, showreelBtn);
    newShowreelBtn.addEventListener("click", openFeatured);
  }
}

// "Клиенты" без реального внешнего заказчика (авторские/личные ролики) —
// не показываем их ни в бегущей строке, ни в счётчике клиентов
const NON_CLIENT_LABELS = new Set(["Личный проект", "Daria Evstigneeva Portfolio"]);
const isRealClient = (client) => Boolean(client) && !NON_CLIENT_LABELS.has(client);

// Бегущая строка клиентов — список собирается из projects.json.
// Одна «группа» повторяет список столько раз, чтобы быть не уже вьюпорта
// (иначе на широких экранах после ухода копии появляется пустота), и таких
// групп две — сдвиг на -50% даёт бесшовный цикл.
export function renderTrust() {
  const track = document.getElementById("trust-track");
  if (!track) return;

  const clients = [...new Set(getGridProjects().map(p => p.client).filter(isRealClient))];
  if (clients.length === 0) {
    const section = track.closest(".trust-section");
    if (section) section.style.display = "none";
    return;
  }

  const spans = clients.map(c => `<span>${c}</span>`).join("");
  const viewport = track.closest(".trust-viewport") || track.parentElement;

  // Измеряем ширину одного прохода списка, чтобы понять, сколько повторов
  // нужно для заполнения экрана.
  track.innerHTML = `<div class="trust-group">${spans}</div>`;
  const oneListWidth = track.firstElementChild.scrollWidth || 1;
  const need = viewport.clientWidth || window.innerWidth || oneListWidth;
  const repeats = Math.max(1, Math.ceil(need / oneListWidth));

  const groupSpans = spans.repeat(repeats);
  // Вторую группу помечаем aria-hidden — это визуальная копия для цикла,
  // скринридер читает список клиентов один раз.
  track.innerHTML =
    `<div class="trust-group">${groupSpans}</div>` +
    `<div class="trust-group" aria-hidden="true">${groupSpans}</div>`;
}

// Пересчёт числа повторов при ресайзе — чтобы копия оставалась шире экрана
// и на широких мониторах не появлялось пустое место.
let trustResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(trustResizeTimer);
  trustResizeTimer = setTimeout(renderTrust, 200);
});

// Статистика хиро-секции — считается из projects.json + meta.yearsExperience
export function renderStats() {
  const gridProjects = getGridProjects();
  const clients = new Set(gridProjects.map(p => p.client).filter(isRealClient));
  const categories = new Set();
  gridProjects.forEach(p => {
    if (!p.category) return;
    if (Array.isArray(p.category)) {
      p.category.forEach(c => categories.add(c));
    } else {
      categories.add(p.category);
    }
  });

  setStatValue("stat-projects", gridProjects.length, true);
  setStatValue("stat-years", siteMeta.yearsExperience, false);
  setStatValue("stat-clients", clients.size, true);
  setStatValue("stat-categories", categories.size, false);
}

function setStatValue(id, value, withPlus) {
  const el = document.getElementById(id);
  if (!el || value === undefined || value === null) return;
  el.textContent = withPlus ? `${value}+` : `${value}`;
}
