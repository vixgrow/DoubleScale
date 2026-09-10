<?php
/**
 * REST bulk Add Tag — POST /doublescale/v1/contacts/add-tag.
 *
 * The Contacts list Bulk Actions → Add Tag modal posts selected contact ids
 * and tag ids here. Tags already on a contact must stay; missing ones attach.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactBulkAddTagRestTest extends IntegrationTestCase {

	/**
	 * @param int $contact_id Contact ID.
	 * @return int[]
	 */
	private function tag_ids_on( $contact_id ) {
		$contact = ContactModel::query()->with( 'tags' )->where( 'id', $contact_id )->first();
		$this->assertNotNull( $contact, 'Contact ' . $contact_id . ' should exist' );

		$ids = array();
		foreach ( $contact->tags as $tag ) {
			$ids[] = (int) $tag->id;
		}
		return $ids;
	}

	/**
	 * Adding a tag to one contact attaches it.
	 */
	public function test_add_tag_attaches_to_selected_contacts(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$contact_id = $this->make_contact(
			array(
				'email'      => 'bulk-add-tag-' . wp_generate_password( 8, false, false ) . '@example.test',
				'first_name' => 'BulkAdd',
			)
		);
		$tag        = TagModel::getOrCreate( 'e2e-bulk-add-' . wp_generate_password( 6, false, false ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $contact_id ),
				'tag_ids' => array( (int) $tag->id ),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status(), wp_json_encode( $response->get_data() ) );
		$this->assertContains( (int) $tag->id, $this->tag_ids_on( $contact_id ) );
	}

	/**
	 * Add Tag is additive — existing tags are not replaced.
	 */
	public function test_add_tag_does_not_detach_existing_tags(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$contact_id = $this->make_contact(
			array(
				'email' => 'bulk-keep-tag-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);
		$kept     = TagModel::getOrCreate( 'e2e-kept-' . wp_generate_password( 6, false, false ) );
		$added    = TagModel::getOrCreate( 'e2e-added-' . wp_generate_password( 6, false, false ) );

		ContactModel::query()->where( 'id', $contact_id )->first()->add_tags( array( (int) $kept->id ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $contact_id ),
				'tag_ids' => array( (int) $added->id ),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
		$ids = $this->tag_ids_on( $contact_id );
		$this->assertContains( (int) $kept->id, $ids );
		$this->assertContains( (int) $added->id, $ids );
	}

	/**
	 * One request can tag several contacts with the same tag.
	 */
	public function test_add_tag_applies_to_every_selected_contact(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$a       = $this->make_contact(
			array(
				'email' => 'bulk-multi-a-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);
		$b       = $this->make_contact(
			array(
				'email' => 'bulk-multi-b-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);
		$tag     = TagModel::getOrCreate( 'e2e-multi-' . wp_generate_password( 6, false, false ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $a, $b ),
				'tag_ids' => array( (int) $tag->id ),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertContains( (int) $tag->id, $this->tag_ids_on( $a ) );
		$this->assertContains( (int) $tag->id, $this->tag_ids_on( $b ) );
	}

	/**
	 * Re-adding a tag the contact already has is a no-op, not an error.
	 */
	public function test_add_tag_is_idempotent(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$contact_id = $this->make_contact(
			array(
				'email' => 'bulk-idem-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);
		$tag        = TagModel::getOrCreate( 'e2e-idem-' . wp_generate_password( 6, false, false ) );

		ContactModel::query()->where( 'id', $contact_id )->first()->add_tags( array( (int) $tag->id ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $contact_id ),
				'tag_ids' => array( (int) $tag->id ),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( (int) $tag->id ), $this->tag_ids_on( $contact_id ) );
	}

	/**
	 * Empty tag_ids is rejected.
	 */
	public function test_add_tag_without_tag_ids_is_an_error(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$contact_id = $this->make_contact(
			array(
				'email' => 'bulk-empty-tag-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $contact_id ),
				'tag_ids' => array(),
			),
			$user_id
		);

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * A subscriber cannot bulk-add tags.
	 */
	public function test_subscriber_cannot_add_tags(): void {
		$user_id    = $this->make_subscriber_user();
		$contact_id = $this->make_contact(
			array(
				'email' => 'bulk-denied-' . wp_generate_password( 8, false, false ) . '@example.test',
			)
		);
		$tag        = TagModel::getOrCreate( 'e2e-denied-' . wp_generate_password( 6, false, false ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/contacts/add-tag',
			array(
				'ids'     => array( $contact_id ),
				'tag_ids' => array( (int) $tag->id ),
			),
			$user_id
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assertNotContains( (int) $tag->id, $this->tag_ids_on( $contact_id ) );
	}
}
