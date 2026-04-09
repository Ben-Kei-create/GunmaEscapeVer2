#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/release/itch"
STAMP="$(date +"%Y%m%d-%H%M%S")"
STAGE_DIR="$RELEASE_DIR/stage"
ZIP_PATH="$RELEASE_DIR/GunmaEscapeVer2-itch-${STAMP}.zip"

mkdir -p "$RELEASE_DIR"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

cp "$ROOT_DIR/index.html" "$STAGE_DIR/"
cp "$ROOT_DIR/favicon.svg" "$STAGE_DIR/"
cp "$ROOT_DIR/site.webmanifest" "$STAGE_DIR/"
cp -R "$ROOT_DIR/js" "$STAGE_DIR/"

(
  cd "$STAGE_DIR"
  zip -qr "$ZIP_PATH" index.html favicon.svg site.webmanifest js
)

rm -rf "$STAGE_DIR"

echo "Created: $ZIP_PATH"
echo "Contents:"
zipinfo -1 "$ZIP_PATH"
