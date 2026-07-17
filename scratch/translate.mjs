import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../public/data/projects.json');

// --dry-run: показать, что было бы переведено, но не писать файл
// --force: игнорировать уже существующие "en" (обычно не нужно — см. README ниже)
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// Отправляем текст на публичный сторонний сервис (MyMemory, mymemory.translated.net).
// Не используйте это для конфиденциальных данных.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const REQUEST_DELAY_MS = 500;

const failures = [];
const translatedFields = [];
const skippedLocked = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text, attempt = 1) {
  if (!text || typeof text !== 'string') return null;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|en`;

  try {
    const res = await fetch(url);

    if (res.status === 429 && attempt <= MAX_RETRIES) {
      console.warn(`  Лимит запросов (429), повтор через ${RETRY_DELAY_MS * attempt} мс (попытка ${attempt}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY_MS * attempt);
      return translateText(text, attempt + 1);
    }

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return null;
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      console.warn(`  Ошибка сети, повтор через ${RETRY_DELAY_MS * attempt} мс (попытка ${attempt}/${MAX_RETRIES}): ${err.message}`);
      await sleep(RETRY_DELAY_MS * attempt);
      return translateText(text, attempt + 1);
    }
    console.error(`  Не удалось перевести "${text}": ${err.message}`);
    return null;
  }
}

// Рекурсивный обход и перевод объектов в JSON
async function translateObject(obj, pathTrail = []) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await translateObject(obj[i], [...pathTrail, i]);
    }
  } else if (obj !== null && typeof obj === 'object') {
    // Если это объект локализации { ru: "..." }
    if ('ru' in obj && typeof obj.ru === 'string') {
      const hasEn = 'en' in obj && obj.en && obj.en.trim() !== '';

      // Никогда не трогаем поле, явно помеченное как проверенное вручную
      if (obj.enReviewed === true) {
        skippedLocked.push(pathTrail.join('.'));
        return obj;
      }

      // По умолчанию переводим только пустые поля. С --force можно перегенерировать
      // существующие, но это осознанное разрушительное действие.
      if (!hasEn || FORCE) {
        console.log(`Перевод [${pathTrail.join('.')}]: "${obj.ru}"...`);
        const translated = await translateText(obj.ru);

        if (translated) {
          if (!DRY_RUN) obj.en = translated;
          translatedFields.push({ path: pathTrail.join('.'), ru: obj.ru, en: translated });
          console.log(`  -> "${translated}"`);
        } else {
          // Не подменяем английское поле русским текстом молча — оставляем как было
          // (пусто или прежнее значение) и репортим в конце, что нужно перевести руками.
          failures.push({ path: pathTrail.join('.'), ru: obj.ru });
        }

        await sleep(REQUEST_DELAY_MS);
      }
    } else {
      // Рекурсивно обходим все ключи объекта
      for (const key in obj) {
        obj[key] = await translateObject(obj[key], [...pathTrail, key]);
      }
    }
  }
  return obj;
}

async function main() {
  console.log('--- НАЧАЛО АВТОПЕРЕВОДА PROJECTS.JSON ---');
  if (DRY_RUN) console.log('(dry-run: файл не будет изменён)');

  if (!fs.existsSync(jsonPath)) {
    console.error(`Файл не найден: ${jsonPath}`);
    process.exitCode = 1;
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error('Ошибка парсинга JSON:', err.message);
    process.exitCode = 1;
    return;
  }

  data = await translateObject(data);

  if (!DRY_RUN && (translatedFields.length > 0)) {
    // Бэкап перед перезаписью — на случай, если перевод получился хуже исходника
    const backupPath = `${jsonPath}.bak`;
    fs.writeFileSync(backupPath, rawData, 'utf-8');
    console.log(`Бэкап сохранён: ${backupPath}`);

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Обновлённый файл сохранён в ${jsonPath}`);
  }

  console.log('\n--- ИТОГ ---');
  console.log(`Переведено полей: ${translatedFields.length}`);
  if (skippedLocked.length > 0) {
    console.log(`Пропущено (enReviewed: true): ${skippedLocked.length}`);
  }
  if (failures.length > 0) {
    console.log(`Не удалось перевести (оставлено без изменений — переведите вручную):`);
    failures.forEach((f) => console.log(`  [${f.path}] "${f.ru}"`));
  }
  console.log('--- ЗАВЕРШЕНО ---');
}

main();
