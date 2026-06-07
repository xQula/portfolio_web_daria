# План рефакторинга (CSS Architecture Cleanup & Accessibility Refactoring)

Этот план решает проблему плохой архитектурной организации стилей. В текущей кодовой базе адаптивные стили для всего сайта (шапка, первый экран, сетка проектов, подвал) были ошибочно описаны внутри `modals.css` (начиная с 157 строки). Мы очистим `modals.css`, перенесем правила в соответствующие компоненты и добавим глобальные стили доступности (`:focus-visible`).

## User Review Required

> [!WARNING]
> Данный рефакторинг не меняет визуального поведения сайта на мобильных и десктопных версиях. Его цель — наведение порядка в архитектуре стилей (CSS Maintainability) и исправление доступности элементов.

## Proposed Changes

Мы распределим медиа-запросы по их законным CSS-файлам и удалим лишний код из `modals.css`.

---

### [1] Глобальные стили (Base & Global a11y)

#### [MODIFY] [base.css](file:///d:/repo/source/portfolio_web_daria/src/css/base.css)
* Перенесем адаптивный размер шрифта из `modals.css`:
  ```css
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
  }
  ```
* Добавим глобальную подсветку фокуса для всех интерактивных элементов (ссылок и кнопок):
  ```css
  a:focus-visible,
  button:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 4px;
  }
  ```

---

### [2] Компонентные стили (Header & Hero Component Queries)

#### [MODIFY] [header.css](file:///d:/repo/source/portfolio_web_daria/src/css/header.css)
* Перенесем логику скрытия навигационного меню на мобильных устройствах из `modals.css` в `@media (max-width: 768px)` внутри `header.css`:
  ```css
  .main-nav {
    display: none;
  }
  ```

#### [MODIFY] [hero.css](file:///d:/repo/source/portfolio_web_daria/src/css/hero.css)
* Перенесем стили `.hero-container`, `.hero-cta` и `.hero-bio` из `modals.css` во внутренние медиа-запросы `hero.css` для разрешений `@media (max-width: 1024px)`.

---

### [3] Сетка проектов (Portfolio Component Queries)

#### [MODIFY] [portfolio.css](file:///d:/repo/source/portfolio_web_daria/src/css/portfolio.css)
* Объединим и очистим медиа-запросы:
  * Для `@media (max-width: 1024px)` перенесем настройки `.portfolio-group { grid-template-columns: repeat(2, 1fr); }`.
  * Для `@media (max-width: 768px)` перенесем настройки сброса колонок и строк:
    ```css
    .portfolio-group {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto !important;
      gap: 2.5rem;
    }
    .portfolio-group .project-card {
      grid-column: span 1 !important;
      grid-row: span 1 !important;
    }
    .project-card.wide .card-thumbnail-container {
      aspect-ratio: 16/9;
    }
    ```

---

### [4] Подвал сайта (Footer Component Queries)

#### [MODIFY] [footer.css](file:///d:/repo/source/portfolio_web_daria/src/css/footer.css)
* Перенесем двухколоночную адаптивность футера из `modals.css` во внутренний медиа-запрос в `footer.css` для разрешения `@media (max-width: 1024px)`:
  ```css
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  .footer-right {
    grid-column: span 2;
    align-items: center;
  }
  ```

---

### [5] Очистка Modals CSS

#### [MODIFY] [modals.css](file:///d:/repo/source/portfolio_web_daria/src/css/modals.css)
* **Удалим все внешние селекторы и правила** из блока `RESPONSIVE DESIGN` (строки 157–243), которые относятся к другим секциям сайта, оставив в файле только адаптивность для модальных окон `.lightbox` и `.contact-modal`.

---

## Verification Plan

### Automated Tests
* Проверим отсутствие ошибок в сборщике:
  `npm run build`

### Manual Verification
1. Откроем сайт локально и проверим работу на разрешениях 1024px, 768px и мобильных версиях. Убедимся, что адаптивная сетка, первый экран и шапка выглядят идентично тому, что было до рефакторинга.
2. Проверим сфокусированные состояния ссылок меню, переключателя тем и социальных иконок в подвале клавишей `Tab`.
