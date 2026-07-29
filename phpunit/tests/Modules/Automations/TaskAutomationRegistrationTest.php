<?php
/**
 * Task automation catalog wiring in the free plugin: stubs, sources, groups, globs.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class TaskAutomationRegistrationTest extends TestCase {

	/** @var array<int, string> */
	private const TRIGGER_SLUGS = array(
		'task_created',
		'task_completed',
		'task_assigned',
		'task_status_changed',
		'task_overdue',
		'task_due_soon',
		'subtask_created',
		'subtask_completed',
	);

	/** @var array<int, string> */
	private const ACTION_SLUGS = array(
		'create_task',
		'complete_task',
		'update_task_status',
		'assign_task',
		'delete_task',
	);

	private function triggers_dir(): string {
		return DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/Task/';
	}

	private function actions_dir(): string {
		return DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Actions/Task/';
	}

	/**
	 * @return array<string, string> slug => file contents
	 */
	private function read_all( string $dir ): array {
		$out = array();
		foreach ( glob( $dir . '*.php' ) ?: array() as $file ) {
			$out[ basename( $file, '.php' ) ] = (string) file_get_contents( $file );
		}
		return $out;
	}

	/**
	 * Pull the declared `public $slug = '...'` out of a stub file.
	 */
	private function slug_of( string $contents ): string {
		if ( preg_match( '/public\s+\$slug\s*=\s*\'([^\']+)\'/', $contents, $m ) ) {
			return $m[1];
		}
		return '';
	}

	public function test_every_trigger_stub_exists_and_extends_trigger_pro(): void {
		$files = $this->read_all( $this->triggers_dir() );
		$this->assertCount( 8, $files, 'Expected exactly 8 task trigger stubs.' );

		$slugs = array();
		foreach ( $files as $name => $contents ) {
			$this->assertStringContainsString( 'extends TriggerPro', $contents, "{$name} must extend TriggerPro." );
			$this->assertStringContainsString(
				'TriggersManager::instance()->register(',
				$contents,
				"{$name} must self-register."
			);
			$this->assertMatchesRegularExpression(
				'/public\s+\$name\s*=\s*\'[^\']+\'/',
				$contents,
				"{$name} must declare a non-empty \$name."
			);
			$this->assertMatchesRegularExpression(
				'/public\s+\$description\s*=\s*\'[^\']+\'/',
				$contents,
				"{$name} must declare a non-empty \$description."
			);
			$slugs[] = $this->slug_of( $contents );
		}

		sort( $slugs );
		$expected = self::TRIGGER_SLUGS;
		sort( $expected );
		$this->assertSame( $expected, $slugs );
	}

	/**
	 * TriggersManager::register() throws on a duplicate slug, so a collision is a
	 * fatal at boot rather than a warning.
	 */
	public function test_trigger_slugs_are_unique_across_the_whole_catalog(): void {
		$all = array();
		$root = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/';

		$iterator = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $root ) );
		foreach ( $iterator as $file ) {
			if ( ! $file->isFile() || 'php' !== $file->getExtension() ) {
				continue;
			}
			$slug = $this->slug_of( (string) file_get_contents( $file->getPathname() ) );
			if ( '' === $slug ) {
				continue;
			}
			$all[] = $slug;
		}

		$duplicates = array_keys( array_filter( array_count_values( $all ), static fn( $n ) => $n > 1 ) );
		$this->assertSame( array(), $duplicates, 'Duplicate trigger slugs would make TriggersManager::register() throw.' );
	}

	public function test_every_action_stub_is_a_pro_stub_with_no_side_effects(): void {
		$files = $this->read_all( $this->actions_dir() );
		$this->assertCount( 5, $files, 'Expected exactly 5 task action stubs.' );

		$slugs = array();
		foreach ( $files as $name => $contents ) {
			$this->assertStringContainsString(
				'extends ProAutomationStubAction',
				$contents,
				"{$name} must extend ProAutomationStubAction so free builds have no side effects."
			);
			$this->assertStringNotContainsString(
				'function process_action',
				$contents,
				"{$name} must inherit the no-op process_action(), not override it."
			);
			$slugs[] = $this->slug_of( $contents );
		}

		sort( $slugs );
		$expected = self::ACTION_SLUGS;
		sort( $expected );
		$this->assertSame( $expected, $slugs );
	}

	public function test_action_slugs_are_unique_across_the_whole_catalog(): void {
		$all  = array();
		$root = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Actions/';

		$iterator = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $root ) );
		foreach ( $iterator as $file ) {
			if ( ! $file->isFile() || 'php' !== $file->getExtension() ) {
				continue;
			}
			$slug = $this->slug_of( (string) file_get_contents( $file->getPathname() ) );
			if ( '' === $slug ) {
				continue;
			}
			$all[] = $slug;
		}

		$duplicates = array_keys( array_filter( array_count_values( $all ), static fn( $n ) => $n > 1 ) );
		$this->assertSame( array(), $duplicates );
	}

	/**
	 * store_trigger_in_sources() hits an undefined index when source/group are
	 * not pre-declared — this is the regression guard for that crash.
	 */
	public function test_triggers_manager_pre_declares_tasks_source_and_groups(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/TriggersManager.php'
		);

		$this->assertStringContainsString( "'tasks'", $contents );
		$this->assertStringContainsString( "'subtask'", $contents );
		$this->assertStringContainsString( "doublescale_is_module_active( 'tasks' )", $contents );
	}

	public function test_actions_manager_pre_declares_tasks_source(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/ActionsManager.php'
		);

		$this->assertStringContainsString( "'tasks'", $contents );
		$this->assertStringContainsString( "doublescale_is_module_active( 'tasks' )", $contents );
	}

	/**
	 * Every stub's source/group pair must resolve in the manager tree. Catches
	 * typos the per-key assertions above would miss.
	 */
	public function test_stub_source_group_pairs_resolve_in_manager_trees(): void {
		$trigger_sources = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/TriggersManager.php'
		);
		$action_sources  = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/ActionsManager.php'
		);

		foreach ( $this->read_all( $this->triggers_dir() ) as $name => $contents ) {
			preg_match( '/public\s+\$source\s*=\s*\'([^\']+)\'/', $contents, $s );
			preg_match( '/public\s+\$group\s*=\s*\'([^\']+)\'/', $contents, $g );
			$this->assertSame( 'tasks', $s[1] ?? '', "{$name} source" );
			$this->assertContains( $g[1] ?? '', array( 'task', 'subtask' ), "{$name} group" );
			$this->assertStringContainsString( "'" . $g[1] . "'", $trigger_sources );
		}

		foreach ( $this->read_all( $this->actions_dir() ) as $name => $contents ) {
			preg_match( '/public\s+\$source\s*=\s*\'([^\']+)\'/', $contents, $s );
			preg_match( '/public\s+\$group\s*=\s*\'([^\']+)\'/', $contents, $g );
			$this->assertSame( 'tasks', $s[1] ?? '', "{$name} source" );
			$this->assertSame( 'task', $g[1] ?? '', "{$name} group" );
			$this->assertStringContainsString( "'task'", $action_sources );
		}
	}

	/**
	 * A merge-tag group with no `triggers` key is treated as global by the
	 * frontend selector, so task tags would show on every automation.
	 */
	public function test_merge_tags_manager_declares_task_group_scoped_to_task_triggers(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/MergeTags/MergeTagsManager.php'
		);

		$this->assertStringContainsString( "'task'", $contents );
		foreach ( self::TRIGGER_SLUGS as $slug ) {
			$this->assertStringContainsString(
				"'{$slug}'",
				$contents,
				"Task merge-tag group must be scoped to {$slug}."
			);
		}
	}

	public function test_rules_manager_pre_declares_task_groups(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/RulesManager.php'
		);

		$this->assertStringContainsString( "'task'", $contents );
		$this->assertStringContainsString( "'task_fields'", $contents );
	}

	public function test_module_glob_list_loads_task_stub_directories(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Module.php'
		);

		$this->assertStringContainsString( 'Triggers/Task/*.php', $contents );
		$this->assertStringContainsString( 'Actions/Task/*.php', $contents );
	}

	public function test_catalog_lists_every_task_trigger_and_action(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Config/ProAutomationCatalog.php'
		);

		foreach ( array( 'TaskCreated', 'TaskCompleted', 'TaskAssigned', 'TaskStatusChanged', 'TaskOverdue', 'TaskDueSoon', 'SubtaskCreated', 'SubtaskCompleted' ) as $class ) {
			$this->assertStringContainsString( "Triggers\\Task\\{$class}::class", $contents );
		}

		foreach ( array( 'CreateTask', 'CompleteTask', 'UpdateTaskStatus', 'AssignTask', 'DeleteTask' ) as $class ) {
			$this->assertStringContainsString( "Actions\\Task\\{$class}::class", $contents );
		}
	}

	public function test_condition_group_mapping_gates_task_rules_on_tasks_module(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$this->assertSame( array( 'tasks' ), doublescale_automation_condition_group_modules( 'task' ) );
		$this->assertSame( array( 'tasks' ), doublescale_automation_condition_group_modules( 'task_fields' ) );
		$this->assertNull( doublescale_automation_condition_group_modules( 'contact' ) );
	}
}
