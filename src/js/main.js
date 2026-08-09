import { initLanguage, toggleLanguage, t } from "./i18n.js";
import { loadProjects } from "./api.js";
import { initGrid, renderGrid, setupFeaturedVideo, renderTrust, renderStats } from "./grid.js";
import { initLightbox } from "./lightbox.js";
import { initContactModal } from "./contact.js";
import { initMotion } from "./motion.js";
import { initNeonCursor } from "./neon-cursor.js";
import { initPreloader } from "./preloader.js";

const langToggleBtn = document.getElementById("lang-toggle");
const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");
const burgerBtn = document.getElementById("mobile-menu-trigger");
const mobileDrawer = document.getElementById("mobile-drawer");
const drawerLinks = document.querySelectorAll(".drawer-link");

function init() {
  // Экран загрузки — перекрывает страницу до готовности критичных ресурсов,
  // не блокирует остальную инициализацию (см. src/js/preloader.js)
  initPreloader();

  // Настройка языка
  initLanguage();

  // Инициализация компонентов, не зависящих от данных проектов
  initGrid();
  initLightbox();
  initContactModal();

  // Слой моушна премиального лендинга
  initStickyHeader();
  initMotion();
  initScrollHighlight();

  // Неоновый шлейф за курсором
  initNeonCursor();

  // Чипсы контактов — копирование по клику
  initContactChips();

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
        burgerBtn.setAttribute("aria-label", t("burger_menu"));
        burgerBtn.focus();
      });
    });
  }

  // Загрузка проектов идёт параллельно с остальной инициализацией — рендер
  // сетки/шоурила/трастов/статистики не должен блокировать хедер, моушн и курсор.
  loadProjects()
    .then(() => {
      renderGrid();
      setupFeaturedVideo();
      renderTrust();
      renderStats();
    })
    .catch((err) => {
      console.error("Ошибка при загрузке проектов:", err);
    });
}

// ----------------------------------------------------
// ЛИПКИЙ ХЕДЕР: прозрачный вверху страницы, уплотняется при скролле
// ----------------------------------------------------
function initStickyHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("site-header--solid", window.scrollY > 40);
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

// ----------------------------------------------------
// АКТИВНЫЕ КАРТОЧКИ ПРИ СКРОЛЛЕ НА МОБИЛЬНЫХ (Scroll Highlight)
// ----------------------------------------------------
function initScrollHighlight() {
  // Запускаем только на мобильных/планшетах
  if (!window.matchMedia("(max-width: 1024px)").matches) return;

  // Допуск по вертикали для карточек в одной строке грида: у настоящих
  // соседей по строке rect.top идентичен, эпсилон лишь страхует от
  // суб-пиксельных округлений.
  const ROW_EPSILON = 2; // px

  const getCards = () => document.querySelectorAll(".project-card, .featured-card, .stat-card, .service-card");

  // .active-scroll триггерит CSS transform (translateY/scale). getBoundingClientRect()
  // отражает этот transform в реальном времени, включая промежуточные кадры transition —
  // если мерить позицию им, включение подсветки само сдвигает измеряемые координаты и
  // получается обратная связь: карточка включается → её rect смещается → на следующем
  // скролл-кадре она "выходит" из победителей → выключается → rect возвращается →
  // снова "выигрывает" → и так по кругу (видно как моргание). offsetTop/offsetHeight
  // задают позицию в потоке документа и transform на них не влияет, поэтому меряем ими.
  function getLayoutTop(el) {
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return top - window.scrollY;
  }

  // Группируем карточки в "строки": сначала по общему родителю (чтобы
  // карточки из разных сеток/секций никогда не попадали в одну группу),
  // затем внутри родителя — по близости top.
  function groupIntoRows(visibleCards) {
    const byParent = new Map();
    visibleCards.forEach(entry => {
      const parent = entry.card.parentElement;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(entry);
    });

    const rows = [];
    byParent.forEach(siblings => {
      const sorted = siblings.slice().sort((a, b) => a.top - b.top);

      let currentRow = null;
      sorted.forEach(({ card, top, height }) => {
        if (currentRow && Math.abs(top - currentRow.top) <= ROW_EPSILON) {
          currentRow.cards.push(card);
        } else {
          currentRow = { top, height, cards: [card] };
          rows.push(currentRow);
        }
      });
    });

    return rows;
  }

  function updateScrollHighlight() {
    const cards = getCards();
    if (cards.length === 0) return;

    // Сначала все чтения layout (offsetTop/offsetHeight), без единой записи
    // стилей между ними — иначе браузер форсирует синхронный reflow на
    // каждой итерации (read → write → read у следующей карточки).
    const measured = Array.from(cards).map(card => {
      const top = getLayoutTop(card);
      const height = card.offsetHeight;
      return { card, top, height, outOfView: top + height < 0 || top > window.innerHeight };
    });

    // Теперь отдельным проходом — только записи.
    measured.forEach(({ card, outOfView }) => {
      if (outOfView) card.classList.remove("active-scroll");
    });

    const visibleCards = measured.filter(entry => !entry.outOfView);
    if (visibleCards.length === 0) return;

    // Подсвечиваем ближайшую к центру экрана строку целиком, а не
    // отдельную карточку — иначе соседи по строке "отбирают" фокус друг
    // у друга на каждом мелком скролле.
    const rows = groupIntoRows(visibleCards);

    const viewportCenter = window.innerHeight / 2;
    let closestRow = null;
    let minDistance = Infinity;

    rows.forEach(row => {
      const rowCenter = row.top + row.height / 2;
      const distance = Math.abs(rowCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestRow = row;
      }
    });

    // Порог: центр строки должен быть в пределах 35% от центра экрана
    const threshold = window.innerHeight * 0.35;
    const winningCards = closestRow && minDistance < threshold ? closestRow.cards : [];

    visibleCards.forEach(({ card }) => {
      card.classList.toggle("active-scroll", winningCards.includes(card));
    });
  }

  let scrollTimeout;
  window.addEventListener("scroll", () => {
    if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    scrollTimeout = requestAnimationFrame(updateScrollHighlight);
  }, { passive: true });

  // Запуск при рендере сетки и переключении фильтров
  document.addEventListener("gridrendered", updateScrollHighlight);

  // Первый запуск с задержкой, чтобы дать элементам загрузиться
  setTimeout(updateScrollHighlight, 500);
}

// ----------------------------------------------------
// ЧИПСЫ КОНТАКТОВ: копирование в буфер по клику + Toast
// ----------------------------------------------------
function initContactChips() {
  const chips = document.querySelectorAll(".contact-chips .chip");
  const toast = document.getElementById("copy-toast");
  if (!chips.length || !toast) return;

  let hideTimer = null;

  chips.forEach(chip => {
    chip.addEventListener("click", async () => {
      const text = chip.getAttribute("data-copy");
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // fallback для старых браузеров
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      // Показываем Toast
      toast.textContent = t("copied");
      toast.classList.add("visible");

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        toast.classList.remove("visible");
      }, 1800);
    });
  });
}

// Запуск инициализации при загрузке DOM
document.addEventListener("DOMContentLoaded", init);
