import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const previewsDir = path.join(__dirname, '../public/img/previews');

// Генерирует .webp рядом с каждым .jpg в public/img/previews/ (не трогая исходники).
// Запускать заново при добавлении новых превью: node scratch/convert-previews-webp.mjs
async function main() {
  const files = fs.readdirSync(previewsDir).filter((f) => /\.jpe?g$/i.test(f));

  console.log(`Найдено ${files.length} JPG-файлов в ${previewsDir}`);

  for (const file of files) {
    const inputPath = path.join(previewsDir, file);
    const outputPath = path.join(previewsDir, file.replace(/\.jpe?g$/i, '.webp'));

    await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);

    const inSize = fs.statSync(inputPath).size;
    const outSize = fs.statSync(outputPath).size;
    console.log(`${file} -> ${path.basename(outputPath)} (${inSize}B -> ${outSize}B)`);
  }

  console.log('Готово.');
}

main();
