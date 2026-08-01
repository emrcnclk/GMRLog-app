#!/usr/bin/env sh
# Generate local self-signed TLS certs for nginx (D3.19).
set -eu
DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/certs"
mkdir -p "$DIR"
openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$DIR/localhost.key" \
  -out "$DIR/localhost.crt" \
  -subj "/CN=localhost"
echo "Wrote $DIR/localhost.crt"
