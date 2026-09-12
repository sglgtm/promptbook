#!/usr/bin/env bash
# Быстрая проверка, что переменные окружения выставлены и БД доступна.
set -euo pipefail
: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL is required}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?NEXT_PUBLIC_SUPABASE_ANON_KEY is required}"
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "ANON present: yes (length=${#NEXT_PUBLIC_SUPABASE_ANON_KEY})"
echo "Testing PostgREST anon access..."
curl -sSf -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1" \
  && echo && echo "OK: PostgREST reachable (RLS может вернуть пусто — это нормально для анонима)."
