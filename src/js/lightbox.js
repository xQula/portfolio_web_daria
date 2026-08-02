import { t, getLocalized } from "./i18n.js";
import { getYoutubeId } from "./api.js";
import { setupFocusTrap } from "./focus-trap.js";

let lightbox, lightboxClose, lightboxContent, videoWrapper, lbTitle, lbCategory, lbDetails, lbDescription, lastActiveElement;
let currentOpenProject = null;
let ytPlayer = null;
let ytApiPromise = null;
let playbackWatchdogTimer = null;
let activeFallbackVideoId = null;
let openGeneration = 0;

// Сколько ждём после playVideo(), пока плеер не подтвердит реальное начало
// воспроизведения (PLAYING/PAUSED). Если YouTube API script загрузился, но
// сам видео-стрим не доходит (например, googlevideo.com заблокирован сетью),
// плеер зависает без единого события — по этому таймауту показываем
// пользователю ссылку "смотреть на YouTube" напрямую.
const PLAYBACK_WATCHDOG_MS = 8000;

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

  // Ловушка фокуса (Focus Trap) — общий модуль
  setupFocusTrap(lightbox);

  // Слушатель смены языка для обновления информации в открытом лайтбоксе (если он активен)
  document.addEventListener("languagechanged", () => {
    if (lightbox.classList.contains("active") && currentOpenProject) {
      updateLightboxContent(currentOpenProject);
      if (activeFallbackVideoId) {
        renderVideoFallback(activeFallbackVideoId);
      }
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

// Ссылка "смотреть на YouTube" — крайний случай, когда для проекта нет
// RuTube-зеркала (см. handlePlaybackTimeout). Вынесена отдельно, чтобы
// её можно было повторно вызвать при смене языка (см. слушатель
// "languagechanged" в initLightbox), не трогая плеер/таймер.
function renderVideoFallback(videoId) {
  if (!videoWrapper) return;
  activeFallbackVideoId = videoId;

  videoWrapper.innerHTML = "";
  const fallback = document.createElement("div");
  fallback.className = "lightbox-video-fallback";
  fallback.innerHTML = `
    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
    <p>${t("lightbox_fallback_message")}</p>
    <a class="btn btn-accent" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">${t("lightbox_fallback_cta")}</a>
  `;
  videoWrapper.appendChild(fallback);
}

function clearPlaybackWatchdog() {
  if (playbackWatchdogTimer) {
    clearTimeout(playbackWatchdogTimer);
    playbackWatchdogTimer = null;
  }
}

function withAutoplay(rutubeUrl) {
  return `${rutubeUrl}?autoplay=1`;
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

// Когда плеер создан, но видео так и не начало проигрываться — вероятно,
// YouTube-стрим недоступен в сети пользователя. Если для проекта есть
// зеркало на RuTube, тихо подменяем плеер на него на том же месте; если
// зеркала нет — показываем ссылку на прямой просмотр на youtube.com.
function handlePlaybackTimeout(videoId, rutubeUrl) {
  clearPlaybackWatchdog();
  destroyYtPlayer();
  if (rutubeUrl) {
    videoWrapper.innerHTML = "";
    mountPlainIframe(withAutoplay(rutubeUrl));
  } else {
    renderVideoFallback(videoId);
  }
}

// YouTube-видео через IFrame Player API — по готовности плеера запрашиваем
// максимальное доступное качество. Если API не загрузился (блокировщик,
// сеть) в разумное время — откатываемся на RuTube-зеркало (если есть) или
// на обычный YouTube iframe.
function mountYoutubePlayer(videoId, rutubeUrl) {
  const myGeneration = openGeneration;
  const mount = document.createElement("div");
  videoWrapper.appendChild(mount);

  let settled = false;
  const fallback = () => {
    if (myGeneration !== openGeneration) return;
    if (settled || !mount.isConnected) return;
    settled = true;
    mount.remove();
    if (rutubeUrl) {
      mountPlainIframe(withAutoplay(rutubeUrl));
    } else {
      renderVideoFallback(videoId);
    }
  };
  const fallbackTimer = setTimeout(fallback, 4000);

  loadYoutubeIframeApi()
    .then((YT) => {
      if (myGeneration !== openGeneration) return;
      if (settled || !mount.isConnected) return;
      settled = true;
      clearTimeout(fallbackTimer);
      ytPlayer = new YT.Player(mount, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (myGeneration !== openGeneration) return;
            try {
              const levels = e.target.getAvailableQualityLevels?.() || [];
              e.target.setPlaybackQuality(levels[0] || "hd1080");
            } catch (err) {
              // Лучшее качество — best effort, YouTube может проигнорировать запрос
            }
            e.target.playVideo();
            clearPlaybackWatchdog();
            playbackWatchdogTimer = setTimeout(() => {
              if (myGeneration !== openGeneration) return;
              handlePlaybackTimeout(videoId, rutubeUrl);
            }, PLAYBACK_WATCHDOG_MS);
          },
          onStateChange: (e) => {
            if (myGeneration !== openGeneration) return;
            // PLAYING (1) или PAUSED (2) — стрим реально дошёл до плеера
            if (e.data === window.YT.PlayerState.PLAYING || e.data === window.YT.PlayerState.PAUSED) {
              clearPlaybackWatchdog();
            }
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
  clearPlaybackWatchdog();
  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    ytPlayer.destroy();
  }
  ytPlayer = null;
}

export function openLightbox(project) {
  if (!lbTitle || !lbCategory || !lbDescription || !lbDetails || !videoWrapper || !lightbox) return;

  // Инвалидируем колбэки предыдущего плеера (onReady/onStateChange/watchdog
  // могут ещё сработать асинхронно после закрытия/смены проекта)
  openGeneration++;

  // Сохраняем ссылку на текущий открытый проект в глобальной переменной для смены языка на лету
  currentOpenProject = project;

  // Обновляем текстовый контент
  updateLightboxContent(project);

  // Очистка предыдущего плеера
  destroyYtPlayer();
  videoWrapper.innerHTML = "";
  activeFallbackVideoId = null;

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
    mountYoutubePlayer(ytId, project.rutubeUrl || null);
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

  // Инвалидируем колбэки текущего плеера — иначе onReady/watchdog,
  // сработавшие уже после закрытия, могут запуститься вхолостую
  openGeneration++;

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // Разблокировка скролла

  // Останавливаем и удаляем плеер
  destroyYtPlayer();
  videoWrapper.innerHTML = "";
  activeFallbackVideoId = null;
  if (lightboxContent) {
    lightboxContent.classList.remove("is-vertical");
  }
  currentOpenProject = null;

  // Возвращаем фокус на прежнее место
  if (lastActiveElement) {
    lastActiveElement.focus();
  }
}
