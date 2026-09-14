#!/usr/bin/env bash
set -euo pipefail
echo "===== search for package.json 'promptbook' ====="
find / -maxdepth 6 -name 'package.json' 2>/dev/null | while read -r f; do
  if grep -q '"name"[[:space:]]*:[[:space:]]*"promptbook"' "$f" 2>/dev/null; then
    dir=$(dirname "$f")
    echo "FOUND: $dir"
  fi
done
echo
echo "===== git repos with promptbook remote ====="
find / -maxdepth 6 -name '.git' -type d 2>/dev/null | while read -r g; do
  url=$(git -C "$(dirname "$g")" remote get-url origin 2>/dev/null || true)
  case "$url" in
    *sglgtm/promptbook*) echo "REPO: $(dirname "$g")  ->  $url" ;;
  esac
done
echo
echo "===== END ====="
