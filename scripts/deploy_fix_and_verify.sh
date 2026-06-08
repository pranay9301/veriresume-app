#!/usr/bin/env bash
set -euo pipefail
APP="veriresume"
ROOT="/c/Users/prana/veriresume"
BASE_URL="https://veriresume.vercel.app"
HEALTH_URL="${BASE_URL}/api/health"
DEBUG_URL="${BASE_URL}/api/debug/dependencies"
HOME_PAGE="${BASE_URL}/"

echo "[deploy_fix_and_verify] Build"
cd "$ROOT"
if [ -x node_modules/.bin/react-scripts ]; then
  CI=1 npm run build
else
  echo "[deploy_fix_and_verify] Installing dependencies"
  npm install
  CI=1 npm run build
fi

echo "[deploy_fix_and_verify] Git status"
git add api/health.js api/debug/dependencies.js scripts/deploy_fix_and_verify.sh scripts/daily_verification.sh || true
git status --porcelain | tee "/tmp/${APP}_repo_status.txt" || true
if [ -s "/tmp/${APP}_repo_status.txt" ]; then
  git commit -m "chore(diagnostics): enhance /api/health + add /api/debug/dependencies"
fi

echo "[deploy_fix_and_verify] Push"
git push origin main

echo "[deploy_fix_and_verify] Waiting for Vercel deploy to settle"
sleep 18

echo "[deploy_fix_and_verify] Verify endpoints"
HOME_CODE=$(curl -I -Ls -o /dev/null -w '%{http_code}' "$HOME_PAGE" || true)
HEALTH_BODY_TMP="/tmp/${APP}_health_body.json"
HEALTH_CODE=$(curl -o "$HEALTH_BODY_TMP" -w '%{http_code}' "$HEALTH_URL" || true)
DEBUG_BODY_TMP="/tmp/${APP}_debug_body.json"
DEBUG_CODE=$(curl -o "$DEBUG_BODY_TMP" -w '%{http_code}' "$DEBUG_URL" || true)

printf "Home=%s\nHealth=%s\nDebug=%s\n" "$HOME_CODE" "$HEALTH_CODE" "$DEBUG_CODE"

if [ "$HOME_CODE" != "200" ]; then
  echo "FAIL Home page not 200"
  exit 1
fi
if [ "$HEALTH_CODE" != "200" ]; then
  echo "FAIL /api/health not 200"
  exit 1
fi
if [ "$DEBUG_CODE" != "200" ]; then
  echo "FAIL /api/debug/dependencies not 200"
  exit 1
fi

if command -v python >/dev/null 2>&1; then
python - <<'PY'
import json, sys
for path in ["/tmp/veriresume_health_body.json", "/tmp/veriresume_debug_body.json"]:
    try:
        with open(path) as f:
            json.load(f)
        print(f"OK parsed JSON: {path}")
    except Exception as e:
        print(f"FAIL invalid JSON {path}: {e}")
        sys.exit(1)
PY
fi

echo "[deploy_fix_and_verify] DONE"
