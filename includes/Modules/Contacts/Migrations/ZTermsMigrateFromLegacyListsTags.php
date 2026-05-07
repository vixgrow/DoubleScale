<?php
/**
 * Migrates rows from doublescale_lists and doublescale_tags into doublescale_terms,
 * then remaps doublescale_contact_taxonomy_relationship.taxonomy_id to the new term IDs.
 *
 * Must run after TermsTable and TaxonomyMigrateLegacyContactRelationships (pivot still uses legacy IDs until this runs).
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\Migrations;

defined( 'ABSPATH' ) || exit;

/**
 * ZTermsMigrateFromLegacyListsTags class
 */
class ZTermsMigrateFromLegacyListsTags {

	/**
	 * Copy legacy taxonomy rows into terms and fix polymorphic pivot FKs.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run() {
		global $wpdb;

		$terms   = $wpdb->prefix . 'doublescale_terms';
		$lists   = $wpdb->prefix . 'doublescale_lists';
		$tags    = $wpdb->prefix . 'doublescale_tags';
		$pivot   = $wpdb->prefix . 'doublescale_contact_taxonomy_relationship';

		if ( ! $this->table_exists( $terms ) ) {
			return;
		}

		if ( $this->table_exists( $lists ) ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"INSERT IGNORE INTO {$terms} (type, name, slug, description, status, created_at, updated_at)
				SELECT 'list', name, slug, description, status, created_at, updated_at FROM {$lists}"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}

		if ( $this->table_exists( $tags ) ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"INSERT IGNORE INTO {$terms} (type, name, slug, description, status, created_at, updated_at)
				SELECT 'tag', name, slug, description, status, created_at, updated_at FROM {$tags}"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}

		if ( ! $this->table_exists( $pivot ) ) {
			return;
		}

		if ( $this->table_exists( $lists ) ) {
			// Remap list FKs: pivot.taxonomy_id still points at legacy lists.id → terms.id (matched by slug).
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"UPDATE {$pivot} ctr
				INNER JOIN {$lists} l ON ctr.taxonomy_type = 'list' AND ctr.taxonomy_id = l.id
				INNER JOIN {$terms} t ON t.type = 'list' AND t.slug = l.slug
				SET ctr.taxonomy_id = t.id
				WHERE ctr.taxonomy_type = 'list'"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}

		if ( $this->table_exists( $tags ) ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query(
				"UPDATE {$pivot} ctr
				INNER JOIN {$tags} tg ON ctr.taxonomy_type = 'tag' AND ctr.taxonomy_id = tg.id
				INNER JOIN {$terms} t ON t.type = 'tag' AND t.slug = tg.slug
				SET ctr.taxonomy_id = t.id
				WHERE ctr.taxonomy_type = 'tag'"
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
