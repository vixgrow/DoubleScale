<?php
/**
 * Live WordPress verifier for Sales (proposal/invoice) automations.
 *
 * Usage (from plugin root):
 *   wp eval-file bin/verify-sales-automations.php --path=/var/www/html/wordpress
 *
 * @package DoubleScale
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via: wp eval-file bin/verify-sales-automations.php\n" );
	exit( 1 );
}

$failures = 0;
$passes   = 0;

/**
 * @param bool   $ok
 * @param string $label
 */
$check = static function ( bool $ok, string $label ) use ( &$failures, &$passes ): void {
	if ( $ok ) {
		++$passes;
		echo "[PASS] {$label}\n";
		return;
	}
	++$failures;
	echo "[FAIL] {$label}\n";
};

echo "=== DoubleScale Sales Automations Verifier ===\n\n";

$expected_triggers = array(
	'proposal_sent',
	'proposal_accepted',
	'proposal_declined',
	'proposal_converted_to_invoice',
	'invoice_sent',
	'invoice_paid',
	'contract_sent',
	'contract_signed',
);

$expected_proposal_rules = array(
	'proposal_status',
	'proposal_subject',
	'proposal_total',
	'proposal_number',
);

$expected_invoice_rules = array(
	'invoice_status',
	'invoice_total',
	'invoice_balance',
	'invoice_number',
);

$expected_contract_rules = array(
	'contract_status',
	'contract_subject',
	'contract_value',
	'contract_number',
);

$sales_on = function_exists( 'doublescale_is_module_active' ) && doublescale_is_module_active( 'sales' );
$pro_on   = function_exists( 'doublescale_is_pro_addon_active' ) && doublescale_is_pro_addon_active();

$check( $sales_on, 'Sales module is active' );
$check( $pro_on, 'Double Scale Pro is active' );

if ( class_exists( '\DoubleScale\Modules\Automations\Services\TriggersManager' ) ) {
	\DoubleScale\Modules\Automations\Services\TriggersManager::instance()->load_triggers();
	$triggers = \DoubleScale\Modules\Automations\Services\TriggersManager::instance()->get_all_triggers();
	foreach ( $expected_triggers as $slug ) {
		$check( isset( $triggers[ $slug ] ), "Trigger registered: {$slug}" );
		if ( isset( $triggers[ $slug ] ) ) {
			$t = $triggers[ $slug ];
			$expected_group = ( 0 === strpos( $slug, 'contract_' ) ) ? 'contracts' : 'sales';
			$check( 'sales' === $t->source && $expected_group === $t->group, "Trigger {$slug} source/group = sales/{$expected_group}" );
			if ( $pro_on ) {
				$check( empty( $t->is_pro ), "Trigger {$slug} is_pro=false when Pro active" );
			}
		}
	}

	$sources = \DoubleScale\Modules\Automations\Services\TriggersManager::instance()->get_sources();
	$check(
		isset( $sources['sales']['label'] ) && '' !== (string) $sources['sales']['label'],
		'Trigger sidebar label for sales source is set'
	);
} else {
	$check( false, 'TriggersManager class missing' );
}

if ( class_exists( '\DoubleScale\Modules\Automations\Services\ActionsManager' ) ) {
	$actions = \DoubleScale\Modules\Automations\Services\ActionsManager::instance()->get_actions();
	$check( ! isset( $actions['send_proposal'] ), 'send_proposal action is not registered' );
	$check( ! isset( $actions['create_invoice_from_proposal'] ), 'create_invoice_from_proposal action is not registered' );
} else {
	$check( false, 'ActionsManager class missing' );
}

if ( class_exists( '\DoubleScale\Modules\Automations\Services\RulesManager' ) ) {
	$groups = \DoubleScale\Modules\Automations\Services\RulesManager::instance()->get_groups();
	$check( isset( $groups['proposal'] ), 'Rules group: proposal' );
	$check( isset( $groups['invoice'] ), 'Rules group: invoice' );
	$check( isset( $groups['contract'] ), 'Rules group: contract' );

	if ( $sales_on && $pro_on ) {
		foreach ( $expected_proposal_rules as $slug ) {
			$check(
				isset( $groups['proposal']['rules'][ $slug ] ),
				"Proposal rule registered: {$slug}"
			);
		}
		foreach ( $expected_invoice_rules as $slug ) {
			$check(
				isset( $groups['invoice']['rules'][ $slug ] ),
				"Invoice rule registered: {$slug}"
			);
		}
		foreach ( $expected_contract_rules as $slug ) {
			$check(
				isset( $groups['contract']['rules'][ $slug ] ),
				"Contract rule registered: {$slug}"
			);
		}

		if ( isset( $groups['proposal']['triggers'] ) ) {
			foreach ( array( 'invoice_sent', 'invoice_paid' ) as $trigger ) {
				$check(
					in_array( $trigger, $groups['proposal']['triggers'], true ),
					"Proposal group includes trigger: {$trigger}"
				);
			}
		}
	} else {
		echo "[SKIP] Rule registration checks (need Sales + Pro active)\n";
	}
} else {
	$check( false, 'RulesManager class missing' );
}

if ( class_exists( '\DoubleScale\Core\MergeTags\MergeTagsManager' ) ) {
	$groups = \DoubleScale\Core\MergeTags\MergeTagsManager::instance()->get_groups();
	$sales_tags = $groups['sales']['mergeTags'] ?? array();
	foreach ( array( 'proposal_url', 'invoice_url', 'proposal_total', 'invoice_balance', 'contract_url', 'contract_value' ) as $slug ) {
		$check( isset( $sales_tags[ $slug ] ), "Merge tag registered in sales group: {$slug}" );
	}
}

echo "\n=== Summary: {$passes} passed, {$failures} failed ===\n";
exit( $failures > 0 ? 1 : 0 );
