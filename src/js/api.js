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

// Функция для динамической загрузки всех проектов и шаблонов
export async function loadProjects() {
  const [videoIndexRes, artIndexRes] = await Promise.all([
    fetch("../../projects/index.json", { cache: "no-store" }),
    fetch("../../projects/art/index.json", { cache: "no-store" })
  ]);
  
  if (!videoIndexRes.ok || !artIndexRes.ok) {
    throw new Error("Не удалось загрузить индексные файлы проектов");
  }
  
  const [videoFilenames, artFilenames] = await Promise.all([
    videoIndexRes.json(),
    artIndexRes.json()
  ]);
  
  // Загрузка видео-проектов
  const videoFetchPromises = videoFilenames.map(async (filename) => {
    const res = await fetch(`../../projects/${filename}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Не удалось загрузить projects/${filename}`);
    }
    return res.json();
  });
  
  // Загрузка арт-шаблонов
  const artFetchPromises = artFilenames.map(async (filename) => {
    const res = await fetch(`../../projects/art/${filename}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Не удалось загрузить projects/art/${filename}`);
    }
    return res.json();
  });
  
  const [rawVideos, rawArts] = await Promise.all([
    Promise.all(videoFetchPromises),
    Promise.all(artFetchPromises)
  ]);
  
  // Сохраняем загруженные шаблоны
  artTemplates = rawArts;
  
  // Автоматическая обработка ссылок и превью для видео
  projects = rawVideos.map(project => {
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
