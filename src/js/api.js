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

// Функция для загрузки проектов из JSON
export async function loadProjects() {
  try {
    const response = await fetch('/data/projects.json');
    if (!response.ok) {
      throw new Error(`Ошибка загрузки проектов: ${response.status}`);
    }
    const data = await response.json();
    projects = data.projects || [];
    artTemplates = data.artTemplates || [];
  } catch (err) {
    console.error("Ошибка при загрузке проектов из JSON:", err);
    throw err;
  }
}
