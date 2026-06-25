<?php
/**
 * Public (anonymous + portal) Knowledge Base read controller.
 *
 * `__return_true` + rate-limited, like Support's guest controller. Enforces the
 * `public_access` setting and excludes members-only / restricted-group articles
 * for ineligible viewers. The single-article endpoint increments the view
 * counter and records a Tier-3 contact read when the reader is identifiable.
 *
 * NOTE: this controller only governs the JSON read surface. The themed CPT
 * permalinks/archive are guarded separately by {@see FrontendGuard}.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Repositories\ArticleRepository;
use DoubleScale\Modules\Knowledgebase\Services\ArticleService;
use DoubleScale\Modules\Knowledgebase\Services\ContactViewTracker;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use DoubleScale\Modules\Knowledgebase\Services\Visibility;
use WP_Error;
use WP_Post;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestPublicArticleController class.
 */
class RestPublicArticleController extends RestController {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'knowledgebase/public';

	/**
	 * Article repository.
	 *
	 * @var ArticleRepository
	 */
	private $articles;

	/**
	 * Article service.
	 *
	 * @var ArticleService
	 */
	private $service;

	/**
	 * View tracker.
	 *
	 * @var ContactViewTracker
	 */
	private $tracker;

	/**
	 * Constructor.
	 *
	 * @param ArticleRepository|null  $articles Repository.
	 * @param ArticleService|null     $service  Service.
	 * @param ContactViewTracker|null $tracker  View tracker.
	 */
	public function __construct( ?ArticleRepository $articles = null, ?ArticleService $service = null, ?ContactViewTracker $tracker = null ) {
		$this->articles = $articles ?? new ArticleRepository();
		$this->service  = $service ?? new ArticleService( $this->articles );
		$this->tracker  = $tracker ?? new ContactViewTracker();
	}

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/articles',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'index' ),
					'permission_callback' => '__return_true',
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/articles/(?P<slug>[a-z0-9\-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'show' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * GET /public/articles — live search / popular / browse, visibility-filtered.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function index( $request ) {
		$gate = $this->guard_request();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$limit = $request->get_param( 'limit' ) ? (int) $request->get_param( 'limit' ) : (int) KnowledgebaseSettings::get( 'articles_per_page' );
		$limit = min( 50, max( 1, $limit ) );

		$args = array(
			'post_status'    => array( 'publish' ),
			'posts_per_page' => $limit,
			'paged'          => $request->get_param( 'page' ) ? max( 1, (int) $request->get_param( 'page' ) ) : 1,
		);

		$search = $request->get_param( 'search' );
		if ( $search ) {
			$args['s'] = sanitize_text_field( (string) $search );
		}

		if ( 'views' === $request->get_param( 'orderby' ) ) {
			$args['meta_key'] = KnowledgebasePostType::META_VIEWS; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- popular ordering is the feature.
			$args['orderby']  = 'meta_value_num';
			$args['order']    = 'DESC';
		}

		$group     = (int) $request->get_param( 'group' );
		$tax_query = $this->visibility_tax_query();
		if ( $group > 0 ) {
			$tax_query[] = array(
				'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
				'terms'    => array( $group ),
			);
		}
		if ( ! empty( $tax_query ) ) {
			$args['tax_query'] = $tax_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- visibility + group filtering.
		}

		$meta_query = $this->visibility_meta_query();
		if ( ! empty( $meta_query ) ) {
			$args['meta_query'] = $meta_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- members-only exclusion for guests.
		}

		$query = $this->articles->query( $args );
		$data  = array_map( array( $this->service, 'to_summary' ), $query->posts );

		return new WP_REST_Response(
			array(
				'data' => array_values( $data ),
				'meta' => array(
					'total'    => (int) $query->found_posts,
					'per_page' => $limit,
				),
			),
			200
		);
	}

	/**
	 * GET /public/articles/{slug}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function show( $request ) {
		$gate = $this->guard_request();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$post = $this->articles->find_by_slug( (string) $request['slug'], array( 'publish' ) );
		if ( ! $post instanceof WP_Post ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! Visibility::viewer_can_see( Visibility::effective_visibility( $post ) ) ) {
			return new WP_Error( 'not_authorized', __( 'You are not allowed to view this article.', 'doublescale' ), array( 'status' => 403 ) );
		}

		$this->service->increment_views( (int) $post->ID );

		$guest_email = $request->get_param( 'email' );
		$this->tracker->record( $post, is_string( $guest_email ) ? $guest_email : null );

		$opts = array(
			'include_related' => (bool) KnowledgebaseSettings::get( 'show_related' ),
			'related_limit'   => (int) KnowledgebaseSettings::get( 'related_count' ),
		);

		return new WP_REST_Response( $this->service->to_full( $post, $opts ), 200 );
	}

	/**
	 * Common request guard: rate limit + `public_access` mode.
	 *
	 * @return true|WP_Error
	 */
	private function guard_request() {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		if ( ! $this->check_rate_limit() ) {
			return new WP_Error( 'rate_limited', __( 'Too many requests. Please try again later.', 'doublescale' ), array( 'status' => 429 ) );
		}

		$access = (string) KnowledgebaseSettings::get( 'public_access' );
		if ( 'disabled' === $access ) {
			return new WP_Error( 'not_found', __( 'The knowledge base is unavailable.', 'doublescale' ), array( 'status' => 404 ) );
		}
		if ( 'portal' === $access && ! is_user_logged_in() ) {
			return new WP_Error( 'not_authorized', __( 'Please log in to view the knowledge base.', 'doublescale' ), array( 'status' => 401 ) );
		}

		return true;
	}

	/**
	 * Build the tax_query clause excluding groups the current viewer can't see.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function visibility_tax_query(): array {
		$clearance = Visibility::viewer_clearance();
		if ( Visibility::INTERNAL === $clearance ) {
			return array();
		}

		$min_restriction = Visibility::PUBLIC === $clearance ? Visibility::MEMBERS : Visibility::INTERNAL;
		$restricted      = Visibility::restricted_group_term_ids( $min_restriction );
		if ( empty( $restricted ) ) {
			return array();
		}

		return array(
			array(
				'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
				'terms'    => $restricted,
				'operator' => 'NOT IN',
			),
		);
	}

	/**
	 * Build the meta_query clause excluding members-only articles for guests.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function visibility_meta_query(): array {
		if ( Visibility::PUBLIC !== Visibility::viewer_clearance() ) {
			return array();
		}

		return array(
			'relation' => 'OR',
			array(
				'key'     => KnowledgebasePostType::META_MEMBERS_ONLY,
				'compare' => 'NOT EXISTS',
			),
			array(
				'key'     => KnowledgebasePostType::META_MEMBERS_ONLY,
				'value'   => '1',
				'compare' => '!=',
			),
		);
	}

	/**
	 * Simple per-IP rate limit (mirrors Support's guest controller).
	 *
	 * @return bool
	 */
	private function check_rate_limit(): bool {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- IP used only for a rate-limit key.
		$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
		$key   = 'ds_kb_pub_' . md5( $ip );
		$count = (int) get_transient( $key );
		if ( $count > 120 ) {
			return false;
		}
		set_transient( $key, $count + 1, MINUTE_IN_SECONDS );

		return true;
	}
}
