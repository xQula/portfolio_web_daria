# План рефакторинга: Исправление опечаток и стандартизация ссылок (Spelling & URL Normalization)

Этот план описывает технические этапы по исправлению систематической опечатки в названии бренда (замена `Sence of Form` на правильное `Sense of Form` в HTML, JS и БД проектов) и приведению домена социальной сети ВКонтакте к стандартному `vk.com` вместо `vk.ru`.

## User Review Required

> [!NOTE]
> Это чисто стилистический и текстовый рефакторинг, который сделает сайт более профессиональным для международной аудитории и исправит ошибки в брендинге.

## Proposed Changes

Мы исправим опечатки во всех текстовых файлах и обновим ссылки на социальные сети.

---

### [1] Исправление опечатки Sence -> Sense

#### [MODIFY] [index.html](file:///d:/repo/source/portfolio_web_daria/index.html)
* Исправим опечатку в ключевых словах (строка 7): `SOF Sence of Form` -> `SOF Sense of Form`.
* Исправим опечатку в логотипе шапки (строка 65): `SENCE OF FORM` -> `SENSE OF FORM`.
* Исправим опечатку в логотипе подвала (строка 178): `SENCE OF FORM` -> `SENSE OF FORM`.
* Исправим опечатку в копирайте (строка 224): `2026 Sence of Form` -> `2026 Sense of Form`.

#### [MODIFY] [grid.js](file:///d:/repo/source/portfolio_web_daria/src/js/grid.js)
* Исправим дефолтный подзаголовок карточки в функции `getNextArtCard` (строка 91): `SENCE OF FORM` -> `SENSE OF FORM`.

#### [MODIFY] [movement_space.js](file:///d:/repo/source/portfolio_web_daria/src/js/projects/art/movement_space.js)
* Исправим значение subtitle: `"SENCE OF FORM"` -> `"SENSE OF FORM"`.

#### [MODIFY] [elevating_stories.js](file:///d:/repo/source/portfolio_web_daria/src/js/projects/art/elevating_stories.js)
* Исправим значение subtitle: `"SENCE OF FORM"` -> `"SENSE OF FORM"`.

#### [MODIFY] [can_be_different.js](file:///d:/repo/source/portfolio_web_daria/src/js/projects/art/can_be_different.js)
* Исправим значение subtitle: `"SENCE OF FORM"` -> `"SENSE OF FORM"`.

---

### [2] Стандартизация домена VK (vk.ru -> vk.com)

#### [MODIFY] [index.html](file:///d:/repo/source/portfolio_web_daria/index.html)
* Обновим ссылки на профиль ВКонтакте в соцсетях подвала (строка 162), модальном окне контактов (строка 234) и в разметке JSON-LD (строка 48): `https://vk.ru/dariaevst` -> `https://vk.com/dariaevst`.

---

## Verification Plan

### Automated Tests
* Проверим сборку: `npm run build`

### Manual Verification
1. Откроем сайт и проверим правильность написания бренда в шапке сайта, подвале, арт-плашках и копирайте.
2. Проверим, что ссылки на ВКонтакте корректно ведут на `vk.com`.
