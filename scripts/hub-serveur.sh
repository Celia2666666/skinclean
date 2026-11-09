#!/bin/zsh
# Lance le Marketing Hub sur http://localhost:3200/hub (utilisé par le service macOS fr.skinclean.marketing-hub).
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export NEXT_DIST_DIR=.next-hub
cd "$(dirname "$0")/.." || exit 1
exec npx next dev -p 3200
