#!/usr/bin/env bash
# Forward Stripe test-mode webhooks to the local DoubleScale REST endpoint.
#
# Usage: ./bin/stripe-listen.sh [WP_SITE_URL]
# Default: http://localhost/wordpress

set -euo pipefail

SITE_URL="${1:-http://localhost/wordpress}"
WEBHOOK_URL="${SITE_URL%/}/wp-json/doublescale/v1/integrations/stripe/webhook"

if ! command -v stripe >/dev/null 2>&1; then
	echo "stripe CLI not found. Install: npm install -g @stripe/cli --prefix ~/.local" >&2
	echo "Add ~/.local/bin to PATH." >&2
	exit 1
fi

echo "Forwarding Stripe events → ${WEBHOOK_URL}"
echo "Copy whsec_… into Integrations → Stripe → Sandbox webhook secret."
echo ""

stripe listen \
	--forward-to "${WEBHOOK_URL}" \
	--events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,charge.refunded,charge.dispute.created
