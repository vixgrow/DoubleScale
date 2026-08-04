<?php
/**
 * Live WordPress verifier for Project automations.
 *
 * Usage:
 *   wp eval-file bin/verify-project-automations.php --path=/var/www/html/wordpress
 *
 * @package DoubleScale
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via: wp eval-file bin/verify-project-automations.php\n" );
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

echo "=== DoubleScale Project Automations Verifier ===\n\n";

$expected_triggers = array(
	'project_created',
	'project_status_changed',
	'project_completed',
	'project_owner_changed',
	'project_due_soon',
	'project_overdue',
	'project_comment_posted',
	'project_converted_from_deal',
);

$expected_actions = array(
	'create_project',
	'update_project_status',
	'complete_project',
	'update_project_owner',
	'add_project_comment',
	'update_custom_field_project',
);

$expected_rules = array(
	'project_title',
	'project_status',
	'project_is_completed',
	'project_budget',
	'project_progress',
	'project_owner',
	'project_due_date',
	'project_has_client',
	'project_has_deal',
	'project_task_completion',
);

$projects_on = function_exists( 'doublescale_is_module_active' ) && doublescale_is_module_active( 'projects' );
$pro_on      = function_exists( 'doublescale_is_pro_addon_active' ) && doublescale_is_pro_addon_active();

$check( $projects_on, 'Projects module is active' );
$check( $pro_on, 'Double Scale Pro is active' );

if ( class_exists( '\DoubleScale\Modules\Automations\Services\TriggersManager' ) ) {
	\DoubleScale\Modules\Automations\Services\TriggersManager::instance()->load_triggers();
	$triggers = \DoubleScale\Modules\Automations\Services\TriggersManager::instance()->get_all_triggers();
	foreach ( $expected_triggers as $slug ) {
		$check( isset( $triggers[ $slug ] ), "Trigger registered: {$slug}" );
		if ( isset( $triggers[ $slug ] ) ) {
			$t              = $triggers[ $slug ];
			$expected_group = ( 'project_comment_posted' === $slug ) ? 'discussion' : 'project';
			$check( 'projects' === $t->source && $expected_group === $t->group, "Trigger {$slug} source/group = projects/{$expected_group}" );
			if ( $pro_on ) {
				$check( empty( $t->is_pro ), "Trigger {$slug} is_pro=false when Pro active" );
			}
		}
	}
} else {
	$check( false, 'TriggersManager available' );
}

if ( class_exists( '\DoubleScale\Modules\Automations\Services\ActionsManager' ) ) {
	\DoubleScale\Modules\Automations\Services\ActionsManager::instance()->load_actions();
	$actions = \DoubleScale\Modules\Automations\Services\ActionsManager::instance()->get_all_actions();
	foreach ( $expected_actions as $slug ) {
		$check( isset( $actions[ $slug ] ), "Action registered: {$slug}" );
	}
} else {
	$check( false, 'ActionsManager available' );
}

if ( class_exists( '\DoubleScale\Modules\Automations\Services\RulesManager' ) ) {
	$groups = \DoubleScale\Modules\Automations\Services\RulesManager::instance()->get_groups();
	$check( isset( $groups['project'] ), 'Rule group project present' );
	$check( isset( $groups['project_fields'] ), 'Rule group project_fields present' );
	if ( isset( $groups['project']['rules'] ) && is_array( $groups['project']['rules'] ) ) {
		foreach ( $expected_rules as $slug ) {
			$check( isset( $groups['project']['rules'][ $slug ] ), "Rule registered: {$slug}" );
		}
	}
} else {
	$check( false, 'RulesManager available' );
}

if ( class_exists( '\DoubleScale\Core\MergeTags\MergeTagsManager' ) ) {
	$mt_groups = \DoubleScale\Core\MergeTags\MergeTagsManager::instance()->get_groups();
	$check( isset( $mt_groups['project'] ), 'Merge-tag group project present' );
}

// Toggle off / on gate check via source is_disabled flags.
if ( class_exists( '\DoubleScale\Modules\Automations\Services\TriggersManager' ) ) {
	$sources = \DoubleScale\Modules\Automations\Services\TriggersManager::instance()->get_sources();
	$check( isset( $sources['projects'] ), 'TriggersManager has projects source' );
	if ( isset( $sources['projects']['groups']['project']['is_disabled'] ) ) {
		$check(
			! $sources['projects']['groups']['project']['is_disabled'] === $projects_on
				|| (bool) $sources['projects']['groups']['project']['is_disabled'] !== $projects_on,
			'Projects trigger group is_disabled mirrors module toggle'
		);
	}
}

echo "\n=== Results: {$passes} passed, {$failures} failed ===\n";
exit( $failures > 0 ? 1 : 0 );
