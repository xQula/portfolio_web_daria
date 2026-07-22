import { t, getLocalized } from "./i18n.js";
import { getYoutubeId } from "./api.js";

let lightbox, lightboxClose, lightboxContent, videoWrapper, lbTitle, lbCategory, lbDetails, lbDescription, lastActiveElement;
let ytPlayer = null;
let ytApiPromise = null;

export function initLightbox() {
  lightbox = document.getElementById("video-lightbox");
  lightboxClose = document.getElementById("lightbox-close");
  videoWrapper = document.getElementById("lightbox-video-wrapper");
  lightboxContent = lightbox ? lightbox.querySelector(".lightbox-content") : null;
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

// ----------------------------------------------------
// YOUTUBE IFRAME API — грузится один раз, лениво, при первом открытии
// YouTube-видео. Нужна, чтобы явно запросить лучшее доступное качество
// (обычный <iframe src="..."> всегда стартует с автоподбора, который на
// старте почти всегда занижен).
// ----------------------------------------------------
function loadYoutubeIframeApi() {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("YouTube IFrame API failed to load"));
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

// Обычный sandboxed iframe — для RuTube и как фолбэк, если YouTube API недоступен
function mountPlainIframe(url) {
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.sandbox = "allow-scripts allow-same-origin allow-presentation allow-popups";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  videoWrapper.appendChild(iframe);
}

// YouTube-видео через IFrame Player API — по готовности плеера запрашиваем
// максимальное доступное качество. Если API не загрузился (блокировщик,
// сеть) в разумное время — откатываемся на обычный iframe.
function mountYoutubePlayer(videoId) {
  const mount = document.createElement("div");
  videoWrapper.appendChild(mount);

  let settled = false;
  const fallback = () => {
    if (settled || !mount.isConnected) return;
    settled = true;
    mount.remove();
    mountPlainIframe(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
  };
  const fallbackTimer = setTimeout(fallback, 4000);

  loadYoutubeIframeApi()
    .then((YT) => {
      if (settled || !mount.isConnected) return;
      settled = true;
      clearTimeout(fallbackTimer);
      ytPlayer = new YT.Player(mount, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            try {
              const levels = e.target.getAvailableQualityLevels?.() || [];
              e.target.setPlaybackQuality(levels[0] || "hd1080");
            } catch (err) {
              // Лучшее качество — best effort, YouTube может проигнорировать запрос
            }
            e.target.playVideo();
          },
        },
      });
    })
    .catch(() => {
      clearTimeout(fallbackTimer);
      fallback();
    });
}

function destroyYtPlayer() {
  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    ytPlayer.destroy();
  }
  ytPlayer = null;
}

export function openLightbox(project) {
  if (!lbTitle || !lbCategory || !lbDescription || !lbDetails || !videoWrapper || !lightbox) return;

  // Сохраняем ссылку на текущий открытый проект в глобальной переменной для смены языка на лету
  window.currentOpenProject = project;

  // Обновляем текстовый контент
  updateLightboxContent(project);

  // Очистка предыдущего плеера
  destroyYtPlayer();
  videoWrapper.innerHTML = "";

  // Определение классов адаптивности для плеера
  const isVertical = project.aspect === "vertical";
  videoWrapper.className = "lightbox-video-wrapper";
  videoWrapper.classList.add(isVertical ? "vertical" : "horizontal");
  if (lightboxContent) {
    lightboxContent.classList.toggle("is-vertical", isVertical);
  }

  // YouTube — через IFrame Player API (чтобы попросить максимальное качество),
  // всё остальное (RuTube и т.д.) — обычным iframe
  const ytId = getYoutubeId(project.videoUrl);
  if (ytId) {
    mountYoutubePlayer(ytId);
  } else {
    mountPlainIframe(project.videoUrl);
  }

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

  // Останавливаем и удаляем плеер
  destroyYtPlayer();
  videoWrapper.innerHTML = "";
  if (lightboxContent) {
    lightboxContent.classList.remove("is-vertical");
  }
  window.currentOpenProject = null;

  // Возвращаем фокус на прежнее место
  if (lastActiveElement) {
    lastActiveElement.focus();
  }
}
