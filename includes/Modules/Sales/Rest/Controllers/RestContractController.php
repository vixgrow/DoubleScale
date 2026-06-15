<?php
/**
 * REST controller for sales contracts.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Sales\Constants\ContractStatus;
use DoubleScale\Modules\Sales\Models\ContractModel;
use DoubleScale\Modules\Sales\Models\ContractTypeModel;
use DoubleScale\Modules\Sales\Rest\ContractShaper;
use DoubleScale\Modules\Sales\Services\ContractNotifications;
use DoubleScale\Modules\Sales\Services\ContractUrl;
use DoubleScale\Modules\Sales\Services\DocumentPdf;
use DoubleScale\Modules\Sales\Services\SalesNumbering;
use DoubleScale\Modules\Sales\Services\SalesRepNotifications;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use DoubleScale\Modules\Sales\Services\SalesTags;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestContractController class.
 */
class RestContractController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales/contracts';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/summary',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_summary' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/send',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/pdf',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_pdf' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/signature',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_signature' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * @return array
	 */
	public function get_collection_params() {
		return array(
			'status'           => array( 'type' => 'string' ),
			'contact_id'       => array( 'type' => 'integer' ),
			'contract_type_id' => array( 'type' => 'integer' ),
			'is_trash'         => array( 'type' => 'boolean' ),
			'search'           => array( 'type' => 'string' ),
			'sort_by'          => array(
				'type'    => 'string',
				'enum'    => array( 'created_at', 'updated_at', 'start_date', 'end_date', 'contract_value' ),
				'default' => 'created_at',
			),
			'sort_order'       => array(
				'type'    => 'string',
				'enum'    => array( 'asc', 'desc' ),
				'default' => 'desc',
			),
			'per_page'         => array( 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100 ),
			'page'             => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1 ),
		);
	}

	public function get_items_permissions_check( $request ) {
		unset( $request );
		return Capabilities::can_view_sales();
	}

	public function get_item_permissions_check( $request ) {
		unset( $request );
		return Capabilities::can_view_sales();
	}

	public function create_item_permissions_check( $request ) {
		unset( $request );
		return Capabilities::can_view_sales()
			&& ( Capabilities::can_manage_all_sales() || Capabilities::current_user_can( 'doublescale_manage_own_sales' ) );
	}

	public function update_item_permissions_check( $request ) {
		return $this->create_item_permissions_check( $request );
	}

	public function delete_item_permissions_check( $request ) {
		return $this->create_item_permissions_check( $request );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$query = ContractModel::query()->with( array( 'contact', 'assigned_user', 'type' ) );

		$is_trash = $request->get_param( 'is_trash' );
		if ( null !== $is_trash && '' !== $is_trash ) {
			$query->where( 'is_trash', (bool) rest_sanitize_boolean( $is_trash ) );
		} else {
			$query->where( 'is_trash', false );
		}

		$status = $request->get_param( 'status' );
		if ( null !== $status && '' !== $status ) {
			$statuses = array_values( array_filter( array_map( 'trim', explode( ',', (string) $status ) ) ) );
			$valid    = array_values( array_intersect( $statuses, ContractStatus::all() ) );
			if ( ! empty( $valid ) ) {
				$query->whereIn( 'status', $valid );
			}
		}

		$contact_id = $request->get_param( 'contact_id' );
		if ( null !== $contact_id && '' !== $contact_id ) {
			$query->where( 'contact_id', (int) $contact_id );
		}

		$contract_type_id = $request->get_param( 'contract_type_id' );
		if ( null !== $contract_type_id && '' !== $contract_type_id ) {
			$query->where( 'contract_type_id', (int) $contract_type_id );
		}

		if ( ! Capabilities::can_manage_all_sales() ) {
			$query->where( 'assigned_user_id', get_current_user_id() );
		}

		$search = $request->get_param( 'search' );
		if ( is_string( $search ) && '' !== trim( $search ) ) {
			$like = '%' . str_replace( array( '%', '_' ), array( '\\%', '\\_' ), trim( $search ) ) . '%';
			$query->where(
				function ( $q ) use ( $like ) {
					$q->where( 'subject', 'LIKE', $like )
						->orWhere( 'contract_number', 'LIKE', $like );
				}
			);
		}

		$sort_by    = in_array( $request->get_param( 'sort_by' ), array( 'created_at', 'updated_at', 'start_date', 'end_date', 'contract_value' ), true )
			? $request->get_param( 'sort_by' )
			: 'created_at';
		$sort_order = 'asc' === $request->get_param( 'sort_order' ) ? 'asc' : 'desc';
		$query->orderBy( $sort_by, $sort_order );

		$per_page  = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ?: 20 ) );
		$page      = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$paginator = $query->paginate( $per_page, array( '*' ), 'page', $page );

		$data = array();
		foreach ( $paginator->items() as $contract ) {
			$data[] = ContractShaper::shape_admin( $contract, true );
		}

		return new WP_REST_Response(
			array(
				'data' => $data,
				'meta' => array(
					'total'        => $paginator->total(),
					'per_page'     => $per_page,
					'current_page' => $page,
					'last_page'    => max( 1, (int) ceil( $paginator->total() / $per_page ) ),
				),
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_summary( $request ) {
		unset( $request );
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$query = ContractModel::query()->where( 'is_trash', false );
		if ( ! Capabilities::can_manage_all_sales() ) {
			$query->where( 'assigned_user_id', get_current_user_id() );
		}

		$total_count = (int) ( clone $query )->count();
		$by_status   = array();

		foreach ( ContractStatus::all() as $status ) {
			$count = (int) ( clone $query )->where( 'status', $status )->count();
			$sum   = (float) ( clone $query )->where( 'status', $status )->sum( 'contract_value' );
			$by_status[ $status ] = array(
				'count'   => $count,
				'amount'  => round( $sum, 2 ),
				'percent' => $total_count > 0 ? round( ( $count / $total_count ) * 100, 2 ) : 0,
			);
		}

		$today     = current_time( 'Y-m-d' );
		$days      = (int) SalesSettings::get( 'contract_expiry_reminder_days', 30 );
		$threshold = gmdate( 'Y-m-d', strtotime( '+' . max( 1, $days ) . ' days', current_time( 'timestamp' ) ) );
		$recent    = gmdate( 'Y-m-d', strtotime( '-30 days', current_time( 'timestamp' ) ) );

		$active_count = (int) ( clone $query )->where( 'status', ContractStatus::ACTIVE )->count();
		$expired_count = (int) ( clone $query )->where( 'status', ContractStatus::EXPIRED )->count();
		$about_to_expire_count = (int) ( clone $query )
			->whereIn( 'status', array( ContractStatus::SENT, ContractStatus::SIGNED, ContractStatus::ACTIVE ) )
			->whereNotNull( 'end_date' )
			->where( 'end_date', '>=', $today )
			->where( 'end_date', '<=', $threshold )
			->count();
		$recently_added_count = (int) ( clone $query )
			->whereDate( 'created_at', '>=', $recent )
			->count();
		$trash_count = (int) ContractModel::query()
			->where( 'is_trash', true )
			->when(
				! Capabilities::can_manage_all_sales(),
				function ( $q ) {
					$q->where( 'assigned_user_id', get_current_user_id() );
				}
			)
			->count();

		$by_type = array();
		$types   = ContractTypeModel::query()->orderBy( 'name' )->get();
		foreach ( $types as $type ) {
			$type_query = ( clone $query )->where( 'contract_type_id', (int) $type->id );
			$by_type[]  = array(
				'contract_type_id' => (int) $type->id,
				'name'             => (string) $type->name,
				'count'            => (int) $type_query->count(),
				'value_total'      => round( (float) $type_query->sum( 'contract_value' ), 2 ),
			);
		}

		$untyped_query = ( clone $query )->whereNull( 'contract_type_id' );
		if ( (int) $untyped_query->count() > 0 ) {
			$by_type[] = array(
				'contract_type_id' => null,
				'name'             => __( 'Uncategorized', 'doublescale' ),
				'count'            => (int) $untyped_query->count(),
				'value_total'      => round( (float) $untyped_query->sum( 'contract_value' ), 2 ),
			);
		}

		return new WP_REST_Response(
			array(
				'active_count'          => $active_count,
				'expired_count'         => $expired_count,
				'about_to_expire_count' => $about_to_expire_count,
				'recently_added_count'  => $recently_added_count,
				'trash_count'           => $trash_count,
				'by_status'             => $by_status,
				'by_type'               => $by_type,
				'total_count'           => $total_count,
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::with( array( 'contact', 'assigned_user', 'type' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		return new WP_REST_Response( ContractShaper::shape_admin( $contract, true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function send_item( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::with( array( 'contact', 'assigned_user', 'type' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		if ( ContractStatus::EXPIRED === (string) $contract->status ) {
			return new WP_Error( 'invalid_status', __( 'Expired contracts cannot be sent.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( '' === ContractUrl::get_page_url() ) {
			return new WP_Error(
				'no_contract_page',
				__( 'Create a WordPress page with the [doublescale_contract] shortcode before sending contracts.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}
		$message = isset( $params['message'] ) ? sanitize_textarea_field( (string) $params['message'] ) : '';

		$notifier = new ContractNotifications();
		if ( ! $notifier->send_contract( $contract, $message ) ) {
			return new WP_Error(
				'email_failed',
				__( 'Failed to send the contract email. Check the customer email and SMTP settings.', 'doublescale' ),
				array( 'status' => 500 )
			);
		}

		if ( ContractStatus::DRAFT === (string) $contract->status ) {
			$contract->status = ContractStatus::SENT;
		}
		$contract->sent_at = current_time( 'mysql' );
		$contract->save();

		$this->log_contract_sent( $contract, $message );

		do_action( 'doublescale_sales_contract_sent', $contract, $message );

		return new WP_REST_Response(
			array(
				'sent'     => true,
				'contract' => ContractShaper::shape_admin( $contract->fresh( array( 'contact', 'assigned_user', 'type' ) ), true ),
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$payload = $this->sanitize_payload( $request );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		if ( ! Capabilities::can_manage_all_sales() ) {
			$payload['assigned_user_id'] = get_current_user_id();
		}

		$contract = new ContractModel();
		$contract->fill( $payload );
		SalesNumbering::save_with_retry( $contract );

		return new WP_REST_Response( ContractShaper::shape_admin( $contract->fresh( array( 'contact', 'assigned_user', 'type' ) ), true ), 201 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		$payload = $this->sanitize_payload( $request, false );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		if ( ! Capabilities::can_manage_all_sales() && isset( $payload['assigned_user_id'] ) ) {
			unset( $payload['assigned_user_id'] );
		}

		$contract->fill( $payload );
		$contract->save();

		return new WP_REST_Response( ContractShaper::shape_admin( $contract->fresh( array( 'contact', 'assigned_user', 'type' ) ), true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		$contract->delete();

		return new WP_REST_Response( array( 'deleted' => true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_pdf( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::with( array( 'contact', 'assigned_user', 'type' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		$shaped = ContractShaper::shape_admin( $contract, true );
		$shaped['description'] = ContractShaper::resolved_description( $contract );

		return DocumentPdf::rest_response( $shaped, 'contract', (string) $contract->contract_number );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_signature( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$contract = ContractModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $contract ) {
			return new WP_Error( 'not_found', __( 'Contract not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $contract );
		if ( $forbidden ) {
			return $forbidden;
		}

		if ( empty( $contract->signature ) ) {
			return new WP_Error( 'no_signature', __( 'This contract has no signature.', 'doublescale' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response(
			array(
				'signed_name' => $contract->signed_name ? (string) $contract->signed_name : null,
				'signature'   => (string) $contract->signature,
				'signed_at'   => $contract->signed_at ? (string) $contract->signed_at : null,
				'signed_ip'   => $contract->signed_ip ? (string) $contract->signed_ip : null,
			),
			200
		);
	}

	/**
	 * @param ContractModel $contract Contract.
	 * @param string        $message Optional custom message.
	 * @return void
	 */
	private function log_contract_sent( ContractModel $contract, string $message = '' ): void {
		if ( ! class_exists( ActivityModel::class ) ) {
			return;
		}

		$note = sprintf(
			/* translators: 1: contract number, 2: contract subject */
			__( 'Contract %1$s sent: %2$s', 'doublescale' ),
			(string) $contract->contract_number,
			(string) $contract->subject
		);
		if ( '' !== trim( $message ) ) {
			$note .= ' — ' . $message;
		}

		ActivityModel::create(
			array(
				'contact_id'    => (int) $contract->contact_id,
				'activity_type' => ActivityTypes::EMAIL_SENT,
				'data'          => array(
					'title'       => __( 'Contract sent', 'doublescale' ),
					'type'        => 'system',
					'note'        => $note,
					'contract_id' => (int) $contract->id,
				),
				'user_id'       => get_current_user_id() ?: null,
			)
		);
	}

	/**
	 * @param ContractModel $contract Contract.
	 * @return WP_Error|null
	 */
	private function require_ownership( ContractModel $contract ) {
		if ( Capabilities::user_can_manage_record( get_current_user_id(), $contract->assigned_user_id ? (int) $contract->assigned_user_id : null ) ) {
			return null;
		}
		return new WP_Error( 'not_allowed', __( 'You do not have permission to access this contract.', 'doublescale' ), array( 'status' => 403 ) );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @param bool            $require_contact Whether contact_id is required.
	 * @return array|WP_Error
	 */
	private function sanitize_payload( WP_REST_Request $request, bool $require_contact = true ) {
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$payload = array();

		$string_fields = array(
			'subject',
			'status',
			'currency',
			'start_date',
			'end_date',
		);

		foreach ( $string_fields as $field ) {
			if ( array_key_exists( $field, $params ) ) {
				$payload[ $field ] = sanitize_text_field( (string) $params[ $field ] );
			}
		}

		if ( array_key_exists( 'description', $params ) ) {
			$payload['description'] = wp_kses_post( (string) $params['description'] );
		}

		if ( array_key_exists( 'contact_id', $params ) ) {
			$payload['contact_id'] = (int) $params['contact_id'];
		} elseif ( $require_contact ) {
			return new WP_Error( 'invalid_data', __( 'Contact is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( array_key_exists( 'assigned_user_id', $params ) ) {
			$payload['assigned_user_id'] = (int) $params['assigned_user_id'] ?: null;
		}

		if ( array_key_exists( 'contract_type_id', $params ) ) {
			$payload['contract_type_id'] = (int) $params['contract_type_id'] ?: null;
		}

		if ( array_key_exists( 'contract_value', $params ) ) {
			$payload['contract_value'] = (float) $params['contract_value'];
		}

		if ( array_key_exists( 'hide_from_customer', $params ) ) {
			$payload['hide_from_customer'] = (bool) $params['hide_from_customer'];
		}
		if ( array_key_exists( 'is_trash', $params ) ) {
			$payload['is_trash'] = (bool) $params['is_trash'];
		}
		if ( array_key_exists( 'tag_ids', $params ) ) {
			$payload['tag_ids'] = SalesTags::normalize_tag_ids( $params['tag_ids'] );
		} elseif ( array_key_exists( 'tags', $params ) ) {
			$payload['tag_ids'] = SalesTags::normalize_tag_ids( $params['tags'] );
		}

		if ( isset( $payload['status'] ) && ! ContractStatus::is_valid( $payload['status'] ) ) {
			return new WP_Error( 'invalid_status', __( 'Invalid contract status.', 'doublescale' ), array( 'status' => 400 ) );
		}

		return $payload;
	}
}
