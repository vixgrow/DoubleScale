#!/usr/bin/env bash
set -euo pipefail

# Build a distributable plugin zip:
#   1. Compile production assets via wp-scripts.
#   2. rsync the plugin into a temp staging dir, excluding dev-only files.
#   3. Zip the staged tree as `doublescale-<version>.zip` in `dist/`.

SLUG="doublescale"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

VERSION="$(grep -E '^\s*\*\s*Version:' "$SLUG.php" | head -n1 | sed -E 's/.*Version:[[:space:]]+([^[:space:]]+).*/\1/')"
if [[ -z "$VERSION" ]]; then
	echo "Could not parse Version from $SLUG.php" >&2
	exit 1
fi

DIST_DIR="$PROJECT_ROOT/dist"
STAGE_DIR="$DIST_DIR/$SLUG"
ZIP_FILE="$DIST_DIR/${SLUG}-${VERSION}.zip"

echo "→ Building production assets…"
npm run build --silent

echo "→ Staging plugin files at $STAGE_DIR"
rm -rf "$STAGE_DIR" "$ZIP_FILE"
mkdir -p "$STAGE_DIR"

rsync -a \
	--exclude=".*" \
	--exclude="node_modules" \
	--exclude="vendor" \
	--exclude="src" \
	--exclude="tests" \
	--exclude="phpunit" \
	--exclude="docs" \
	--exclude="dist" \
	--exclude="bin" \
	--exclude="tools" \
	--exclude="*.log" \
	--exclude="*.md" \
	--exclude="package.json" \
	--exclude="package-lock.json" \
	--exclude="composer.json" \
	--exclude="composer.lock" \
	--exclude="webpack.config.js" \
	--exclude="postcss.config.js" \
	--exclude="tailwind.config.js" \
	--exclude="tsconfig.json" \
	--exclude="tsconfig.tsbuildinfo" \
	--exclude="vitest.config.ts" \
	--exclude="playwright.config.ts" \
	--exclude="components.json" \
	--exclude="phpcs.xml.dist" \
	--exclude="phpunit.xml.dist" \
	--exclude="*.postman_collection.json" \
	./ "$STAGE_DIR/"

echo "→ Creating $ZIP_FILE"
(cd "$DIST_DIR" && zip -rq "$(basename "$ZIP_FILE")" "$SLUG")

rm -rf "$STAGE_DIR"

SIZE="$(du -h "$ZIP_FILE" | cut -f1)"
echo "✓ Built $ZIP_FILE ($SIZE)"
