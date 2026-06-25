<?php
/**
 * Knowledge Base group (category) REST controller.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Knowledgebase\Repositories\GroupRepository;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestGroupController class.
 */
class RestGroupController extends RestController {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'knowledgebase/groups';

	/**
	 * Group repository.
	 *
	 * @var GroupRepository
	 */
	private $groups;

	/**
	 * Constructor.
	 *
	 * @param GroupRepository|null $groups Repository.
	 */
	public function __construct( ?GroupRepository $groups = null ) {
		$this->groups = $groups ?? new GroupRepository();
	}

	/**
	 * Authoring permission gate.
	 *
	 * @return bool
	 */
	public function can_manage(): bool {
		return current_user_can( 'doublescale_manage_knowledgebase' );
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
					'permission_callback' => array( $this, 'can_manage' ),
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
					'permission_callback' => array( $this, 'can_manage' ),
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
	}

	/**
	 * GET /groups
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function index( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$data = array_map( array( $this->groups, 'to_payload' ), $this->groups->all() );

		return new WP_REST_Response( array( 'data' => array_values( $data ) ), 200 );
	}

	/**
	 * GET /groups/{id}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function show( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$term = $this->groups->find( (int) $request['id'] );
		if ( ! $term ) {
			return new WP_Error( 'not_found', __( 'Group not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response( $this->groups->to_payload( $term ), 200 );
	}

	/**
	 * POST /groups
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$name = sanitize_text_field( (string) $request->get_param( 'name' ) );
		if ( '' === $name ) {
			return new WP_Error( 'missing_name', __( 'A group name is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$term_id = $this->groups->create( $name, (int) $request->get_param( 'parent' ) );
		if ( is_wp_error( $term_id ) ) {
			return $term_id;
		}

		$this->groups->save_meta( $term_id, $this->meta_from_request( $request ) );

		$term = $this->groups->find( $term_id );

		return new WP_REST_Response( $this->groups->to_payload( $term ), 201 );
	}

	/**
	 * PUT /groups/{id}
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$term_id = (int) $request['id'];
		if ( ! $this->groups->find( $term_id ) ) {
			return new WP_Error( 'not_found', __( 'Group not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$args = array();
		if ( null !== $request->get_param( 'name' ) ) {
			$args['name'] = sanitize_text_field( (string) $request->get_param( 'name' ) );
		}
		if ( null !== $request->get_param( 'parent' ) ) {
			$args['parent'] = (int) $request->get_param( 'parent' );
		}

		if ( ! empty( $args ) ) {
			$result = $this->groups->update( $term_id, $args );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		$this->groups->save_meta( $term_id, $this->meta_from_request( $request ) );

		return new WP_REST_Response( $this->groups->to_payload( $this->groups->find( $term_id ) ), 200 );
	}

	/**
	 * DELETE /groups/{id} — blocked when the group still holds articles.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function destroy( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$term_id = (int) $request['id'];
		if ( ! $this->groups->find( $term_id ) ) {
			return new WP_Error( 'not_found', __( 'Group not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( $this->groups->article_count( $term_id ) > 0 ) {
			return new WP_Error(
				'group_referenced',
				__( 'This group still contains articles. Move or delete them first.', 'doublescale' ),
				array( 'status' => 409 )
			);
		}

		if ( ! $this->groups->delete( $term_id ) ) {
			return new WP_Error( 'delete_failed', __( 'Could not delete the group.', 'doublescale' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response(
			array(
				'deleted' => true,
				'id'      => $term_id,
			),
			200
		);
	}

	/**
	 * POST /groups/reorder — body: { items: [ { id, order } ] }.
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
			$this->groups->save_meta( (int) $item['id'], array( 'order' => isset( $item['order'] ) ? (int) $item['order'] : 0 ) );
		}

		return new WP_REST_Response( array( 'reordered' => true ), 200 );
	}

	/**
	 * Extract colour/order/visibility from a request (only present keys).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array<string, mixed>
	 */
	private function meta_from_request( WP_REST_Request $request ): array {
		$meta = array();
		if ( null !== $request->get_param( 'color' ) ) {
			$meta['color'] = (string) $request->get_param( 'color' );
		}
		if ( null !== $request->get_param( 'order' ) ) {
			$meta['order'] = (int) $request->get_param( 'order' );
		}
		if ( null !== $request->get_param( 'visibility' ) ) {
			$meta['visibility'] = (string) $request->get_param( 'visibility' );
		}

		return $meta;
	}
}
