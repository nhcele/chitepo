#!/usr/bin/env bash
# Create the real .env files from the templates, generate secrets, and prompt for
# the DB password. Run once from the repo root:  ./deploy/setup-env.sh
# Safe to re-run: it never overwrites an existing .env.
set -euo pipefail
cd "$(dirname "$0")/.."

BE=backend/.env
FE=frontend/.env.production

if [ -f "$BE" ]; then
  echo "• $BE already exists — leaving it untouched."
else
  cp deploy/backend.env.production.example "$BE"
  JWT=$(openssl rand -hex 32)
  SES=$(openssl rand -hex 32)
  ENC=$(openssl rand -hex 32)
  read -rs -p "MySQL password for the 'chitepo' DB user: " DBPW; echo
  python3 - "$BE" "$JWT" "$SES" "$ENC" "$DBPW" <<'PY'
import sys
path, jwt, ses, enc, dbpw = sys.argv[1:6]
s = open(path, encoding='utf-8').read()
s = s.replace('CHANGE_ME_DB_PASSWORD', dbpw)
# Placeholders appear in file order: JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY
for val in (jwt, ses, enc):
    s = s.replace('CHANGE_ME_64_HEX_CHARS', val, 1)
open(path, 'w', encoding='utf-8').write(s)
PY
  echo "• Created $BE with generated secrets + DB password."
fi

if [ -f "$FE" ]; then
  echo "• $FE already exists — leaving it untouched."
else
  cp deploy/frontend.env.production.example "$FE"
  echo "• Created $FE (public URL + /chitepo base path)."
fi

echo
echo "Done. Quick check:"
echo "  grep -E 'DATABASE_PASSWORD|JWT_SECRET' $BE   # confirm they are filled, not CHANGE_ME"
echo "Then build:  ./deploy/deploy.sh"
