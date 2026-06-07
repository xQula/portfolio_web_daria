export let projects = [];

// Вспомогательная функция для получения ID видео с YouTube
export function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Вспомогательная функция для получения ID видео с RuTube
export function getRutubeId(url) {
  if (!url) return null;
  const match = url.match(/rutube\.ru\/(video|play\/embed)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

// Функция для динамической загрузки всех проектов
export async function loadProjects() {
  const response = await fetch("../../projects/index.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Не удалось загрузить projects/index.json");
  }
  const filenames = await response.json();
  
  const fetchPromises = filenames.map(async (filename) => {
    const res = await fetch(`../../projects/${filename}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Не удалось загрузить projects/${filename}`);
    }
    return res.json();
  });
  
  const rawProjects = await Promise.all(fetchPromises);
  
  // Автоматическая обработка ссылок и превью
  projects = rawProjects.map(project => {
    if (project.type === "video" && project.videoUrl) {
      const ytId = getYoutubeId(project.videoUrl);
      if (ytId) {
        // Превращаем любую ссылку YouTube во встроенную (embed)
        project.videoUrl = `https://www.youtube.com/embed/${ytId}`;
        // Если превью не задано вручную, генерируем ссылку на максимальное разрешение
        if (!project.preview) {
          project.preview = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        }
      } else {
        const rtId = getRutubeId(project.videoUrl);
        if (rtId) {
          // Превращаем любую ссылку RuTube во встроенную (embed)
          project.videoUrl = `https://rutube.ru/play/embed/${rtId}`;
        }
      }
    }
    return project;
  });
}
