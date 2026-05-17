<?php
/**
 * Insert automation rows directly into wp_doublescale_automations.
 *
 * @package DoubleScale\Tests\Integration\Factories
 */

namespace DoubleScale\Tests\Integration\Factories;

/**
 * @see /includes/Modules/Automations/Migrations/AutomationsTable.php
 */
final class AutomationFactory {

	/**
	 * @param array<string, mixed> $overrides
	 * @return int Inserted automation ID.
	 */
	public static function create( array $overrides = array() ) {
		global $wpdb;

		$defaults = array(
			'name'       => 'Test Automation ' . wp_generate_password( 6, false ),
			'trigger'    => 'contact_created',
			'status'     => 'draft',
			'created_at' => current_time( 'mysql', true ),
			'updated_at' => current_time( 'mysql', true ),
		);

		$data = array_merge( $defaults, $overrides );

		$wpdb->insert( $wpdb->prefix . 'doublescale_automations', $data );

		return (int) $wpdb->insert_id;
	}
}
