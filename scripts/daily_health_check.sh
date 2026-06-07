#!/usr/bin/env bash
set -euo pipefail
APP="veriresume"
ROOT="/c/Users/prana/veriresume"
BASE_URL="https://veriresume.vercel.app"
HEALTH_URL="${BASE_URL}/api/health"

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

ok() { printf "${GREEN}OK${NC} %s\n" "$1"; }
err() { printf "${RED}FAIL${NC} %s\n" "$1"; }

printf "\n${BOLD}[%s] Daily Health Check: %s${NC}\n" "$(date -Iseconds)" "$APP"

repo_clean=1
if [ -d "$ROOT/.git" ]; then
  cd "$ROOT"
  if git status --porcelain | grep -q .; then
    repo_clean=0
  fi
fi

http_code=$(curl -I -Ls -o /dev/null -w '%{http_code}' "$BASE_URL")
if [ "$http_code" = "200" ]; then
  ok "Frontend responded $http_code"
else
  err "Frontend responded $http_code"
fi

health_code=$(curl -I -Ls -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)
health_body=$(curl -o /tmp/${APP}_health.json -w '%{http_code}' "$HEALTH_URL" || true) || true

if [ "$health_code" = "200" ]; then
  core_ok="unknown"
  if [ -f /tmp/${APP}_health.json ] && jq -e '.checks.core' /tmp/${APP}_health.json >/dev/null 2>&1; then
    core_ok=$(jq -r '.checks.core' /tmp/${APP}_health.json)
  fi
  if [ "$core_ok" = "true" ]; then
    ok "Core checks passed"
  else
    err "Core checks returned: ${core_ok}"
  fi
else
  err "Health endpoint responded $health_code"
fi

if [ "$repo_clean" = "1" ]; then
  ok "Repo clean"
else
  err "Repo has uncommitted changes"
fi
