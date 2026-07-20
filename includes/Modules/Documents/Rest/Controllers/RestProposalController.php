<?php
/**
 * REST controller for sales proposals.
 *
 * @package DoubleScale\Modules\Documents
 */

namespace DoubleScale\Modules\Documents\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Documents\Constants\DiscountType;
use DoubleScale\Modules\Documents\Constants\DocumentTemplate;
use DoubleScale\Modules\Documents\Constants\DocumentTemplateColor;
use DoubleScale\Modules\Documents\Constants\ProposalStatus;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\ProposalModel;
use DoubleScale\Modules\Documents\Rest\InvoiceShaper;
use DoubleScale\Modules\Documents\Rest\ProposalShaper;
use DoubleScale\Modules\Documents\Services\ConvertProposalToInvoice;
use DoubleScale\Modules\Documents\Services\DocumentPdf;
use DoubleScale\Modules\Documents\Services\DuplicateProposal;
use DoubleScale\Modules\Documents\Services\ProposalNotifications;
use DoubleScale\Modules\Documents\Services\ProposalUrl;
use DoubleScale\Modules\Sales\Services\SalesNumbering;
use DoubleScale\Modules\Sales\Services\SalesRepNotifications;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestProposalController class.
 */
class RestProposalController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales/proposals';

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
			'/' . $this->rest_base . '/(?P<id>[\d]+)/duplicate',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
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
			'/' . $this->rest_base . '/(?P<id>[\d]+)/convert-to-invoice',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'convert_to_invoice' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
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
			'status'     => array( 'type' => 'string' ),
			'contact_id' => array( 'type' => 'integer' ),
			'search'     => array( 'type' => 'string' ),
			'from'       => array( 'type' => 'string' ),
			'to'         => array( 'type' => 'string' ),
			'sort_by'    => array(
				'type'    => 'string',
				'enum'    => array( 'created_at', 'updated_at', 'date', 'total' ),
				'default' => 'created_at',
			),
			'sort_order' => array(
				'type'    => 'string',
				'enum'    => array( 'asc', 'desc' ),
				'default' => 'desc',
			),
			'per_page'   => array( 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100 ),
			'page'       => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1 ),
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
			&& (
				Capabilities::can_manage_all_sales()
				|| Capabilities::current_user_can( 'doublescale_manage_own_sales' )
				|| Capabilities::can_assign_sales_rep()
			);
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
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$query = ProposalModel::query()->with( array( 'contact', 'assigned_user' ) );

		if ( ! Capabilities::can_manage_all_sales() && ! Capabilities::can_assign_sales_rep() ) {
			$query->where( 'assigned_user_id', get_current_user_id() );
		}

		$total_count = (int) $query->count();

		$status = $request->get_param( 'status' );
		if ( null !== $status && '' !== $status ) {
			$statuses = array_values( array_filter( array_map( 'trim', explode( ',', (string) $status ) ) ) );
			$valid    = array_values( array_intersect( $statuses, ProposalStatus::all() ) );
			if ( ! empty( $valid ) ) {
				$query->whereIn( 'status', $valid );
			}
		}

		$contact_id = $request->get_param( 'contact_id' );
		if ( null !== $contact_id && '' !== $contact_id ) {
			$query->where( 'contact_id', (int) $contact_id );
		}

		$search = $request->get_param( 'search' );
		if ( is_string( $search ) && '' !== trim( $search ) ) {
			$like = '%' . str_replace( array( '%', '_' ), array( '\\%', '\\_' ), trim( $search ) ) . '%';
			$query->where(
				function ( $q ) use ( $like ) {
					$q->where( 'subject', 'LIKE', $like )
						->orWhere( 'proposal_number', 'LIKE', $like )
						->orWhere( 'to_name', 'LIKE', $like );
				}
			);
		}

		$from = $request->get_param( 'from' );
		if ( is_string( $from ) && '' !== trim( $from ) ) {
			$query->where( 'created_at', '>=', trim( $from ) );
		}

		$to = $request->get_param( 'to' );
		if ( is_string( $to ) && '' !== trim( $to ) ) {
			$query->where( 'created_at', '<=', trim( $to ) );
		}

		$sort_by    = in_array( $request->get_param( 'sort_by' ), array( 'created_at', 'updated_at', 'date', 'total' ), true )
			? $request->get_param( 'sort_by' )
			: 'created_at';
		$sort_order = 'asc' === $request->get_param( 'sort_order' ) ? 'asc' : 'desc';
		$query->orderBy( $sort_by, $sort_order );

		$per_page  = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ?: 20 ) );
		$page      = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$paginator = $query->paginate( $per_page, array( '*' ), 'page', $page );

		$data = array();
		foreach ( $paginator->items() as $proposal ) {
			$data[] = ProposalShaper::shape_admin( $proposal, true );
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
				'total_count' => $total_count,
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::with( array( 'contact', 'assigned_user' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		return new WP_REST_Response( ProposalShaper::shape_admin( $proposal, true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function send_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::with( array( 'contact', 'assigned_user' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		if ( ProposalStatus::DECLINED === (string) $proposal->status ) {
			return new WP_Error( 'invalid_status', __( 'Declined proposals cannot be sent.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( '' === ProposalUrl::get_page_url() ) {
			return new WP_Error(
				'no_proposal_page',
				__( 'Create a WordPress page with the [doublescale_proposal] shortcode before sending proposals.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		$gate = apply_filters( 'doublescale_sales_send_gate', null, 'proposal', $proposal );
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}
		$message = isset( $params['message'] ) ? sanitize_textarea_field( (string) $params['message'] ) : '';

		$notifier = new ProposalNotifications();
		if ( ! $notifier->send_proposal( $proposal, $message ) ) {
			return new WP_Error(
				'email_failed',
				__( 'Failed to send the proposal email. Check the customer email and SMTP settings.', 'doublescale' ),
				array( 'status' => 500 )
			);
		}

		if ( ProposalStatus::DRAFT === (string) $proposal->status ) {
			$proposal->status = ProposalStatus::SENT;
		}
		$proposal->sent_at = current_time( 'mysql' );
		$proposal->save();

		$this->log_proposal_sent( $proposal, $message );

		do_action( 'doublescale_sales_proposal_sent', $proposal, $message );

		( new SalesRepNotifications() )->notify_proposal_event( $proposal, 'sent' );

		return new WP_REST_Response(
			array(
				'sent'     => true,
				'proposal' => ProposalShaper::shape_admin( $proposal->fresh( array( 'contact', 'assigned_user' ) ), true ),
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$payload = $this->sanitize_payload( $request );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		if ( ! isset( $payload['template'] ) ) {
			$payload['template'] = DocumentTemplate::normalize(
				SalesSettings::get( 'default_proposal_template', DocumentTemplate::DEFAULT )
			);
		}

		$discount_check = DiscountType::validate_payload( $payload );
		if ( is_wp_error( $discount_check ) ) {
			return $discount_check;
		}

		if ( ! Capabilities::can_assign_sales_rep() ) {
			$payload['assigned_user_id'] = get_current_user_id();
		}

		$proposal = new ProposalModel();
		$proposal->fill( $payload );
		SalesNumbering::save_with_retry( $proposal );

		return new WP_REST_Response( ProposalShaper::shape_admin( $proposal->fresh( array( 'contact', 'assigned_user' ) ), true ), 201 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		$gate = apply_filters( 'doublescale_sales_update_gate', null, 'proposal', $proposal );
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$payload = $this->sanitize_payload( $request, false );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$discount_check = DiscountType::validate_payload( $payload, $proposal );
		if ( is_wp_error( $discount_check ) ) {
			return $discount_check;
		}

		if ( ! Capabilities::can_assign_sales_rep() && isset( $payload['assigned_user_id'] ) ) {
			unset( $payload['assigned_user_id'] );
		}

		$proposal->fill( $payload );
		$proposal->save();

		do_action( 'doublescale_sales_proposal_updated', $proposal );

		return new WP_REST_Response( ProposalShaper::shape_admin( $proposal->fresh( array( 'contact', 'assigned_user' ) ), true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		do_action( 'doublescale_sales_proposal_deleted', $proposal );

		$proposal->delete();

		return new WP_REST_Response( array( 'deleted' => true ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function convert_to_invoice( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::with( array( 'contact', 'assigned_user' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		if ( ProposalStatus::DECLINED === (string) $proposal->status ) {
			return new WP_Error( 'invalid_status', __( 'Declined proposals cannot be converted to invoices.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$gate = apply_filters( 'doublescale_sales_convert_proposal_gate', null, $proposal );
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$invoice = ( new ConvertProposalToInvoice() )->convert( $proposal );
		if ( is_wp_error( $invoice ) ) {
			if ( 'already_converted' === $invoice->get_error_code() ) {
				$existing_id = (int) ( $invoice->get_error_data()['invoice_id'] ?? 0 );
				$existing    = $existing_id > 0
					? InvoiceModel::with( array( 'contact', 'sale_agent' ) )->find( $existing_id )
					: null;
				if ( $existing ) {
					$proposal->refresh();

					return new WP_REST_Response(
						array(
							'invoice'           => InvoiceShaper::shape( $existing, true ),
							'proposal'        => ProposalShaper::shape_admin( $proposal, true ),
							'already_converted' => true,
						),
						200
					);
				}
			}

			return $invoice;
		}
		$proposal->refresh();

		do_action( 'doublescale_sales_proposal_converted_to_invoice', $proposal, $invoice );

		return new WP_REST_Response(
			array(
				'invoice'  => InvoiceShaper::shape( $invoice, true ),
				'proposal' => ProposalShaper::shape_admin( $proposal, true ),
			),
			201
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_pdf( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::with( array( 'contact', 'assigned_user' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		$shaped = ProposalShaper::shape_admin( $proposal, true );

		return DocumentPdf::rest_response( $shaped, 'proposal', (string) $proposal->proposal_number );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate_item( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::with( array( 'contact', 'assigned_user' ) )->find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		$copy = ( new DuplicateProposal() )->duplicate( $proposal );

		return new WP_REST_Response( ProposalShaper::shape_admin( $copy, true ), 201 );
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $message Optional custom message.
	 * @return void
	 */
	private function log_proposal_sent( ProposalModel $proposal, string $message = '' ): void {
		if ( ! class_exists( ActivityModel::class ) ) {
			return;
		}

		$note = sprintf(
			/* translators: 1: proposal number, 2: proposal subject */
			__( 'Proposal %1$s sent: %2$s', 'doublescale' ),
			(string) $proposal->proposal_number,
			(string) $proposal->subject
		);
		if ( '' !== trim( $message ) ) {
			$note .= ' — ' . $message;
		}

		ActivityModel::create(
			array(
				'contact_id'    => (int) $proposal->contact_id,
				'activity_type' => ActivityTypes::EMAIL_SENT,
				'data'          => array(
					'title'       => __( 'Proposal sent', 'doublescale' ),
					'type'        => 'system',
					'note'        => $note,
					'proposal_id' => (int) $proposal->id,
				),
				'user_id'       => get_current_user_id() ?: null,
			)
		);
		// TODO(morph): wire proposal/invoice associations (ENTITY_TYPE_PROPOSAL).
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_signature( $request ) {
		$disabled = $this->require_module( 'documents' );
		if ( $disabled ) {
			return $disabled;
		}

		$proposal = ProposalModel::find( (int) $request->get_param( 'id' ) );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$forbidden = $this->require_ownership( $proposal );
		if ( $forbidden ) {
			return $forbidden;
		}

		if ( empty( $proposal->signature ) ) {
			return new WP_Error( 'no_signature', __( 'This proposal has no signature.', 'doublescale' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response(
			array(
				'signed_name' => $proposal->signed_name ? (string) $proposal->signed_name : null,
				'signature'   => (string) $proposal->signature,
				'accepted_at' => $proposal->accepted_at ? (string) $proposal->accepted_at : null,
				'signed_ip'   => $proposal->signed_ip ? (string) $proposal->signed_ip : null,
			),
			200
		);
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @return WP_Error|null
	 */
	private function require_ownership( ProposalModel $proposal ) {
		if ( Capabilities::user_can_manage_record( get_current_user_id(), $proposal->assigned_user_id ? (int) $proposal->assigned_user_id : null ) ) {
			return null;
		}
		return new WP_Error( 'not_allowed', __( 'You do not have permission to access this proposal.', 'doublescale' ), array( 'status' => 403 ) );
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
			'discount_type',
			'to_name',
			'address',
			'city',
			'state',
			'country',
			'zip',
			'email',
			'phone',
			'date',
			'open_till',
		);

		foreach ( $string_fields as $field ) {
			if ( array_key_exists( $field, $params ) ) {
				$payload[ $field ] = sanitize_text_field( (string) $params[ $field ] );
			}
		}

		if ( array_key_exists( 'contact_id', $params ) ) {
			$payload['contact_id'] = (int) $params['contact_id'];
		} elseif ( $require_contact ) {
			return new WP_Error( 'invalid_data', __( 'Contact is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( array_key_exists( 'assigned_user_id', $params ) ) {
			$payload['assigned_user_id'] = (int) $params['assigned_user_id'] ?: null;
		}

		if ( array_key_exists( 'discount_value', $params ) ) {
			$payload['discount_value'] = (float) $params['discount_value'];
		}
		if ( array_key_exists( 'adjustment', $params ) ) {
			$payload['adjustment'] = (float) $params['adjustment'];
		}
		if ( array_key_exists( 'line_items', $params ) && is_array( $params['line_items'] ) ) {
			$payload['line_items'] = $params['line_items'];
		}

		if ( array_key_exists( 'template', $params ) ) {
			$payload['template'] = DocumentTemplate::normalize( $params['template'] );
		}

		if ( array_key_exists( 'template_color', $params ) ) {
			$payload['template_color'] = DocumentTemplateColor::normalize( $params['template_color'] );
		}

		if ( isset( $payload['status'] ) && ! ProposalStatus::is_valid( $payload['status'] ) ) {
			return new WP_Error( 'invalid_status', __( 'Invalid proposal status.', 'doublescale' ), array( 'status' => 400 ) );
		}

		return $payload;
	}
}
