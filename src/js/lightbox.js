let lightbox, lightboxClose, videoWrapper, lbTitle, lbCategory, lbDetails, lbDescription;

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
}

export function openLightbox(project) {
  if (!lbTitle || !lbCategory || !lbDescription || !lbDetails || !videoWrapper || !lightbox) return;

  lbTitle.textContent = project.title;
  lbCategory.textContent = `${project.subCategory} | ${project.client}`;
  lbDescription.textContent = project.desc;
  
  // Детали софта
  lbDetails.innerHTML = `
    <div><strong>Софт:</strong> ${project.soft}</div>
    <div><strong>Формат:</strong> ${project.aspect === "vertical" ? "Вертикальный (9:16)" : "Горизонтальный (16:9)"}</div>
  `;
  
  // Очистка предыдущего плеера
  videoWrapper.innerHTML = "";
  
  // Определение классов адаптивности для плеера
  videoWrapper.className = "lightbox-video-wrapper";
  if (project.aspect === "vertical") {
    videoWrapper.classList.add("vertical");
  } else {
    videoWrapper.classList.add("horizontal");
  }
  
  // Создание iframe плеера
  const iframe = document.createElement("iframe");
  iframe.src = project.videoUrl;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  
  videoWrapper.appendChild(iframe);
  
  // Показ модального окна
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Блокировка скролла сайта
}

export function closeLightbox() {
  if (!lightbox || !videoWrapper) return;

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // Разблокировка скролла
  
  // Удаляем iframe, чтобы остановить воспроизведение видео
  videoWrapper.innerHTML = "";
}
