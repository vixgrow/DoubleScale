<?php
/**
 * Filter-targeted bulk membership actions on contacts.
 *
 * Covers the `target.mode = filter` path on add-tag / remove-tag /
 * add-to-list / remove-from-list: a bulk action can address every contact
 * matching the list filter instead of an explicit id array, processed in
 * resumable cursor batches.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\ListModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactBulkFilterTargetTest extends IntegrationTestCase {

	/**
	 * Unique suffix so seeded rows never collide with other tests.
	 *
	 * @var string
	 */
	private $suffix;

	/**
	 * Admin user id used for every dispatch.
	 *
	 * @var int
	 */
	private $admin_id;

	protected function setUp(): void {
		parent::setUp();
		$this->suffix   = wp_generate_password( 8, false, false );
		$this->admin_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
	}

	/**
	 * Seed N contacts sharing a searchable last name.
	 *
	 * @param int $count How many contacts to create.
	 * @return int[] Contact ids, ascending.
	 */
	private function seed_contacts( $count ) {
		$ids = array();
		for ( $i = 0; $i < $count; $i++ ) {
			$ids[] = $this->make_contact(
				array(
					'email'      => sprintf( 'bulk-%s-%02d@example.test', $this->suffix, $i ),
					'first_name' => 'Bulk',
					'last_name'  => 'Target' . $this->suffix,
				)
			);
		}
		return $ids;
	}

	/**
	 * Drive the resumable bulk endpoint until it reports completion.
	 *
	 * Mirrors what the browser does: re-POST with the cursor the previous
	 * response handed back, carrying `total` forward for the progress
	 * denominator.
	 *
	 * @param string               $route Route to POST to.
	 * @param array<string, mixed> $body  Request body (without after_id/total).
	 * @return array<string, mixed> The final response payload.
	 */
	private function run_to_completion( $route, array $body ) {
		$after_id = 0;
		$total    = 0;
		$rounds   = 0;
		$last     = array();
		$updated  = 0;
		$skipped  = 0;

		do {
			$response = $this->dispatch_rest(
				'POST',
				$route,
				array_merge( $body, array( 'after_id' => $after_id, 'total' => $total ) ),
				$this->admin_id
			);

			$this->assertSame(
				200,
				$response->get_status(),
				'Bulk round ' . $rounds . ' failed: ' . wp_json_encode( $response->get_data() )
			);

			$last     = (array) $response->get_data();
			$after_id = isset( $last['next_after_id'] ) ? (int) $last['next_after_id'] : 0;
			$total    = isset( $last['total'] ) ? (int) $last['total'] : 0;
			$updated += isset( $last['updated'] ) ? (int) $last['updated'] : 0;
			$skipped += isset( $last['skipped'] ) ? (int) $last['skipped'] : 0;

			++$rounds;
			$this->assertLessThan( 50, $rounds, 'Bulk loop did not terminate.' );
		} while ( isset( $last['status'] ) && 'in_progress' === $last['status'] );

		$last['updated'] = $updated;
		$last['skipped'] = $skipped;

		return $last;
	}

	/**
	 * Tag names attached to a contact.
	 *
	 * @param int $contact_id Contact id.
	 * @return string[]
	 */
	private function tag_names( $contact_id ) {
		$contact = ContactModel::query()->with( 'tags' )->where( 'id', $contact_id )->first();
		$names   = array();
		foreach ( $contact->tags as $tag ) {
			$names[] = (string) $tag->name;
		}
		return $names;
	}

	/**
	 * The core promise: a filter target reaches every matching contact.
	 */
	public function test_filter_target_tags_every_matching_contact(): void {
		$ids = $this->seed_contacts( 25 );
		$tag = TagModel::getOrCreate( 'BulkAll ' . $this->suffix );

		// A contact that must NOT be touched — different last name.
		$outsider = $this->make_contact(
			array(
				'email'     => 'outsider-' . $this->suffix . '@example.test',
				'last_name' => 'Untouched' . $this->suffix,
			)
		);

		$result = $this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 25, (int) $result['total'] );

		$this->assertNotEmpty( $ids );
		foreach ( $ids as $id ) {
			$this->assertContains(
				'BulkAll ' . $this->suffix,
				$this->tag_names( $id ),
				"Contact {$id} matched the filter but was not tagged."
			);
		}

		$this->assertNotContains( 'BulkAll ' . $this->suffix, $this->tag_names( $outsider ) );
	}

	/**
	 * The run resumes across batch boundaries rather than doing it all at once.
	 */
	public function test_filter_target_resumes_across_batches(): void {
		$this->seed_contacts( 25 );
		$tag = TagModel::getOrCreate( 'BulkBatch ' . $this->suffix );

		add_filter( 'doublescale_contacts_bulk_batch_size', static fn() => 5 );

		$first = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids'  => array( (int) $tag->id ),
				'after_id' => 0,
				'total'    => 0,
				'target'   => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			),
			$this->admin_id
		);

		$this->assertSame( 200, $first->get_status() );
		$payload = (array) $first->get_data();

		$this->assertSame( 'in_progress', $payload['status'], 'A 25-row run with batch size 5 must not finish in one round.' );
		$this->assertSame( 5, (int) $payload['processed'] );
		$this->assertSame( 25, (int) $payload['total'] );
		$this->assertGreaterThan( 0, (int) $payload['next_after_id'] );
	}

	/**
	 * Regression: offset paging silently skips rows once the action changes
	 * what the filter matches. The cursor must be anchored to the id.
	 *
	 * Seed 25 contacts carrying tag A, filter for "does not have tag B", then
	 * apply tag B. After the first batch those rows stop matching, so an
	 * offset-based cursor jumps over the next batch and leaves most contacts
	 * untagged.
	 */
	public function test_cursor_does_not_skip_when_filter_excludes_processed_rows(): void {
		$ids   = $this->seed_contacts( 25 );
		$tag_a = TagModel::getOrCreate( 'Cursor A ' . $this->suffix );
		$tag_b = TagModel::getOrCreate( 'Cursor B ' . $this->suffix );

		foreach ( $ids as $id ) {
			ContactModel::query()->where( 'id', $id )->first()->add_tags( array( (int) $tag_a->id ) );
		}

		add_filter( 'doublescale_contacts_bulk_batch_size', static fn() => 5 );

		$this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag_b->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
					'filters'  => array(
						array(
							array(
								'rule'          => 'tag',
								'selectedGroup' => 'segments',
								'operator'      => 'not_in',
								'value'         => array( (int) $tag_b->id ),
							),
						),
					),
				),
			)
		);

		$this->assertNotEmpty( $ids );
		$missed = array();
		foreach ( $ids as $id ) {
			if ( ! in_array( 'Cursor B ' . $this->suffix, $this->tag_names( $id ), true ) ) {
				$missed[] = $id;
			}
		}

		$this->assertSame(
			array(),
			$missed,
			count( $missed ) . ' of 25 contacts were skipped — the cursor drifted when tagged rows left the filter.'
		);
	}

	/**
	 * An empty filter would address the whole database, so it needs an
	 * explicit acknowledgement.
	 */
	public function test_empty_filter_target_without_confirmation_is_rejected(): void {
		$this->seed_contacts( 2 );
		$tag = TagModel::getOrCreate( 'BulkGuard ' . $this->suffix );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array( 'mode' => 'filter' ),
			),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'doublescale_bulk_empty_target', $response->get_data()['code'] );
	}

	/**
	 * ...and is allowed once the caller confirms it means everyone.
	 */
	public function test_empty_filter_target_with_confirm_all_processes_everything(): void {
		$ids = $this->seed_contacts( 3 );
		$tag = TagModel::getOrCreate( 'BulkConfirm ' . $this->suffix );

		$result = $this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'        => 'filter',
					'confirm_all' => true,
				),
			)
		);

		$this->assertSame( 'completed', $result['status'] );

		$this->assertNotEmpty( $ids );
		foreach ( $ids as $id ) {
			$this->assertContains( 'BulkConfirm ' . $this->suffix, $this->tag_names( $id ) );
		}
	}

	/**
	 * A filter must never silently widen an explicit id list.
	 */
	public function test_ids_and_filter_target_together_are_rejected(): void {
		$ids = $this->seed_contacts( 2 );
		$tag = TagModel::getOrCreate( 'BulkAmbiguous ' . $this->suffix );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $ids[0] ),
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'doublescale_bulk_ambiguous_target', $response->get_data()['code'] );
	}

	/**
	 * Automations hang off this hook, so the batched path must still fire it
	 * once per contact with only the newly added tag ids.
	 */
	public function test_tag_apply_hook_fires_once_per_contact_with_added_ids(): void {
		$ids = $this->seed_contacts( 6 );
		$tag = TagModel::getOrCreate( 'BulkHook ' . $this->suffix );

		$fired = array();
		add_action(
			'doublescale_contact_tag_apply',
			static function ( $contact, $tags_added ) use ( &$fired ) {
				$fired[] = array(
					'contact_id' => (int) $contact->id,
					'tags'       => array_map( 'intval', (array) $tags_added ),
				);
			},
			10,
			2
		);

		add_filter( 'doublescale_contacts_bulk_batch_size', static fn() => 4 );

		$this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			)
		);

		$this->assertCount( 6, $fired, 'The apply hook must fire once per changed contact.' );

		$seen = array();
		foreach ( $fired as $entry ) {
			$this->assertSame( array( (int) $tag->id ), $entry['tags'] );
			$seen[] = $entry['contact_id'];
		}
		sort( $seen );
		$expected = $ids;
		sort( $expected );
		$this->assertSame( $expected, $seen );
	}

	/**
	 * Re-running the same action must not duplicate pivot rows or re-fire the
	 * hook for contacts that already carry the tag.
	 */
	public function test_already_tagged_contacts_are_skipped_not_duplicated(): void {
		$ids = $this->seed_contacts( 4 );
		$tag = TagModel::getOrCreate( 'BulkIdem ' . $this->suffix );

		$body = array(
			'tag_ids' => array( (int) $tag->id ),
			'target'  => array(
				'mode'     => 'filter',
				'keywords' => 'Target' . $this->suffix,
			),
		);

		$first = $this->run_to_completion( '/doublescale/v1/contacts/add-tag', $body );
		$this->assertSame( 4, (int) $first['updated'] );
		$this->assertSame( 0, (int) $first['skipped'] );

		$second = $this->run_to_completion( '/doublescale/v1/contacts/add-tag', $body );
		$this->assertSame( 0, (int) $second['updated'], 'A repeat run must change nothing.' );
		$this->assertSame( 4, (int) $second['skipped'] );

		$this->assert_table_row_count(
			'contact_taxonomy_relationship',
			4,
			sprintf( "taxonomy_id = %d AND taxonomy_type = 'tag'", (int) $tag->id )
		);

		$this->assertNotEmpty( $ids );
	}

	/**
	 * The removal path bypassed the model helpers, so the remove hook never
	 * fired and "tag removed" automations were silently dead.
	 */
	public function test_remove_tag_fires_remove_hook(): void {
		$ids = $this->seed_contacts( 3 );
		$tag = TagModel::getOrCreate( 'BulkRemove ' . $this->suffix );

		foreach ( $ids as $id ) {
			ContactModel::query()->where( 'id', $id )->first()->add_tags( array( (int) $tag->id ) );
		}

		$fired = array();
		add_action(
			'doublescale_contact_tag_remove',
			static function ( $contact ) use ( &$fired ) {
				$fired[] = (int) $contact->id;
			},
			10,
			2
		);

		$this->run_to_completion(
			'/doublescale/v1/contacts/remove-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			)
		);

		$this->assertCount( 3, $fired, 'Bulk tag removal must fire doublescale_contact_tag_remove.' );

		foreach ( $ids as $id ) {
			$this->assertNotContains( 'BulkRemove ' . $this->suffix, $this->tag_names( $id ) );
		}
	}

	/**
	 * Lists travel the same path as tags.
	 */
	public function test_filter_target_adds_every_matching_contact_to_a_list(): void {
		$ids  = $this->seed_contacts( 7 );
		$list = ListModel::getOrCreate( 'BulkList ' . $this->suffix );

		add_filter( 'doublescale_contacts_bulk_batch_size', static fn() => 3 );

		$result = $this->run_to_completion(
			'/doublescale/v1/contacts/add-to-list',
			array(
				'list_ids' => array( (int) $list->id ),
				'target'   => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 7, (int) $result['total'] );

		$this->assertNotEmpty( $ids );
		foreach ( $ids as $id ) {
			$contact = ContactModel::query()->with( 'lists' )->where( 'id', $id )->first();
			$names   = array();
			foreach ( $contact->lists as $l ) {
				$names[] = (string) $l->name;
			}
			$this->assertContains( 'BulkList ' . $this->suffix, $names );
		}
	}

	/**
	 * Deletion stays on the reviewable explicit-id path.
	 */
	public function test_filter_target_is_rejected_for_delete(): void {
		$ids = $this->seed_contacts( 3 );

		$response = $this->dispatch_rest(
			'DELETE',
			'/doublescale/v1/contacts',
			array(
				'target' => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
				'force'  => true,
			),
			$this->admin_id
		);

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );

		// Nothing may have been deleted.
		$this->assertNotEmpty( $ids );
		foreach ( $ids as $id ) {
			$this->assertNotNull( ContactModel::query()->where( 'id', $id )->first() );
		}
	}

	/**
	 * The set the bulk action reaches must be exactly the set the list shows.
	 * This is what makes the shared query builder safe to refactor.
	 */
	public function test_bulk_filter_target_matches_list_endpoint_exactly(): void {
		$this->seed_contacts( 12 );
		$tag = TagModel::getOrCreate( 'BulkParity ' . $this->suffix );

		$criteria = array( 'keywords' => 'Target' . $this->suffix );

		$listed = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/contacts',
			array_merge( $criteria, array( 'per_page' => 100 ) ),
			$this->admin_id
		);
		$this->assertSame( 200, $listed->get_status() );

		$listed_ids = array();
		foreach ( (array) $listed->get_data()['data'] as $row ) {
			$listed_ids[] = (int) ( is_array( $row ) ? $row['id'] : $row->id );
		}
		sort( $listed_ids );
		$this->assertNotEmpty( $listed_ids, 'The list endpoint returned nothing to compare against.' );

		$this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array_merge( array( 'mode' => 'filter' ), $criteria ),
			)
		);

		global $wpdb;
		$tagged_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT contact_id FROM {$wpdb->prefix}doublescale_contact_taxonomy_relationship WHERE taxonomy_id = %d AND taxonomy_type = 'tag'",
				(int) $tag->id
			)
		);
		$tagged_ids = array_map( 'intval', (array) $tagged_ids );
		sort( $tagged_ids );

		$this->assertSame(
			$listed_ids,
			$tagged_ids,
			'The bulk action reached a different set of contacts than the list endpoint shows.'
		);
	}

	/**
	 * A non-manager must not be able to drive a filter-wide mutation.
	 */
	public function test_subscriber_cannot_run_a_filter_target_bulk_action(): void {
		$this->seed_contacts( 2 );
		$tag        = TagModel::getOrCreate( 'BulkPerm ' . $this->suffix );
		$subscriber = $this->make_subscriber_user();

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			),
			$subscriber
		);

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	/**
	 * A filter matching nobody completes quietly instead of erroring.
	 */
	public function test_filter_target_matching_nothing_completes(): void {
		$tag = TagModel::getOrCreate( 'BulkEmpty ' . $this->suffix );

		$result = $this->run_to_completion(
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array( (int) $tag->id ),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'NoSuchContact' . $this->suffix,
				),
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 0, (int) $result['total'] );
		$this->assertSame( 0, (int) $result['updated'] );
	}

	/**
	 * An empty tag list is a caller mistake, not a silent no-op.
	 */
	public function test_empty_tag_ids_is_rejected(): void {
		$this->seed_contacts( 2 );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'tag_ids' => array(),
				'target'  => array(
					'mode'     => 'filter',
					'keywords' => 'Target' . $this->suffix,
				),
			),
			$this->admin_id
		);

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}
}
