<?php
/**
 * Single visibility resolver for the Knowledge Base.
 *
 * Three vocabularies describe "who can see this": the post status
 * (`draft`/`publish`/`private`), the per-article members-only flag, and the
 * per-group visibility (`public`/`members`/`internal`, cascading to
 * descendants). Effective visibility is the MOST RESTRICTIVE of the article's
 * status/flag, its group, and the group's ancestors.
 *
 * Implemented once and called from every gate — the public REST listing, the
 * `pre_get_posts` archive filter, the `template_redirect` single-article guard,
 * and the shortcode — so the four surfaces can never disagree.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use WP_Post;

/**
 * Visibility class.
 */
final class Visibility {

	public const PUBLIC   = 'public';
	public const MEMBERS  = 'members';
	public const INTERNAL = 'internal';

	/**
	 * Numeric rank — higher is more restrictive.
	 *
	 * @param string $level Visibility level.
	 * @return int
	 */
	public static function rank( string $level ): int {
		switch ( $level ) {
			case self::INTERNAL:
				return 2;
			case self::MEMBERS:
				return 1;
			default:
				return 0;
		}
	}

	/**
	 * The more restrictive of two levels.
	 *
	 * @param string $a First level.
	 * @param string $b Second level.
	 * @return string
	 */
	public static function most_restrictive( string $a, string $b ): string {
		return self::rank( $a ) >= self::rank( $b ) ? $a : $b;
	}

	/**
	 * Effective visibility for an article: `public` | `members` | `internal`.
	 *
	 * @param WP_Post $post Article post object.
	 * @return string
	 */
	public static function effective_visibility( WP_Post $post ): string {
		// A non-published article is staff-only regardless of group/flag.
		if ( 'publish' !== $post->post_status ) {
			return self::INTERNAL;
		}

		$level = self::PUBLIC;

		if ( self::is_members_only( $post->ID ) ) {
			$level = self::most_restrictive( $level, self::MEMBERS );
		}

		foreach ( self::group_terms_for_post( $post->ID ) as $term_id ) {
			$level = self::most_restrictive( $level, self::group_effective_visibility( $term_id ) );
		}

		return $level;
	}

	/**
	 * Whether a published article carries the members-only flag.
	 *
	 * @param int $post_id Article ID.
	 * @return bool
	 */
	public static function is_members_only( int $post_id ): bool {
		return (bool) get_post_meta( $post_id, KnowledgebasePostType::META_MEMBERS_ONLY, true );
	}

	/**
	 * Effective visibility for a single group term, folding in ancestors
	 * (the most restrictive ancestor wins — a `members`/`internal` parent
	 * cascades to its children).
	 *
	 * @param int $term_id Group term ID.
	 * @return string
	 */
	public static function group_effective_visibility( int $term_id ): string {
		$level     = self::group_own_visibility( $term_id );
		$ancestors = get_ancestors( $term_id, KnowledgebasePostType::TAXONOMY_GROUP, 'taxonomy' );

		foreach ( (array) $ancestors as $ancestor_id ) {
			$level = self::most_restrictive( $level, self::group_own_visibility( (int) $ancestor_id ) );
		}

		return $level;
	}

	/**
	 * A group term's own visibility meta (no ancestor folding).
	 *
	 * @param int $term_id Group term ID.
	 * @return string
	 */
	private static function group_own_visibility( int $term_id ): string {
		$raw = (string) get_term_meta( $term_id, KnowledgebasePostType::TERM_META_VISIBILITY, true );

		return self::normalize( $raw );
	}

	/**
	 * Normalise an arbitrary visibility string to a known level (default public).
	 *
	 * @param string $raw Raw value.
	 * @return string
	 */
	public static function normalize( string $raw ): string {
		$raw = strtolower( trim( $raw ) );

		return in_array( $raw, array( self::PUBLIC, self::MEMBERS, self::INTERNAL ), true ) ? $raw : self::PUBLIC;
	}

	/**
	 * Group term IDs assigned to a post.
	 *
	 * @param int $post_id Article ID.
	 * @return array<int, int>
	 */
	public static function group_terms_for_post( int $post_id ): array {
		$terms = wp_get_post_terms( $post_id, KnowledgebasePostType::TAXONOMY_GROUP, array( 'fields' => 'ids' ) );
		if ( is_wp_error( $terms ) ) {
			return array();
		}

		return array_map( 'intval', $terms );
	}

	/**
	 * Group term IDs whose effective visibility is AT LEAST `$min_level`
	 * (used to `tax_query`-exclude restricted groups for ineligible viewers).
	 *
	 * @param string $min_level Minimum restriction (`members` | `internal`).
	 * @return array<int, int>
	 */
	public static function restricted_group_term_ids( string $min_level ): array {
		$min      = self::rank( $min_level );
		$ids      = array();
		$term_ids = get_terms(
			array(
				'taxonomy'   => KnowledgebasePostType::TAXONOMY_GROUP,
				'hide_empty' => false,
				'fields'     => 'ids',
			)
		);

		if ( is_wp_error( $term_ids ) ) {
			return array();
		}

		foreach ( $term_ids as $term_id ) {
			if ( self::rank( self::group_effective_visibility( (int) $term_id ) ) >= $min ) {
				$ids[] = (int) $term_id;
			}
		}

		return $ids;
	}

	/**
	 * The visibility level the current request's viewer is cleared to see.
	 *
	 * - Staff (holds the KB read-private cap) → `internal`.
	 * - Logged-in non-staff → `members`.
	 * - Guests → `public`.
	 *
	 * @return string
	 */
	public static function viewer_clearance(): string {
		if ( current_user_can( 'read_private_doublescale_kbs' ) ) {
			return self::INTERNAL;
		}

		if ( is_user_logged_in() ) {
			return self::MEMBERS;
		}

		return self::PUBLIC;
	}

	/**
	 * Whether the current viewer may see an article at `$article_level`.
	 *
	 * @param string $article_level Effective article visibility.
	 * @return bool
	 */
	public static function viewer_can_see( string $article_level ): bool {
		return self::rank( self::viewer_clearance() ) >= self::rank( $article_level );
	}
}
