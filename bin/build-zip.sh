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
	--exclude="/phpcs.security.xml.dist" \
	--exclude="/phpunit.xml.dist" \
	--exclude="/*.postman_collection.json" \
	--exclude="/dependencies/composer.json" \
	--exclude="/dependencies/composer.lock" \
	--exclude="/dependencies/vendor" \
	--exclude="/dependencies/vendor.OFF" \
	--exclude="/php-scoper.phar" \
	--include="/assets/images/templates-images/***" \
	--include="/assets/images/form-types/***" \
	--include="/assets/images/typeform/***" \
	--include="/assets/images/jotform/***" \
	--include="/assets/images/slack/***" \
	--include="/assets/images/stripe/***" \
	--include="/assets/images/paypal/***" \
	--include="/assets/images/twilio/***" \
	--include="/assets/images/square/***" \
	--include="/assets/images/mollie/***" \
	--include="/assets/images/razorpay/***" \
	--include="/assets/images/authorize-net/***" \
	--include="/assets/images/meta-whatsapp/***" \
	--include="/assets/images/zapier/***" \
	--include="/assets/images/white-label/***" \
	--exclude="/assets/images/**" \
	--exclude="/assets/booking-icons" \
	./ "$STAGE_DIR/"

# Generate a production-only Composer autoloader inside the staging dir.
# We strip the dev `vendor/` from the rsync above to keep PHPCS/PHPUnit out of
# the zip, but the SMTP module relies on Composer's classmap autoloader (see
# the root composer.json `autoload.classmap` entry) — its provider files use
# WP-style `class-*.php` names. The PSR-4 fallback in `includes/Autoload.php`
# lowercases every path segment when building the disk path, so on a
# case-sensitive filesystem (Linux production) it fails to find e.g.
# `includes/Modules/Smtp/Providers/sendlayer/class-sendlayer.php` because
# it builds `includes/modules/smtp/providers/sendlayer/class-sendlayer.php`.
# Composer's classmap stores the exact case-preserving path, so it works
# everywhere. Without this step the zipped plugin fatals on Linux with
# "Class SendLayer not found".
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
# Keep composer.json next to the generated vendor/ so wp.org's Plugin Check
# doesn't flag "missing_composer_json_file". Drop the lock — it's not useful
# to end-users and bloats the zip.
rm -f "$STAGE_DIR/composer.lock"

# Strip files that wp.org's "Add your plugin" upload rejects, plus dev/CI
# bloat that ships inside scoped vendor packages. wp.org explicitly bans
# executable scripts (.sh, .bat, .cmd, .ps1) anywhere in the zip.
echo "→ Scrubbing disallowed / dev-only files from staging…"
find "$STAGE_DIR" \( \
	-name '*.sh' -o \
	-name '*.bat' -o \
	-name '*.cmd' -o \
	-name '*.ps1' -o \
	-name '*.exe' -o \
	-name '*.dll' \
\) -type f -delete
# Strip per-vendor .github/ workflow dirs (not runtime code), composer.lock
# files left inside scoped vendor packages, and dev configs.
find "$STAGE_DIR" -type d -name '.github' -prune -exec rm -rf {} +
find "$STAGE_DIR" -type f \( -name 'composer.lock' -o -name '*.neon' -o -name '*.rst' \) -delete
# Re-create the top-level composer.lock guard (we explicitly removed the
# staging one above, but find above would have caught it again on a second
# run — keep it explicit so future readers understand the order).

echo "→ Creating $ZIP_FILE"
(cd "$DIST_DIR" && zip -rq "$(basename "$ZIP_FILE")" "$SLUG")

rm -rf "$STAGE_DIR"

SIZE="$(du -h "$ZIP_FILE" | cut -f1)"
echo "✓ Built $ZIP_FILE ($SIZE)"
