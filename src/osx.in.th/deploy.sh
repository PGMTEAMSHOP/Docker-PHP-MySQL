#!/bin/bash
# deploy.sh — ใช้ทุกครั้งหลังอัพโหลดไฟล์ใหม่ขึ้น server
# Usage: bash /www/wwwroot/osx.in.th/deploy.sh

set -e
APP_DIR="/www/wwwroot/osx.in.th"
NGINX_CACHE="/www/server/nginx/proxy_cache_dir"
PM2_APP="web-shop"

echo "=== 1/4 Build Next.js ==="
cd "$APP_DIR"
rm -rf .next
npm run build

echo "=== 2/4 Restart PM2 ==="
pm2 restart "$PM2_APP"

echo "=== 3/4 Clear Nginx Cache ==="
if [ "$EUID" -eq 0 ]; then
  rm -rf "$NGINX_CACHE"/* 2>/dev/null || true
  nginx -s reload 2>/dev/null || true
else
  sudo rm -rf "$NGINX_CACHE"/* 2>/dev/null || true
  sudo nginx -s reload 2>/dev/null || true
fi

echo "=== 4/4 Verify ==="
sleep 3
curl -sI https://osx.in.th | grep -i "x-cache\|x-nextjs-cache" || true
curl -s https://osx.in.th | grep -o 'href="https://discord[^"]*"' || true

echo ""
echo "Deploy Done!"
