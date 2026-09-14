#!/usr/bin/env bash
# Однократный выпуск Let's Encrypt через certbot --nginx для afawots.ru + www.
# Требует: DOMAIN_EMAIL (env), nginx уже слушает 80, DNS А-запись указывает на этот сервер.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
DOMAIN="afawots.ru"

echo "===== 1. install certbot ====="
if ! command -v certbot >/dev/null 2>&1; then
  sudo -n apt-get update -y
  sudo -n apt-get install -y certbot python3-certbot-nginx
fi
certbot --version

echo "===== 2. sanity: DNS ====="
IP=$(curl -s -4 ifconfig.me)
DNS_IP=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')
echo "server IP: $IP"
echo "DNS IP:    ${DNS_IP:-<none>}"
if [ -z "$DNS_IP" ] || [ "$DNS_IP" != "$IP" ]; then
  echo "::error::DNS запись $DOMAIN не указывает на этот сервер ($IP). Замени A-запись в панели Timeweb, дождись обновления (5-15 мин) и повтори."
  exit 1
fi

echo "===== 3. run certbot ====="
sudo -n certbot --nginx \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    -m "${DOMAIN_EMAIL:-admin@$DOMAIN}" \
    --agree-tos --no-eff-email \
    --redirect --non-interactive

echo "===== 4. verify ====="
curl -sI -m 10 "https://$DOMAIN/" | head -5 || true

echo "===== END ====="
