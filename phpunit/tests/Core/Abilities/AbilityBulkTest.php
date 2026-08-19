<?php
/**
 * Batch validation, per-row processing, and the write envelope.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityBulk;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class AbilityBulkTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_current_user_id'] = 1;
	}

	protected function tearDown(): void {
		unset( $GLOBALS['__doublescale_phpunit_filters']['doublescale_ability_bulk_max_items'] );
		unset( $GLOBALS['__doublescale_phpunit_hooks']['doublescale_ability_bulk_item'] );
		$GLOBALS['__doublescale_phpunit_current_user_id'] = 0;
		parent::tearDown();
	}

	/**
	 * A filter returning a number above the hard ceiling must not raise it.
	 * Kills the mutation `min($filtered, HARD_MAX)` → `$filtered`.
	 */
	public function test_max_items_clamps_a_filter_above_the_hard_ceiling(): void {
		add_filter(
			'doublescale_ability_bulk_max_items',
			static function () {
				return 5000;
			}
		);

		$this->assertSame( AbilityBulk::HARD_MAX_ITEMS, AbilityBulk::max_items( 'doublescale/create-contacts-bulk' ) );
	}

	/**
	 * Zero (and negatives) collapse to 1, never to an empty-batch-by-default.
	 */
	public function test_max_items_clamps_zero_up_to_one(): void {
		add_filter(
			'doublescale_ability_bulk_max_items',
			static function () {
				return 0;
			}
		);

		$this->assertSame( 1, AbilityBulk::max_items( 'doublescale/create-contacts-bulk' ) );
	}

	public function test_max_items_default_is_one_hundred(): void {
		$this->assertSame( AbilityBulk::DEFAULT_MAX_ITEMS, AbilityBulk::max_items( 'doublescale/create-contacts-bulk' ) );
	}

	public function test_validate_batch_missing_field(): void {
		$error = AbilityBulk::validate_batch( array(), 'contacts', 'doublescale/create-contacts-bulk' );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_missing_field', $error->get_error_code() );
	}

	public function test_validate_batch_rejects_a_non_array(): void {
		$error = AbilityBulk::validate_batch(
			array( 'contacts' => 'not-a-list' ),
			'contacts',
			'doublescale/create-contacts-bulk'
		);

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_invalid_batch', $error->get_error_code() );
	}

	public function test_validate_batch_rejects_an_associative_object(): void {
		$error = AbilityBulk::validate_batch(
			array( 'contacts' => array( 'email' => 'a@example.test' ) ),
			'contacts',
			'doublescale/create-contacts-bulk'
		);

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_invalid_batch', $error->get_error_code() );
	}

	public function test_validate_batch_rejects_an_empty_list(): void {
		$error = AbilityBulk::validate_batch(
			array( 'contacts' => array() ),
			'contacts',
			'doublescale/create-contacts-bulk'
		);

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_empty_batch', $error->get_error_code() );
	}

	/**
	 * Exactly at the cap is accepted; one over is rejected. Kills the mutation
	 * `count > $max` → `count >= $max`.
	 */
	public function test_validate_batch_accepts_exactly_the_cap_and_rejects_one_over(): void {
		$max = AbilityBulk::max_items( 'doublescale/create-contacts-bulk' );

		$at_cap = AbilityBulk::validate_batch(
			array( 'contacts' => $this->n_rows( $max ) ),
			'contacts',
			'doublescale/create-contacts-bulk'
		);
		$this->assertNull( $at_cap );

		$over = AbilityBulk::validate_batch(
			array( 'contacts' => $this->n_rows( $max + 1 ) ),
			'contacts',
			'doublescale/create-contacts-bulk'
		);
		$this->assertInstanceOf( \WP_Error::class, $over );
		$this->assertSame( 'doublescale_batch_too_large', $over->get_error_code() );
		$this->assertSame( $max, $over->get_error_data()['max'] );
		$this->assertSame( $max + 1, $over->get_error_data()['received'] );
		$this->assertStringContainsString( 'Split', $over->get_error_message() );
	}

	public function test_process_continues_past_a_wp_error_row(): void {
		$processed = AbilityBulk::process(
			array(
				array( 'email' => 'ok-a@example.test' ),
				array( 'email' => 'bad@example.test' ),
				array( 'email' => 'ok-b@example.test' ),
			),
			static function ( array $row ) {
				if ( 0 === strpos( (string) $row['email'], 'bad' ) ) {
					return new \WP_Error( 'doublescale_contact_exists', 'already there' );
				}
				return array( 'created' => true, 'email' => $row['email'] );
			}
		);

		$this->assertCount( 2, $processed['items'] );
		$this->assertCount( 1, $processed['errors'] );
		$this->assertSame( 'doublescale_contact_exists', $processed['errors'][0]['code'] );
		$this->assertSame( 1, $processed['errors'][0]['index'] );
	}

	/**
	 * Highest-value test: a throw must not abort the rest of the batch.
	 * Kills removing the per-row try/catch, and `continue` → `break`.
	 */
	public function test_process_continues_past_a_throwing_row(): void {
		$processed = AbilityBulk::process(
			array(
				array( 'email' => 'ok-a@example.test' ),
				array( 'email' => 'boom@example.test' ),
				array( 'email' => 'ok-b@example.test' ),
			),
			static function ( array $row ) {
				if ( 0 === strpos( (string) $row['email'], 'boom' ) ) {
					throw new \Exception( 'identifier conflict' );
				}
				return array( 'created' => true, 'email' => $row['email'] );
			}
		);

		$this->assertCount( 2, $processed['items'] );
		$this->assertCount( 1, $processed['errors'] );
		$this->assertSame( 'doublescale_item_failed', $processed['errors'][0]['code'] );
		$this->assertSame( 1, $processed['errors'][0]['index'] );
		$this->assertSame( $processed['batch_id'], $processed['errors'][0]['batch_id'] );
	}

	/**
	 * A bare string never reaches the handler. Call-counting closure pins it.
	 */
	public function test_process_does_not_call_the_handler_for_a_non_array_row(): void {
		$calls = 0;

		$processed = AbilityBulk::process(
			array(
				'not-an-object',
				array( 'email' => 'ok@example.test' ),
			),
			static function ( array $row ) use ( &$calls ) {
				++$calls;
				return array( 'created' => true, 'email' => $row['email'] );
			}
		);

		$this->assertSame( 1, $calls );
		$this->assertCount( 1, $processed['items'] );
		$this->assertSame( 'doublescale_invalid_item', $processed['errors'][0]['code'] );
		$this->assertSame( 0, $processed['errors'][0]['index'] );
	}

	public function test_envelope_puts_created_top_level_as_int(): void {
		$envelope = AbilityBulk::envelope(
			array(
				'items'    => array( array( 'created' => true ), array( 'created' => true ) ),
				'errors'   => array( array( 'code' => 'x' ) ),
				'batch_id' => 'a1b2c3d4e5f6',
			),
			'created'
		);

		$this->assertSame( 2, $envelope['created'] );
		$this->assertIsInt( $envelope['created'] );
		$this->assertSame( 1, $envelope['failed'] );
		$this->assertSame( 3, $envelope['total'] );
		$this->assertTrue( $envelope['partial'] );
		$this->assertSame( 'a1b2c3d4e5f6', $envelope['batch_id'] );
		$this->assertArrayNotHasKey( 'summary', $envelope );
	}

	/**
	 * Zero successes must be the integer 0, not absent and not false.
	 * AbilityGuard casts this to bool; 0 suppresses the audit.
	 */
	public function test_envelope_zero_successes_is_integer_zero(): void {
		$envelope = AbilityBulk::envelope(
			array(
				'items'    => array(),
				'errors'   => array( array( 'code' => 'x' ) ),
				'batch_id' => 'deadbeef0001',
			),
			'created'
		);

		$this->assertSame( 0, $envelope['created'] );
		$this->assertIsInt( $envelope['created'] );
		$this->assertFalse( $envelope['partial'] );
	}

	public function test_process_fires_bulk_item_only_for_successes_with_the_same_batch_id(): void {
		$fires = array();

		add_action(
			'doublescale_ability_bulk_item',
			static function ( $ability, $index, $result, $batch_id ) use ( &$fires ) {
				$fires[] = array(
					'ability'  => $ability,
					'index'    => $index,
					'result'   => $result,
					'batch_id' => $batch_id,
				);
			},
			10,
			4
		);

		$processed = AbilityBulk::process(
			array(
				array( 'email' => 'ok-a@example.test' ),
				array( 'email' => 'bad@example.test' ),
				array( 'email' => 'ok-b@example.test' ),
			),
			static function ( array $row ) {
				if ( 0 === strpos( (string) $row['email'], 'bad' ) ) {
					return new \WP_Error( 'nope', 'nope' );
				}
				return array( 'created' => true, 'email' => $row['email'] );
			},
			array( 'ability_name' => 'doublescale/create-contacts-bulk' )
		);

		$this->assertCount( 2, $fires );
		$this->assertSame( $processed['batch_id'], $fires[0]['batch_id'] );
		$this->assertSame( $processed['batch_id'], $fires[1]['batch_id'] );
		$this->assertSame( 0, $fires[0]['index'] );
		$this->assertSame( 2, $fires[1]['index'] );
		$this->assertSame( 'doublescale/create-contacts-bulk', $fires[0]['ability'] );
	}

	public function test_validate_batch_skip_cap_accepts_over_max(): void {
		$max = AbilityBulk::max_items( 'doublescale/create-contacts-bulk' );

		$error = AbilityBulk::validate_batch(
			array( 'contacts' => $this->n_rows( $max + 1 ) ),
			'contacts',
			'doublescale/create-contacts-bulk',
			array( 'skip_cap' => true )
		);

		$this->assertNull( $error );
	}

	public function test_process_dry_run_skips_the_per_row_hook(): void {
		$fires = 0;

		add_action(
			'doublescale_ability_bulk_item',
			static function () use ( &$fires ) {
				++$fires;
			}
		);

		AbilityBulk::process(
			array( array( 'email' => 'ok@example.test' ) ),
			static function ( array $row ) {
				return array( 'created' => false, 'would_create' => true, 'email' => $row['email'] );
			},
			array(
				'ability_name' => 'doublescale/create-contacts-bulk',
				'dry_run'      => true,
			)
		);

		$this->assertSame( 0, $fires );
	}

	public function test_process_injects_preview_flag(): void {
		$saw = false;

		AbilityBulk::process(
			array( array( 'email' => 'ok@example.test' ) ),
			static function ( array $row ) use ( &$saw ) {
				$saw = AbilityBulk::is_preview( $row );
				return array( 'created' => false, 'would_create' => true );
			},
			array( 'dry_run' => true )
		);

		$this->assertTrue( $saw );
	}

	public function test_finish_zeros_created_and_applied_ids_on_dry_run(): void {
		$processed = array(
			'items'    => array(
				array( 'created' => false, 'would_create' => true, 'contact_id' => 7 ),
			),
			'errors'   => array(),
			'batch_id' => 'preview000001',
		);

		$envelope = AbilityBulk::finish(
			$processed,
			'created',
			array( 'dry_run' => true ),
			array(
				'id_key'      => 'contact_id',
				'applied_key' => 'applied_contact_ids',
			)
		);

		$this->assertSame( 0, $envelope['created'] );
		$this->assertSame( 1, $envelope['would_create'] );
		$this->assertTrue( $envelope['dry_run'] );
		$this->assertSame( array(), $envelope['applied_ids'] );
		$this->assertSame( array(), $envelope['applied_contact_ids'] );
	}

	public function test_envelope_applied_ids_skip_preview_and_noop_rows(): void {
		$envelope = AbilityBulk::envelope(
			array(
				'items'    => array(
					array( 'created' => true, 'contact_id' => 1 ),
					array( 'created' => false, 'would_create' => true, 'contact_id' => 2 ),
					array( 'updated' => false, 'contact_id' => 3 ),
					array( 'updated' => true, 'contact_id' => 1 ),
				),
				'errors'   => array(),
				'batch_id' => 'applied000001',
			),
			'created',
			array(
				'id_key'      => 'contact_id',
				'applied_key' => 'applied_contact_ids',
			)
		);

		$this->assertSame( array( 1 ), $envelope['applied_ids'] );
		$this->assertSame( array( 1 ), $envelope['applied_contact_ids'] );
	}

	public function test_expand_refuses_combining_modes(): void {
		$error = AbilityBulk::expand(
			array(
				'contacts'    => array( array( 'id' => 1 ) ),
				'contact_ids' => array( 1 ),
			),
			'doublescale/update-contacts-bulk',
			array(
				'rows_key' => 'contacts',
				'ids_key'  => 'contact_ids',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_invalid_target', $error->get_error_code() );
	}

	public function test_expand_refuses_an_empty_filter(): void {
		$error = AbilityBulk::expand(
			array( 'filter' => array() ),
			'doublescale/update-contacts-bulk',
			array(
				'rows_key' => 'contacts',
				'ids_key'  => 'contact_ids',
				'querier'  => static function () {
					return null;
				},
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_empty_filter', $error->get_error_code() );
	}

	public function test_expand_filter_over_cap_dry_run_is_count_only(): void {
		$max = AbilityBulk::max_items( 'doublescale/update-contacts-bulk' );
		$ids = range( 1, $max + 3 );

		$expanded = AbilityBulk::expand(
			array(
				'dry_run' => true,
				'filter'  => array( 'status' => 'subscribed' ),
			),
			'doublescale/update-contacts-bulk',
			array(
				'rows_key' => 'contacts',
				'ids_key'  => 'contact_ids',
				'id_field' => 'id',
				'querier'  => function () use ( $ids ) {
					return $this->fake_query( $ids );
				},
			)
		);

		$this->assertIsArray( $expanded );
		$this->assertTrue( $expanded['count_only'] );
		$this->assertTrue( $expanded['over_cap'] );
		$this->assertSame( $max + 3, $expanded['matched'] );
		$this->assertSame( array(), $expanded['rows'] );
	}

	public function test_preview_over_cap_keeps_write_counts_at_zero(): void {
		$max      = AbilityBulk::max_items( 'doublescale/update-contacts-bulk' );
		$envelope = AbilityBulk::preview_over_cap(
			$max + 10,
			'doublescale/update-contacts-bulk',
			'updated',
			array( 'applied_key' => 'applied_contact_ids' )
		);

		$this->assertSame( 0, $envelope['updated'] );
		$this->assertSame( $max + 10, $envelope['would_update'] );
		$this->assertTrue( $envelope['dry_run'] );
		$this->assertTrue( $envelope['over_cap'] );
		$this->assertSame( array(), $envelope['applied_contact_ids'] );
	}

	public function test_filter_is_empty_treats_blank_criteria_as_empty(): void {
		$this->assertTrue( AbilityBulk::filter_is_empty( array() ) );
		$this->assertTrue( AbilityBulk::filter_is_empty( array( 'search' => '  ', 'tag_id' => 0 ) ) );
		$this->assertFalse( AbilityBulk::filter_is_empty( array( 'status' => 'subscribed' ) ) );
		$this->assertFalse( AbilityBulk::filter_is_empty( array( 'overdue_only' => true ) ) );
	}

	public function test_normalize_id_list_rejects_non_positive_ids(): void {
		$error = AbilityBulk::normalize_id_list( array( 1, 0, 2 ), 'contact_ids' );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'doublescale_invalid_id', $error->get_error_code() );
	}

	/**
	 * @param array<int, int> $ids Record ids.
	 * @return object Query double with count()/orderBy()/pluck().
	 */
	private function fake_query( array $ids ) {
		return new class( $ids ) {
			/**
			 * @var array<int, int>
			 */
			private $ids;

			/**
			 * @param array<int, int> $ids Record ids.
			 */
			public function __construct( array $ids ) {
				$this->ids = $ids;
			}

			public function count(): int {
				return count( $this->ids );
			}

			/**
			 * @param string $column Column.
			 * @return self
			 */
			public function orderBy( $column ) {
				unset( $column );
				return $this;
			}

			/**
			 * @param string $column Column.
			 * @return array<int, int>
			 */
			public function pluck( $column ) {
				unset( $column );
				return $this->ids;
			}
		};
	}

	/**
	 * @param int $n Row count.
	 * @return array<int, array<string, string>>
	 */
	private function n_rows( int $n ): array {
		$rows = array();
		for ( $i = 0; $i < $n; $i++ ) {
			$rows[] = array( 'email' => 'u' . $i . '@example.test' );
		}
		return $rows;
	}
}
