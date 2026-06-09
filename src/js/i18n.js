// Словарь локализации для статических элементов сайта
export const translations = {
  ru: {
    site_title: "SOF — Режиссер монтажа Дарья Евстигнеева | Портфолио",
    site_description: "Портфолио Евстигнеевой Дарьи — профессионального режиссера монтажа и контент-мейкера. Кинопродвижение, реклама, музыкальные клипы и трендовый вертикальный контент.",
    
    // Навигация
    nav_home: "ГЛАВНАЯ",
    nav_portfolio: "ПОРТФОЛИО",
    nav_contact: "КОНТАКТЫ",
    nav_start_project: "НАЧАТЬ ПРОЕКТ",
    
    // Главный экран (Hero)
    hero_title: "РАСКРЫВАЯ ИСТОРИИ ЧЕРЕЗ ФОРМУ И ДВИЖЕНИЕ",
    hero_subtitle: "Высококлассный бренд видеопроизводства.",
    hero_bio_name: "Евстигнеева Дарья — режиссер монтажа и контент-мейкер.",
    hero_bio_tagline: "Готова к работе с любыми медиаплощадками.",
    hero_cat_cinema: "кинопродвижение",
    hero_cat_brands: "реклама и бренды",
    hero_cat_music: "музыкальное видео",
    hero_cat_digital: "digital-контент",
    hero_cta: "Смотреть работы",
    hero_showreel_title: "ШОУРИЛ 2026 | ПРИМЕРЫ МОНТАЖА",
    
    // Секция Портфолио
    portfolio_title: "ПОРТФОЛИО",
    filter_all: "Все проекты",
    filter_cinema: "Кинопродвижение",
    filter_commercial: "Реклама",
    filter_music: "Клипы",
    filter_vertical: "Shorts / Reels",
    portfolio_show_more: "ПОКАЗАТЬ ЕЩЕ",
    
    // Подвал (Footer)
    footer_tagline: "Евстигнеева Дарья — Режиссер монтажа",
    
    // Модалка контактов
    contact_title: "КОНТАКТЫ",
    contact_subtitle: "Готова к сотрудничеству над вашим следующим проектом",
    
    // Видео-лайтбокс
    lightbox_label_soft: "Софт",
    lightbox_label_format: "Формат",
    lightbox_format_vertical: "Вертикальный (9:16)",
    lightbox_format_horizontal: "Горизонтальный (16:9)",
    lightbox_default_title: "Название проекта",
    lightbox_default_category: "Категория",
    lightbox_default_desc: "Описание процесса монтажа...",
    
    // Вспомогательные
    aria_close_player: "Закрыть плеер",
    aria_close_contacts: "Закрыть контакты",
    aria_toggle_theme: "Переключить тему",
    aria_toggle_lang: "Сменить язык"
  },
  en: {
    site_title: "SOF — Video Editor Daria Evstigneeva | Portfolio",
    site_description: "Daria Evstigneeva's Portfolio — professional video editor and content creator. Film promotion, commercials, music videos, and trending vertical content.",
    
    // Navigation
    nav_home: "HOME",
    nav_portfolio: "PORTFOLIO",
    nav_contact: "CONTACT",
    nav_start_project: "START A PROJECT",
    
    // Hero
    hero_title: "ELEVATING STORIES THROUGH FORM & MOVEMENT",
    hero_subtitle: "High-fashion video production brand.",
    hero_bio_name: "Daria Evstigneeva — video editor and content creator.",
    hero_bio_tagline: "Ready to work with any media platforms.",
    hero_cat_cinema: "film promotion",
    hero_cat_brands: "brands & commercials",
    hero_cat_music: "music video",
    hero_cat_digital: "digital content",
    hero_cta: "View works",
    hero_showreel_title: "SHOWREEL 2026 | EDITING SHOWCASE",
    
    // Portfolio
    portfolio_title: "PORTFOLIO",
    filter_all: "All Projects",
    filter_cinema: "Film Promotion",
    filter_commercial: "Commercials",
    filter_music: "Music Videos",
    filter_vertical: "Shorts / Reels",
    portfolio_show_more: "SHOW MORE",
    
    // Footer
    footer_tagline: "Daria Evstigneeva — Video Editor",
    
    // Contact modal
    contact_title: "CONTACTS",
    contact_subtitle: "Ready to collaborate on your next project",
    
    // Video Lightbox
    lightbox_label_soft: "Software",
    lightbox_label_format: "Format",
    lightbox_format_vertical: "Vertical (9:16)",
    lightbox_format_horizontal: "Horizontal (16:9)",
    lightbox_default_title: "Project Title",
    lightbox_default_category: "Category",
    lightbox_default_desc: "Editing process description...",
    
    // Accessibility & labels
    aria_close_player: "Close player",
    aria_close_contacts: "Close contacts",
    aria_toggle_theme: "Toggle theme",
    aria_toggle_lang: "Change language"
  }
};

export let currentLanguage = "ru";

// Инициализация языка из localStorage или настроек браузера
export function initLanguage() {
  const savedLang = localStorage.getItem("lang");
  if (savedLang && (savedLang === "ru" || savedLang === "en")) {
    currentLanguage = savedLang;
  } else {
    // По умолчанию русский
    currentLanguage = "ru";
  }
  applyLanguage(currentLanguage);
}

// Смена языка
export function toggleLanguage() {
  currentLanguage = currentLanguage === "ru" ? "en" : "ru";
  localStorage.setItem("lang", currentLanguage);
  applyLanguage(currentLanguage);
  
  // Перерендеринг динамических элементов (сетка проектов и главное видео)
  // Для этого мы вызываем кастомное событие
  const event = new CustomEvent("languagechanged", { detail: { lang: currentLanguage } });
  document.dispatchEvent(event);
}

// Функция для получения перевода по ключу
export function t(key) {
  return translations[currentLanguage]?.[key] || translations["ru"]?.[key] || key;
}

// Вспомогательный метод для получения локализованного объекта проекта
export function getLocalized(value) {
  if (value && typeof value === "object") {
    return value[currentLanguage] || value["ru"] || "";
  }
  return value || "";
}

// Применение языка к элементам DOM
export function applyLanguage(lang) {
  document.documentElement.setAttribute("lang", lang);
  
  // Меняем заголовок и описание страницы
  document.title = translations[lang].site_title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", translations[lang].site_description);
  }
  
  // Локализация статических текстовых элементов с атрибутом data-i18n
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Локализация placeholder или aria-label
  const ariaElements = document.querySelectorAll("[data-i18n-aria]");
  ariaElements.forEach(el => {
    const key = el.getAttribute("data-i18n-aria");
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute("aria-label", translations[lang][key]);
    }
  });

  // Локализация заголовков для социальных сетей в DOM
  const mailLink = document.getElementById("footer-contact-link");
  if (mailLink && lang === "en") {
    mailLink.textContent = "CONTACT";
  } else if (mailLink && lang === "ru") {
    mailLink.textContent = "КОНТАКТЫ";
  }

  // Обновление текста на переключателе языков
  const langToggleBtn = document.getElementById("lang-toggle");
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === "ru" ? "RU" : "EN";
  }
  const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
  if (mobileLangToggleBtn) {
    mobileLangToggleBtn.textContent = lang === "ru" ? "RU" : "EN";
  }
}
