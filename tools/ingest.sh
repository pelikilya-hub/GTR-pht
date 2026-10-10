#!/usr/bin/env bash
# usage: tools/ingest.sh <local file> <r2 path, e.g. raw/2026-10-10/night-pov.mp4>
# Encrypts the file with a fresh random key (AES-256-CBC, PBKDF2) and wraps that key with keys/public.pem.
# Only the runner can unwrap it (private key lives in the private R2 bucket). Then: git add inbox && push.
set -euo pipefail
f="$1"; dest="$2"; here="$(cd "$(dirname "$0")/.." && pwd)"
id="$(date +%s%N | tail -c 10)-$(basename "$dest" | tr -c 'A-Za-z0-9._-' '_')"
key="$(openssl rand -hex 32)"
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "pass:$key" -in "$f" -out "$here/inbox/$id.enc"
printf '%s' "$key" | openssl pkeyutl -encrypt -pubin -inkey "$here/keys/public.pem" -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w0 > "$here/inbox/$id.key"
printf '%s' "$dest" > "$here/inbox/$id.path"
echo "queued $dest ($(stat -c %s "$f") bytes)"
