<?php
/**
 * Copies legacy list/tag pivot rows into the unified polymorphic pivot table.
 *
 * Runs once after ContactTaxonomyRelationshipTable (alphabetically after TagsTable).
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\Migrations;

defined( 'ABSPATH' ) || exit;

/**
 * TaxonomyMigrateLegacyContactRelationships class
 */
class TaxonomyMigrateLegacyContactRelationships {

	/**
	 * Migrate rows from contact_list_relationship and contact_tag_relationship.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run() {
		global $wpdb;

		$new         = $wpdb->prefix . 'doublescale_contact_taxonomy_relationship';
		$legacy_list = $wpdb->prefix . 'doublescale_contact_list_relationship';
		$legacy_tag  = $wpdb->prefix . 'doublescale_contact_tag_relationship';

		$list_exists = $this->table_exists( $legacy_list );
		$tag_exists  = $this->table_exists( $legacy_tag );

		if ( $list_exists ) {
			// INSERT IGNORE: idempotent merge from legacy pivots (unique contact_id + taxonomy_type + taxonomy_id).
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"INSERT IGNORE INTO {$new} (contact_id, taxonomy_type, taxonomy_id, created_at, updated_at)
				SELECT contact_id, 'list', list_id, created_at, updated_at FROM {$legacy_list}"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}

		if ( $tag_exists ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"INSERT IGNORE INTO {$new} (contact_id, taxonomy_type, taxonomy_id, created_at, updated_at)
				SELECT contact_id, 'tag', tag_id, created_at, updated_at FROM {$legacy_tag}"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}
	}

	/**
	 * @param string $table Full prefixed table name.
	 */
	private function table_exists( $table ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$found = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );

		return $found === $table;
	}
}
