/* ----------------------------------------------------
   NEON CURSOR TRAIL — Canvas Neon Strip Follow Effect
   Glowing electric-lime band that trails behind the cursor
   with smooth decay and premium glow.

   Архитектура:
   • Canvas overlay (position: fixed, pointer-events: none)
   • Массив точек с временем — старые точки отбрасываются
   • Два прохода рендера: внешнее свечение (shadowBlur)
     и яркая сердцевина
   • Яркая точка на острие курсора (голова шлейфа)
   • rAF-цикл очистки/отрисовки
   • Останавливается при уходе курсора из окна
   • prefersReducedMotion + hasHover guards
   ---------------------------------------------------- */

import { prefersReducedMotion, hasHover } from "./device.js";

export function initNeonCursor() {
  /* Не запускаем, если:
     - пользователь предпочёл reduced motion
     - устройство без мыши (touch)
     - уже инициализирован */
  if (prefersReducedMotion() || !hasHover()) return;
  if (document.querySelector(".neon-cursor-canvas")) return;

  /* --------------------------------------------------
     Создаём canvas
     -------------------------------------------------- */
  const canvas = document.createElement("canvas");
  canvas.className = "neon-cursor-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  document.body.classList.add("neon-cursor-active");

  const ctx = canvas.getContext("2d");

  /* Сброс размера при ресайзе окна (canvas.width/height всегда очищает
     битмап, поэтому будим цикл, если он был на idle-паузе — иначе холст
     останется пустым до следующего движения мыши) */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    startLoop();
  }
  window.addEventListener("resize", resize, { passive: true });

  /* --------------------------------------------------
     Параметры шлейфа
     -------------------------------------------------- */
  const TRAIL_DURATION = 650;   // мс — полное затухание
  const MAX_POINTS = 400;       // макс точек (ограничение памяти)
  const GLOW_BLUR = 30;         // px — радиус внешнего свечения
  const CORE_WIDTH = 3;         // px — толщина сердцевины
  const GLOW_WIDTH = 18;        // px — толщина ореола
  const ACCENT = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#CCFF00";
  const HEAD_RADIUS = 4;        // px — радиус точки-головы

  /* --------------------------------------------------
     Состояние
     -------------------------------------------------- */
  const points = [];            // { x, y, time }
  let mouseX = 0;
  let mouseY = 0;
  let prevX = 0;
  let prevY = 0;
  let hasPrev = false;
  let isVisible = false;
  let isInWindow = false;

  /* Над видео-плеером эффект полностью скрываем: iframe YouTube/RuTube —
     отдельный browsing context (почти всегда чужой домен, OOPIF), mousemove
     внутри него до document не долетает, и mouseenter/mouseleave на обёртке
     для этой границы ненадёжны (не гарантированно долетают — подтверждено
     живым дебагом). Вместо событий — геометрическая проверка последней
     известной позиции курсора каждый кадр. */
  let wasOverVideo = false;
  let fadeAlpha = 1;
  let lastFrameTs = null;
  const FADE_DURATION = 220; // мс — плавное угасание/появление при входе/выходе с видео
  const videoWrapper = document.getElementById("lightbox-video-wrapper");
  const lightboxEl = document.getElementById("video-lightbox");

  /* getBoundingClientRect() форсирует синхронный layout-read. Лайтбокс закрыт
     почти всё время работы страницы, а aria-hidden — обычный атрибут, его
     чтение layout не затрагивает. Проверяем сначала его и только если
     лайтбокс реально открыт — трогаем геометрию. */
  function isOverVideo() {
    if (!videoWrapper || !lightboxEl) return false;
    if (lightboxEl.getAttribute("aria-hidden") === "true") return false;
    const rect = videoWrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom;
  }

  /* --------------------------------------------------
     Показываем/скрываем при входе/выходе мыши из окна
     -------------------------------------------------- */
  document.addEventListener("mouseenter", () => {
    isInWindow = true;
    isVisible = true;
    /* Сброс: начинаем шлейф с текущих координат,
       чтобы не было скачка из предыдущей позиции */
    hasPrev = false;
    startLoop();
  });

  document.addEventListener("mouseleave", () => {
    /* Переход на iframe видео тоже может породить mouseleave на document —
       это не реальный уход курсора за пределы окна, а тот же квирк границы
       OOPIF. Не сбрасываем видимость, если курсор всё ещё над видео. */
    if (isOverVideo()) return;
    isInWindow = false;
    isVisible = false;
  });

  /* --------------------------------------------------
     Обновление координат мыши
     -------------------------------------------------- */
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    /* Safari не шлёт синтетический mouseenter на document, если курсор
       оказался внутри viewport без реального пересечения границы окна
       (например, страница просто загрузилась под курсором) — тогда
       isInWindow никогда не станет true через mouseenter. Раз mousemove
       вообще случился, курсор точно в окне. */
    isInWindow = true;

    if (!isVisible) {
      /* При первом движении после mouseenter — просыпаемся */
      isVisible = true;
      prevX = mouseX;
      prevY = mouseY;
      hasPrev = true;
    }

    /* Цикл мог быть остановлен из-за простоя (см. idle-пауза в tick) —
       движение мыши его будит */
    startLoop();
  }, { passive: true });

  /* --------------------------------------------------
     Анимационный цикл
     -------------------------------------------------- */
  let rafId = null;
  let lastAddTime = 0;

  function tick(now) {
    /* Очищаем canvas */
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const overVideo = isOverVideo();

    /* Только что вышли с видео — начинаем шлейф заново с текущей позиции,
       без соединительной линии от точки входа через всё видео */
    if (wasOverVideo && !overVideo) {
      points.length = 0;
      hasPrev = false;
    }
    wasOverVideo = overVideo;

    /* Плавное угасание/появление вместо мгновенного вкл/выкл при пересечении
       границы видео */
    const dt = lastFrameTs === null ? 0 : now - lastFrameTs;
    lastFrameTs = now;
    const fadeTarget = overVideo ? 0 : 1;
    const fadeStep = dt / FADE_DURATION;
    if (fadeAlpha < fadeTarget) fadeAlpha = Math.min(fadeTarget, fadeAlpha + fadeStep);
    else if (fadeAlpha > fadeTarget) fadeAlpha = Math.max(fadeTarget, fadeAlpha - fadeStep);

    /* ------------------------------
       Добавляем новые точки вдоль пути мыши
       ------------------------------ */
    if (isVisible && isInWindow && !overVideo) {
      const dx = mouseX - prevX;
      const dy = mouseY - prevY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (hasPrev && dist > 0.5 && now - lastAddTime > 6) {
        /* Добавляем интерполированные точки для плавности */
        const step = 2;
        const steps = Math.min(Math.floor(dist / step), 10);

        for (let i = 0; i <= steps; i++) {
          const t = i / (steps || 1);
          points.push({
            x: prevX + dx * t,
            y: prevY + dy * t,
            time: now,
          });
        }

        prevX = mouseX;
        prevY = mouseY;
        lastAddTime = now;
      } else if (!hasPrev) {
        prevX = mouseX;
        prevY = mouseY;
        hasPrev = true;
      }
    }

    /* ------------------------------
       Удаляем старые точки (полностью прозрачные)
       ------------------------------ */
    const cutoff = now - TRAIL_DURATION;
    while (points.length > 0 && points[0].time < cutoff) {
      points.shift();
    }

    /* Лимит на количество точек */
    if (points.length > MAX_POINTS) {
      points.splice(0, points.length - MAX_POINTS);
    }

    /* Над видео эффект плавно гаснет (fadeAlpha) вместо мгновенного скрытия
       (см. isOverVideo выше) */
    if (fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      /* ------------------------------
         Отрисовка шлейфа (нужно минимум 2 точки)
         ------------------------------ */
      if (points.length >= 2) {
        /* ---- Проход 1: внешнее свечение (glow) ---- */
        ctx.save();
        ctx.shadowBlur = GLOW_BLUR;
        ctx.shadowColor = ACCENT;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 1; i < points.length; i++) {
          const age = now - points[i].time;
          const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
          const widthFactor = 0.15 + 0.85 * alpha;

          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.strokeStyle = `rgba(204, 255, 0, ${(alpha * 0.12).toFixed(4)})`;
          ctx.lineWidth = GLOW_WIDTH * widthFactor;
          ctx.stroke();
        }
        ctx.restore();

        /* ---- Проход 2: яркая сердцевина ---- */
        for (let i = 1; i < points.length; i++) {
          const age = now - points[i].time;
          const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
          const widthFactor = 0.15 + 0.85 * alpha;

          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.strokeStyle = `rgba(204, 255, 0, ${alpha.toFixed(4)})`;
          ctx.lineWidth = CORE_WIDTH * widthFactor;
          ctx.stroke();
        }
      }

      /* ------------------------------
         Голова шлейфа — яркая точка на острие курсора
         (только если курсор в окне)
         ------------------------------ */
      if (isVisible && isInWindow && hasPrev) {
        /* Внешнее свечение головы */
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = ACCENT;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, HEAD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
        ctx.restore();

        /* Сердцевина точки (ещё один слой для яркости) */
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, HEAD_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      ctx.restore();
    }

    /* Рисовать больше нечего: шлейф погас, угасание/появление устаканилось —
       следующий кадр выглядел бы идентично текущему. Останавливаем цикл,
       чтобы не жечь кадровый бюджет впустую (например во время скролла без
       движения мыши); mousemove/mouseenter разбудят его заново. */
    if (points.length === 0 && fadeAlpha === fadeTarget) {
      rafId = null;
      return;
    }

    /* Следующий кадр */
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /* Останавливаем rAF при скрытии вкладки, возобновляем при показе */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  /* Запуск цикла */
  startLoop();
}
