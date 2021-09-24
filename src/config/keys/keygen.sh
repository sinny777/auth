#!/bin/bash
set -euo pipefail

NAME=${1:-}
# test -z "${NAME:-}" && NAME="smarthings-auth-keys-$(date +%s)"
test -z "${NAME:-}" && NAME="smarthings-auth-keys"
mkdir "$NAME"

PRIVATE_PEM="./$NAME/private.pem"
PUBLIC_PEM="./$NAME/public.pem"
PUBLIC_TXT="./$NAME/public_key.txt"
PRIVATE_TXT="./$NAME/private_key.txt"

ssh-keygen -t rsa -b 2048 -m PEM -f "$PRIVATE_PEM" -q -N ""
openssl rsa -in "$PRIVATE_PEM" -pubout -outform PEM -out "$PUBLIC_PEM" 2>/dev/null
openssl rsa -in "$PRIVATE_PEM" -pubout -outform DER | base64 > "$PUBLIC_TXT"

# awk -v ORS='\\n' '1' secrets/public.pem | pbcopy
# awk -v ORS='\\n' '1' src/config/keys/secrets/public.pem | pbcopy
# awk -v ORS='\\n' '1' src/config/keys/secrets/hyper-dbaas-postgres.pem |  pbcopy

# openssl x509 -outform der -in src/config/keys/secrets/hyper-dbaas-postgres.pem -out src/config/keys/secrets/hyper-dbaas-postgres.crt

rm "$PRIVATE_PEM".pub

echo "Public key to saved in $PUBLIC_TXT"
