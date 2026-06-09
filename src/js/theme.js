export function initTheme() {
  // Проверяем сохраненную тему или системные настройки
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    // По умолчанию ставим светлую тему (Light Editorial Mode)
    document.documentElement.setAttribute("data-theme", "light");
  }
}

export function toggleTheme(e) {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  // Если браузер не поддерживает View Transitions, просто переключаем тему
  if (!document.startViewTransition) {
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    return;
  }
  
  // Координаты клика для начала волны (или центр экрана, если клик без координат)
  const x = e.clientX || window.innerWidth / 2;
  const y = e.clientY || window.innerHeight / 2;
  
  // Расстояние до самого дальнего угла экрана
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  
  const transition = document.startViewTransition(() => {
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
  
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];
    
    document.documentElement.animate(
      {
        clipPath: clipPath
      },
      {
        duration: 550,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });
}
