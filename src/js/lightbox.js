import { t, getLocalized } from "./i18n.js";

let lightbox, lightboxClose, videoWrapper, lbTitle, lbCategory, lbDetails, lbDescription, lastActiveElement;

export function initLightbox() {
  lightbox = document.getElementById("video-lightbox");
  lightboxClose = document.getElementById("lightbox-close");
  videoWrapper = document.getElementById("lightbox-video-wrapper");
  lbTitle = document.getElementById("lightbox-title");
  lbCategory = document.getElementById("lightbox-category");
  lbDetails = document.getElementById("lightbox-details");
  lbDescription = document.getElementById("lightbox-description");

  if (!lightbox || !lightboxClose || !videoWrapper) return;

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

  // Ловушка фокуса (Focus Trap)
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

  // Слушатель смены языка для обновления информации в открытом лайтбоксе (если он активен)
  document.addEventListener("languagechanged", () => {
    if (lightbox.classList.contains("active") && window.currentOpenProject) {
      updateLightboxContent(window.currentOpenProject);
    }
  });
}

function updateLightboxContent(project) {
  if (!lbTitle || !lbCategory || !lbDescription || !lbDetails) return;

  lbTitle.textContent = getLocalized(project.title);
  lbCategory.textContent = `${getLocalized(project.subCategory)} | ${project.client}`;
  lbDescription.textContent = getLocalized(project.desc);
  
  // Детали софта
  lbDetails.innerHTML = `
    <div><strong>${t("lightbox_label_soft")}:</strong> ${project.soft}</div>
    <div><strong>${t("lightbox_label_format")}:</strong> ${project.aspect === "vertical" ? t("lightbox_format_vertical") : t("lightbox_format_horizontal")}</div>
  `;
}

export function openLightbox(project) {
  if (!lbTitle || !lbCategory || !lbDescription || !lbDetails || !videoWrapper || !lightbox) return;

  // Сохраняем ссылку на текущий открытый проект в глобальной переменной для смены языка на лету
  window.currentOpenProject = project;

  // Обновляем текстовый контент
  updateLightboxContent(project);
  
  // Очистка предыдущего плеера
  videoWrapper.innerHTML = "";
  
  // Определение классов адаптивности для плеера
  videoWrapper.className = "lightbox-video-wrapper";
  if (project.aspect === "vertical") {
    videoWrapper.classList.add("vertical");
  } else {
    videoWrapper.classList.add("horizontal");
  }
  
  // Создание iframe плеера с мерами безопасности
  const iframe = document.createElement("iframe");
  iframe.src = project.videoUrl;
  iframe.sandbox = "allow-scripts allow-same-origin allow-presentation allow-popups";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  
  videoWrapper.appendChild(iframe);
  
  // Показ модального окна
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Блокировка скролла сайта
  
  // Сохраняем элемент, вызвавший модалку, и переносим фокус на кнопку закрытия
  lastActiveElement = document.activeElement;
  setTimeout(() => {
    if (lightboxClose) lightboxClose.focus();
  }, 50);
}

export function closeLightbox() {
  if (!lightbox || !videoWrapper) return;

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // Разблокировка скролла
  
  // Удаляем iframe, чтобы остановить воспроизведение видео
  videoWrapper.innerHTML = "";
  window.currentOpenProject = null;
  
  // Возвращаем фокус на прежнее место
  if (lastActiveElement) {
    lastActiveElement.focus();
  }
}
