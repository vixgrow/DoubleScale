#!/usr/bin/env bash
set -euo pipefail

# Compile languages/doublescale-<locale>.po into a .mo file.
#
# Usage: bash bin/compile-translations.sh [locale ...]
#   e.g.: bash bin/compile-translations.sh pt_BR
#         bash bin/compile-translations.sh            (all .po files present)
#
# Compiles with msgfmt when gettext is installed, otherwise falls back to
# `wp i18n make-mo` so the pipeline works on machines without gettext.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANG_DIR="$ROOT/languages"
POT="$LANG_DIR/doublescale.pot"

if [[ ! -f "$POT" ]]; then
	echo "Missing $POT — run: php bin/make-pot.php" >&2
	exit 1
fi

# Resolve the locales to compile.
locales=("$@")
if [[ ${#locales[@]} -eq 0 ]]; then
	shopt -s nullglob
	for po in "$LANG_DIR"/doublescale-*.po; do
		base="$(basename "$po" .po)"
		locales+=("${base#doublescale-}")
	done
	shopt -u nullglob
fi

if [[ ${#locales[@]} -eq 0 ]]; then
	echo "No .po files in $LANG_DIR — create one from doublescale.pot first." >&2
	echo "  cp languages/doublescale.pot languages/doublescale-<locale>.po" >&2
	exit 1
fi

have_msgfmt=0
command -v msgfmt >/dev/null 2>&1 && have_msgfmt=1

have_wp=0
command -v wp >/dev/null 2>&1 && have_wp=1

if [[ $have_msgfmt -eq 0 && $have_wp -eq 0 ]]; then
	echo "Neither msgfmt nor wp-cli found — install gettext or WP-CLI to compile .mo files." >&2
	exit 1
fi

for locale in "${locales[@]}"; do
	PO="$LANG_DIR/doublescale-${locale}.po"
	MO="$LANG_DIR/doublescale-${locale}.mo"

	if [[ ! -f "$PO" ]]; then
		echo "Skipping ${locale}: $PO not found" >&2
		continue
	fi

	if [[ $have_msgfmt -eq 1 ]]; then
		msgfmt "$PO" -o "$MO"
	else
		# make-mo writes <basename>.mo into the target directory.
		wp i18n make-mo "$PO" "$LANG_DIR" >/dev/null
	fi

	echo "Compiled $MO"
done
