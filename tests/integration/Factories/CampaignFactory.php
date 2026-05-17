<?php
/**
 * Insert campaign rows directly into wp_doublescale_campaigns.
 *
 * @package DoubleScale\Tests\Integration\Factories
 */

namespace DoubleScale\Tests\Integration\Factories;

/**
 * @see /includes/Modules/Campaigns/Migrations/CampaignsTable.php
 */
final class CampaignFactory {

	/**
	 * @param array<string, mixed> $overrides
	 * @return int Inserted campaign ID.
	 */
	public static function create( array $overrides = array() ) {
		global $wpdb;

		$defaults = array(
			'name'       => 'Test Campaign ' . wp_generate_password( 6, false ),
			'status'     => 'inactive',
			'type'       => 1,
			'parent_id'  => 0,
			'count'      => 0,
			'created_at' => current_time( 'mysql', true ),
			'updated_at' => current_time( 'mysql', true ),
		);

		$data = array_merge( $defaults, $overrides );

		$wpdb->insert( $wpdb->prefix . 'doublescale_campaigns', $data );

		return (int) $wpdb->insert_id;
	}
}
