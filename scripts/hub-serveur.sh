#!/bin/zsh
# Garde le Marketing Hub en marche sur http://localhost:3200/hub : le relance automatiquement s'il s'arrête.
# Lancé à l'ouverture de session par l'application « SKINCLEAN Hub » (~/Applications).
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export NEXT_DIST_DIR=.next-hub
cd "$(dirname "$0")/.." || exit 1
# Déjà en marche (lancé ailleurs) : rien à faire
lsof -nP -iTCP:3200 -sTCP:LISTEN >/dev/null 2>&1 && exit 0
while true; do
  npx next dev -p 3200
  echo "[$(date)] Le Hub s'est arrêté, redémarrage dans 5 s…"
  sleep 5
done
