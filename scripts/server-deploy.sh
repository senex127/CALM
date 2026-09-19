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
NODE_MAJOR="20"   # doit rester synchro avec la version choisie dans Setup Node.js App

# Le cron ne source pas le profil interactif (celui qui active l'environnement Node de
# Setup Node.js App, visible dans le prompt SSH en `[app_root (20)]`) — sans ça, `npm`/`node`
# peuvent résoudre vers une tout autre version côté cron que celle configurée pour l'app, voire
# être absents du PATH. On l'active explicitement ici si le script d'activation existe.
NODE_VENV="$HOME/nodevenv/$CPANEL_APP_ROOT/$NODE_MAJOR"
if [ -f "$NODE_VENV/bin/activate" ]; then
  # shellcheck disable=SC1090
  source "$NODE_VENV/bin/activate"
fi

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
git diff --name-only "$CURRENT" "$REMOTE" | grep -q "^backend/package" && BACKEND_PKG=1 || true

echo "Backend pkg changé : $BACKEND_PKG"

# ── Pull ──
git reset --hard origin/main
echo "=== git reset --hard OK ==="

# ── Deps backend ──
cd "$BACKEND"

if [ "$BACKEND_PKG" = "1" ]; then
  echo "=== npm install backend ==="
  # uapi NodeJs install_npm_packages est la méthode recommandée sur un compte CloudLinux (évite
  # de casser le lien symbolique géré par le système vers node_modules) — mais indisponible sur
  # certains comptes O2Switch (binaire /usr/local/cpanel/cpanel absent selon la configuration).
  # On retombe alors sur un npm install classique, sûr tant que le venv Node du Setup Node.js
  # App est actif (c'est le cas ici : le script tourne depuis ce même app_root).
  if "$UAPI" --output=jsonpretty NodeJs install_npm_packages app_root="$CPANEL_APP_ROOT" 2>/dev/null; then
    echo "(installé via uapi)"
  else
    echo "uapi indisponible sur ce compte — npm install classique"
    npm install
  fi
fi

# ── Prisma ──
echo "=== prisma db push ==="
./node_modules/.bin/prisma db push \
  --schema ./src/prisma/schema.prisma \
  --accept-data-loss

echo "=== prisma generate ==="
./node_modules/.bin/prisma generate \
  --schema ./src/prisma/schema.prisma

# ── Frontend : déjà construit par la CI (frontend/dist commité sur main, voir
# .github/workflows/deploy.yml) — ce serveur se contente de le copier. Pas de `npm ci`/
# `npm run build` ici : NODE_ENV=production (actif via le venv Node source plus haut) fait
# sauter les devDependencies à l'install sur ce compte, quel que soit le flag npm utilisé
# (--include=dev, --production=false) — et vite en fait partie. Copie systématique, pas
# conditionnelle : sans build à lancer, c'est une opération rapide et sans effet de bord.
if [ -d "$FRONTEND/dist" ]; then
  echo "=== Copie frontend/dist → $PUBLIC ==="
  mkdir -p "$PUBLIC"
  rm -rf "${PUBLIC:?}"/*
  cp -r "$FRONTEND/dist/." "$PUBLIC/"
else
  echo "AVERTISSEMENT : $FRONTEND/dist introuvable — la CI a-t-elle bien commité le build ?"
fi

# ── Restart Passenger ──
echo "=== Restart Passenger ==="
mkdir -p tmp
touch tmp/restart.txt

echo "=== DEPLOY OK ==="
