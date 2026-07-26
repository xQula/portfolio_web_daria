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

  /* Сброс размера при ресайзе окна */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
  const ACCENT = "#CCFF00";     // акцентный цвет
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

  /* --------------------------------------------------
     Показываем/скрываем при входе/выходе мыши из окна
     -------------------------------------------------- */
  document.addEventListener("mouseenter", () => {
    isInWindow = true;
    isVisible = true;
    /* Сброс: начинаем шлейф с текущих координат,
       чтобы не было скачка из предыдущей позиции */
    hasPrev = false;
  });

  document.addEventListener("mouseleave", () => {
    isInWindow = false;
    isVisible = false;
  });

  /* --------------------------------------------------
     Обновление координат мыши
     -------------------------------------------------- */
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      /* При первом движении после mouseenter — просыпаемся */
      isVisible = true;
      prevX = mouseX;
      prevY = mouseY;
      hasPrev = true;
    }
  }, { passive: true });

  /* --------------------------------------------------
     Анимационный цикл
     -------------------------------------------------- */
  let rafId = null;
  let lastAddTime = 0;

  function tick(now) {
    /* Очищаем canvas */
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* ------------------------------
       Добавляем новые точки вдоль пути мыши
       ------------------------------ */
    if (isVisible && isInWindow) {
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
