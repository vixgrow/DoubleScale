<?php
/**
 * Group repository — taxonomy-term layer for `doublescale_kb_group`.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Repositories;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Services\Visibility;
use WP_Term;

/**
 * GroupRepository class.
 */
class GroupRepository {

	/**
	 * List groups, ordered by the stored order meta then name.
	 *
	 * @param bool $hide_empty Whether to drop groups with no articles.
	 * @return array<int, WP_Term>
	 */
	public function all( bool $hide_empty = false ): array {
		$terms = get_terms(
			array(
				'taxonomy'   => KnowledgebasePostType::TAXONOMY_GROUP,
				'hide_empty' => $hide_empty,
			)
		);

		if ( is_wp_error( $terms ) ) {
			return array();
		}

		usort(
			$terms,
			static function ( WP_Term $a, WP_Term $b ): int {
				$oa = (int) get_term_meta( $a->term_id, KnowledgebasePostType::TERM_META_ORDER, true );
				$ob = (int) get_term_meta( $b->term_id, KnowledgebasePostType::TERM_META_ORDER, true );
				if ( $oa === $ob ) {
					return strcasecmp( $a->name, $b->name );
				}
				return $oa <=> $ob;
			}
		);

		return $terms;
	}

	/**
	 * Find a group term by ID.
	 *
	 * @param int $term_id Term ID.
	 * @return WP_Term|null
	 */
	public function find( int $term_id ): ?WP_Term {
		$term = get_term( $term_id, KnowledgebasePostType::TAXONOMY_GROUP );

		return $term instanceof WP_Term ? $term : null;
	}

	/**
	 * Create a group term.
	 *
	 * @param string $name   Group name.
	 * @param int    $parent Parent term ID (0 = top level).
	 * @return int|\WP_Error New term ID.
	 */
	public function create( string $name, int $parent = 0 ) {
		$result = wp_insert_term(
			$name,
			KnowledgebasePostType::TAXONOMY_GROUP,
			array( 'parent' => $parent )
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return (int) $result['term_id'];
	}

	/**
	 * Update a group term's name/parent.
	 *
	 * @param int                  $term_id Term ID.
	 * @param array<string, mixed> $args    name / parent.
	 * @return int|\WP_Error
	 */
	public function update( int $term_id, array $args ) {
		$result = wp_update_term( $term_id, KnowledgebasePostType::TAXONOMY_GROUP, $args );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return (int) $result['term_id'];
	}

	/**
	 * Delete a group term.
	 *
	 * @param int $term_id Term ID.
	 * @return bool
	 */
	public function delete( int $term_id ): bool {
		$result = wp_delete_term( $term_id, KnowledgebasePostType::TAXONOMY_GROUP );

		return true === $result;
	}

	/**
	 * How many articles are filed under a group.
	 *
	 * @param int $term_id Term ID.
	 * @return int
	 */
	public function article_count( int $term_id ): int {
		$term = $this->find( $term_id );

		return $term ? (int) $term->count : 0;
	}

	/**
	 * Persist a group's display meta (colour / order / visibility).
	 *
	 * @param int                  $term_id Term ID.
	 * @param array<string, mixed> $meta    color / order / visibility.
	 * @return void
	 */
	public function save_meta( int $term_id, array $meta ): void {
		if ( array_key_exists( 'color', $meta ) ) {
			update_term_meta( $term_id, KnowledgebasePostType::TERM_META_COLOR, sanitize_hex_color( (string) $meta['color'] ) );
		}
		if ( array_key_exists( 'order', $meta ) ) {
			update_term_meta( $term_id, KnowledgebasePostType::TERM_META_ORDER, (int) $meta['order'] );
		}
		if ( array_key_exists( 'visibility', $meta ) ) {
			update_term_meta(
				$term_id,
				KnowledgebasePostType::TERM_META_VISIBILITY,
				Visibility::normalize( (string) $meta['visibility'] )
			);
		}
	}

	/**
	 * Shape a group term for a REST payload.
	 *
	 * @param WP_Term $term Group term.
	 * @return array<string, mixed>
	 */
	public function to_payload( WP_Term $term ): array {
		return array(
			'id'          => (int) $term->term_id,
			'name'        => $term->name,
			'slug'        => $term->slug,
			'parent'      => (int) $term->parent,
			'count'       => (int) $term->count,
			'description' => $term->description,
			'color'       => (string) get_term_meta( $term->term_id, KnowledgebasePostType::TERM_META_COLOR, true ),
			'order'       => (int) get_term_meta( $term->term_id, KnowledgebasePostType::TERM_META_ORDER, true ),
			'visibility'  => Visibility::normalize( (string) get_term_meta( $term->term_id, KnowledgebasePostType::TERM_META_VISIBILITY, true ) ),
		);
	}
}
