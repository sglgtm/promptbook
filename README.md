# Promptbook — P0 (Итерация 1)

Веб-приложение для повторяемых AI-workflow. Итерация 1: Auth + защищённый Dashboard + связь с Supabase.

## Стек

- Next.js 15 (App Router, RSC), TypeScript, Tailwind CSS
- Supabase Auth + PostgREST (без Drizzle/Prisma)
- `@supabase/ssr` для сессий на сервере
- Zod для валидации env
- Perplexity API — на Итерации 4

## Что уже есть в этой итерации

- `/` — лендинг с кнопками Войти / Регистрация
- `/signup`, `/login` — реальная регистрация и вход через Supabase Auth
- `/dashboard` — защищённая страница; редиректит на `/login`, если нет сессии
- `middleware.ts` — обновляет сессию на каждом запросе, редиректит guests с защищённых путей
- Триггер `handle_new_user` в Postgres создаёт запись в `profiles` при регистрации
- RLS-политики на трёх таблицах: `profiles`, `prompts`, `prompt_runs`
- `/api/health` — проверка серверного клиента и связи с БД

## Локальный запуск

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.local (в .gitignore) из .env.example и заполнить
cp .env.example .env.local
# внутри:
#   NEXT_PUBLIC_SUPABASE_URL=https://vlsykjnijpulutewbvqt.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key из Supabase>

# 3. Запуск dev-сервера
npm run dev
# → http://localhost:3000

# 4. Проверка end-to-end
#    a) открой /signup, зарегистрируйся; если Supabase требует подтверждение — подтверди по e-mail
#    b) /login → войди → должен попасть на /dashboard
#    c) на /dashboard увидишь три галочки: сессия, профиль, RLS-запрос
#    d) /api/health вернёт {"ok":true,...}
```

## Настройки Supabase (одноразово, если ещё не сделано)

1. **Email confirmation.** На старте P0 удобно ОТКЛЮЧИТЬ:
   Dashboard → Authentication → Providers → Email → выключить "Confirm email".
   Иначе первый вход после signup требует клика в письме — тормозит тесты.
2. **Site URL.** Authentication → URL Configuration → Site URL:
   локально `http://localhost:3000`, на проде — публичный URL.
3. **Redirect URLs.** Туда же добавь адреса деплоя.

## SQL миграция

Файл `supabase/migrations/0001_promptbook_init.sql` уже применён вручную в SQL Editor.
Он идемпотентный: можно применить повторно на новом проекте Supabase.

## Генерация TS-типов из БД (опционально)

```bash
# один раз, если хочешь строгие типы для supabase.from(...).select():
npm install -D supabase
npx supabase login
npx supabase gen types typescript --project-id vlsykjnijpulutewbvqt --schema public > src/types/database.ts
```

Затем в `src/lib/supabase/server.ts` и `.../client.ts` добавь дженерик `<Database>` в `createServerClient`/`createBrowserClient`. На этой итерации сделано без дженериков.

## Деплой на VPS (шаблон, детали — на Итерации 5)

```bash
# на сервере (Ubuntu 22.04, Node 20+):
git clone https://github.com/sglgtm/promptbook.git
cd promptbook
npm ci
npm run build
# .env.local создаётся отдельно, никогда не в git
pm2 start "npm run start" --name promptbook
# nginx проксирует :3000 → 443 с let's encrypt
```

## Что дальше — Итерация 2

CRUD промптов: список, создание, редактирование, удаление, реальный `navigator.clipboard.writeText`. Roundtrip save→open через `supabase.from('prompts').select()` уже готов на уровне БД.

## Что не входит в Итерацию 1

- Формы восстановления пароля (Supabase их даёт, но UI ещё нет)
- OAuth (Google/GitHub)
- Персистентные Toast/UI-компоненты (появятся с Итерацией 2)
- Реальный вызов Perplexity API (Итерация 4)
