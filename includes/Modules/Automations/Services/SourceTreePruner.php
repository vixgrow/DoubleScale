<?php
/**
 * Prunes automation trigger/action source trees down to active integrations only.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Services;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * "Pick one integration" categories (Forms, E-commerce, LMS, Membership, Video)
 * declare every vendor DoubleScale supports, each flagged `is_disabled` when
 * that vendor's plugin isn't installed/active. Left as-is, the builder would
 * show a wall of "not installed" tiles for plugins the site will never use.
 * This prunes each such category down to the vendor(s) actually active.
 * Empty categories are kept so the sidebar still lists every top-level source.
 */
final class SourceTreePruner {

	/**
	 * @param array $sources       Trigger/action source tree (category key => category).
	 * @param array $category_keys Category keys to prune; others pass through untouched.
	 *
	 * @return array
	 */
	public static function prune( array $sources, array $category_keys ): array {
		foreach ( $category_keys as $key ) {
			if ( ! isset( $sources[ $key ] ) || ! is_array( $sources[ $key ] ) ) {
				continue;
			}

			$category = $sources[ $key ];

			if ( isset( $category['tabs'] ) && is_array( $category['tabs'] ) ) {
				$category['tabs'] = array_filter(
					$category['tabs'],
					static function ( $tab ) {
						return is_array( $tab ) && empty( $tab['is_disabled'] );
					}
				);

				$sources[ $key ] = $category;
				continue;
			}

			if ( isset( $category['groups'] ) && is_array( $category['groups'] ) ) {
				$category['groups'] = array_filter(
					$category['groups'],
					static function ( $group ) {
						return is_array( $group ) && empty( $group['is_disabled'] );
					}
				);

				$sources[ $key ] = $category;
			}
		}

		return $sources;
	}
}
