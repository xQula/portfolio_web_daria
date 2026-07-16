# Технический аудит и архитектурный разбор проекта SOF (Sense of Form)

В данном документе представлен подробный технический аудит кодовой базы, архитектуры, производительности, безопасности и DX (Developer Experience) веб-сайта портфолио режиссера монтажа **Дарьи Евстигнеевой (SOF — Sense of Form)**.

---

## 1. Краткий диагноз проекта

Проект представляет собой премиальное **MVP портфолио-одностраничник**, построенное на стеке Vite + Vanilla JS + Vanilla CSS. 
Визуальная часть, включая инерционный скролл (Lenis), кастомный магнитный курсор и View Transitions для смены тем, оставляет отличное первое впечатление. Однако архитектурно проект имеет ряд серьезных проблем: данные проектов жестко смешаны с JS-кодом, алгоритм рендеринга портфолио императивно управляет разметкой и ломает хронологию работ, а критическая зависимость от внешнего домена YouTube для загрузки обложек видео несет в себе продуктовый риск полной потери работоспособности сайта в некоторых регионах (в частности, в РФ). Также присутствует "мертвый" код для смены тем оформления, функционал которого был скрыт в CSS вместо полноценного удаления или доработки.

---

## 2. Ключевые проблемы проекта

| Область | Проблема | Почему это проблема | Последствия | Критичность | Как исправить |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Инфраструктура / UX** | Динамическая загрузка обложек видео напрямую с домена `img.youtube.com`. | При замедлении или блокировке YouTube (например, в РФ) изображения превью не загрузятся. | Клиент увидит пустые серые блоки вместо видеоработ. Полная потеря доверия к портфолио. | **Критичная** | Сохранять оптимизированные обложки в `.webp` локально в папке `/public/img/previews/`. |
| **DX / Архитектура** | Описание проектов в виде отдельных JS-файлов со статическими импортами. | Для добавления нового видео необходимо создавать файл на чистом JS, прописывать импорт и добавлять в массив вручную. | Сложный процесс обновления контента. Рост размера JS-бандла при увеличении числа проектов. | **Высокая** | Вынести данные о проектах в единый JSON-файл `/public/data/projects.json`. |
| **Архитектура / Frontend** | Сильная связанность JS-кода рендеринга и CSS-разметки сетки (`grid.js`). | JS-код императивно группирует карточки по форматам и заворачивает их во вложенные DOM-контейнеры. | Изменение верстки требует переписывания JS. Нарушается хронологический порядок отображения работ. | **Высокая** | Переписать сетку на чистый CSS Grid с `grid-auto-flow: dense`, упростив JS до итерации массива. |
| **UI / DX** | Мертвый код тем оформления и скрытая кнопка переключателя. | Логика смены темы присутствует в JS, но кнопка скрыта через `display: none !important`. Цвета в `variables.css` дублируются. | Увеличение объема мертвого кода. Несоответствие мобильного drawer-меню и десктопной шапки. | **Средняя** | Полностью вырезать код тем, либо дописать стили для светлой темы `[data-theme="light"]`. |
| **Продукт / Бизнес** | Отсутствие интерактивной формы контактов вопреки дизайн-концепции. | В ТЗ (`design_proposal.md`) описана форма обратной связи. Фактически в модалке — только ссылки на мессенджеры. | Клиенту сложнее отправить заявку прямо с сайта (требуется переход во внешние приложения). | **Средняя** | Реализовать минималистичную HTML-форму с отправкой данных через API (Telegram-бот / Formspree). |
| **Доступность (A11y)** | Принудительное отключение курсора мыши на десктопах. | Свойство `cursor: none !important` применяется ко всему документу, включая ссылки и кнопки. | При сбоях или зависании JS-скриптов пользователь теряет видимый курсор и не может управлять сайтом. | **Средняя** | Скрывать системный курсор только при успешной инициализации кастомного и только для `body`. |
| **Качество кода** | Неэкранированные пробелы в путях предзагрузки шрифтов в HTML и CSS. | Браузер пытается загрузить `/font/.../Dirtyline 36daysoftype 2022.woff2` с пробелами в имени файла. | Риск блокировки предзагрузки на строгих веб-серверах, предупреждения в консоли разработчика. | **Низкая** | Переименовать файлы шрифтов, исключив пробелы (например, `Dirtyline-36daysoftype-2022.woff2`). |

