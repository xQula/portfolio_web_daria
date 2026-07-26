/**
 * Универсальная ловушка фокуса (Focus Trap) для модальных окон.
 * Зацикливает Tab/Shift+Tab внутри переданного контейнера.
 *
 * @param {HTMLElement} container — элемент-контейнер (модалка), в котором нужно ловить фокус
 * @param {string} [customSelector] — опциональный кастомный селектор focusable-элементов.
 *   По умолчанию: 'a, button, iframe, [tabindex]:not([tabindex="-1"])'
 */
export function setupFocusTrap(container, customSelector) {
  const selector = customSelector || 'a, button, iframe, [tabindex]:not([tabindex="-1"])';

  container.addEventListener("keydown", (e) => {
    if (!container.classList.contains("active")) return;
    if (e.key !== "Tab") return;

    const focusable = container.querySelectorAll(selector);
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
  });
}
