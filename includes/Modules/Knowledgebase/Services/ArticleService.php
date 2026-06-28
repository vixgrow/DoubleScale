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
	 * Record a "Was this helpful?" vote on an article (postmeta counters).
	 *
	 * A minimal, table-free helpful/not-helpful tally — the phase-2 daily
	 * analytics aggregate is a separate, deferred concern.
	 *
	 * @param int  $post_id Article ID.
	 * @param bool $helpful Whether the reader found it helpful.
	 * @return array{helpful:int, not_helpful:int} The updated counts.
	 */
	public function record_feedback( int $post_id, bool $helpful ): array {
		$key   = $helpful ? KnowledgebasePostType::META_HELPFUL : KnowledgebasePostType::META_NOT_HELPFUL;
		$count = (int) get_post_meta( $post_id, $key, true ) + 1;
		update_post_meta( $post_id, $key, $count );

		return $this->feedback_counts( $post_id );
	}

	/**
	 * Current helpful / not-helpful counts for an article.
	 *
	 * @param int $post_id Article ID.
	 * @return array{helpful:int, not_helpful:int}
	 */
	public function feedback_counts( int $post_id ): array {
		return array(
			'helpful'     => (int) get_post_meta( $post_id, KnowledgebasePostType::META_HELPFUL, true ),
			'not_helpful' => (int) get_post_meta( $post_id, KnowledgebasePostType::META_NOT_HELPFUL, true ),
		);
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
		return $this->parse_headings( $content );
	}

	/**
	 * Parse `<h2>`/`<h3>` headings into ordered {level, text, anchor} entries,
	 * skipping empty headings and de-duplicating anchors. This is the single
	 * source of truth for both the TOC list and {@see inject_heading_anchors()},
	 * so the rendered heading ids and the TOC links can never drift.
	 *
	 * @param string $content Body HTML.
	 * @return array<int, array{level:int, text:string, anchor:string}>
	 */
	private function parse_headings( string $content ): array {
		$headings = array();
		if ( ! preg_match_all( '/<h([23])[^>]*>(.*?)<\/h\1>/is', $content, $matches, PREG_SET_ORDER ) ) {
			return $headings;
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
			$headings[] = array(
				'level'  => (int) $match[1],
				'text'   => $text,
				'anchor' => $anchor,
			);
		}

		return $headings;
	}

	/**
	 * Inject `id="<anchor>"` into each `<h2>`/`<h3>` so the TOC links resolve.
	 *
	 * Anchors are pulled from {@see parse_headings()} in document order, so they
	 * always match the TOC. Empty headings are skipped (they have no TOC entry),
	 * and a heading that already carries an `id` is left untouched — but the
	 * anchor cursor still advances for it so the remaining headings stay aligned.
	 * Display-only: callers run this on a copy, never persisting it back into
	 * `post_content`.
	 *
	 * @param string $content Body HTML.
	 * @return string
	 */
	public function inject_heading_anchors( string $content ): string {
		$headings = $this->parse_headings( $content );
		if ( empty( $headings ) ) {
			return $content;
		}

		$anchors = array_column( $headings, 'anchor' );
		$index   = 0;

		return (string) preg_replace_callback(
			'/<h([23])([^>]*)>(.*?)<\/h\1>/is',
			static function ( $heading ) use ( &$index, $anchors ): string {
				$text = trim( wp_strip_all_tags( $heading[3] ) );
				if ( '' === $text ) {
					return $heading[0];
				}

				$anchor = $anchors[ $index ] ?? '';
				++$index;

				if ( '' === $anchor || preg_match( '/\sid\s*=/i', $heading[2] ) ) {
					return $heading[0];
				}

				return '<h' . $heading[1] . ' id="' . esc_attr( $anchor ) . '"' . $heading[2] . '>' . $heading[3] . '</h' . $heading[1] . '>';
			},
			$content
		);
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
		$groups   = Visibility::group_terms_for_post( $post->ID );
		$group_id = ! empty( $groups ) ? (int) $groups[0] : 0;

		// Carry the primary group's name + colour so the portal can render
		// coloured group headers (and the admin a swatch) without a separate
		// public groups request.
		$group_name  = '';
		$group_color = '';
		if ( $group_id ) {
			$term = get_term( $group_id, KnowledgebasePostType::TAXONOMY_GROUP );
			if ( $term && ! is_wp_error( $term ) ) {
				$group_name  = $term->name;
				$group_color = (string) get_term_meta( $group_id, KnowledgebasePostType::TERM_META_COLOR, true );
			}
		}

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
			'group_id'     => $group_id,
			'group_name'   => $group_name,
			'group_color'  => $group_color,
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
		$payload = $this->to_summary( $post );
		// `content` stays raw for the authoring editor; `content_html` carries the
		// reader copy with heading anchors injected so the TOC links resolve.
		$payload['content']      = $post->post_content;
		$payload['content_html'] = $this->inject_heading_anchors( $post->post_content );
		$payload['toc']          = $this->table_of_contents( $post->post_content );
		$payload['show_toc']     = (bool) KnowledgebaseSettings::get( 'show_toc' );
		$payload['breadcrumbs']  = $this->breadcrumbs( $post );
		$payload['group_ids']    = Visibility::group_terms_for_post( $post->ID );

		$tags            = wp_get_post_terms( $post->ID, KnowledgebasePostType::TAXONOMY_TAG, array( 'fields' => 'names' ) );
		$payload['tags'] = is_wp_error( $tags ) ? array() : array_values( $tags );

		$payload['featured_image']     = (int) get_post_thumbnail_id( $post->ID );
		$payload['featured_image_url'] = (string) get_the_post_thumbnail_url( $post->ID, 'large' );

		// Raw, author-curated related IDs (distinct from the resolved `related`
		// list below, which also folds in the same-group fallback) — the editor
		// pre-populates its related-picker from these.
		$related_ids            = (array) get_post_meta( $post->ID, KnowledgebasePostType::META_RELATED, true );
		$payload['related_ids'] = array_values( array_filter( array_map( 'intval', $related_ids ) ) );

		$payload['feedback_enabled'] = (bool) KnowledgebaseSettings::get( 'enable_feedback' );
		$counts                      = $this->feedback_counts( (int) $post->ID );
		$payload['helpful']          = $counts['helpful'];
		$payload['not_helpful']      = $counts['not_helpful'];

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
