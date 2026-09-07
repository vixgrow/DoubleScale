<?php
/**
 * Use case 1b — Add Contact with an identifier that already exists.
 *
 * Creating a contact whose email/phone/WhatsApp number belongs to an existing
 * record used to fail with a flat "already exists" error, leaving the admin to
 * find the other record by hand. It now returns the existing contact and the
 * fields that would change, so the admin can review and confirm updating it
 * instead — the create-time equivalent of the merge dialog.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactCreateMergeTest extends IntegrationTestCase {

	/**
	 * @param string $suffix Local-part suffix.
	 * @return string
	 */
	private function unique_email( $suffix ) {
		return 'create-' . $suffix . '-' . wp_generate_password( 8, false, false ) . '@example.test';
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
	 * Pull the WP_Error out of a REST response.
	 *
	 * @param \WP_REST_Response $response Response.
	 * @return \WP_Error|null
	 */
	private function error_of( $response ) {
		$data = $response->get_data();

		if ( $data instanceof \WP_Error ) {
			return $data;
		}

		if ( method_exists( $response, 'as_error' ) ) {
			return $response->as_error();
		}

		return null;
	}

	/**
	 * An admin creating a duplicate is offered the existing record.
	 */
	public function test_creating_a_duplicate_offers_the_existing_contact(): void {
		$user_id  = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$email    = $this->unique_email( 'create-dup' );
		$existing = $this->make_contact(
			array(
				'first_name' => 'Existing',
				'email'      => $email,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts',
			array(
				'first_name' => 'Existing',
				'email'      => $email,
				'phone'      => $this->unique_phone(),
			),
			$user_id
		);

		$this->assertSame( 409, $response->get_status() );

		$error = $this->error_of( $response );
		$this->assertNotNull( $error );
		$this->assertSame( 'contact_exists_merge_available', $error->get_error_code() );

		$data = $error->get_error_data();
		$this->assertSame( $existing, (int) $data['existing']['id'] );
		$this->assertSame( 'email', $data['field'] );
	}

	/**
	 * The response names the fields the incoming data would add or change, so
	 * the admin can see what confirming would do before doing it.
	 */
	public function test_response_describes_what_would_change(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$email   = $this->unique_email( 'create-changes' );
		$phone   = $this->unique_phone();

		$this->make_contact(
			array(
				'first_name' => 'Existing',
				'last_name'  => null,
				'email'      => $email,
				'phone'      => null,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts',
			array(
				'first_name' => 'Existing',
				'last_name'  => 'Added',
				'email'      => $email,
				'phone'      => $phone,
			),
			$user_id
		);

		$data    = $this->error_of( $response )->get_error_data();
		$changes = array();
		foreach ( $data['changes'] as $change ) {
			$changes[ $change['field'] ] = $change;
		}

		// An empty field being filled in is an addition, not a conflict.
		$this->assertArrayHasKey( 'phone', $changes );
		$this->assertSame( $phone, $changes['phone']['incoming'] );
		$this->assertFalse( $changes['phone']['conflict'] );

		$this->assertArrayHasKey( 'last_name', $changes );
		$this->assertFalse( $changes['last_name']['conflict'] );

		// A field that matches is not reported at all.
		$this->assertArrayNotHasKey( 'first_name', $changes );
	}

	/**
	 * A field whose value differs is flagged as a conflict the admin must judge.
	 */
	public function test_differing_value_is_flagged_as_a_conflict(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$email   = $this->unique_email( 'create-conflict' );

		$this->make_contact(
			array(
				'first_name' => 'Ahmed',
				'email'      => $email,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts',
			array(
				'first_name' => 'Mohamed',
				'email'      => $email,
			),
			$user_id
		);

		$data    = $this->error_of( $response )->get_error_data();
		$changes = array();
		foreach ( $data['changes'] as $change ) {
			$changes[ $change['field'] ] = $change;
		}

		$this->assertArrayHasKey( 'first_name', $changes );
		$this->assertTrue(
			$changes['first_name']['conflict'],
			'A name that differs from the stored one must be marked as a conflict.'
		);
		$this->assertSame( 'Ahmed', $changes['first_name']['existing'] );
		$this->assertSame( 'Mohamed', $changes['first_name']['incoming'] );
	}

	/**
	 * Confirming updates the existing contact rather than creating a second one.
	 */
	public function test_confirming_updates_the_existing_contact(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$email   = $this->unique_email( 'create-confirm' );
		$phone   = $this->unique_phone();

		$existing = $this->make_contact(
			array(
				'first_name' => 'Existing',
				'email'      => $email,
				'phone'      => null,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts',
			array(
				'first_name'     => 'Existing',
				'email'          => $email,
				'phone'          => $phone,
				'merge_existing' => true,
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );

		$body = $response->get_data();
		$this->assertSame( $existing, (int) $body['id'], 'No second contact may be created.' );
		$this->assertSame( $phone, $this->contact_row( $existing )['phone'] );
	}

	/**
	 * Creating a contact with no duplicate is unaffected.
	 */
	public function test_creating_a_unique_contact_still_works(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts',
			array(
				'first_name' => 'Fresh',
				'email'      => $this->unique_email( 'create-fresh' ),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
	}
}
