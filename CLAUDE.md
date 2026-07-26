# SOF — портфолио режиссёра монтажа Дарьи Евстигнеевой

Сайт-портфолио под брендом **SOF (Sense of Form)**: работы в видеомонтаже, кинопродвижении, рекламе и digital-контенте.

## Стек
Vanilla HTML/CSS/JS (ES6-модули, без фреймворка), сборка через Vite (`npm run dev` / `npm run build` / `npm run preview`).
Контент проектов — JSON в `projects/` (`projects/video/`, `projects/art/`). Стили разбиты по компонентам в `src/css/`, логика — в `src/js/` (`main.js`, `api.js`, `theme.js`, `lightbox.js`, `contact.js`, `grid.js`).

## Установленные инструменты CLI-агента

### 🌐 Глобально (доступны во всех проектах)
Подключено в `~/.claude/settings.json`:

- **Context7** (MCP) — актуальная документация библиотек по версиям.
- **Chrome** (MCP) — браузерная автоматизация.
- **superpowers@superpowers-marketplace** — методология разработки: brainstorming, writing-plans, TDD, systematic-debugging, git worktrees, code review discipline.
- **code-review@claude-plugins-official** — код-ревью для любых проектов.
- **feature-dev@claude-plugins-official** — планирование и реализация фич.
- **commit-commands@claude-plugins-official** — команды для коммитов и PR.
- **playwright@claude-plugins-official** — управление браузером (Chromium/Firefox/WebKit): навигация, скриншоты, заполнение форм, e2e-тесты.
- **claude-mem@thedotmack** (сторонний, thedotmack/claude-mem) — персистентная память между сессиями CLI.
- **graphify** (Python-пакет `graphifyy`, скилл в `~/.claude/skills/graphify`) — граф знаний по кодовой базе (AST-парсинг, без векторного поиска), вызов через `/graphify .`.

### 📁 Только для этого проекта (portfolio_web_daria)
Подключено в `.claude/settings.local.json` — скиллы доступны только при работе в этом репозитории:

- **frontend-design@claude-plugins-official** — официальный Anthropic-плагин для фронтенд/дизайн-задач.
- **ui-ux-pro-max@ui-ux-pro-max-skill** — стили/палитры/шрифты/дизайн-токены для визуала сайта.
- **a11y-specialist-skills@a11y-specialist-skills** (masuP9, сторонний, 47★ MIT) — WCAG 2.2/WAI-ARIA ревью, аудит и планирование доступности.
- **senior-frontend** (локальный скилл в `.claude/skills/senior-frontend/`) — архитектурный ревью, код-ревью, best practices.

### ⚡ MCP-коннекторы (инструменты)

**Нельзя заскопить по проекту** — они идут от платформы (claude.ai Pro) и доступны всегда:

| Коннектор | Инструменты | Для чего |
|---|---|---|
| **21st.dev Magic** | `mcp__21st__*` | Поиск/генерация UI-компонентов, `/ui ...` |
| **Figma** | `mcp__figma__*` | Чтение макетов, дизайн-токенов |
| **Context7** | `mcp__context7__*` | Документация библиотек |
| **Chrome** | `mcp__claude-in-chrome__*` | Браузерная автоматизация |
| **Gmail / Calendar / Drive** | `mcp__claude_ai_Gmail__*` и др. | Google-сервисы |
| **Notion** | `mcp__claude_ai_Notion__*` | Базы знаний |
| **DeepL** | `mcp__claude_ai_DeepL__*` | Перевод |
| **Playwright** | `mcp__plugin_playwright__*` | Браузерные тесты (от плагина) |
| **claude-mem** | `mcp__plugin_claude-mem__*` | Память между сессиями (от плагина) |

Эти инструменты технически привязаны к платформе, а не к проекту — их нельзя выключить для конкретной папки. Figma и 21st.dev будут видны всегда, но вызывать их по делу имеет смысл только в этом проекте.

Полная карта всех инструментов (Cowork + CLI) — в Notion: "🧰 Карта инструментов Claude — плагины, скилы, коннекторы".

## Заметки для агента
- Framework не нужен: не предлагать миграцию на React/Next.js без явного запроса — сайт осознанно на чистом JS.
- Проверять сборку через `npm run build` перед тем как считать задачу законченной.
- Скриншоты/визуальная проверка — через Playwright/chromium-cli (уже использовались в этом репо, см. `.claude/settings.local.json`).
