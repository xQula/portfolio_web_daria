# План рефакторинга: Продвинутый Focus Trap и WCAG контрастность (UX, a11y & Contrast Refactoring)

Этот план описывает технические этапы по добавлению полноценной ловушки фокуса (Focus Trap) для модальных окон (чтобы фокус не улетал на задний план страницы при нажатии `Tab`) и повышению контрастности второстепенного текста в светлой теме для соответствия стандартам доступности веб-контента WCAG AA.

## User Review Required

> [!NOTE]
> Все изменения будут реализованы на чистом CSS и ванильном JS, сохраняя легкость и высокую производительность загрузки сайта.

## Proposed Changes

Мы внесем изменения в настройки цветов темы и логику работы модальных окон.

---

### [1] Улучшение контрастности текста (WCAG AA Compliance)

#### [MODIFY] [variables.css](file:///d:/repo/source/portfolio_web_daria/src/css/variables.css)
* В светлой теме цвет второстепенного текста `--color-text-secondary` сейчас равен `#6B7280`. На бежевом фоне `#E0DBC6` это дает контрастность всего `3.4:1` (при норме `4.5:1` для мелкого текста).
* Изменим значение `--color-text-secondary` на более темный оттенок серого `#4B5563`, что поднимет контрастность до безопасных `5.1:1` и сделает текст полностью читаемым.

---

### [2] Реализация Focus Trap в Lightbox

#### [MODIFY] [lightbox.js](file:///d:/repo/source/portfolio_web_daria/src/js/lightbox.js)
* В функции `initLightbox()` добавим обработчик события `keydown` на контейнер `#video-lightbox` для удержания фокуса внутри открытого плеера:
  ```javascript
  lightbox.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Tab") {
      const focusable = lightbox.querySelectorAll('a, button, iframe, [tabindex="0"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
  ```

---

### [3] Реализация Focus Trap в окне контактов

#### [MODIFY] [contact.js](file:///d:/repo/source/portfolio_web_daria/src/js/contact.js)
* В функции `initContactModal()` добавим обработчик клавиши `Tab` на контейнер `#contact-modal` для предотвращения выхода фокуса за пределы окна контактов:
  ```javascript
  contactModal.addEventListener("keydown", (e) => {
    if (!contactModal.classList.contains("active")) return;
    if (e.key === "Tab") {
      const focusable = contactModal.querySelectorAll('a, button, [tabindex="0"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
  ```

---

## Verification Plan

### Automated Tests
* Проверим сборку: `npm run build` (выполняем через `cmd /c npm run build` для обхода ограничений политик PowerShell)

### Manual Verification
1. Откроем форму контактов или видео-плеер с помощью клавиатуры.
2. Будем нажимать `Tab` многократно. Убедимся, что фокус циклически ходит только по элементам внутри открытого окна (кнопка закрытия, ссылки контактов, iframe) и не уходит на ссылки в шапке или карточки на заднем плане страницы.
3. Проверим то же самое в обратном направлении с помощью `Shift + Tab`.
4. Визуально оценим читаемость описаний карточек и второстепенного текста в светлой теме.
