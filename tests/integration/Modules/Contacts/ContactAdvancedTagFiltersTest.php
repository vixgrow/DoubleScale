<?php
/**
 * Contacts list Advanced Filters — GET /doublescale/v1/contacts?filters=…
 *
 * The Advanced Filters dialog posts RulesBuilder groups (OR of AND rows).
 * Filtering by Tags / Has must return only contacts that carry that tag.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactAdvancedTagFiltersTest extends IntegrationTestCase {

	/**
	 * @param \WP_REST_Response $response REST response.
	 * @return array<int, array<string, mixed>>
	 */
	private function contact_rows( $response ) {
		$data = $response->get_data();
		$this->assertIsArray( $data, 'Contacts list envelope must be an array' );
		$this->assertArrayHasKey( 'data', $data, 'Paginator payload uses a data key' );
		$this->assertIsArray( $data['data'] );
		return $data['data'];
	}

	/**
	 * @param array<int, array<string, mixed>> $rows Contact rows.
	 * @return int[]
	 */
	private function ids_of( array $rows ) {
		$ids = array();
		foreach ( $rows as $row ) {
			$ids[] = (int) $row['id'];
		}
		return $ids;
	}

	/**
	 * Tags / Has returns the tagged contact and not the untagged sibling.
	 */
	public function test_tag_contains_filter_returns_only_tagged_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$stamp   = wp_generate_password( 8, false, false );
		$tagged  = $this->make_contact(
			array(
				'email'      => 'adv-tagged-' . $stamp . '@example.test',
				'last_name'  => 'AdvFilter' . $stamp,
				'first_name' => 'Tagged',
			)
		);
		$plain   = $this->make_contact(
			array(
				'email'      => 'adv-plain-' . $stamp . '@example.test',
				'last_name'  => 'AdvFilter' . $stamp,
				'first_name' => 'Plain',
			)
		);
		$tag     = TagModel::getOrCreate( 'e2e-adv-has-' . $stamp );

		ContactModel::query()->where( 'id', $tagged )->first()->add_tags( array( (int) $tag->id ) );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/contacts',
			array(
				'per_page' => 50,
				'keywords' => 'AdvFilter' . $stamp,
				'filters'  => array(
					array(
						array(
							'rule'          => 'tags_segment',
							'operator'      => 'contains',
							'value'         => array( (string) $tag->id ),
							'selectedGroup' => 'segments',
						),
					),
				),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status(), wp_json_encode( $response->get_data() ) );
		$rows = $this->contact_rows( $response );
		$this->assertNotEmpty( $rows, 'Tag filter must not return an empty collection when a match exists' );
		$ids = $this->ids_of( $rows );
		$this->assertContains( $tagged, $ids );
		$this->assertNotContains( $plain, $ids );
	}

	/**
	 * Tags / Is empty returns contacts with no tags.
	 */
	public function test_tag_is_empty_filter_excludes_tagged_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$stamp   = wp_generate_password( 8, false, false );
		$tagged  = $this->make_contact(
			array(
				'email'      => 'adv-empty-t-' . $stamp . '@example.test',
				'last_name'  => 'AdvEmpty' . $stamp,
				'first_name' => 'Tagged',
			)
		);
		$plain   = $this->make_contact(
			array(
				'email'      => 'adv-empty-p-' . $stamp . '@example.test',
				'last_name'  => 'AdvEmpty' . $stamp,
				'first_name' => 'Plain',
			)
		);
		$tag     = TagModel::getOrCreate( 'e2e-adv-empty-' . $stamp );

		ContactModel::query()->where( 'id', $tagged )->first()->add_tags( array( (int) $tag->id ) );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/contacts',
			array(
				'per_page' => 50,
				'keywords' => 'AdvEmpty' . $stamp,
				'filters'  => array(
					array(
						array(
							'rule'          => 'tags_segment',
							'operator'      => 'is_empty',
							'value'         => array(),
							'selectedGroup' => 'segments',
						),
					),
				),
			),
			$user_id
		);

		$this->assertSame( 200, $response->get_status() );
		$rows = $this->contact_rows( $response );
		$this->assertNotEmpty( $rows, 'Is-empty tag filter must return the untagged contact' );
		$ids = $this->ids_of( $rows );
		$this->assertContains( $plain, $ids );
		$this->assertNotContains( $tagged, $ids );
	}
}
