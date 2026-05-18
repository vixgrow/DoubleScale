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
	--exclude="*.log" \
	--exclude="*.md" \
	--exclude="/vendor" \
	--exclude="/src" \
	--exclude="/tests" \
	--exclude="/phpunit" \
	--exclude="/docs" \
	--exclude="/dist" \
	--exclude="/bin" \
	--exclude="/tools" \
	--exclude="/package.json" \
	--exclude="/package-lock.json" \
	--exclude="/composer.json" \
	--exclude="/composer.lock" \
	--exclude="/webpack.config.js" \
	--exclude="/postcss.config.js" \
	--exclude="/tailwind.config.js" \
	--exclude="/tsconfig.json" \
	--exclude="/tsconfig.tsbuildinfo" \
	--exclude="/vitest.config.ts" \
	--exclude="/playwright.config.ts" \
	--exclude="/components.json" \
	--exclude="/phpcs.xml.dist" \
	--exclude="/phpunit.xml.dist" \
	--exclude="/*.postman_collection.json" \
	--exclude="/dependencies/composer.json" \
	--exclude="/dependencies/composer.lock" \
	./ "$STAGE_DIR/"

# Generate a production-only Composer autoloader inside the staging dir.
# We strip the dev `vendor/` from the rsync above to keep PHPCS/PHPUnit out of
# the zip, but the SMTP module relies on Composer's classmap autoloader (see
# the root composer.json `autoload.classmap` entry) — its provider files use
# WP-style `class-*.php` names that the custom PSR-4 fallback in
# `includes/Autoload.php` cannot resolve. Without this step, activating the
# zipped plugin fatals with "Class SendLayer not found".
echo "→ Installing production Composer autoloader in staging…"
cp "$PROJECT_ROOT/composer.json" "$STAGE_DIR/composer.json"
if [[ -f "$PROJECT_ROOT/composer.lock" ]]; then
	cp "$PROJECT_ROOT/composer.lock" "$STAGE_DIR/composer.lock"
fi
(
	cd "$STAGE_DIR"
	composer install \
		--no-dev \
		--classmap-authoritative \
		--optimize-autoloader \
		--no-interaction \
		--no-progress \
		--no-scripts \
		--quiet
)
rm -f "$STAGE_DIR/composer.json" "$STAGE_DIR/composer.lock"

echo "→ Creating $ZIP_FILE"
(cd "$DIST_DIR" && zip -rq "$(basename "$ZIP_FILE")" "$SLUG")

rm -rf "$STAGE_DIR"

SIZE="$(du -h "$ZIP_FILE" | cut -f1)"
echo "✓ Built $ZIP_FILE ($SIZE)"
