let contactModal, contactLink, contactClose;

export function initContactModal() {
  contactModal = document.getElementById("contact-modal");
  contactLink = document.getElementById("contact-link");
  contactClose = document.getElementById("contact-close");

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

export function openContactModal() {
  if (!contactModal) return;
  contactModal.classList.add("active");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeContactModal() {
  if (!contactModal) return;
  contactModal.classList.remove("active");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
