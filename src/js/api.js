import { projects as rawProjects, artTemplates as rawArtTemplates } from './projects/index.js';

export let projects = [];
export let artTemplates = [];

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

// Функция для обработки локально импортированных проектов
export async function loadProjects() {
  // Сохраняем загруженные шаблоны
  artTemplates = [...rawArtTemplates];
  
  // Автоматическая обработка ссылок и превью для видео
  projects = rawProjects.map(project => {
    const projectCopy = { ...project };
    if (projectCopy.type === "video" && projectCopy.videoUrl) {
      const ytId = getYoutubeId(projectCopy.videoUrl);
      if (ytId) {
        // Превращаем любую ссылку YouTube во встроенную (embed)
        projectCopy.videoUrl = `https://www.youtube.com/embed/${ytId}`;
        // Если превью не задано вручную, генерируем ссылку на максимальное разрешение
        if (!projectCopy.preview) {
          projectCopy.preview = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        }
      } else {
        const rtId = getRutubeId(projectCopy.videoUrl);
        if (rtId) {
          // Превращаем любую ссылку RuTube во встроенную (embed)
          projectCopy.videoUrl = `https://rutube.ru/play/embed/${rtId}`;
        }
      }
    }
    return projectCopy;
  });
}
