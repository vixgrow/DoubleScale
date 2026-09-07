<?php
/**
 * Integration coverage for admin contact merge.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Activities\Models\ActivityAssociationModel;
use DoubleScale\Modules\Contacts\Services\ContactMergeService;
use DoubleScale\Tests\Integration\IntegrationTestCase;
use WP_REST_Response;

final class ContactMergeServiceTest extends IntegrationTestCase {

	/**
	 * @var ContactMergeService
	 */
	private $service;

	protected function setUp(): void {
		parent::setUp();
		$this->service = new ContactMergeService();
	}

	public function test_basic_merge_keeps_primary_and_copies_source_phone(): void {
		$primary_id = $this->make_contact(
			array(
				'first_name' => 'Primary',
				'email'      => $this->unique_email( 'primary' ),
			)
		);
		$phone      = $this->unique_phone();
		$source_id  = $this->make_contact(
			array(
				'first_name' => 'Source',
				'email'      => null,
				'phone'      => $phone,
			)
		);

		$result = $this->service->merge( $primary_id, $source_id );

		$this->assertIsArray( $result );
		$this->assertSame( $primary_id, (int) $result['id'] );
		$this->assertSame( $phone, $result['phone'] );

		$primary = $this->contact_row( $primary_id );
		$this->assertSame( 'Primary', $primary['first_name'] );
		$this->assertSame( $phone, $primary['phone'] );
		$this->assertNull( $this->contact_row( $source_id ) );
	}

	public function test_source_activities_move_to_primary(): void {
		$primary_id = $this->make_contact( array( 'email' => $this->unique_email( 'act-p' ) ) );
		$source_id  = $this->make_contact(
			array(
				'email' => null,
				'phone' => $this->unique_phone(),
			)
		);
		$activity_id = $this->insert_note( $source_id, 'Source note' );

		$this->service->merge( $primary_id, $source_id );

		$this->assertSame(
			1,
			$this->count_activity_links( $activity_id, $primary_id )
		);
		$this->assertSame(
			0,
			$this->count_activity_links( $activity_id, $source_id )
		);
	}

	public function test_tags_and_lists_union_without_duplicate_pivots(): void {
		$primary_id = $this->make_contact( array( 'email' => $this->unique_email( 'tag-p' ) ) );
		$source_id  = $this->make_contact(
			array(
				'email' => null,
				'phone' => $this->unique_phone(),
			)
		);

		$this->attach_taxonomy( $primary_id, 'tag', 11 );
		$this->attach_taxonomy( $source_id, 'tag', 11 );
		$this->attach_taxonomy( $source_id, 'tag', 12 );
		$this->attach_taxonomy( $primary_id, 'list', 21 );
		$this->attach_taxonomy( $source_id, 'list', 22 );

		$this->service->merge( $primary_id, $source_id );

		$this->assertSame( 2, $this->count_taxonomy( $primary_id, 'tag' ) );
		$this->assertSame( 2, $this->count_taxonomy( $primary_id, 'list' ) );
		$this->assertSame( 0, $this->count_taxonomy( $source_id, 'tag' ) );
	}

	public function test_custom_field_primary_wins_empty_fills_and_conflicts_are_logged(): void {
		if ( ! $this->table_exists( 'custom_field_relationship' ) ) {
			$this->markTestSkipped( 'Custom field relationship table is not installed.' );
		}

		$primary_id = $this->make_contact(
			array(
				'email'      => $this->unique_email( 'cf-p' ),
				'first_name' => 'Kept',
			)
		);
		$source_id  = $this->make_contact(
			array(
				'email'      => null,
				'phone'      => $this->unique_phone(),
				'first_name' => 'Dropped',
			)
		);

		$this->set_custom_field( $primary_id, 101, 'primary-value' );
		$this->set_custom_field( $source_id, 101, 'source-value' );
		$this->set_custom_field( $primary_id, 102, '' );
		$this->set_custom_field( $source_id, 102, 'filled' );
		$this->set_custom_field( $source_id, 103, 'only-source' );

		$this->service->merge( $primary_id, $source_id );

		$this->assertSame( 'primary-value', $this->custom_field_value( $primary_id, 101 ) );
		$this->assertSame( 'filled', $this->custom_field_value( $primary_id, 102 ) );
		$this->assertSame( 'only-source', $this->custom_field_value( $primary_id, 103 ) );
		$this->assertSame( 'Kept', $this->contact_row( $primary_id )['first_name'] );
		$this->assertStringContainsString(
			'custom_field_101',
			$this->latest_merge_note_body( $primary_id )
		);
	}

	public function test_invoices_reassign_to_primary(): void {
		if ( ! $this->table_exists( 'sales_invoices' ) ) {
			$this->markTestSkipped( 'Invoices table is not installed.' );
		}

		$primary_id = $this->make_contact( array( 'email' => $this->unique_email( 'inv-p' ) ) );
		$source_id  = $this->make_contact(
			array(
				'email' => null,
				'phone' => $this->unique_phone(),
			)
		);
		$invoice_id = $this->insert_invoice( $source_id );

		$this->service->merge( $primary_id, $source_id );

		global $wpdb;
		$owner = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT contact_id FROM {$wpdb->prefix}doublescale_sales_invoices WHERE id = %d",
				$invoice_id
			)
		);
		$this->assertSame( $primary_id, $owner );
	}

	public function test_conflicting_identifiers_block_the_merge(): void {
		$primary_id = $this->make_contact(
			array(
				'email' => $this->unique_email( 'block-p' ),
				'phone' => $this->unique_phone(),
			)
		);
		$source_id  = $this->make_contact(
			array(
				'email' => $this->unique_email( 'block-s' ),
				'phone' => $this->unique_phone(),
			)
		);

		$result = $this->service->merge( $primary_id, $source_id );

		$this->assertWPError( $result );
		$this->assertSame( 'merge_identifier_conflict', $result->get_error_code() );
		$this->assertNotNull( $this->contact_row( $source_id ) );
	}

	public function test_failure_rolls_back_primary_source_and_relationships(): void {
		$primary_id = $this->make_contact(
			array(
				'first_name' => 'Unchanged',
				'email'      => $this->unique_email( 'rb-p' ),
			)
		);
		$phone      = $this->unique_phone();
		$source_id  = $this->make_contact(
			array(
				'first_name' => 'SourceStill',
				'email'      => null,
				'phone'      => $phone,
			)
		);
		$activity_id = $this->insert_note( $source_id, 'Must roll back' );

		$thrower = static function () {
			throw new \RuntimeException( 'forced merge failure' );
		};
		add_action( 'doublescale_contact_merge_before_commit', $thrower );

		$result = $this->service->merge( $primary_id, $source_id );

		remove_action( 'doublescale_contact_merge_before_commit', $thrower );

		$this->assertWPError( $result );
		$this->assertSame( 'merge_failed', $result->get_error_code() );

		$primary = $this->contact_row( $primary_id );
		$source  = $this->contact_row( $source_id );
		$this->assertSame( 'Unchanged', $primary['first_name'] );
		$this->assertTrue( ContactMergeService::is_empty_value( $primary['phone'] ?? null ) );
		$this->assertSame( 'SourceStill', $source['first_name'] );
		$this->assertSame( $phone, $source['phone'] );
		$this->assertSame( 1, $this->count_activity_links( $activity_id, $source_id ) );
		$this->assertSame( 0, $this->count_activity_links( $activity_id, $primary_id ) );
	}

	public function test_update_without_duplicate_still_succeeds(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$primary_id = $this->make_contact(
			array(
				'first_name' => 'Ada',
				'email'      => $this->unique_email( 'reg' ),
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/' . $primary_id,
			array(
				'first_name' => 'Ada Lovelace',
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'Ada Lovelace', $data['first_name'] );
	}

	public function test_update_with_duplicate_phone_returns_merge_required(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$primary_id = $this->make_contact(
			array(
				'first_name' => 'MergePrimary',
				'email'      => $this->unique_email( 'req-p' ),
			)
		);
		$phone      = $this->unique_phone();
		$source_id  = $this->make_contact(
			array(
				'first_name' => 'MergeSource',
				'email'      => null,
				'phone'      => $phone,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/' . $primary_id,
			array(
				'email' => $this->contact_row( $primary_id )['email'],
				'phone' => $phone,
			),
			$user_id
		);

		$this->assertSame( 409, $response->get_status() );
		$error = $response->as_error();
		$this->assertNotNull( $error );
		$this->assertSame( 'merge_required', $error->get_error_code() );
		$data = $error->get_error_data();
		$this->assertSame( $primary_id, (int) $data['primary']['id'] );
		$this->assertSame( $source_id, (int) $data['source']['id'] );
		$this->assertNotNull( $this->contact_row( $source_id ) );
	}

	public function test_merge_endpoint_unifies_contacts(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$primary_id = $this->make_contact( array( 'email' => $this->unique_email( 'ep-p' ) ) );
		$phone      = $this->unique_phone();
		$source_id  = $this->make_contact(
			array(
				'email' => null,
				'phone' => $phone,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/merge',
			array(
				'primary_id' => $primary_id,
				'source_id'  => $source_id,
			),
			$user_id
		);

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $phone, $this->contact_row( $primary_id )['phone'] );
		$this->assertNull( $this->contact_row( $source_id ) );
	}

	public function test_restrictive_email_status_is_preserved(): void {
		$primary_id = $this->make_contact(
			array(
				'email'        => $this->unique_email( 'st-p' ),
				'email_status' => 'subscribed',
			)
		);
		$source_id  = $this->make_contact(
			array(
				'email'        => null,
				'phone'        => $this->unique_phone(),
				'email_status' => 'unsubscribed',
			)
		);

		$this->service->merge( $primary_id, $source_id );

		$this->assertSame( 'unsubscribed', $this->contact_row( $primary_id )['email_status'] );
	}

	/**
	 * @param string $suffix Unique fragment.
	 * @return string
	 */
	private function unique_email( $suffix ) {
		return 'merge-' . $suffix . '-' . wp_generate_password( 8, false, false ) . '@example.test';
	}

	/**
	 * @return string
	 */
	private function unique_phone() {
		return '+1555' . (string) wp_rand( 1000000, 9999999 );
	}

	/**
	 * @param int $id Contact ID.
	 * @return array<string, mixed>|null
	 */
	private function contact_row( $id ) {
		global $wpdb;
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}doublescale_contacts WHERE id = %d",
				$id
			),
			ARRAY_A
		);
		return is_array( $row ) ? $row : null;
	}

	/**
	 * @param string $suffix Table suffix.
	 * @return bool
	 */
	private function table_exists( $suffix ) {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_' . $suffix;
		return $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) === $table;
	}

	/**
	 * @param int    $contact_id Contact ID.
	 * @param string $title      Note title.
	 * @return int Activity ID.
	 */
	private function insert_note( $contact_id, $title ) {
		global $wpdb;
		$now  = current_time( 'mysql', true );
		$data = wp_json_encode(
			array(
				'title'   => $title,
				'type'    => 'note',
				'content' => $title,
			)
		);
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_activities',
			array(
				'activity_type' => 'note',
				'data'          => $data,
				'activity_date' => $now,
				'created_at'    => $now,
				'updated_at'    => $now,
			)
		);
		$activity_id = (int) $wpdb->insert_id;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_activity_associations',
			array(
				'activity_id' => $activity_id,
				'entity_type' => ActivityAssociationModel::ENTITY_TYPE_CONTACT,
				'entity_id'   => $contact_id,
				'created_at'  => $now,
				'updated_at'  => $now,
			)
		);
		return $activity_id;
	}

	/**
	 * @param int $activity_id Activity ID.
	 * @param int $contact_id  Contact ID.
	 * @return int
	 */
	private function count_activity_links( $activity_id, $contact_id ) {
		global $wpdb;
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}doublescale_activity_associations
				WHERE activity_id = %d AND entity_type = %d AND entity_id = %d",
				$activity_id,
				ActivityAssociationModel::ENTITY_TYPE_CONTACT,
				$contact_id
			)
		);
	}

	/**
	 * @param int    $contact_id Contact ID.
	 * @param string $type       tag|list.
	 * @param int    $taxonomy_id Taxonomy ID.
	 * @return void
	 */
	private function attach_taxonomy( $contact_id, $type, $taxonomy_id ) {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_contact_taxonomy_relationship',
			array(
				'contact_id'    => $contact_id,
				'taxonomy_type' => $type,
				'taxonomy_id'   => $taxonomy_id,
			)
		);
	}

	/**
	 * @param int    $contact_id Contact ID.
	 * @param string $type       tag|list.
	 * @return int
	 */
	private function count_taxonomy( $contact_id, $type ) {
		global $wpdb;
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}doublescale_contact_taxonomy_relationship
				WHERE contact_id = %d AND taxonomy_type = %s",
				$contact_id,
				$type
			)
		);
	}

	/**
	 * @param int    $contact_id Contact ID.
	 * @param int    $field_id   Custom field ID.
	 * @param string $value      Value.
	 * @return void
	 */
	private function set_custom_field( $contact_id, $field_id, $value ) {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_custom_field_relationship',
			array(
				'entity_type'     => 'contact',
				'entity_id'       => $contact_id,
				'custom_field_id' => $field_id,
				'value'           => $value,
			)
		);
	}

	/**
	 * @param int $contact_id Contact ID.
	 * @param int $field_id   Custom field ID.
	 * @return string|null
	 */
	private function custom_field_value( $contact_id, $field_id ) {
		global $wpdb;
		$value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT value FROM {$wpdb->prefix}doublescale_custom_field_relationship
				WHERE entity_type = %s AND entity_id = %d AND custom_field_id = %d",
				'contact',
				$contact_id,
				$field_id
			)
		);
		return null === $value ? null : (string) $value;
	}

	/**
	 * @param int $contact_id Contact ID.
	 * @return string
	 */
	private function latest_merge_note_body( $contact_id ) {
		global $wpdb;
		$data = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT a.data FROM {$wpdb->prefix}doublescale_activities a
				INNER JOIN {$wpdb->prefix}doublescale_activity_associations aa ON aa.activity_id = a.id
				WHERE aa.entity_type = %d AND aa.entity_id = %d AND a.activity_type = %s
				ORDER BY a.id DESC LIMIT 1",
				ActivityAssociationModel::ENTITY_TYPE_CONTACT,
				$contact_id,
				'note'
			)
		);
		$decoded = json_decode( (string) $data, true );
		return is_array( $decoded ) ? (string) ( $decoded['content'] ?? '' ) : (string) $data;
	}

	/**
	 * @param int $contact_id Contact ID.
	 * @return int Invoice ID.
	 */
	private function insert_invoice( $contact_id ) {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_sales_invoices',
			array(
				'invoice_number' => 'INV-M-' . wp_generate_password( 8, false, false ),
				'hash'           => wp_generate_password( 32, false, false ),
				'status'         => 'draft',
				'contact_id'     => $contact_id,
				'currency'       => 'USD',
			)
		);
		return (int) $wpdb->insert_id;
	}
}
