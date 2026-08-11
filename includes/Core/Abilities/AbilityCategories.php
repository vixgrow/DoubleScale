<?php
/**
 * Ability category catalog and registration.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core\Abilities;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the DoubleScale ability categories.
 *
 * Must run on wp_abilities_api_categories_init, which WP core fires before
 * wp_abilities_api_init. An ability naming an unregistered category does not
 * throw — WP_Abilities_Registry::register() returns null, so the ability
 * silently vanishes. Ordering is therefore mandatory, not merely tidy.
 */
final class AbilityCategories {

	public const CORE     = 'doublescale-core';
	public const CONTACTS = 'doublescale-contacts';
	public const SALES    = 'doublescale-sales';
	public const SUPPORT  = 'doublescale-support';

	/**
	 * Module slug => category slug.
	 *
	 * Sales documents (invoices, proposals) live in the `documents` module but
	 * belong in the user-facing Sales category.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, string>
	 */
	public static function module_category_map(): array {
		return array(
			'core'      => self::CORE,
			'contacts'  => self::CONTACTS,
			'documents' => self::SALES,
			'support'   => self::SUPPORT,
		);
	}

	/**
	 * Category slug for a module, falling back to the core category.
	 *
	 * @since 1.0.0
	 *
	 * @param string $module_slug Module slug.
	 * @return string
	 */
	public static function slug_for_module( string $module_slug ): string {
		$map = self::module_category_map();
		return $map[ $module_slug ] ?? self::CORE;
	}

	/**
	 * Catalog of registered categories.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, array{label: string, description: string}>
	 */
	public static function catalog(): array {
		return array(
			self::CORE     => array(
				'label'       => __( 'DoubleScale: Core', 'doublescale' ),
				'description' => __( 'Identity, active modules, and site context.', 'doublescale' ),
			),
			self::CONTACTS => array(
				'label'       => __( 'DoubleScale: Contacts', 'doublescale' ),
				'description' => __( 'CRM contacts, tags, lists, and activity timelines.', 'doublescale' ),
			),
			self::SALES    => array(
				'label'       => __( 'DoubleScale: Sales', 'doublescale' ),
				'description' => __( 'Invoices, proposals, and sales summaries.', 'doublescale' ),
			),
			self::SUPPORT  => array(
				'label'       => __( 'DoubleScale: Support', 'doublescale' ),
				'description' => __( 'Support tickets, threads, and workload summaries.', 'doublescale' ),
			),
		);
	}

	/**
	 * Register every category unconditionally.
	 *
	 * Registering a category whose module is disabled is harmless and costs
	 * nothing; registering an ability whose category is missing loses the
	 * ability silently. Unconditional is strictly safer, and it keeps a
	 * runtime module toggle from ever hitting a missing category.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		foreach ( self::catalog() as $slug => $spec ) {
			wp_register_ability_category(
				$slug,
				array(
					'label'       => $spec['label'],
					'description' => $spec['description'],
				)
			);
		}
	}
}