---

## 3. Первопричины проблем

1. **Симптомы:**
   - Превью видеороликов не загружаются при отсутствии VPN.
   - Огромная простыня императивного кода в `grid.js` с циклами `while` и сдвигами массивов `shift()`.
   - Заблокированный переключатель тем в шапке сайта.
   - Избыточные файлы конфигурации проектов на JS.

2. **Корневые причины:**
   - **Приоритет формы над содержанием:** При разработке фокус был смещен на визуальные "вау-эффекты" (Lenis скролл, View Transitions, магнитный курсор), в то время как базовые архитектурные принципы (отделение данных от представления, отказоустойчивость загрузки ресурсов) прорабатывались по остаточному принципу.
   - **Отсутствие единого источника данных (Single Source of Truth):** Вместо структурированной базы данных (JSON), контент был размазан по JS-модулям, что заставило UI-компонент `grid.js` взять на себя роль СУБД и сортировщика.

---

## 4. Архитектурный разбор

### Удачные решения
* **Модульность JS-логики:** Кодовая база логически разделена на изолированные модули (`theme.js`, `i18n.js`, `api.js`, `grid.js`, `lightbox.js`). Точка входа `main.js` выполняет лишь координирующую роль.
* **Ловушка фокуса (Focus Trap):** Отлично реализовано управление фокусом в модальных окнах (`lightbox.js` и `contact.js`), что обеспечивает соответствие стандартам доступности (A11y) при навигации с клавиатуры.

### Неудачные решения
* **Жизненный цикл ассетов:** Загрузка обложек с серверов YouTube — это критическая уязвимость. Портфолио видеоредактора полностью зависит от доступности стороннего видеохостинга.
* **Императивный рендеринг:** Логика позиционирования карточек находится внутри JS-кода. При смене фильтров портфолио JS производит тяжелые вычисления, распределяя элементы по массивам `wideVideos`, `verticalVideos` и `horizontalVideos`, а затем создает обертки `.portfolio-group`. Это лишает проект гибкости: любые изменения в дизайне сетки потребуют переписывания логики JS, а хронологический порядок работ нарушается в угоду геометрии.

---

## 5. План исправления и рефакторинга

### Этап 1: Срочные исправления (Исправление критических рисков)

#### 1. Оптимизация и локализация обложек
Необходимо скачать все обложки видео с YouTube, сконвертировать их в формат `.webp` с оптимизацией веса (размер не более 150-200 КБ на обложку) и сохранить в директорию `/public/img/previews/`.

#### 2. Исправление путей шрифтов
Переименовать файлы шрифтов в `/public/font/` для исключения пробелов:
* `Dirtyline 36daysoftype 2022.woff2` $\rightarrow$ `Dirtyline-36daysoftype-2022.woff2`
* `MAK bold.woff` $\rightarrow$ `MAK-bold.woff`

