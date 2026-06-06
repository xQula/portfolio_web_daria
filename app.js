/* ----------------------------------------------------
   ДИНАМИЧЕСКАЯ БАЗА ДАННЫХ ПРОЕКТОВ
   ---------------------------------------------------- */
let projects = [];

// Функция для динамической загрузки всех проектов
async function loadProjects() {
  const response = await fetch("projects/index.json");
  if (!response.ok) {
    throw new Error("Не удалось загрузить projects/index.json");
  }
  const filenames = await response.json();
  
  const fetchPromises = filenames.map(async (filename) => {
    const res = await fetch(`projects/${filename}`);
    if (!res.ok) {
      throw new Error(`Не удалось загрузить projects/${filename}`);
    }
    return res.json();
  });
  
  projects = await Promise.all(fetchPromises);
}

/* ----------------------------------------------------
   ИНИЦИАЛИЗАЦИЯ И РЕНДЕРИНГ
   ---------------------------------------------------- */
const projectGrid = document.getElementById("project-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const showMoreBtn = document.getElementById("show-more-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

let currentFilter = "all";
let showingAll = false;
const INITIAL_ITEMS_COUNT = 6;

// Функция инициализации страницы
async function init() {
  // Настройка темы
  initTheme();
  
  // Загружаем проекты из файлов
  try {
    await loadProjects();
  } catch (err) {
    console.error("Ошибка при загрузке проектов:", err);
  }
  
  // Рендеринг сетки
  renderGrid();
  
  // Добавление слушателей для фильтрации
  filterButtons.forEach(btn => {
    btn.addEventListener("click", handleFilterClick);
  });
  
  // Кнопка "Show More"
  showMoreBtn.addEventListener("click", toggleShowMore);
  
  // Переключатель тем
  themeToggleBtn.addEventListener("click", toggleTheme);
  
  // Настройка главного featured-видео на первом экране
  setupFeaturedVideo();
  
  // Настройка лайтбокса
  initLightbox();
  
  // Настройка модального окна контактов
  initContactModal();
}


// Рендеринг карточек проектов
function renderGrid() {
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
  
  itemsToShow.forEach(project => {
    const card = document.createElement("div");
    
    if (project.type === "art") {
      const aspect = project.aspect === "vertical" ? "vertical" : "horizontal";
      card.className = `project-card art-block ${aspect}`;
      card.innerHTML = `
        <div class="art-title serif-text">${project.title}</div>
        <div class="art-subtitle">${project.subtitle}</div>
      `;
    } else {
      card.className = `project-card ${project.aspect}`;
      card.dataset.projectId = project.id;
      
      const playBtnSize = project.aspect === "vertical" ? "play-btn-small" : "play-btn-small";
      
      card.innerHTML = `
        <div class="card-thumbnail-container">
          <div class="featured-noise-overlay"></div>
          <img src="${project.preview}" alt="${project.title}" class="card-thumbnail-img" loading="lazy">
          <button class="${playBtnSize}" aria-label="Смотреть видео">
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
    
    projectGrid.appendChild(card);
  });
  
  // Скрытие/показ кнопки Show More
  if (filtered.length <= INITIAL_ITEMS_COUNT || showingAll) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn.style.display = "inline-flex";
  }
}

// Фильтрация
function handleFilterClick(e) {
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
function toggleShowMore() {
  showingAll = true;
  renderGrid();
}

/* ----------------------------------------------------
   УПРАВЛЕНИЕ ЛАЙТБОКСОМ (ВИДЕОПЛЕЕРОМ)
   ---------------------------------------------------- */
const lightbox = document.getElementById("video-lightbox");
const lightboxClose = document.getElementById("lightbox-close");
const videoWrapper = document.getElementById("lightbox-video-wrapper");
const lbTitle = document.getElementById("lightbox-title");
const lbCategory = document.getElementById("lightbox-category");
const lbDetails = document.getElementById("lightbox-details");
const lbDescription = document.getElementById("lightbox-description");

function initLightbox() {
  lightboxClose.addEventListener("click", closeLightbox);
  
  // Закрытие по клику вне контента
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Закрытие по ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
}

function openLightbox(project) {
  lbTitle.textContent = project.title;
  lbCategory.textContent = `${project.subCategory} | ${project.client}`;
  lbDescription.textContent = project.desc;
  
  // Детали софта
  lbDetails.innerHTML = `
    <div><strong>Софт:</strong> ${project.soft}</div>
    <div><strong>Формат:</strong> ${project.aspect === "vertical" ? "Вертикальный (9:16)" : "Горизонтальный (16:9)"}</div>
  `;
  
  // Очистка предыдущего плеера
  videoWrapper.innerHTML = "";
  
  // Определение классов адаптивности для плеера
  videoWrapper.className = "lightbox-video-wrapper";
  if (project.aspect === "vertical") {
    videoWrapper.classList.add("vertical");
  } else {
    videoWrapper.classList.add("horizontal");
  }
  
  // Создание iframe плеера
  const iframe = document.createElement("iframe");
  iframe.src = project.videoUrl;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  
  videoWrapper.appendChild(iframe);
  
  // Показ модального окна
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Блокировка скролла сайта
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // Разблокировка скролла
  
  // Удаляем iframe, чтобы остановить воспроизведение видео
  videoWrapper.innerHTML = "";
}

// Настройка клика на Featured Project (Главное промо на Hero)
function setupFeaturedVideo() {
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

/* ----------------------------------------------------
   ЛОГИКА СМЕНЫ ТЕМ (DARK / LIGHT)
   ---------------------------------------------------- */
function initTheme() {
  // Проверяем сохраненную тему или системные настройки
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    // По умолчанию ставим светлую тему (Light Editorial Mode)
    document.documentElement.setAttribute("data-theme", "light");
  }
}

function toggleTheme(e) {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  // Если браузер не поддерживает View Transitions, просто переключаем тему
  if (!document.startViewTransition) {
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    return;
  }
  
  // Координаты клика для начала волны (или центр экрана, если клик без координат)
  const x = e.clientX ?? window.innerWidth / 2;
  const y = e.clientY ?? window.innerHeight / 2;
  
  // Расстояние до самого дальнего угла экрана
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  
  const transition = document.startViewTransition(() => {
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
  
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];
    
    document.documentElement.animate(
      {
        clipPath: clipPath
      },
      {
        duration: 550,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });
}

/* ----------------------------------------------------
   УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ КОНТАКТОВ
   ---------------------------------------------------- */
const contactModal = document.getElementById("contact-modal");
const contactLink = document.getElementById("contact-link");
const contactClose = document.getElementById("contact-close");

function initContactModal() {
  if (!contactLink || !contactModal || !contactClose) return;

  contactLink.addEventListener("click", (e) => {
    e.preventDefault();
    openContactModal();
  });

  contactClose.addEventListener("click", closeContactModal);

  // Закрытие по клику вне контента
  contactModal.addEventListener("click", (e) => {
    if (e.target === contactModal) {
      closeContactModal();
    }
  });

  // Закрытие по ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && contactModal.classList.contains("active")) {
      closeContactModal();
    }
  });
}

function openContactModal() {
  contactModal.classList.add("active");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeContactModal() {
  contactModal.classList.remove("active");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
