#!/bin/bash
# ============================================================
# Déploiement côté serveur — O2Switch / cPanel
# ============================================================
# Installer via cPanel → Cron Jobs :
#   */5 * * * * /home/USER/public_html/comme-a-la-maison/scripts/server-deploy.sh
# (remplacer USER par votre identifiant cPanel)
#
# Pourquoi un cron qui pull, plutôt qu'un webhook déclenché par le CI :
#   - le port 22 (SSH) est bloqué depuis les IPs GitHub Actions sur O2Switch
#   - la protection anti-bot (Imunify360) bloque les requêtes curl/wget entrantes
# Le CI (voir .github/workflows/deploy.yml) se contente donc de valider le
# build et l'audit de sécurité ; ce script fait le déploiement réel.
# ============================================================
set -euo pipefail

REPO="$HOME/public_html/comme-a-la-maison"
BACKEND="$REPO/backend"
FRONTEND="$REPO/frontend"
PUBLIC="$BACKEND/public"   # servi par Passenger comme racine statique
LOG="$BACKEND/tmp/deploy-cron.log"
UAPI="/usr/local/cpanel/bin/uapi"
CPANEL_APP_ROOT="public_html/comme-a-la-maison/backend"

mkdir -p "$(dirname "$LOG")"

# Rotation du log : garder les 200 dernières lignes
if [ -f "$LOG" ]; then
  lines=$(wc -l < "$LOG")
  if [ "$lines" -gt 250 ]; then
    tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
  fi
fi

exec >> "$LOG" 2>&1

echo ""
echo "=== Check $(date) ==="

cd "$REPO"
git fetch origin main --quiet

CURRENT=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$CURRENT" = "$REMOTE" ]; then
  echo "Aucun nouveau commit — rien à faire."
  exit 0
fi

echo "=== Nouveau commit détecté : $REMOTE (était $CURRENT) ==="

BACKEND_PKG=0
FRONTEND_CHANGED=0
git diff --name-only "$CURRENT" "$REMOTE" | grep -q "^backend/package" && BACKEND_PKG=1 || true
git diff --name-only "$CURRENT" "$REMOTE" | grep -q "^frontend/"       && FRONTEND_CHANGED=1 || true

echo "Backend pkg changé : $BACKEND_PKG | Frontend changé : $FRONTEND_CHANGED"

# ── Pull ──
git reset --hard origin/main
echo "=== git reset --hard OK ==="

# ── Deps backend ──
cd "$BACKEND"

if [ "$BACKEND_PKG" = "1" ]; then
  echo "=== npm install backend (via uapi CloudLinux) ==="
  "$UAPI" --output=jsonpretty NodeJs install_npm_packages app_root="$CPANEL_APP_ROOT"
fi

# ── Prisma ──
echo "=== prisma db push ==="
./node_modules/.bin/prisma db push \
  --schema ./src/prisma/schema.prisma \
  --accept-data-loss

echo "=== prisma generate ==="
./node_modules/.bin/prisma generate \
  --schema ./src/prisma/schema.prisma

# ── Build frontend ──
if [ "$FRONTEND_CHANGED" = "1" ]; then
  echo "=== Build frontend ==="
  cd "$FRONTEND"
  npm ci --silent
  npm run build
  mkdir -p "$PUBLIC"
  rm -rf "${PUBLIC:?}"/*
  cp -r dist/. "$PUBLIC/"
  echo "=== Frontend déployé dans $PUBLIC ==="
  cd "$BACKEND"
fi

# ── Restart Passenger ──
echo "=== Restart Passenger ==="
mkdir -p tmp
touch tmp/restart.txt

echo "=== DEPLOY OK ==="