Обновить пути в [index.html](file:///d:/repo/source/portfolio_web_daria/index.html) and [variables.css](file:///d:/repo/source/portfolio_web_daria/src/css/variables.css).

---

### Этап 2: Ближайший спринт (Рефакторинг архитектуры и DX)

#### 1. Переход на JSON-базу данных
Создать файл `/public/data/projects.json`:

```json
[
  {
    "id": "showreel",
    "type": "video",
    "title": {
      "ru": "ШОУРИЛ 2026 | ПРИМЕРЫ МОНТАЖА",
      "en": "SHOWREEL 2026 | EDITING SHOWCASE"
    },
    "duration": "1:30",
    "category": "commercial",
    "subCategory": {
      "ru": "Шоурил монтажа",
      "en": "Editing Showreel"
    },
    "client": "Daria Evstigneeva Portfolio",
    "videoUrl": "https://www.youtube.com/embed/n9xhJrPXy4g",
    "preview": "/img/previews/showreel_2026.webp",
    "aspect": "horizontal",
    "soft": "Premiere Pro · After Effects · DaVinci Resolve",
    "desc": {
      "ru": "Официальный шоурил режиссера монтажа Евстигнеевой Дарьи...",
      "en": "Official video editing showreel of Daria Evstigneeva..."
    },
    "featured": true,
    "hideFromGrid": true
  }
]
```

Переписать [api.js](file:///d:/repo/source/portfolio_web_daria/src/js/api.js) для динамической загрузки:

```javascript
export let projects = [];

export async function loadProjects() {
  try {
    const response = await fetch('/data/projects.json');
    if (!response.ok) throw new Error('Ошибка загрузки JSON');
    projects = await response.json();
  } catch (error) {
    console.error("Не удалось загрузить проекты:", error);
  }
}
```

#### 2. Переход на CSS Grid Auto-flow
Удалить императивную группировку из [grid.js](file:///d:/repo/source/portfolio_web_daria/src/js/grid.js). Переписать `.project-grid` в [portfolio.css](file:///d:/repo/source/portfolio_web_daria/src/css/portfolio.css) на современную сетку:

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  grid-auto-flow: dense;
  gap: 2.5rem;
}

/* Вертикальные карточки занимают две строки по высоте */
.project-card.vertical {
  grid-row: span 2;
}

/* Широкоформатные карточки занимают две колонки по ширине */
.project-card.wide {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .project-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .project-card.vertical,
  .project-card.wide {
    grid-row: span 1;
    grid-column: span 1;
  }
}
```

Упростить `renderGrid` в `grid.js` до плоской вставки элементов:

```javascript
export function renderGrid() {
  if (!projectGrid || !showMoreBtn) return;
  projectGrid.innerHTML = "";
  
  const gridProjects = projects.filter(p => !p.hideFromGrid && p.type !== "art");
  
  let filtered = gridProjects;
  if (currentFilter !== "all") {
    filtered = gridProjects.filter(p => 
      Array.isArray(p.category) ? p.category.includes(currentFilter) : p.category === currentFilter
    );
  }
  
  const videosToShow = showingAll ? filtered : filtered.slice(0, INITIAL_ITEMS_COUNT);
  
  // Карточки рендерятся последовательно, сохраняя хронологию. CSS разложит их сам!
  videosToShow.forEach(project => {
    projectGrid.appendChild(createCard(project));
  });
  
  showMoreBtn.style.display = (filtered.length <= INITIAL_ITEMS_COUNT || showingAll) ? "none" : "inline-flex";
  
  document.dispatchEvent(new CustomEvent("gridrendered"));
}
```

---

### Этап 3: Среднесрочные задачи (Полировка продукта и безопасность)

#### 1. Интеграция формы контактов
Заменить статичные ссылки в модальном окне на полноценную HTML-форму:

```html
<form id="contact-form" class="contact-modal-form">
  <div class="form-group">
    <label for="client-name" data-i18n="form_label_name">Ваше имя</label>
    <input type="text" id="client-name" name="name" required class="form-input">
  </div>
  <div class="form-group">
    <label for="client-email" data-i18n="form_label_email">Email / Telegram</label>
    <input type="text" id="client-email" name="contact" required class="form-input">
  </div>
  <div class="form-group">
    <label for="client-task" data-i18n="form_label_task">Опишите проект</label>
    <textarea id="client-task" name="task" rows="4" class="form-input"></textarea>
  </div>
  <button type="submit" class="btn btn-accent btn-pill" data-i18n="form_submit">Отправить запрос</button>
</form>
```

#### 2. Безопасность iframe плеера
В [lightbox.js](file:///d:/repo/source/portfolio_web_daria/src/js/lightbox.js) добавить атрибуты безопасности для встраиваемого видео-фрейма:

```javascript
const iframe = document.createElement("iframe");
iframe.src = project.videoUrl;
iframe.sandbox = "allow-scripts allow-same-origin allow-presentation allow-popups";
iframe.referrerpolicy = "no-referrer-when-downgrade";
iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
iframe.allowFullscreen = true;
```
