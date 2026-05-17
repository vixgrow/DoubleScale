<?php
/**
 * Insert contact rows directly into wp_doublescale_contacts.
 *
 * @package DoubleScale\Tests\Integration\Factories
 */

namespace DoubleScale\Tests\Integration\Factories;

/**
 * @see /includes/Modules/Contacts/Migrations/ContactsTable.php
 */
final class ContactFactory {

	/**
	 * @param array<string, mixed> $overrides
	 * @return int Inserted contact ID.
	 */
	public static function create( array $overrides = array() ) {
		global $wpdb;

		$defaults = array(
			'hash_id'         => wp_generate_password( 32, false, false ),
			'email'           => 'contact-' . wp_generate_password( 8, false ) . '@example.test',
			'first_name'      => 'Test',
			'last_name'       => 'Contact',
			'email_status'    => 'subscribed',
			'sms_status'      => 'subscribed',
			'whatsapp_status' => 'subscribed',
			'created_at'      => current_time( 'mysql', true ),
			'updated_at'      => current_time( 'mysql', true ),
		);

		$data = array_merge( $defaults, $overrides );

		$wpdb->insert( $wpdb->prefix . 'doublescale_contacts', $data );

		return (int) $wpdb->insert_id;
	}

	/**
	 * @param int                  $count
	 * @param array<string, mixed> $overrides Applied to every row.
	 * @return int[]
	 */
	public static function create_many( $count, array $overrides = array() ) {
		$ids = array();
		for ( $i = 0; $i < (int) $count; $i++ ) {
			$ids[] = self::create( $overrides );
		}
		return $ids;
	}
}
