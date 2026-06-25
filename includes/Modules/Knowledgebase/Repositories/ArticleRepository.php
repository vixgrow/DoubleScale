<?php
/**
 * Article repository — the "model" layer over `wp_posts` for the KB.
 *
 * Wraps WP_Query / wp_insert_post / wp_update_post so the REST controllers and
 * services stay free of direct WordPress post plumbing (and remain testable).
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Repositories;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use WP_Post;
use WP_Query;

/**
 * ArticleRepository class.
 */
class ArticleRepository {

	/**
	 * Run a WP_Query against the KB post type.
	 *
	 * @param array<string, mixed> $args Query overrides.
	 * @return WP_Query
	 */
	public function query( array $args = array() ): WP_Query {
		$defaults = array(
			'post_type'      => KnowledgebasePostType::POST_TYPE,
			'post_status'    => array( 'publish', 'draft', 'private' ),
			'posts_per_page' => 20,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'no_found_rows'  => false,
		);

		return new WP_Query( array_merge( $defaults, $args ) );
	}

	/**
	 * Find a single article by ID.
	 *
	 * @param int $id Post ID.
	 * @return WP_Post|null
	 */
	public function find( int $id ): ?WP_Post {
		$post = get_post( $id );
		if ( ! $post instanceof WP_Post || KnowledgebasePostType::POST_TYPE !== $post->post_type ) {
			return null;
		}

		return $post;
	}

	/**
	 * Find a published article by slug.
	 *
	 * @param string             $slug    Post slug.
	 * @param array<int, string> $statuses Allowed statuses.
	 * @return WP_Post|null
	 */
	public function find_by_slug( string $slug, array $statuses = array( 'publish' ) ): ?WP_Post {
		$query = $this->query(
			array(
				'name'           => sanitize_title( $slug ),
				'post_status'    => $statuses,
				'posts_per_page' => 1,
				'no_found_rows'  => true,
			)
		);

		$posts = $query->posts;

		return ! empty( $posts ) ? $posts[0] : null;
	}

	/**
	 * Insert a new article.
	 *
	 * @param array<string, mixed> $data post_title / post_content / post_excerpt / post_status / menu_order.
	 * @return int|\WP_Error New post ID.
	 */
	public function insert( array $data ) {
		$data['post_type'] = KnowledgebasePostType::POST_TYPE;

		return wp_insert_post( $data, true );
	}

	/**
	 * Update an existing article.
	 *
	 * @param int                  $id   Post ID.
	 * @param array<string, mixed> $data Fields to update.
	 * @return int|\WP_Error
	 */
	public function update( int $id, array $data ) {
		$data['ID']        = $id;
		$data['post_type'] = KnowledgebasePostType::POST_TYPE;

		return wp_update_post( $data, true );
	}

	/**
	 * Permanently delete an article (skips trash).
	 *
	 * @param int $id Post ID.
	 * @return bool
	 */
	public function delete( int $id ): bool {
		return (bool) wp_delete_post( $id, true );
	}

	/**
	 * Assign group + tag terms to an article.
	 *
	 * @param int                $id    Post ID.
	 * @param array<int, int>    $group_ids Group term IDs.
	 * @param array<int, string> $tags  Tag names/slugs.
	 * @return void
	 */
	public function set_terms( int $id, array $group_ids, array $tags ): void {
		wp_set_object_terms( $id, array_map( 'intval', $group_ids ), KnowledgebasePostType::TAXONOMY_GROUP, false );
		wp_set_object_terms( $id, array_map( 'sanitize_text_field', $tags ), KnowledgebasePostType::TAXONOMY_TAG, false );
	}

	/**
	 * Set the menu_order for an article (Kanban / list reorder).
	 *
	 * @param int $id    Post ID.
	 * @param int $order New menu_order.
	 * @return void
	 */
	public function set_order( int $id, int $order ): void {
		wp_update_post(
			array(
				'ID'         => $id,
				'menu_order' => $order,
			)
		);
	}
}
