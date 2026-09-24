#!/bin/bash
# Хук старта веб-сессии Claude Code: ставит зависимости для проверок (Playwright для npm run smoke).
# Работает только в облачной сессии; на обычном компьютере ничего не делает.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund
