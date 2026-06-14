#!/usr/bin/env bash
# E2E: Stripe CLI payment + refund for invoice #22, replaying webhooks locally.
set -euo pipefail

WP_ROOT="/var/www/html/wordpress"
INVOICE_ID=22
PI_ID=""

echo "=== 1) Reset invoice ${INVOICE_ID} ==="
php -r "
require '${WP_ROOT}/wp-load.php';
global \$wpdb;
\$p = \$wpdb->prefix;
\$wpdb->update(\$p.'doublescale_sales_invoices', ['status'=>'unpaid','amount_paid'=>0,'stripe_payment_intent_id'=>null], ['id'=>${INVOICE_ID}]);
\$wpdb->delete(\$p.'doublescale_sales_invoice_payments', ['invoice_id'=>${INVOICE_ID}]);
echo 'reset ok'.PHP_EOL;
" 2>/dev/null

echo "=== 2) Stripe CLI: create + confirm payment intent ==="
PI_JSON=$(stripe payment_intents create \
  --amount=1460 \
  --currency=usd \
  -d "metadata[source]=invoice" \
  -d "metadata[invoice_id]=${INVOICE_ID}" \
  -d "metadata[invoice_number]=INV-000002" \
  -d "metadata[invoice_hash]=f0b538043ceeffe5fbe8cb95f666d70c" \
  -d "payment_method_types[]=card" \
  -d payment_method=pm_card_visa \
  -d confirm=true)

PI_ID=$(php -r 'echo json_decode(file_get_contents("php://stdin"))->id;' <<<"$PI_JSON")
echo "PI: ${PI_ID}"

php -r "
require '${WP_ROOT}/wp-load.php';
global \$wpdb;
\$wpdb->update(\$wpdb->prefix.'doublescale_sales_invoices', ['stripe_payment_intent_id'=>'${PI_ID}'], ['id'=>${INVOICE_ID}]);
" 2>/dev/null

echo "=== 3) Wait for payment_intent.succeeded (stripe listen) ==="
sleep 3

php -r "
require '${WP_ROOT}/wp-load.php';
global \$wpdb;
\$inv=\$wpdb->get_row('SELECT status,amount_paid FROM '.\$wpdb->prefix.'doublescale_sales_invoices WHERE id=${INVOICE_ID}');
echo 'After pay webhook: status='.\$inv->status.' paid='.\$inv->amount_paid.PHP_EOL;
if ((float)\$inv->amount_paid < 14.60) {
  echo 'Webhook missed — replaying payment_intent.succeeded via handler...'.PHP_EOL;
  \$events = shell_exec('stripe events list --limit 5 --type payment_intent.succeeded 2>/dev/null');
  \$list = json_decode(\$events);
  foreach (\$list->data ?? [] as \$evt) {
    \$pi = \$evt->data->object->id ?? '';
    if (\$pi === '${PI_ID}') {
      delete_transient('ds_stripe_evt_'.md5(\$evt->id));
      DoubleScale\Pro\Modules\Sales\PaymentGateways\Stripe\StripeInvoiceGateway::instance()->handle_webhook_event(\$evt, ${INVOICE_ID});
      break;
    }
  }
  \$inv=\$wpdb->get_row('SELECT status,amount_paid FROM '.\$wpdb->prefix.'doublescale_sales_invoices WHERE id=${INVOICE_ID}');
  echo 'After replay: status='.\$inv->status.' paid='.\$inv->amount_paid.PHP_EOL;
}
" 2>/dev/null

echo "=== 4) Stripe CLI: full refund ==="
stripe refunds create --payment-intent="${PI_ID}" >/dev/null
echo "Refund issued"
sleep 3

php -r "
require '${WP_ROOT}/wp-load.php';
global \$wpdb;
\$inv=\$wpdb->get_row('SELECT status,amount_paid,stripe_payment_intent_id FROM '.\$wpdb->prefix.'doublescale_sales_invoices WHERE id=${INVOICE_ID}');
\$cnt=\$wpdb->get_var('SELECT COUNT(*) FROM '.\$wpdb->prefix.'doublescale_sales_invoice_payments WHERE invoice_id=${INVOICE_ID}');
echo 'After refund webhook: status='.\$inv->status.' paid='.\$inv->amount_paid.' pi='.(\$inv->stripe_payment_intent_id??'null').' payments='.\$cnt.PHP_EOL;
if ((float)\$inv->amount_paid > 0) {
  echo 'Webhook missed — replaying charge.refunded via handler...'.PHP_EOL;
  \$events = shell_exec('stripe events list --limit 5 --type charge.refunded 2>/dev/null');
  \$list = json_decode(\$events);
  foreach (\$list->data ?? [] as \$evt) {
    \$pi = \$evt->data->object->payment_intent ?? '';
    if (\$pi === '${PI_ID}') {
      delete_transient('ds_stripe_evt_'.md5(\$evt->id));
      DoubleScale\Pro\Modules\Sales\PaymentGateways\Stripe\StripeInvoiceGateway::instance()->handle_webhook_event(\$evt, ${INVOICE_ID});
      break;
    }
  }
  \$inv=\$wpdb->get_row('SELECT status,amount_paid,stripe_payment_intent_id FROM '.\$wpdb->prefix.'doublescale_sales_invoices WHERE id=${INVOICE_ID}');
  \$cnt=\$wpdb->get_var('SELECT COUNT(*) FROM '.\$wpdb->prefix.'doublescale_sales_invoice_payments WHERE invoice_id=${INVOICE_ID}');
  echo 'After replay: status='.\$inv->status.' paid='.\$inv->amount_paid.' pi='.(\$inv->stripe_payment_intent_id??'null').' payments='.\$cnt.PHP_EOL;
}
" 2>/dev/null

echo "=== Done ==="
