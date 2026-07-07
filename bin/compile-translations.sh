#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANG_DIR="$ROOT/languages"
POT="$LANG_DIR/doublescale.pot"
PO="$LANG_DIR/doublescale-en_US.po"
MO="$LANG_DIR/doublescale-en_US.mo"

if [[ ! -f "$POT" ]]; then
	echo "Missing $POT — run: php bin/make-pot.php" >&2
	exit 1
fi

if [[ ! -f "$PO" ]]; then
	cp "$POT" "$PO"
	sed -i '' 's/"Language-Team: LANGUAGE <LL@li.org>\\n"/"Language-Team: English (United States)\\n"/' "$PO" 2>/dev/null || \
		sed -i 's/"Language-Team: LANGUAGE <LL@li.org>\\n"/"Language-Team: English (United States)\\n"/' "$PO"
fi

if ! command -v msgfmt >/dev/null 2>&1; then
	echo "msgfmt not found — install gettext to compile .mo files." >&2
	exit 1
fi

msgfmt "$PO" -o "$MO"
echo "Compiled $MO"
