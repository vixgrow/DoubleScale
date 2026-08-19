<?php
/**
 * Integration tests for tag and list membership abilities.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Abilities\ContactAbilities;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactMembershipAbilitiesTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		$settings = (array) get_option( 'doublescale_settings', array() );
		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array( UserRoles::ADMINISTRATOR, UserRoles::SALES_REP, UserRoles::SALES_MANAGER ),
				),
			)
		);
		update_option( 'doublescale_settings', $settings );

		wp_set_current_user( self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) ) );
	}

	public function test_add_and_remove_tags_on_one_contact(): void {
		$contact_id = $this->make_contact();
		$tag        = TagModel::getOrCreate( 'mcp-vip-' . wp_generate_password( 6, false, false ) );

		$added = ContactAbilities::add_contact_tags(
			array(
				'contact_id' => $contact_id,
				'tag_ids'    => array( (int) $tag->id ),
			)
		);

		$this->assertIsArray( $added, is_wp_error( $added ) ? $added->get_error_message() : '' );
		$this->assertSame( 1, $added['updated'] );
		$this->assertContains( $contact_id, $added['applied_contact_ids'] );

		$contact = ContactModel::query()->with( 'tags' )->where( 'id', $contact_id )->first();
		$ids     = array();
		foreach ( $contact->tags as $term ) {
			$ids[] = (int) $term->id;
		}
		$this->assertContains( (int) $tag->id, $ids );

		$removed = ContactAbilities::remove_contact_tags(
			array(
				'contact_id' => $contact_id,
				'tag_ids'    => array( (int) $tag->id ),
			)
		);

		$this->assertIsArray( $removed );
		$this->assertSame( 1, $removed['updated'] );

		$contact = ContactModel::query()->with( 'tags' )->where( 'id', $contact_id )->first();
		$ids     = array();
		foreach ( $contact->tags as $term ) {
			$ids[] = (int) $term->id;
		}
		$this->assertNotContains( (int) $tag->id, $ids );
	}

	public function test_dry_run_does_not_attach_tags(): void {
		$contact_id = $this->make_contact();
		$tag        = TagModel::getOrCreate( 'mcp-dry-' . wp_generate_password( 6, false, false ) );

		$result = ContactAbilities::add_contact_tags(
			array(
				'contact_id' => $contact_id,
				'tag_ids'    => array( (int) $tag->id ),
				'dry_run'    => true,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 0, $result['updated'] );
		$this->assertSame( array(), $result['applied_contact_ids'] );

		$contact = ContactModel::query()->with( 'tags' )->where( 'id', $contact_id )->first();
		$ids     = array();
		foreach ( $contact->tags as $term ) {
			$ids[] = (int) $term->id;
		}
		$this->assertNotContains( (int) $tag->id, $ids );
	}

	public function test_combining_contact_id_and_filter_is_refused(): void {
		$result = ContactAbilities::add_contact_tags(
			array(
				'contact_id' => 1,
				'filter'     => array( 'status' => 'subscribed' ),
				'tag_ids'    => array( 1 ),
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_invalid_target', $result->get_error_code() );
	}

	public function test_unknown_tag_id_is_refused(): void {
		$result = ContactAbilities::add_contact_tags(
			array(
				'contact_id' => $this->make_contact(),
				'tag_ids'    => array( 99999999 ),
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_unknown_ids', $result->get_error_code() );
	}
}
