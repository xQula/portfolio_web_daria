/* ----------------------------------------------------
   БАЗА ДАННЫХ ПРОЕКТОВ (ПОРТФОЛИО ДАРЬИ ЕВСТИГНЕЕВОЙ)
   ---------------------------------------------------- */
const projects = [
  {
    id: 1,
    type: "video",
    title: "VELVET & LIGHT",
    duration: "2:15",
    category: "commercial",
    subCategory: "Fashion film",
    client: "NINA RICCI",
    // Демонстрационное видео высокой четкости с YouTube
    videoUrl: "https://www.youtube.com/embed/n9xhJrPXy4g", 
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    soft: "Adobe Premiere Pro · DaVinci Resolve",
    desc: "Fashion-ролик с акцентом на мягкую игру света и текстур одежды. Использован динамический ритмичный монтаж и глубокая цветокоррекция в соответствии с брендбуком."
  },
  {
    id: 2,
    type: "video",
    title: "MODERN MOVEMENT",
    duration: "3:01",
    category: "music",
    subCategory: "Dance film",
    client: "NYFW Showcase",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop",
    soft: "Adobe Premiere Pro · After Effects",
    desc: "Динамичный монтаж танцевального перформанса. Ключевая фишка — использование эффектов speed ramp (замедление/ускорение) и точная синхронизация движений под ритм саундтрека."
  },
  {
    id: 3,
    type: "video",
    title: "URBAN GEOMETRY",
    duration: "1:58",
    category: "commercial",
    subCategory: "Architectural film",
    client: "KEFN",
    videoUrl: "https://www.youtube.com/embed/tgbNymZ7vqY",
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    soft: "DaVinci Resolve · Audition",
    desc: "Коммерческий презентационный ролик архитектурных решений. Строгая композиция кадра, выверенные переходы и атмосферный саунд-дизайн, подчеркивающий монументальность."
  },
  {
    id: 4,
    type: "art", // Арт-вставка в сетку (шахматный эффект из брендбука)
    title: "CAN BE DIFFERENT",
    subtitle: "SENCE OF FORM",
    category: "all"
  },
  {
    id: 5,
    type: "video",
    title: "CYBERPUNK RUNWAY",
    duration: "0:45",
    category: "vertical",
    subCategory: "Instagram Reels / TikTok",
    client: "SOF Studio",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Имитация вертикального Shorts
    aspect: "vertical",
    preview: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
    soft: "Adobe Premiere Pro · CapCut Pro",
    desc: "Трендовый вертикальный ролик для соцсетей. Применены эффекты неонового свечения, глитчи и зум-переходы под трендовый аудиозвук."
  },
  {
    id: 6,
    type: "video",
    title: "THE COLLECTION",
    duration: "4:30",
    category: "commercial",
    subCategory: "Runway highlights",
    client: "NYFW 2026",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop",
    soft: "Premiere Pro · DaVinci Resolve",
    desc: "Сборный отчетный ролик с показов недели моды в Нью-Йорке. Сочетание репортажной динамики и плавных фэшн-склеек."
  },
  {
    id: 7,
    type: "video",
    title: "COUTURE STORY",
    duration: "2:45",
    category: "music",
    subCategory: "Editorial MV",
    client: "EDITORIAL",
    videoUrl: "https://www.youtube.com/embed/n9xhJrPXy4g",
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
    soft: "Adobe Premiere Pro · Audition",
    desc: "Музыкальный клип с упором на сторителлинг через образы. Мягкая склейка по движению, контрастные переходы."
  },
  {
    id: 8,
    type: "video",
    title: "STREET CULTURE",
    duration: "0:30",
    category: "vertical",
    subCategory: "Shorts / Reels",
    client: "Streetwear Brand",
    videoUrl: "https://www.youtube.com/embed/tgbNymZ7vqY", // Вертикальный плеер
    aspect: "vertical",
    preview: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop",
    soft: "Adobe Premiere Pro · After Effects",
    desc: "Промо-ролик уличного бренда одежды в вертикальном формате. Высокая плотность монтажных склеек, стилизованные глитч-переходы."
  },
  {
    id: 9,
    type: "video",
    title: "THE ESSENCE ROAD",
    duration: "3:40",
    category: "trailers",
    subCategory: "Teaser / Trailer",
    client: "LEOKBOO Production",
    // Демонстрация интеграции с RuTube (пример embed-ссылки)
    videoUrl: "https://rutube.ru/play/embed/b53b817e07a6a42217c91ca7c9082260", 
    aspect: "horizontal",
    preview: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
    soft: "DaVinci Resolve · Audition",
    desc: "Тизер кинематографического проекта. Выполнен на стыке документальной драмы и фэшн-эстетики. Использована интеграция видеохостинга RuTube."
  }
];

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
function init() {
  // Настройка темы
  initTheme();
  
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
  
  // Фильтрация проектов
  let filtered = projects;
  if (currentFilter !== "all") {
    filtered = projects.filter(p => p.category === currentFilter || p.type === "art");
  }
  
  // Ограничение по количеству
  const itemsToShow = showingAll ? filtered : filtered.slice(0, INITIAL_ITEMS_COUNT);
  
  itemsToShow.forEach(project => {
    const card = document.createElement("div");
    
    if (project.type === "art") {
      card.className = "project-card art-block horizontal";
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
