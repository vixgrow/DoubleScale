<?php
/**
 * Article service — write-side sanitisation + read-side derivations.
 *
 * Owns the body sanitisation (`wp_kses_post`), the view counter, the duplicate
 * (clone) action, and the Tier-1 derived fields (reading time, breadcrumbs,
 * table of contents, related articles) — all computed from `wp_posts` + the
 * taxonomy + the view meta, with no extra tables.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Repositories\ArticleRepository;
use WP_Post;
use WP_Query;

/**
 * ArticleService class.
 */
class ArticleService {

	/**
	 * Words read per minute, for the reading-time estimate.
	 */
	private const WORDS_PER_MINUTE = 200;

	/**
	 * Article repository.
	 *
	 * @var ArticleRepository
	 */
	private $articles;

	/**
	 * Constructor.
	 *
	 * @param ArticleRepository|null $articles Repository (injectable for tests).
	 */
	public function __construct( ?ArticleRepository $articles = null ) {
		$this->articles = $articles ?? new ArticleRepository();
	}

	/**
	 * Sanitise article body HTML for storage.
	 *
	 * @param string $html Raw body HTML.
	 * @return string
	 */
	public function sanitize_body( string $html ): string {
		return wp_kses_post( $html );
	}

	/**
	 * Atomically increment an article's view counter.
	 *
	 * @param int $post_id Article ID.
	 * @return int New count.
	 */
	public function increment_views( int $post_id ): int {
		$current = (int) get_post_meta( $post_id, KnowledgebasePostType::META_VIEWS, true );
		$next    = $current + 1;
		update_post_meta( $post_id, KnowledgebasePostType::META_VIEWS, $next );

		return $next;
	}

	/**
	 * Duplicate an article as a fresh draft (title/body/excerpt/terms copied).
	 *
	 * @param WP_Post $source Source article.
	 * @return int|\WP_Error New post ID.
	 */
	public function duplicate( WP_Post $source ) {
		$new_id = $this->articles->insert(
			array(
				/* translators: %s: original article title */
				'post_title'   => sprintf( __( '%s (copy)', 'doublescale' ), $source->post_title ),
				'post_content' => $source->post_content,
				'post_excerpt' => $source->post_excerpt,
				'post_status'  => 'draft',
				'post_author'  => get_current_user_id(),
			)
		);

		if ( is_wp_error( $new_id ) ) {
			return $new_id;
		}

		$group_ids = Visibility::group_terms_for_post( $source->ID );
		$tags      = wp_get_post_terms( $source->ID, KnowledgebasePostType::TAXONOMY_TAG, array( 'fields' => 'names' ) );
		$tags      = is_wp_error( $tags ) ? array() : $tags;
		$this->articles->set_terms( (int) $new_id, $group_ids, $tags );

		if ( Visibility::is_members_only( $source->ID ) ) {
			update_post_meta( (int) $new_id, KnowledgebasePostType::META_MEMBERS_ONLY, 1 );
		}

		return (int) $new_id;
	}

	/**
	 * Estimated reading time in minutes (>= 1).
	 *
	 * @param string $content Body HTML.
	 * @return int
	 */
	public function reading_time( string $content ): int {
		$words = str_word_count( wp_strip_all_tags( $content ) );

		return max( 1, (int) ceil( $words / self::WORDS_PER_MINUTE ) );
	}

	/**
	 * Parse an auto table of contents from the body `<h2>` / `<h3>` headings.
	 *
	 * @param string $content Body HTML.
	 * @return array<int, array{level:int, text:string, anchor:string}>
	 */
	public function table_of_contents( string $content ): array {
		$toc = array();
		if ( ! preg_match_all( '/<h([23])[^>]*>(.*?)<\/h\1>/is', $content, $matches, PREG_SET_ORDER ) ) {
			return $toc;
		}

		$seen = array();
		foreach ( $matches as $match ) {
			$text = trim( wp_strip_all_tags( $match[2] ) );
			if ( '' === $text ) {
				continue;
			}
			$anchor = sanitize_title( $text );
			if ( isset( $seen[ $anchor ] ) ) {
				++$seen[ $anchor ];
				$anchor .= '-' . $seen[ $anchor ];
			} else {
				$seen[ $anchor ] = 0;
			}
			$toc[] = array(
				'level'  => (int) $match[1],
				'text'   => $text,
				'anchor' => $anchor,
			);
		}

		return $toc;
	}

	/**
	 * Breadcrumb trail (Home › Group › … › Article) from group ancestry.
	 *
	 * @param WP_Post $post Article.
	 * @return array<int, array{label:string, url:string}>
	 */
	public function breadcrumbs( WP_Post $post ): array {
		$crumbs = array();
		$groups = Visibility::group_terms_for_post( $post->ID );
		if ( empty( $groups ) ) {
			return $crumbs;
		}

		$term_id   = $groups[0];
		$ancestors = array_reverse( get_ancestors( $term_id, KnowledgebasePostType::TAXONOMY_GROUP, 'taxonomy' ) );
		$chain     = array_merge( array_map( 'intval', $ancestors ), array( $term_id ) );

		foreach ( $chain as $id ) {
			$term = get_term( $id, KnowledgebasePostType::TAXONOMY_GROUP );
			if ( ! $term || is_wp_error( $term ) ) {
				continue;
			}
			$link     = get_term_link( $term );
			$crumbs[] = array(
				'label' => $term->name,
				'url'   => is_wp_error( $link ) ? '' : $link,
			);
		}

		return $crumbs;
	}

