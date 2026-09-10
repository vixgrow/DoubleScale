<?php
/**
 * Tags and lists on a contact are returned A–Z by name, not attach order.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\ListModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactTermSortTest extends IntegrationTestCase {

	/**
	 * @param iterable $terms Tag or list models.
	 * @return string[]
	 */
	private function names_of( $terms ) {
		$names = array();
		foreach ( $terms as $term ) {
			$names[] = (string) $term->name;
		}
		return $names;
	}

	public function test_contact_tags_and_lists_load_alphabetically(): void {
		$user_id    = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$suffix     = wp_generate_password( 8, false, false );
		$contact_id = $this->make_contact(
			array(
				'email'      => 'term-sort-' . $suffix . '@example.test',
				'first_name' => 'TermSort',
			)
		);

		$zebra_tag  = TagModel::getOrCreate( 'Zebra ' . $suffix );
		$mango_tag  = TagModel::getOrCreate( 'Mango ' . $suffix );
		$alpha_tag  = TagModel::getOrCreate( 'Alpha ' . $suffix );
		$zebra_list = ListModel::getOrCreate( 'Zebra List ' . $suffix );
		$mango_list = ListModel::getOrCreate( 'Mango List ' . $suffix );
		$alpha_list = ListModel::getOrCreate( 'Alpha List ' . $suffix );

		$contact = ContactModel::query()->where( 'id', $contact_id )->first();
		$contact->add_tags( array( (int) $zebra_tag->id, (int) $mango_tag->id, (int) $alpha_tag->id ) );
		$contact->add_lists( array( (int) $zebra_list->id, (int) $mango_list->id, (int) $alpha_list->id ) );

		$loaded = ContactModel::query()->with( array( 'tags', 'lists' ) )->where( 'id', $contact_id )->first();
		$this->assertSame(
			array( 'Alpha ' . $suffix, 'Mango ' . $suffix, 'Zebra ' . $suffix ),
			$this->names_of( $loaded->tags )
		);
		$this->assertSame(
			array( 'Alpha List ' . $suffix, 'Mango List ' . $suffix, 'Zebra List ' . $suffix ),
			$this->names_of( $loaded->lists )
		);

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/contacts/' . $contact_id,
			array(),
			$user_id
		);
		$this->assertSame( 200, $response->get_status(), wp_json_encode( $response->get_data() ) );

		$data = $response->get_data();
		if ( is_object( $data ) ) {
			$data = json_decode( wp_json_encode( $data ), true );
		}

		$this->assertIsArray( $data['tags'] );
		$rest_tag_names = array();
		foreach ( $data['tags'] as $tag ) {
			$rest_tag_names[] = (string) $tag['name'];
		}
		$this->assertSame(
			array( 'Alpha ' . $suffix, 'Mango ' . $suffix, 'Zebra ' . $suffix ),
			$rest_tag_names
		);

		$rest_list_names = array();
		foreach ( $data['lists'] as $list ) {
			$rest_list_names[] = (string) $list['name'];
		}
		$this->assertSame(
			array( 'Alpha List ' . $suffix, 'Mango List ' . $suffix, 'Zebra List ' . $suffix ),
			$rest_list_names
		);
	}
}
