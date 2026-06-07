# План рефакторинга: Продвинутая доступность (a11y Focus Management & Keyboard Nav)

Этот план решает проблемы с потерей фокуса (focus management) при открытии модальных окон и неполной поддержкой клавиатурной навигации для главного промо-видео (Showreel) на первом экране.

## User Review Required

> [!NOTE]
> Доработка полностью соответствует спецификации W3C WAI-ARIA по реализации доступных модальных окон (Modal Dialogs). Это улучшает UX для пользователей, использующих вспомогательные технологии и управление клавиатурой.

## Proposed Changes

Мы внесем изменения в разметку первого экрана и логику работы модальных окон (лайтбокс и контакты).

---

### [1] Навигация клавиатурой на Hero

#### [MODIFY] [index.html](file:///d:/repo/source/portfolio_web_daria/index.html)
* Добавим атрибут `tabindex="0"` для интерактивной видео-карточки промо-видео:
  ```html
  <div class="featured-card" id="featured-card-element" data-project-id="featured" tabindex="0">
  ```

#### [MODIFY] [grid.js](file:///d:/repo/source/portfolio_web_daria/src/js/grid.js)
* В функции `setupFeaturedVideo()` добавим обработчик нажатия клавиш `Enter` / `Space` на карточку `#featured-card-element`:
  ```javascript
  featuredCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(featuredProject || { ...дефолтный_проект... });
    }
  });
  ```

---

### [2] Управление фокусом в Lightbox (Видео-плеер)

#### [MODIFY] [lightbox.js](file:///d:/repo/source/portfolio_web_daria/src/js/lightbox.js)
* Добавим переменную `lastActiveElement` для сохранения фокуса.
* В `openLightbox(project)`:
  * Сохраним элемент, который вызвал открытие плеера: `lastActiveElement = document.activeElement;`.
  * Переместим фокус на кнопку закрытия плеера после отрисовки: `setTimeout(() => lightboxClose.focus(), 50);`.
* В `closeLightbox()`:
  * После скрытия окна вернем фокус на сохраненный элемент: `if (lastActiveElement) lastActiveElement.focus();`.

---

### [3] Управление фокусом в Модальном окне контактов

#### [MODIFY] [contact.js](file:///d:/repo/source/portfolio_web_daria/src/js/contact.js)
* Добавим переменную `lastActiveElement` для сохранения фокуса.
* В `openContactModal()`:
  * Сохраним активный элемент: `lastActiveElement = document.activeElement;`.
  * Переместим фокус на кнопку закрытия: `setTimeout(() => contactClose.focus(), 50);`.
* В `closeContactModal()`:
  * Вернем фокус: `if (lastActiveElement) lastActiveElement.focus();`.

---

## Verification Plan

### Automated Tests
* Проверим сборку: `npm run build`

### Manual Verification
1. Откроем сайт и переместим фокус клавишей `Tab` на карточку шоурила в Hero. Убедимся, что она подсвечивается. Нажмем `Enter` — плеер должен открыться.
2. После открытия плеера фокус должен автоматически перейти на кнопку закрытия (`×`). 
3. Нажмем `Escape` или `Enter` (для кнопки `×`) — плеер должен закрыться, а фокус вернуться ровно на ту карточку в Hero, с которой мы его открыли.
4. Повторим процедуру с любой карточкой в сетке проектов и ссылкой `CONTACT` в шапке сайта.
