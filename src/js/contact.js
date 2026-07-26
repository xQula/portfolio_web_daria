import { setupFocusTrap } from "./focus-trap.js";

let contactModal, contactClose, lastActiveElement;

export function initContactModal() {
  contactModal = document.getElementById("contact-modal");
  contactClose = document.getElementById("contact-close");

  if (!contactModal || !contactClose) return;

  // Ищем все триггеры контактов на странице
  const triggers = [
    document.getElementById("contact-link"),
    document.getElementById("footer-contact-link"),
    document.getElementById("mobile-contact-link")
  ].filter(Boolean);

  const closeMobileDrawer = () => {
    const drawer = document.getElementById("mobile-drawer");
    const burger = document.getElementById("mobile-menu-trigger");
    if (drawer && drawer.classList.contains("active")) {
      drawer.classList.remove("active");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    if (burger && burger.classList.contains("active")) {
      burger.classList.remove("active");
      burger.setAttribute("aria-label", "Открыть меню");
    }
  };

  triggers.forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      closeMobileDrawer(); // Закрываем мобильное меню, если открыто
      openContactModal();
    });
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

  // Ловушка фокуса (Focus Trap) — общий модуль
  setupFocusTrap(contactModal);
}

export function openContactModal() {
  if (!contactModal) return;
  contactModal.classList.add("active");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  
  // Сохраняем активный элемент и переносим фокус на кнопку закрытия
  lastActiveElement = document.activeElement;
  setTimeout(() => {
    if (contactClose) contactClose.focus();
  }, 50);
}

export function closeContactModal() {
  if (!contactModal) return;
  contactModal.classList.remove("active");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  
  // Возвращаем фокус на прежнее место
  if (lastActiveElement) {
    lastActiveElement.focus();
  }
}
