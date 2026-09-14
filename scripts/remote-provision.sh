#!/usr/bin/env bash
# Идемпотентный provisioning сервера для Promptbook.
# Запускается по SSH из GitHub Actions (workflow: server-provision).
# Только apt install + mkdir + git clone; никаких systemctl restart / reboot.

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

DEPLOY_PATH_LOCAL="${DEPLOY_PATH:-/var/www/promptbook}"
REPO_URL="https://github.com/sglgtm/promptbook.git"

echo "===== 1. apt update ====="
sudo -n apt-get update -qq

echo "===== 2. Base packages ====="
sudo -n apt-get install -y -qq curl git ca-certificates gnupg nginx ufw >/dev/null

echo "===== 3. Node 20 (nodesource) ====="
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -n -E bash - >/dev/null
  sudo -n apt-get install -y -qq nodejs >/dev/null
fi

echo "===== 4. pm2 ====="
if ! command -v pm2 >/dev/null 2>&1; then
  sudo -n npm install -g pm2 >/dev/null
fi

echo "===== 5. Deploy path ====="
sudo -n mkdir -p "$DEPLOY_PATH_LOCAL"
sudo -n chown "$USER:$USER" "$DEPLOY_PATH_LOCAL"

echo "===== 6. Clone or update repo ====="
if [ ! -d "$DEPLOY_PATH_LOCAL/.git" ]; then
  if [ -z "$(ls -A "$DEPLOY_PATH_LOCAL" 2>/dev/null || true)" ]; then
    git clone --depth 1 "$REPO_URL" "$DEPLOY_PATH_LOCAL"
  else
    echo "warn: $DEPLOY_PATH_LOCAL не пуст, git clone пропущен"
  fi
else
  git -C "$DEPLOY_PATH_LOCAL" fetch --depth 1 origin main
  git -C "$DEPLOY_PATH_LOCAL" reset --hard origin/main
fi

echo "===== 7. .env.local stub (без секретов) ====="
ENV_FILE="$DEPLOY_PATH_LOCAL/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'ENV'
# Заполнить вручную на сервере, никогда не в git.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
PERPLEXITY_API_KEY=
ENV
  chmod 600 "$ENV_FILE"
  echo "created empty $ENV_FILE (owner $USER, chmod 600)"
else
  echo "$ENV_FILE already exists, not touched"
fi

echo "===== 8. Installed versions ====="
printf "node:  %s\n" "$(node -v 2>/dev/null || echo none)"
printf "npm:   %s\n" "$(npm -v 2>/dev/null || echo none)"
printf "nginx: %s\n" "$(nginx -v 2>&1 || echo none)"
printf "pm2:   %s\n" "$(pm2 -v 2>/dev/null || echo none)"

echo "===== 9. Listing deploy path (top-level) ====="
ls -la --group-directories-first --time-style=long-iso "$DEPLOY_PATH_LOCAL" | head -30

echo "===== END ====="
