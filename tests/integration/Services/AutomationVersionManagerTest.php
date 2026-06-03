<?php
/**
 * Integration tests for the automation rollback (undo / redo) feature.
 *
 * Exercises VersionManager against a real database: snapshot capture, the undo
 * / redo cursor, redo-tail discarding, the 20-version retention cap, restore of
 * step add / edit / delete / reorder, branching (parent_id) steps, and the
 * automation-level fields.
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Tests\Integration\IntegrationTestCase;
use DoubleScale\Tests\Integration\Factories\AutomationFactory;
use DoubleScale\Modules\Automations\Models\AutomationModel;
use DoubleScale\Modules\Automations\Models\AutomationStepModel;
use DoubleScale\Modules\Automations\Models\AutomationVersionModel;
use DoubleScale\Modules\Automations\Services\VersionManager;

defined( 'ABSPATH' ) || exit;

final class AutomationVersionManagerTest extends IntegrationTestCase {

	/**
	 * @var VersionManager
	 */
	private $manager;

	/**
	 * @var int
	 */
	private $automation_id;

	public function set_up() {
		parent::set_up();
		$this->manager       = VersionManager::instance();
		$this->automation_id = AutomationFactory::create( array( 'name' => 'Flow', 'status' => 'draft' ) );
	}

	/**
	 * Create a step row directly and return its model.
	 *
	 * @param array<string, mixed> $overrides Column overrides.
	 * @return AutomationStepModel
	 */
	private function make_step( array $overrides = array() ) {
		$defaults = array(
			'automation_id' => $this->automation_id,
			'parent_id'     => 0,
			'action'        => 'send_email',
			'type'          => 'action',
			'condition'     => '',
			'status'        => 'active',
			'settings'      => array(),
			'order'         => 1,
		);

		return AutomationStepModel::create( array_merge( $defaults, $overrides ) );
	}

	/**
	 * Convenience: count live (non-deleted) steps for the automation.
	 */
	private function live_step_count() {
		return AutomationStepModel::where( 'automation_id', $this->automation_id )
			->whereIn( 'status', array( 'active', 'draft' ) )
			->count();
	}

	// ---------------------------------------------------------------------
	// Snapshot basics
	// ---------------------------------------------------------------------

	public function test_snapshot_creates_a_version_row_and_sets_cursor() {
		$this->make_step();
		$version = $this->manager->snapshot( $this->automation_id, 'Added step' );

		$this->assertNotNull( $version );
		$this->assertSame( 1, (int) $version->version );
		$this->assertSame( 'Added step', $version->label );

		$automation = AutomationModel::find( $this->automation_id );
		$settings   = $automation->settings;
		$this->assertSame( (int) $version->id, (int) $settings['_version_cursor'] );

		// The snapshot captures the one live step.
		$this->assertCount( 1, $version->snapshot['steps'] );
	}

	public function test_version_numbers_increment_per_automation() {
		$v1 = $this->manager->snapshot( $this->automation_id, 'one' );
		$v2 = $this->manager->snapshot( $this->automation_id, 'two' );
		$v3 = $this->manager->snapshot( $this->automation_id, 'three' );

		$this->assertSame( array( 1, 2, 3 ), array( (int) $v1->version, (int) $v2->version, (int) $v3->version ) );
	}

	public function test_snapshot_excludes_cursor_key_from_payload() {
		$this->manager->snapshot( $this->automation_id, 'one' );
		$v2 = $this->manager->snapshot( $this->automation_id, 'two' );

		$this->assertArrayNotHasKey( '_version_cursor', $v2->snapshot['automation']['settings'] );
	}

	// ---------------------------------------------------------------------
	// Undo / redo
	// ---------------------------------------------------------------------

	public function test_undo_restores_previous_step_state() {
		// v1: one step.
		$this->make_step( array( 'order' => 1 ) );
		$this->manager->snapshot( $this->automation_id, 'one step' );

		// v2: two steps.
		$this->make_step( array( 'order' => 2 ) );
		$this->manager->snapshot( $this->automation_id, 'two steps' );
		$this->assertSame( 2, $this->live_step_count() );

		// Undo back to v1 — second step should be gone.
		$this->assertTrue( $this->manager->undo( $this->automation_id ) );
		$this->assertSame( 1, $this->live_step_count() );

		// Redo forward to v2 — second step should return.
		$this->assertTrue( $this->manager->redo( $this->automation_id ) );
		$this->assertSame( 2, $this->live_step_count() );
	}

	public function test_undo_at_oldest_version_returns_false() {
		$this->make_step();
		$this->manager->snapshot( $this->automation_id, 'only' );

		$this->assertFalse( $this->manager->undo( $this->automation_id ) );
	}

	public function test_redo_at_newest_version_returns_false() {
		$this->make_step();
		$this->manager->snapshot( $this->automation_id, 'one' );
		$this->make_step( array( 'order' => 2 ) );
		$this->manager->snapshot( $this->automation_id, 'two' );

		$this->assertFalse( $this->manager->redo( $this->automation_id ) );
	}

	public function test_history_flags_reflect_cursor_position() {
		$this->manager->snapshot( $this->automation_id, 'one' );
		$this->manager->snapshot( $this->automation_id, 'two' );
		$this->manager->snapshot( $this->automation_id, 'three' );

		// At newest: can undo, cannot redo.
		$history = $this->manager->get_history( $this->automation_id );
		$this->assertTrue( $history['can_undo'] );
		$this->assertFalse( $history['can_redo'] );

		// Undo once: can both.
		$this->manager->undo( $this->automation_id );
		$history = $this->manager->get_history( $this->automation_id );
		$this->assertTrue( $history['can_undo'] );
		$this->assertTrue( $history['can_redo'] );

		// Undo to oldest: cannot undo, can redo.
		$this->manager->undo( $this->automation_id );
		$history = $this->manager->get_history( $this->automation_id );
		$this->assertFalse( $history['can_undo'] );
		$this->assertTrue( $history['can_redo'] );
	}

	// ---------------------------------------------------------------------
	// Redo-tail discard
	// ---------------------------------------------------------------------

	public function test_new_snapshot_after_undo_discards_redo_tail() {
		$this->manager->snapshot( $this->automation_id, 'v1' );
		$this->manager->snapshot( $this->automation_id, 'v2' );
		$this->manager->snapshot( $this->automation_id, 'v3' );

		// Go back to v2.
		$this->manager->undo( $this->automation_id );

		// Fresh edit -> new snapshot. v3 (the redo tail) must be discarded.
		$this->manager->snapshot( $this->automation_id, 'v4' );

		$labels = AutomationVersionModel::where( 'automation_id', $this->automation_id )
			->orderBy( 'version', 'asc' )->pluck( 'label' )->all();

		$this->assertSame( array( 'v1', 'v2', 'v4' ), $labels );

		// And redo is no longer possible.
		$history = $this->manager->get_history( $this->automation_id );
		$this->assertFalse( $history['can_redo'] );
	}

	// ---------------------------------------------------------------------
	// Retention cap
	// ---------------------------------------------------------------------

	public function test_history_capped_at_max_versions() {
		for ( $i = 1; $i <= 25; $i++ ) {
			$this->manager->snapshot( $this->automation_id, 'v' . $i );
		}

		$count = AutomationVersionModel::where( 'automation_id', $this->automation_id )->count();
		$this->assertSame( VersionManager::MAX_VERSIONS, $count );

		// The oldest kept version is v6 (25 - 20 + 1); v1..v5 pruned.
		$min_version = (int) AutomationVersionModel::where( 'automation_id', $this->automation_id )->min( 'version' );
		$this->assertSame( 6, $min_version );
	}

	// ---------------------------------------------------------------------
	// Restore mechanics: edit, delete, reorder
	// ---------------------------------------------------------------------

	public function test_undo_restores_edited_step_settings() {
		$step = $this->make_step( array( 'settings' => array( 'subject' => 'Hello' ) ) );
		$this->manager->snapshot( $this->automation_id, 'original subject' );

		$step->settings = array( 'subject' => 'Changed' );
		$step->save();
		$this->manager->snapshot( $this->automation_id, 'changed subject' );

		$this->manager->undo( $this->automation_id );

		$restored = AutomationStepModel::find( $step->id );
		$this->assertSame( 'Hello', $restored->settings['subject'] );
	}

	public function test_undo_revives_a_soft_deleted_step_with_same_id() {
		$step    = $this->make_step();
		$step_id = $step->id;
		$this->manager->snapshot( $this->automation_id, 'has step' );

		// Soft-delete (the way the controller deletes a published step).
		$step->status = 'deleted';
		$step->save();
		$this->manager->snapshot( $this->automation_id, 'step deleted' );
		$this->assertSame( 0, $this->live_step_count() );

		// Undo brings it back with the same id (so parent_id links stay valid).
		$this->manager->undo( $this->automation_id );
		$revived = AutomationStepModel::find( $step_id );
		$this->assertSame( 'active', $revived->status );
		$this->assertSame( 1, $this->live_step_count() );
	}

	public function test_undo_restores_step_order() {
		$a = $this->make_step( array( 'order' => 1, 'settings' => array( 'k' => 'a' ) ) );
		$b = $this->make_step( array( 'order' => 2, 'settings' => array( 'k' => 'b' ) ) );
		$this->manager->snapshot( $this->automation_id, 'a then b' );

		// Swap order.
		$a->order = 2;
		$a->save();
		$b->order = 1;
		$b->save();
		$this->manager->snapshot( $this->automation_id, 'b then a' );

		$this->manager->undo( $this->automation_id );

		$this->assertSame( 1, (int) AutomationStepModel::find( $a->id )->order );
		$this->assertSame( 2, (int) AutomationStepModel::find( $b->id )->order );
	}

	// ---------------------------------------------------------------------
	// Branching (parent_id) steps
	// ---------------------------------------------------------------------

	public function test_restore_preserves_branch_parent_links() {
		$condition = $this->make_step( array( 'type' => 'condition', 'action' => 'has_tag', 'order' => 1 ) );
		$yes       = $this->make_step( array( 'parent_id' => $condition->id, 'condition' => 'yes', 'order' => 2 ) );
		$this->manager->snapshot( $this->automation_id, 'branch' );

		// Soft-delete the yes branch child.
		$yes->status = 'deleted';
		$yes->save();
		$this->manager->snapshot( $this->automation_id, 'child removed' );

		$this->manager->undo( $this->automation_id );

		$revived = AutomationStepModel::find( $yes->id );
		$this->assertSame( 'active', $revived->status );
		$this->assertSame( (int) $condition->id, (int) $revived->parent_id );
		$this->assertSame( 'yes', $revived->condition );
	}

	// ---------------------------------------------------------------------
	// Automation-level fields
	// ---------------------------------------------------------------------

	public function test_undo_restores_automation_name_and_status() {
		$this->manager->snapshot( $this->automation_id, 'draft flow' );

		$automation         = AutomationModel::find( $this->automation_id );
		$automation->name   = 'Renamed';
		$automation->status = 'active';
		$automation->save();
		$this->manager->snapshot( $this->automation_id, 'renamed + active' );

		$this->manager->undo( $this->automation_id );

		$reloaded = AutomationModel::find( $this->automation_id );
		$this->assertSame( 'Flow', $reloaded->name );
		$this->assertSame( 'draft', $reloaded->status );
	}

	// ---------------------------------------------------------------------
	// Baseline + isolation
	// ---------------------------------------------------------------------

	public function test_ensure_baseline_creates_one_version_only_once() {
		$this->manager->ensure_baseline( $this->automation_id );
		$this->manager->ensure_baseline( $this->automation_id );

		$count = AutomationVersionModel::where( 'automation_id', $this->automation_id )->count();
		$this->assertSame( 1, $count );
	}

	public function test_versions_are_scoped_per_automation() {
		$other = AutomationFactory::create();

		$this->manager->snapshot( $this->automation_id, 'a1' );
		$this->manager->snapshot( $this->automation_id, 'a2' );
		$this->manager->snapshot( $other, 'b1' );

		$this->assertSame( 2, AutomationVersionModel::where( 'automation_id', $this->automation_id )->count() );
		$this->assertSame( 1, AutomationVersionModel::where( 'automation_id', $other )->count() );

		// Undo on $other has nothing before its single version.
		$this->assertFalse( $this->manager->undo( $other ) );
	}

	public function test_snapshot_suppressed_while_restoring() {
		$this->make_step();
		$this->manager->snapshot( $this->automation_id, 'v1' );
		$this->make_step( array( 'order' => 2 ) );
		$this->manager->snapshot( $this->automation_id, 'v2' );

		$before = AutomationVersionModel::where( 'automation_id', $this->automation_id )->count();
		$this->manager->undo( $this->automation_id );
		$after = AutomationVersionModel::where( 'automation_id', $this->automation_id )->count();

		// Undo restores state but must NOT create a new version.
		$this->assertSame( $before, $after );
	}

	// ---------------------------------------------------------------------
	// REST end-to-end: the actual undo / redo endpoints + step snapshotting
	// ---------------------------------------------------------------------

	public function test_rest_step_create_then_undo_redo_round_trip() {
		$admin = $this->make_admin_user();

		// Open the automation first — this captures the baseline (empty) state,
		// exactly as the editor does on load, so the first edit is undoable.
		$open = $this->dispatch_rest( 'GET', "/doublescale/v1/automations/{$this->automation_id}", array(), $admin );
		$this->assertSame( 200, $open->get_status() );

		// Create a step through the REST controller (which snapshots after).
		$create = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/automation-steps',
			array(
				'automation_id' => $this->automation_id,
				'type'          => 'action',
				'action'        => 'send_email',
				'status'        => 'active',
				'order'         => 1,
				'settings'      => array(),
			),
			$admin
		);
		$this->assertSame( 201, $create->get_status() );
		$this->assertSame( 1, $this->live_step_count() );

		// A version row was written by the controller hook.
		$this->assertGreaterThanOrEqual( 1, AutomationVersionModel::where( 'automation_id', $this->automation_id )->count() );

		// Undo through the REST endpoint -> step removed, response advertises redo.
		$undo = $this->dispatch_rest( 'POST', "/doublescale/v1/automations/{$this->automation_id}/undo", array(), $admin );
		$this->assertSame( 200, $undo->get_status() );
		$data = $undo->get_data();
		$this->assertTrue( $data['can_redo'] );
		$this->assertSame( 0, $this->live_step_count() );

		// Redo through the REST endpoint -> step returns.
		$redo = $this->dispatch_rest( 'POST', "/doublescale/v1/automations/{$this->automation_id}/redo", array(), $admin );
		$this->assertSame( 200, $redo->get_status() );
		$this->assertSame( 1, $this->live_step_count() );
	}

	public function test_rest_undo_with_no_history_returns_error() {
		$admin = $this->make_admin_user();

		// Only the lazily-created baseline exists; nothing to undo.
		$undo = $this->dispatch_rest( 'POST', "/doublescale/v1/automations/{$this->automation_id}/undo", array(), $admin );
		$this->assertSame( 400, $undo->get_status() );
	}

	public function test_rest_versions_endpoint_returns_history_shape() {
		$admin = $this->make_admin_user();
		$this->manager->snapshot( $this->automation_id, 'one' );

		$response = $this->dispatch_rest( 'GET', "/doublescale/v1/automations/{$this->automation_id}/versions", array(), $admin );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'versions', $data );
		$this->assertArrayHasKey( 'can_undo', $data );
		$this->assertArrayHasKey( 'can_redo', $data );
		$this->assertArrayHasKey( 'cursor', $data );
	}

	public function test_rest_undo_denied_for_subscriber() {
		$subscriber = $this->make_subscriber_user();

		$undo = $this->dispatch_rest( 'POST', "/doublescale/v1/automations/{$this->automation_id}/undo", array(), $subscriber );
		// An authenticated-but-unauthorized user is forbidden (403), not 401.
		$this->assertSame( 403, $undo->get_status() );
	}
}
