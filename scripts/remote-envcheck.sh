#!/usr/bin/env bash
# Проверка состояния сервера без утечки значений .env.local.
set -euo pipefail
DEPLOY_PATH_LOCAL="${DEPLOY_PATH:-/var/www/promptbook}"

echo "===== who ====="
whoami
echo "HOME=$HOME"
echo

echo "===== $HOME/promptbook ====="
if [ -d "$HOME/promptbook" ]; then
  ls -la --time-style=long-iso "$HOME/promptbook" | head -25
else
  echo "nope"
fi
echo

echo "===== deploy path ====="
if [ -d "$DEPLOY_PATH_LOCAL" ]; then
  ls -ld "$DEPLOY_PATH_LOCAL"
  echo "top-level:"
  ls -la --group-directories-first --time-style=long-iso "$DEPLOY_PATH_LOCAL" | head -25
else
  echo "MISSING: $DEPLOY_PATH_LOCAL"
fi
echo

echo "===== .env.local keys (без значений) ====="
ENV_FILE="$DEPLOY_PATH_LOCAL/.env.local"
if [ -f "$ENV_FILE" ]; then
  ls -l "$ENV_FILE"
  # Показываем только имя переменной и статус: filled(len=N) или EMPTY
  awk -F= '
    /^[[:space:]]*#/ {next}
    /^[[:space:]]*$/ {next}
    {
      key=$1
      # значение — всё после первого "="
      sub(/^[^=]*=/, "", $0)
      # удаляем ведущие/хвостовые пробелы и кавычки
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
      gsub(/^["'"'"']|["'"'"']$/, "", $0)
      if (length($0) == 0) status = "EMPTY"
      else status = "filled(len=" length($0) ")"
      printf "  %-35s %s\n", key, status
    }
  ' "$ENV_FILE"
else
  echo "MISSING: $ENV_FILE"
fi
echo

echo "===== node/pm2 pids ====="
pgrep -a node || echo "no node processes"
pgrep -a pm2  || echo "no pm2 processes"
echo

echo "===== nginx ====="
systemctl is-active nginx 2>/dev/null || echo "nginx not active"
echo

echo "===== END ====="