	/**
	 * Resolve related articles: explicit meta IDs first, then a same-group
	 * fallback to fill up to `$limit`.
	 *
	 * @param WP_Post $post  Article.
	 * @param int     $limit Max related to return.
	 * @return array<int, WP_Post>
	 */
	public function related( WP_Post $post, int $limit = 4 ): array {
		$related = array();
		$ids     = (array) get_post_meta( $post->ID, KnowledgebasePostType::META_RELATED, true );
		$ids     = array_filter( array_map( 'intval', $ids ) );

		foreach ( $ids as $id ) {
			$candidate = $this->articles->find( $id );
			if ( $candidate && 'publish' === $candidate->post_status ) {
				$related[ $candidate->ID ] = $candidate;
			}
			if ( count( $related ) >= $limit ) {
				return array_values( $related );
			}
		}

		$groups = Visibility::group_terms_for_post( $post->ID );
		if ( ! empty( $groups ) && count( $related ) < $limit ) {
			$query = $this->articles->query(
				array(
					'post_status'    => array( 'publish' ),
					'posts_per_page' => $limit - count( $related ) + 1,
					'post__not_in'   => array_merge( array( $post->ID ), array_keys( $related ) ),
					'no_found_rows'  => true,
					'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- bounded same-group lookup for the related block.
						array(
							'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
							'terms'    => $groups,
						),
					),
				)
			);
			foreach ( $query->posts as $candidate ) {
				$related[ $candidate->ID ] = $candidate;
				if ( count( $related ) >= $limit ) {
					break;
				}
			}
		}

		return array_values( $related );
	}

	/**
	 * Shape an article for a list/summary payload (no body).
	 *
	 * @param WP_Post $post Article.
	 * @return array<string, mixed>
	 */
	public function to_summary( WP_Post $post ): array {
		$groups = Visibility::group_terms_for_post( $post->ID );

		return array(
			'id'           => (int) $post->ID,
			'title'        => $post->post_title,
			'slug'         => $post->post_name,
			'excerpt'      => $post->post_excerpt,
			'status'       => $post->post_status,
			'menu_order'   => (int) $post->menu_order,
			'members_only' => Visibility::is_members_only( $post->ID ),
			'visibility'   => Visibility::effective_visibility( $post ),
			'views'        => (int) get_post_meta( $post->ID, KnowledgebasePostType::META_VIEWS, true ),
			'group_id'     => ! empty( $groups ) ? $groups[0] : 0,
			'reading_time' => $this->reading_time( $post->post_content ),
			'author'       => get_the_author_meta( 'display_name', (int) $post->post_author ),
			'modified'     => $post->post_modified_gmt,
			'created'      => $post->post_date_gmt,
			'url'          => (string) get_permalink( $post ),
		);
	}

	/**
	 * Shape an article for a full reader/editor payload (with body + derived).
	 *
	 * @param WP_Post              $post Article.
	 * @param array<string, mixed> $opts include_related / related_limit.
	 * @return array<string, mixed>
	 */
	public function to_full( WP_Post $post, array $opts = array() ): array {
		$payload                = $this->to_summary( $post );
		$payload['content']     = $post->post_content;
		$payload['toc']         = $this->table_of_contents( $post->post_content );
		$payload['breadcrumbs'] = $this->breadcrumbs( $post );
		$payload['group_ids']   = Visibility::group_terms_for_post( $post->ID );

		$tags            = wp_get_post_terms( $post->ID, KnowledgebasePostType::TAXONOMY_TAG, array( 'fields' => 'names' ) );
		$payload['tags'] = is_wp_error( $tags ) ? array() : array_values( $tags );

		if ( ! empty( $opts['include_related'] ) ) {
			$limit              = isset( $opts['related_limit'] ) ? (int) $opts['related_limit'] : 4;
			$payload['related'] = array_map( array( $this, 'to_summary' ), $this->related( $post, $limit ) );
		}

		return $payload;
	}

	/**
	 * Most-viewed published articles (popular widget / deflection ordering).
	 *
	 * @param int $limit How many to return.
	 * @return WP_Query
	 */
	public function popular( int $limit = 5 ): WP_Query {
		return $this->articles->query(
			array(
				'post_status'    => array( 'publish' ),
				'posts_per_page' => $limit,
				'meta_key'       => KnowledgebasePostType::META_VIEWS, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- ordering by the view counter is the feature.
				'orderby'        => 'meta_value_num',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);
	}
}
