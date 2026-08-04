<?php
/**
 * Project automation catalog wiring in the free plugin: stubs, sources, groups, globs.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class ProjectAutomationRegistrationTest extends TestCase {

	/** @var array<int, string> */
	private const TRIGGER_SLUGS = array(
		'project_created',
		'project_status_changed',
		'project_completed',
		'project_owner_changed',
		'project_due_soon',
		'project_overdue',
		'project_comment_posted',
		'project_converted_from_deal',
	);

	/** @var array<int, string> */
	private const ACTION_SLUGS = array(
		'create_project',
		'update_project_status',
		'complete_project',
		'update_project_owner',
		'add_project_comment',
		'update_custom_field_project',
	);

	private function triggers_dir(): string {
		return DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/Project/';
	}

	private function actions_dir(): string {
		return DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Actions/Project/';
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

	private function slug_of( string $contents ): string {
		if ( preg_match( '/public\s+\$slug\s*=\s*\'([^\']+)\'/', $contents, $m ) ) {
			return $m[1];
		}
		return '';
	}

	public function test_every_trigger_stub_exists_and_extends_trigger_pro(): void {
		$files = $this->read_all( $this->triggers_dir() );
		$this->assertCount( 8, $files, 'Expected exactly 8 project trigger stubs.' );

		$slugs = array();
		foreach ( $files as $name => $contents ) {
			$this->assertStringContainsString( 'extends TriggerPro', $contents, "{$name} must extend TriggerPro." );
			$this->assertStringContainsString(
				'TriggersManager::instance()->register(',
				$contents,
				"{$name} must self-register."
			);
			$slugs[] = $this->slug_of( $contents );
		}

		sort( $slugs );
		$expected = self::TRIGGER_SLUGS;
		sort( $expected );
		$this->assertSame( $expected, $slugs );
	}

	public function test_every_action_stub_is_a_pro_stub(): void {
		$files = $this->read_all( $this->actions_dir() );
		$this->assertCount( 6, $files, 'Expected exactly 6 project action stubs.' );

		$slugs = array();
		foreach ( $files as $name => $contents ) {
			$this->assertStringContainsString( 'extends ProAutomationStubAction', $contents );
			$slugs[] = $this->slug_of( $contents );
		}

		sort( $slugs );
		$expected = self::ACTION_SLUGS;
		sort( $expected );
		$this->assertSame( $expected, $slugs );
	}

	public function test_triggers_manager_pre_declares_projects_source_and_groups(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/TriggersManager.php'
		);

		$this->assertStringContainsString( "'projects'", $contents );
		$this->assertStringContainsString( "'discussion'", $contents );
		$this->assertStringContainsString( "doublescale_is_module_active( 'projects' )", $contents );
	}

	public function test_actions_manager_pre_declares_projects_source(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/ActionsManager.php'
		);

		$this->assertStringContainsString( "'projects'", $contents );
		$this->assertStringContainsString( "doublescale_is_module_active( 'projects' )", $contents );
	}

	public function test_stub_source_group_pairs_resolve_in_manager_trees(): void {
		foreach ( $this->read_all( $this->triggers_dir() ) as $name => $contents ) {
			preg_match( '/public\s+\$source\s*=\s*\'([^\']+)\'/', $contents, $s );
			preg_match( '/public\s+\$group\s*=\s*\'([^\']+)\'/', $contents, $g );
			$this->assertSame( 'projects', $s[1] ?? '', "{$name} source" );
			$this->assertContains( $g[1] ?? '', array( 'project', 'discussion' ), "{$name} group" );
		}

		foreach ( $this->read_all( $this->actions_dir() ) as $name => $contents ) {
			preg_match( '/public\s+\$source\s*=\s*\'([^\']+)\'/', $contents, $s );
			preg_match( '/public\s+\$group\s*=\s*\'([^\']+)\'/', $contents, $g );
			$this->assertSame( 'projects', $s[1] ?? '', "{$name} source" );
			$this->assertSame( 'project', $g[1] ?? '', "{$name} group" );
		}
	}

	public function test_merge_tags_manager_declares_project_group(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/MergeTags/MergeTagsManager.php'
		);

		$this->assertStringContainsString( "'project'", $contents );
		foreach ( self::TRIGGER_SLUGS as $slug ) {
			$this->assertStringContainsString( "'{$slug}'", $contents );
		}
	}

	public function test_rules_manager_pre_declares_project_groups(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/RulesManager.php'
		);

		$this->assertStringContainsString( "'project'", $contents );
		$this->assertStringContainsString( "'project_fields'", $contents );
	}

	public function test_module_glob_list_loads_project_stub_directories(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Module.php'
		);

		$this->assertStringContainsString( 'Triggers/Project/*.php', $contents );
		$this->assertStringContainsString( 'Actions/Project/*.php', $contents );
		$this->assertStringContainsString( 'automations_v4', $contents );
	}

	public function test_catalog_lists_every_project_trigger_and_action(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Config/ProAutomationCatalog.php'
		);

		foreach ( array( 'ProjectCreated', 'ProjectStatusChanged', 'ProjectCompleted', 'ProjectOwnerChanged', 'ProjectDueSoon', 'ProjectOverdue', 'ProjectCommentPosted', 'ProjectConvertedFromDeal' ) as $class ) {
			$this->assertStringContainsString( "Triggers\\Project\\{$class}::class", $contents );
		}

		foreach ( array( 'CreateProject', 'UpdateProjectStatus', 'CompleteProject', 'UpdateProjectOwner', 'AddProjectComment', 'UpdateCustomFieldProject' ) as $class ) {
			$this->assertStringContainsString( "Actions\\Project\\{$class}::class", $contents );
		}
	}

	public function test_condition_group_mapping_gates_project_rules_on_projects_module(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$this->assertSame( array( 'projects' ), doublescale_automation_condition_group_modules( 'project' ) );
		$this->assertSame( array( 'projects' ), doublescale_automation_condition_group_modules( 'project_fields' ) );
	}
}
