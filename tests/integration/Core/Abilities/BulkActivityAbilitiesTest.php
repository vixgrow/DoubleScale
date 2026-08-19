<?php
/**
 * Integration tests for the bulk activity write abilities.
 *
 * Notes and calls are the two lowest-risk writes in the product — append-only,
 * no hooks, no email. That makes them the right place to pin the behaviour the
 * bulk envelope promises, without side effects confounding the assertions:
 * partial success actually persists the good rows, the audit hook fires once
 * (and not at all when every row fails), and the per-row hook fires only for
 * rows that really wrote.
 *
 * The contact-exists guard matters more here than it looks. ActivityManager
 * returns null for every failure — unknown contact, no access, empty body — so
 * a bulk loop that skipped the guard would report rows as failed with no usable
 * reason, or worse, create activity rows pointing at nothing.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityGuard;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Activities\Abilities\ActivityAbilities;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class BulkActivityAbilitiesTest extends IntegrationTestCase {

	/**
	 * Mails intercepted during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $sent_mail = array();

	/**
	 * Write-audit fires captured during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $write_fires = array();

	/**
	 * Per-row bulk item fires captured during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $item_fires = array();

	protected function setUp(): void {
		parent::setUp();

		self::$sent_mail   = array();
		self::$write_fires = array();
		self::$item_fires  = array();

		add_filter(
			'pre_wp_mail',
			static function ( $short_circuit, $atts ) {
				self::$sent_mail[] = (array) $atts;
				return true;
			},
			10,
			2
		);

		add_action(
			'doublescale_ability_write',
			static function ( $name, $input, $result ) {
				self::$write_fires[] = array(
					'name'   => $name,
					'result' => $result,
				);
			},
			10,
			3
		);

		add_action(
			'doublescale_ability_bulk_item',
			static function ( $name, $index, $result, $batch_id ) {
				self::$item_fires[] = array(
					'name'     => $name,
					'index'    => $index,
					'batch_id' => $batch_id,
				);
			},
			10,
			4
		);

		$this->allow_ai_for( array( UserRoles::SALES_REP, UserRoles::SALES_MANAGER ) );

		wp_set_current_user( self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) ) );
	}

	protected function tearDown(): void {
		self::$sent_mail   = array();
		self::$write_fires = array();
		self::$item_fires  = array();
		parent::tearDown();
	}

	/**
	 * Put roles on the AI allow-list the ability gate consults.
	 *
	 * @param array<int, string> $roles Roles to permit.
	 * @return void
	 */
	private function allow_ai_for( array $roles ): void {
		$settings = (array) get_option( 'doublescale_settings', array() );

		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array_merge( array( UserRoles::ADMINISTRATOR ), $roles ),
				),
			)
		);

		update_option( 'doublescale_settings', $settings );
	}

	/**
	 * Run a bulk ability through the write wrapper so the audit hook fires.
	 *
	 * @param string               $name     Full ability name.
	 * @param string               $callback Static method on ActivityAbilities.
	 * @param array<string, mixed> $input    Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	private function run_bulk( string $name, string $callback, array $input ) {
		$wrapped = AbilityGuard::wrap_execute( $name, array( ActivityAbilities::class, $callback ) );

		return $wrapped( $input );
	}

	/**
	 * Count activity rows of a type recorded against a contact.
	 *
	 * @param int    $contact_id Contact.
	 * @param string $type       Activity type constant.
	 * @return int
	 */
	private function count_activities( int $contact_id, string $type ): int {
		// Activities link to contacts through the polymorphic
		// activity_associations table, not a contact_id column, so this must go
		// through the model's own scope rather than a direct where().
		return (int) ActivityModel::query()
			->forContact( $contact_id )
			->where( 'activity_type', $type )
			->count();
	}

	// -----------------------------------------------------------------
	// add-contact-notes-bulk
	// -----------------------------------------------------------------

	public function test_notes_happy_path_writes_every_row(): void {
		$first  = $this->make_contact();
		$second = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => $first,
						'content'    => 'Spoke about renewal.',
					),
					array(
						'contact_id' => $second,
						'content'    => 'Asked for a quote.',
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['created'] );
		$this->assertSame( 0, $result['failed'] );
		$this->assertFalse( $result['partial'] );
		$this->assertSame( 1, $this->count_activities( $first, ActivityTypes::NOTE ) );
		$this->assertSame( 1, $this->count_activities( $second, ActivityTypes::NOTE ) );
		$this->assertSame( array(), self::$sent_mail, 'Notes must never send mail.' );
	}

	/**
	 * Each row carries its own note text — this is what makes the tool worth
	 * having over N single calls. A shared-payload implementation would write
	 * the same text everywhere and still pass a naive count assertion.
	 */
	public function test_each_row_keeps_its_own_note_text(): void {
		$first  = $this->make_contact();
		$second = $this->make_contact();

		$this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => $first,
						'content'    => 'FIRST-ROW-TEXT',
					),
					array(
						'contact_id' => $second,
						'content'    => 'SECOND-ROW-TEXT',
					),
				),
			)
		);

		$first_row  = ActivityModel::query()->forContact( $first )->first();
		$second_row = ActivityModel::query()->forContact( $second )->first();

		$this->assertStringContainsString( 'FIRST-ROW-TEXT', wp_json_encode( $first_row->data ) );
		$this->assertStringContainsString( 'SECOND-ROW-TEXT', wp_json_encode( $second_row->data ) );
	}

	/**
	 * Real partial success: the good rows persist. Kills `continue` → `break`
	 * and any wrapping transaction.
	 */
	public function test_notes_partial_success_keeps_the_valid_rows(): void {
		$first  = $this->make_contact();
		$second = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => $first,
						'content'    => 'valid',
					),
					// Missing content — refused before it reaches the service.
					array( 'contact_id' => $second ),
					array(
						'contact_id' => $second,
						'content'    => 'also valid',
					),
				),
			)
		);

		$this->assertSame( 2, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertTrue( $result['partial'] );
		$this->assertSame( 1, $result['errors'][0]['index'], 'The failing row must be reported by index.' );

		$this->assertSame( 1, $this->count_activities( $first, ActivityTypes::NOTE ) );
		$this->assertSame(
			1,
			$this->count_activities( $second, ActivityTypes::NOTE ),
			'The valid row after the failure must still have written.'
		);
	}

	/**
	 * An unknown contact must be refused per row rather than creating an
	 * activity that belongs to nothing and appears in no timeline.
	 */
	public function test_unknown_contact_row_fails_without_orphaning_an_activity(): void {
		$known = $this->make_contact();

		$before = (int) ActivityModel::query()->count();

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => 99999999,
						'content'    => 'nobody',
					),
					array(
						'contact_id' => $known,
						'content'    => 'somebody',
					),
				),
			)
		);

		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 0, $result['errors'][0]['index'] );

		$this->assertSame(
			$before + 1,
			(int) ActivityModel::query()->count(),
			'Exactly one activity row must exist — the unknown contact must not orphan one.'
		);
	}

	/**
	 * A row that is not an object must never reach the handler.
	 */
	public function test_non_object_row_is_refused(): void {
		$contact_id = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					'i-am-a-string',
					array(
						'contact_id' => $contact_id,
						'content'    => 'valid',
					),
				),
			)
		);

		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 'doublescale_invalid_item', $result['errors'][0]['code'] );
	}

	/**
	 * Over-cap must reject outright and write nothing — truncating would
	 * silently drop rows the agent believes it saved.
	 */
	public function test_over_cap_batch_writes_nothing(): void {
		$contact_id = $this->make_contact();
		$before     = (int) ActivityModel::query()->count();

		$rows = array();
		for ( $i = 0; $i < 101; $i++ ) {
			$rows[] = array(
				'contact_id' => $contact_id,
				'content'    => 'row ' . $i,
			);
		}

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array( 'notes' => $rows )
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_batch_too_large', $result->get_error_code() );
		$this->assertSame( $before, (int) ActivityModel::query()->count(), 'A rejected batch must write nothing.' );
	}

	// -----------------------------------------------------------------
	// Audit accountability
	// -----------------------------------------------------------------

	/**
	 * One audit fire per batch, carrying the real count.
	 */
	public function test_audit_fires_once_for_a_mixed_batch(): void {
		$contact_id = $this->make_contact();

		$this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => $contact_id,
						'content'    => 'good',
					),
					array( 'contact_id' => $contact_id ),
				),
			)
		);

		$this->assertCount( 1, self::$write_fires );
		$this->assertSame( 1, self::$write_fires[0]['result']['created'] );
	}

	/**
	 * A batch where every row failed changed nothing, so it must not be
	 * audited. This is what the top-level integer count buys — nesting the
	 * counts under a summary key would fire a phantom entry here.
	 */
	public function test_audit_does_not_fire_when_every_row_fails(): void {
		$this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array( 'contact_id' => 99999999, 'content' => 'nobody' ),
					array( 'contact_id' => 99999998, 'content' => 'also nobody' ),
				),
			)
		);

		$this->assertSame(
			array(),
			self::$write_fires,
			'A batch that changed nothing must not be audited.'
		);
	}

	/**
	 * The per-row hook fires only for rows that actually wrote, and every fire
	 * shares the envelope's batch id so N entries are traceable to one call.
	 */
	public function test_per_row_hook_fires_only_for_successful_rows(): void {
		$contact_id = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/add-contact-notes-bulk',
			'add_contact_notes_bulk',
			array(
				'notes' => array(
					array(
						'contact_id' => $contact_id,
						'content'    => 'good',
					),
					array( 'contact_id' => $contact_id ),
					array(
						'contact_id' => $contact_id,
						'content'    => 'also good',
					),
				),
			)
		);

		$this->assertCount( 2, self::$item_fires, 'Only successful rows may fire the per-row hook.' );

		foreach ( self::$item_fires as $fire ) {
			$this->assertSame( 'doublescale/add-contact-notes-bulk', $fire['name'] );
			$this->assertSame(
				$result['batch_id'],
				$fire['batch_id'],
				'Every per-row fire must carry the envelope batch id.'
			);
		}

		$this->assertNotSame( '', $result['batch_id'] );
	}

	// -----------------------------------------------------------------
	// log-calls-bulk
	// -----------------------------------------------------------------

	public function test_calls_happy_path_writes_every_row(): void {
		$first  = $this->make_contact();
		$second = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/log-calls-bulk',
			'log_calls_bulk',
			array(
				'calls' => array(
					array(
						'contact_id' => $first,
						'notes'      => 'Left voicemail.',
						'duration'   => 2,
					),
					array(
						'contact_id' => $second,
						'notes'      => 'Agreed to a demo.',
						'outcome'    => 'demo booked',
					),
				),
			)
		);

		$this->assertSame( 2, $result['created'] );
		$this->assertSame( 0, $result['failed'] );
		$this->assertSame( 1, $this->count_activities( $first, ActivityTypes::CALL_LOGGED ) );
		$this->assertSame( 1, $this->count_activities( $second, ActivityTypes::CALL_LOGGED ) );
		$this->assertSame( array(), self::$sent_mail, 'Logging calls must never send mail — and never place a call.' );
	}

	/**
	 * Calls and notes must not be confusable: logging calls writes CALL rows,
	 * never NOTE rows.
	 */
	public function test_logging_calls_does_not_write_notes(): void {
		$contact_id = $this->make_contact();

		$this->run_bulk(
			'doublescale/log-calls-bulk',
			'log_calls_bulk',
			array(
				'calls' => array(
					array(
						'contact_id' => $contact_id,
						'notes'      => 'Discussed pricing.',
					),
				),
			)
		);

		$this->assertSame( 1, $this->count_activities( $contact_id, ActivityTypes::CALL_LOGGED ) );
		$this->assertSame(
			0,
			$this->count_activities( $contact_id, ActivityTypes::NOTE ),
			'log-calls-bulk must not record notes.'
		);
	}

	/**
	 * Partial success on the call path too — the two abilities share the loop,
	 * but each needs its own proof that a bad row does not take the batch down.
	 */
	public function test_calls_partial_success_keeps_the_valid_rows(): void {
		$contact_id = $this->make_contact();

		$result = $this->run_bulk(
			'doublescale/log-calls-bulk',
			'log_calls_bulk',
			array(
				'calls' => array(
					array( 'contact_id' => 99999999 ),
					array( 'contact_id' => $contact_id ),
				),
			)
		);

		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 0, $result['errors'][0]['index'] );
		$this->assertSame( 1, $this->count_activities( $contact_id, ActivityTypes::CALL_LOGGED ) );
	}

	/**
	 * An empty batch is a caller bug, not a successful no-op.
	 */
	public function test_empty_batch_is_refused(): void {
		$result = $this->run_bulk(
			'doublescale/log-calls-bulk',
			'log_calls_bulk',
			array( 'calls' => array() )
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_empty_batch', $result->get_error_code() );
	}
}
