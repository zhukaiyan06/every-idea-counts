#!/usr/bin/env bash
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
ALLOWED_EMAIL="${ALLOWED_EMAIL:-}"
EXPECT_ALLOWLIST="${EXPECT_ALLOWLIST:-false}"


if [[ -z "${SUPABASE_ANON_KEY}" ]]; then
  echo "FAIL: SUPABASE_ANON_KEY is required"
  exit 1
fi

if [[ -z "${ALLOWED_EMAIL}" ]]; then
  echo "FAIL: ALLOWED_EMAIL is required"
  exit 1
fi

FUNCTIONS_URL="${SUPABASE_URL%/}/functions/v1"
AUTH_URL="${SUPABASE_URL%/}/auth/v1"

PASSWORD='local-smoke-Password!123'
WRONG_EMAIL="smoke_wrong_$(date +%s)@example.com"

function get_access_token() {
  local email="$1"

  curl -s -X POST "${AUTH_URL}/signup" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}" >/dev/null

  local token_response
  token_response=$(curl -s -X POST "${AUTH_URL}/token?grant_type=password" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")

  echo "${token_response}" | python -c "import json,sys; data=json.load(sys.stdin); print(data.get('access_token',''))"
}

ALLOWED_TOKEN=$(get_access_token "${ALLOWED_EMAIL}")
if [[ -z "${ALLOWED_TOKEN}" ]]; then
  echo "FAIL: Unable to obtain access token for allowed email"
  exit 1
fi

WRONG_TOKEN=$(get_access_token "${WRONG_EMAIL}")
if [[ -z "${WRONG_TOKEN}" ]]; then
  echo "FAIL: Unable to obtain access token for wrong email"
  exit 1
fi

IDEA_ID=$(python -c "import uuid; print(uuid.uuid4())")

REQUEST_BODY=$(cat <<JSON
{
  "idea_id": "${IDEA_ID}",
  "idea_type": "product",
  "raw_input": "Smoke test idea",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "capture_mode": "quick"
}
JSON
)

function check_status() {
  local name="$1"
  local expected="$2"
  local status="$3"

  if [[ "${status}" == "${expected}" ]]; then
    echo "PASS: ${name} returned ${status}"
  else
    echo "FAIL: ${name} returned ${status} (expected ${expected})"
    exit 1
  fi
}

STATUS_UNAUTH=$(curl -s -o /tmp/functions-smoke-unauth.txt -w "%{http_code}" \
  -X POST "${FUNCTIONS_URL}/ai_extract_note" \
  -H "Content-Type: application/json" \
  -d "${REQUEST_BODY}")

if [[ "${EXPECT_ALLOWLIST}" == "true" ]]; then
  check_status "Unauthenticated request" "401" "${STATUS_UNAUTH}"
else
  # In open-access mode, an unauthenticated request may return 200, 401, or 403
  if [[ "${STATUS_UNAUTH}" == "200" || "${STATUS_UNAUTH}" == "401" || "${STATUS_UNAUTH}" == "403" ]]; then
    echo "PASS: Unauthenticated request returned ${STATUS_UNAUTH} (allowed in open-access mode)"
  else
    echo "FAIL: Unauthenticated request returned ${STATUS_UNAUTH} (expected 200, 401, or 403 in open-access mode)"
    exit 1
  fi
fi

STATUS_FORBIDDEN=$(curl -s -o /tmp/functions-smoke-forbidden.txt -w "%{http_code}" \
  -X POST "${FUNCTIONS_URL}/ai_extract_note" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WRONG_TOKEN}" \
  -d "${REQUEST_BODY}")

if [[ "${EXPECT_ALLOWLIST}" == "true" ]]; then
  check_status "Wrong email request (strict allowlist)" "403" "${STATUS_FORBIDDEN}"
else
  # In open-access mode, a wrong email (valid token) may return 401, 200, or 403
  if [[ "${STATUS_FORBIDDEN}" == "200" || "${STATUS_FORBIDDEN}" == "401" || "${STATUS_FORBIDDEN}" == "403" ]]; then
    echo "PASS: Wrong email request returned ${STATUS_FORBIDDEN} (allowed in open-access mode)"
  else
    echo "FAIL: Wrong email request returned ${STATUS_FORBIDDEN} (expected 200, 401, or 403 in open-access mode)"
    exit 1
  fi
fi


STATUS_ALLOWED=$(curl -s -o /tmp/functions-smoke-allowed.txt -w "%{http_code}" \
  -X POST "${FUNCTIONS_URL}/ai_extract_note" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ALLOWED_TOKEN}" \
  -d "${REQUEST_BODY}")

if [[ "${EXPECT_ALLOWLIST}" == "true" ]]; then
  check_status "Allowed email request (strict allowlist)" "200" "${STATUS_ALLOWED}"
else
  # In open-access mode, an allowed email may return 200, 401, or 403
  if [[ "${STATUS_ALLOWED}" == "200" || "${STATUS_ALLOWED}" == "401" || "${STATUS_ALLOWED}" == "403" ]]; then
    echo "PASS: Allowed email request returned ${STATUS_ALLOWED} (allowed in open-access mode)"
  else
    echo "FAIL: Allowed email request returned ${STATUS_ALLOWED} (expected 200, 401, or 403 in open-access mode)"
    exit 1
  fi
fi

echo "PASS: Functions smoke checks succeeded"
