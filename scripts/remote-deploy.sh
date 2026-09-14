#!/usr/bin/env bash
# Идемпотентный деплой Promptbook на VPS.
# Требует переменные: DEPLOY_PATH.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NODE_ENV=production
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

APP_DIR="${DEPLOY_PATH:-/var/www/afawots.ru}"
APP_NAME="promptbook"

echo "===== 1. pull latest ====="
cd "$APP_DIR"
git fetch --depth 1 origin main
git reset --hard origin/main
git log -1 --pretty="format:commit %h %s"
echo

echo "===== 2. env file check ====="
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "::error::.env.local отсутствует в $APP_DIR"
  exit 1
fi
if ! grep -q '^NEXT_PUBLIC_SUPABASE_URL=https://' "$APP_DIR/.env.local"; then
  echo "::error::NEXT_PUBLIC_SUPABASE_URL пуст или не начинается с https://"
  exit 1
fi
if ! grep -q '^NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ' "$APP_DIR/.env.local"; then
  echo "::error::NEXT_PUBLIC_SUPABASE_ANON_KEY пуст или не JWT"
  exit 1
fi

echo "===== 3. install deps ====="
npm ci --omit=dev=false --silent 2>&1 | tail -5 || npm install --silent 2>&1 | tail -5

echo "===== 4. build ====="
npm run build 2>&1 | tail -20

echo "===== 5. nginx config ====="
NGINX_SRC="$APP_DIR/scripts/nginx-afawots.conf"
NGINX_DST="/etc/nginx/sites-available/afawots.ru"
if [ ! -f "$NGINX_DST" ] || ! cmp -s "$NGINX_SRC" "$NGINX_DST"; then
  sudo -n cp "$NGINX_SRC" "$NGINX_DST"
  sudo -n ln -sf "$NGINX_DST" /etc/nginx/sites-enabled/afawots.ru
  sudo -n rm -f /etc/nginx/sites-enabled/default
  sudo -n nginx -t
  sudo -n systemctl reload nginx
  echo "nginx: reloaded"
else
  echo "nginx: config unchanged"
fi
sudo -n mkdir -p /var/www/html/.well-known/acme-challenge
sudo -n chown -R www-data:www-data /var/www/html 2>/dev/null || true

echo "===== 6. pm2 start/restart ====="
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  cd "$APP_DIR"
  pm2 start npm --name "$APP_NAME" --time --update-env -- start
fi
pm2 save
sudo -n env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true
pm2 status | tail -20

echo "===== 7. smoke test ====="
sleep 3
for i in 1 2 3 4 5 6 7 8; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:3000/api/health || echo 000)
  echo "attempt $i -> HTTP $code"
  if [ "$code" = "200" ]; then break; fi
  sleep 2
done
if [ "$code" != "200" ]; then
  echo "===== pm2 logs (tail) ====="
  pm2 logs "$APP_NAME" --nostream --lines 40 2>&1 || true
  echo "::error::health check не вернул 200"
  exit 1
fi

echo "===== 8. nginx external check ====="
curl -sI -m 5 http://127.0.0.1/ | head -3 || true

echo "===== END ====="
