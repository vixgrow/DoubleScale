<?php
/**
 * Knowledge Base article authoring REST controller.
 *
 * Authoring (create/update/delete/reorder/status/duplicate) gates on
 * `doublescale_manage_knowledgebase`. Read endpoints additionally OR-in
 * `doublescale_view_support` so Support Agents can browse + insert articles into
 * replies (and see suggested articles) without authoring rights.
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
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use WP_Error;
use WP_Post;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestArticleController class.
 */
class RestArticleController extends RestController {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'knowledgebase/articles';

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
	 * Constructor.
	 *
	 * @param ArticleRepository|null $articles Repository.
	 * @param ArticleService|null    $service  Service.
	 */
	public function __construct( ?ArticleRepository $articles = null, ?ArticleService $service = null ) {
		$this->articles = $articles ?? new ArticleRepository();
		$this->service  = $service ?? new ArticleService( $this->articles );
	}

	/**
	 * Authoring gate.
	 *
	 * @return bool
	 */
	public function can_manage(): bool {
		return current_user_can( 'doublescale_manage_knowledgebase' );
	}

	/**
	 * Read gate — authoring OR support read (agent picker / suggested articles).
	 *
	 * @return bool
	 */
	public function can_read(): bool {
		return current_user_can( 'doublescale_manage_knowledgebase' ) || current_user_can( 'doublescale_view_support' );
	}

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'index' ),
					'permission_callback' => array( $this, 'can_read' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/reorder',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'reorder' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'show' ),
					'permission_callback' => array( $this, 'can_read' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'destroy' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/status',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'set_status' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/duplicate',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/related',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'related' ),
					'permission_callback' => array( $this, 'can_read' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/revisions',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'revisions' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/revisions/(?P<revision_id>\d+)/restore',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'restore_revision' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);
	}

	/**
	 * GET /articles
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function index( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$args = array(
			'posts_per_page' => $request->get_param( 'per_page' ) ? (int) $request->get_param( 'per_page' ) : 50,
			'paged'          => $request->get_param( 'page' ) ? max( 1, (int) $request->get_param( 'page' ) ) : 1,
		);

		$status = $request->get_param( 'status' );
		if ( $status && in_array( $status, array( 'publish', 'draft', 'private' ), true ) ) {
			$args['post_status'] = array( $status );
		}

		$search = $request->get_param( 'search' );
		if ( $search ) {
			$args['s'] = sanitize_text_field( (string) $search );
		}

		$group = (int) $request->get_param( 'group' );
		if ( $group > 0 ) {
			$args['tax_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- group filter is the feature.
				array(
					'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
					'terms'    => array( $group ),
				),
			);
		}

		// Support Agents reach this endpoint (read OR-in) for the reply picker /
		// suggested articles, but must never see drafts or internal articles —
		// restrict non-managers to published, overriding any requested status.
		if ( ! $this->can_manage() ) {
			$args['post_status'] = array( 'publish' );
		}

		$query = $this->articles->query( $args );
		$data  = array_map( array( $this->service, 'to_summary' ), $query->posts );

		return new WP_REST_Response(
			array(
				'data' => array_values( $data ),
				'meta' => array(
					'total'    => (int) $query->found_posts,
					'page'     => $args['paged'],
					'per_page' => $args['posts_per_page'],
				),
			),
			200
		);
	}

	/**
	 * GET /articles/{id}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function show( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$post = $this->articles->find( (int) $request['id'] );
		if ( ! $post ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		// Agents (read-only) may fetch published articles for the reply picker,
		// but draft / internal bodies are authoring-only.
		if ( ! $this->can_manage() && 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response(
			$this->service->to_full( $post, array( 'include_related' => true ) ),
			200
		);
	}

	/**
	 * POST /articles
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id = $this->articles->insert( $this->post_data_from_request( $request, true ) );
		if ( is_wp_error( $id ) ) {
			return $id;
		}

		$this->apply_relations( (int) $id, $request, true );

		return new WP_REST_Response( $this->service->to_full( $this->articles->find( (int) $id ), array( 'include_related' => true ) ), 201 );
	}

	/**
	 * PUT /articles/{id}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id = (int) $request['id'];
		if ( ! $this->articles->find( $id ) ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$result = $this->articles->update( $id, $this->post_data_from_request( $request, false ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$this->apply_relations( $id, $request );

		return new WP_REST_Response( $this->service->to_full( $this->articles->find( $id ), array( 'include_related' => true ) ), 200 );
	}

	/**
	 * DELETE /articles/{id}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function destroy( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id = (int) $request['id'];
		if ( ! $this->articles->find( $id ) ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! $this->articles->delete( $id ) ) {
			return new WP_Error( 'delete_failed', __( 'Could not delete the article.', 'doublescale' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response(
			array(
				'deleted' => true,
				'id'      => $id,
			),
			200
		);
	}

	/**
	 * POST /articles/{id}/status — body: { status }.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function set_status( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id     = (int) $request['id'];
		$status = (string) $request->get_param( 'status' );
		if ( ! in_array( $status, array( 'publish', 'draft', 'private' ), true ) ) {
			return new WP_Error( 'invalid_status', __( 'Invalid status.', 'doublescale' ), array( 'status' => 400 ) );
		}
		if ( ! $this->articles->find( $id ) ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$result = $this->articles->update( $id, array( 'post_status' => $status ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $this->service->to_summary( $this->articles->find( $id ) ), 200 );
	}

	/**
	 * POST /articles/{id}/duplicate
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$source = $this->articles->find( (int) $request['id'] );
		if ( ! $source ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$new_id = $this->service->duplicate( $source );
		if ( is_wp_error( $new_id ) ) {
			return $new_id;
		}

		return new WP_REST_Response( $this->service->to_summary( $this->articles->find( (int) $new_id ) ), 201 );
	}

	/**
	 * GET /articles/{id}/related
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function related( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$post = $this->articles->find( (int) $request['id'] );
		if ( ! $post ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! $this->can_manage() && 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$limit = $request->get_param( 'limit' ) ? (int) $request->get_param( 'limit' ) : 4;
		$data  = array_map( array( $this->service, 'to_summary' ), $this->service->related( $post, $limit ) );

		return new WP_REST_Response( array( 'data' => array_values( $data ) ), 200 );
	}

	/**
	 * GET /articles/{id}/revisions — list this article's stored revisions.
	 *
	 * The CPT supports revisions but has no wp-admin screen (`show_ui=false`),
	 * so this is the only surface for them. Authoring-gated.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function revisions( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id = (int) $request['id'];
		if ( ! $this->articles->find( $id ) ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		// Default ordering is `date ID` DESC — keep the ID tiebreaker so revisions
		// saved within the same second still sort newest-first deterministically.
		$revisions = wp_get_post_revisions( $id, array( 'order' => 'DESC' ) );

		$data = array();
		foreach ( $revisions as $revision ) {
			$data[] = array(
				'id'       => (int) $revision->ID,
				'date'     => $revision->post_modified_gmt,
				'author'   => get_the_author_meta( 'display_name', (int) $revision->post_author ),
				'title'    => $revision->post_title,
				'content'  => $revision->post_content,
				'autosave' => (bool) wp_is_post_autosave( $revision ),
			);
		}

		return new WP_REST_Response( array( 'data' => $data ), 200 );
	}

	/**
	 * POST /articles/{id}/revisions/{revision_id}/restore — roll the article back
	 * to a stored revision and return the refreshed article.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function restore_revision( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$id          = (int) $request['id'];
		$revision_id = (int) $request['revision_id'];
		if ( ! $this->articles->find( $id ) ) {
			return new WP_Error( 'not_found', __( 'Article not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$revision = wp_get_post_revision( $revision_id );
		if ( ! $revision || (int) $revision->post_parent !== $id ) {
			return new WP_Error( 'invalid_revision', __( 'That revision does not belong to this article.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( ! wp_restore_post_revision( $revision_id ) ) {
			return new WP_Error( 'restore_failed', __( 'Could not restore the revision.', 'doublescale' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response( $this->service->to_full( $this->articles->find( $id ), array( 'include_related' => true ) ), 200 );
	}

	/**
	 * POST /articles/reorder — body: { items: [ { id, order } ] }.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function reorder( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$items = $request->get_param( 'items' );
		if ( ! is_array( $items ) ) {
			return new WP_Error( 'invalid_param', __( 'The "items" parameter must be an array.', 'doublescale' ), array( 'status' => 400 ) );
		}

		foreach ( $items as $item ) {
			if ( ! isset( $item['id'] ) ) {
				continue;
			}
			$id = (int) $item['id'];
			if ( ! $this->articles->find( $id ) ) {
				continue;
			}
			$this->articles->set_order( $id, isset( $item['order'] ) ? (int) $item['order'] : 0 );
			// Drag-between-columns recategorises (Perfex parity).
			if ( isset( $item['group_id'] ) ) {
				$this->articles->set_terms( $id, array( (int) $item['group_id'] ), $this->existing_tags( $id ) );
			}
		}

		return new WP_REST_Response( array( 'reordered' => true ), 200 );
	}

	/**
	 * Build the wp_insert/update_post data array from a request.
	 *
	 * @param WP_REST_Request $request   Request.
	 * @param bool            $is_create Whether this is a create (applies defaults).
	 * @return array<string, mixed>
	 */
	private function post_data_from_request( WP_REST_Request $request, bool $is_create ): array {
		$data = array();

		if ( null !== $request->get_param( 'title' ) ) {
			$data['post_title'] = sanitize_text_field( (string) $request->get_param( 'title' ) );
		}
		// Optional editor-supplied slug. Empty is ignored so WordPress falls back to
		// auto-deriving from the title; `wp_insert_post`/`wp_update_post` run
		// wp_unique_post_slug() on `post_name`, so collisions are deduped by core.
		if ( null !== $request->get_param( 'slug' ) ) {
			$slug = sanitize_title( (string) $request->get_param( 'slug' ) );
			if ( '' !== $slug ) {
				$data['post_name'] = $slug;
			}
		}
		if ( null !== $request->get_param( 'content' ) ) {
			$data['post_content'] = $this->service->sanitize_body( (string) $request->get_param( 'content' ) );
		}
		if ( null !== $request->get_param( 'excerpt' ) ) {
			$data['post_excerpt'] = sanitize_textarea_field( (string) $request->get_param( 'excerpt' ) );
		}
		if ( null !== $request->get_param( 'status' ) ) {
			$status              = (string) $request->get_param( 'status' );
			$data['post_status'] = in_array( $status, array( 'publish', 'draft', 'private' ), true ) ? $status : 'draft';
		} elseif ( $is_create ) {
			$data['post_status'] = 'draft';
		}
		if ( null !== $request->get_param( 'menu_order' ) ) {
			$data['menu_order'] = (int) $request->get_param( 'menu_order' );
		}
		if ( $is_create ) {
			$data['post_author'] = get_current_user_id();
		}

		return $data;
	}

	/**
	 * Apply taxonomy terms, members-only flag, related IDs, and featured image.
	 *
	 * @param int             $id        Article ID.
	 * @param WP_REST_Request $request   Request.
	 * @param bool            $is_create Whether this is a create (applies the default-group fallback).
	 * @return void
	 */
	private function apply_relations( int $id, WP_REST_Request $request, bool $is_create = false ): void {
		$group_ids = $request->get_param( 'group_ids' );
		$tags      = $request->get_param( 'tags' );

		$resolved_groups = is_array( $group_ids )
			? array_values( array_filter( array_map( 'intval', $group_ids ) ) )
			: null;

		// On create, an article whose author picked no group lands in the
		// configured default group (when one is set and still exists).
		if ( $is_create && empty( $resolved_groups ) ) {
			$default_group = (int) KnowledgebaseSettings::get( 'default_group' );
			if ( $default_group > 0 && term_exists( $default_group, KnowledgebasePostType::TAXONOMY_GROUP ) ) {
				$resolved_groups = array( $default_group );
			}
		}

		if ( null !== $resolved_groups || is_array( $tags ) ) {
			$this->articles->set_terms(
				$id,
				null !== $resolved_groups ? $resolved_groups : $this->existing_group_ids( $id ),
				is_array( $tags ) ? $tags : $this->existing_tags( $id )
			);
		}

		if ( null !== $request->get_param( 'members_only' ) ) {
			update_post_meta( $id, KnowledgebasePostType::META_MEMBERS_ONLY, $request->get_param( 'members_only' ) ? 1 : 0 );
		}

		$related = $request->get_param( 'related' );
		if ( is_array( $related ) ) {
			update_post_meta( $id, KnowledgebasePostType::META_RELATED, array_values( array_filter( array_map( 'intval', $related ) ) ) );
		}

		$thumbnail_id = $request->get_param( 'featured_image_id' );
		if ( null !== $thumbnail_id ) {
			if ( (int) $thumbnail_id > 0 ) {
				set_post_thumbnail( $id, (int) $thumbnail_id );
			} else {
				delete_post_thumbnail( $id );
			}
		}
	}

	/**
	 * Existing tag names for an article (preserve when only group changes).
	 *
	 * @param int $id Article ID.
	 * @return array<int, string>
	 */
	private function existing_tags( int $id ): array {
		$tags = wp_get_post_terms( $id, KnowledgebasePostType::TAXONOMY_TAG, array( 'fields' => 'names' ) );

		return is_wp_error( $tags ) ? array() : array_values( $tags );
	}

	/**
	 * Existing group term IDs for an article (preserve when only tags change).
	 *
	 * @param int $id Article ID.
	 * @return array<int, int>
	 */
	private function existing_group_ids( int $id ): array {
		$ids = wp_get_post_terms( $id, KnowledgebasePostType::TAXONOMY_GROUP, array( 'fields' => 'ids' ) );

		return is_wp_error( $ids ) ? array() : array_map( 'intval', $ids );
	}
}
