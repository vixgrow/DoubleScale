#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if ! pgrep -f "stripe listen" >/dev/null 2>&1; then
	echo "Start stripe listen first: ${SCRIPT_DIR}/stripe-listen.sh" >&2
	exit 1
fi
php "${SCRIPT_DIR}/test-stripe-booking-deep.php" "$@"
