<?php
/**
 * Client Portal documents endpoint.
 *
 *   GET /doublescale/v1/portal/documents?type=invoice|proposal|all
 *
 * Lists the logged-in customer's own non-draft invoices and proposals. Reuses
 * {@see PortalIdentity} for the login + lowercased-email contact resolve and
 * gates every row on `contact_id`. Drafts are excluded; agent identity and
 * internal ids are never exposed (the list shape is built from the customer-safe
 * static helpers, not the admin shapers).
 *
 * Phase 1 is link-out: each row carries the existing public hash-page URL
 * (`public_url`) for view / pay (Pro) / accept / decline / sign / PDF — the
 * portal does not reimplement those flows.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Portal\Services\PortalIdentity;
use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\ProposalModel;
use DoubleScale\Modules\Sales\Rest\InvoiceShaper;
use DoubleScale\Modules\Sales\Rest\ProposalShaper;
use DoubleScale\Modules\Sales\Services\InvoiceUrl;
use DoubleScale\Modules\Sales\Services\ProposalUrl;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestPortalDocumentsController.
 */
class RestPortalDocumentsController extends RestController {

	/**
	 * REST base.
	 *
	 * @var string
	 */
	protected $rest_base = 'portal';

	/**
	 * Max rows returned across both document types.
	 */
	private const LIST_CAP = 100;

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/documents',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_documents' ),
					'permission_callback' => array( PortalIdentity::class, 'permission_check' ),
					'args'                => array(
						'type' => array(
							'type'    => 'string',
							'enum'    => array( 'all', 'invoice', 'proposal' ),
							'default' => 'all',
						),
					),
				),
			)
		);
	}

	/**
	 * List the contact's non-draft documents.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_documents( WP_REST_Request $request ) {
		$gate = $this->documents_gate();
		if ( $gate instanceof WP_Error ) {
			return $gate;
		}

		$contact = PortalIdentity::current_contact();
		if ( ! $contact ) {
			return new WP_REST_Response( array( 'data' => array() ), 200 );
		}

		$type = (string) $request->get_param( 'type' );
		$rows = array();

		if ( 'proposal' !== $type ) {
			$invoices = InvoiceModel::where( 'contact_id', (int) $contact->id )
				->where( 'status', '!=', InvoiceStatus::DRAFT )
				->orderBy( 'id', 'desc' )
				->limit( self::LIST_CAP )
				->get();
			foreach ( $invoices as $invoice ) {
				$rows[] = $this->shape_invoice( $invoice );
			}
		}

		if ( 'invoice' !== $type ) {
			$proposals = ProposalModel::where( 'contact_id', (int) $contact->id )
				->where( 'status', '!=', ProposalStatus::DRAFT )
				->orderBy( 'id', 'desc' )
				->limit( self::LIST_CAP )
				->get();
			foreach ( $proposals as $proposal ) {
				$rows[] = $this->shape_proposal( $proposal );
			}
		}

		// Sort the merged list newest-first by created_at (a full datetime, unlike
		// the Y-m-d doc dates), then drop the private sort key and cap.
		usort(
			$rows,
			static function ( $a, $b ) {
				return strcmp( (string) $b['_sort'], (string) $a['_sort'] );
			}
		);
		$rows = array_slice( $rows, 0, self::LIST_CAP );
		$data = array_map(
			static function ( $row ) {
				unset( $row['_sort'] );
				return $row;
			},
			$rows
		);

		return new WP_REST_Response( array( 'data' => array_values( $data ) ), 200 );
	}

	/**
	 * Documents-surface gate (404 when Sales/release-gated off), mirroring
	 * {@see RestController::require_module()}.
	 *
	 * @return WP_Error|null
	 */
	private function documents_gate(): ?WP_Error {
		if ( ! doublescale_sales_documents_ready() ) {
			return new WP_Error(
				'module_disabled',
				__( 'The Documents area is unavailable.', 'doublescale' ),
				array( 'status' => 404 )
			);
		}
		return null;
	}

	/**
	 * Customer-safe invoice list row.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return array<string, mixed>
	 */
	private function shape_invoice( InvoiceModel $invoice ): array {
		return array(
			'id'         => (int) $invoice->id,
			'type'       => 'invoice',
			'number'     => (string) $invoice->invoice_number,
			'subject'    => null,
			'status'     => (string) $invoice->status,
			'date'       => $invoice->invoice_date,
			'due_date'   => $invoice->due_date,
			'open_till'  => null,
			'currency'   => (string) $invoice->currency,
			'total'      => (float) $invoice->total,
			'balance'    => InvoiceShaper::balance( $invoice ),
			'is_overdue' => InvoiceShaper::is_overdue( $invoice ),
			'is_expired' => false,
			'invoice_id' => null,
			'public_url' => InvoiceUrl::get_public_url( $invoice ),
			'_sort'      => (string) $invoice->created_at,
		);
	}

	/**
	 * Customer-safe proposal list row.
	 *
	 * @param ProposalModel $proposal Proposal.
	 * @return array<string, mixed>
	 */
	private function shape_proposal( ProposalModel $proposal ): array {
		return array(
			'id'         => (int) $proposal->id,
			'type'       => 'proposal',
			'number'     => (string) $proposal->proposal_number,
			'subject'    => (string) $proposal->subject,
			'status'     => (string) $proposal->status,
			'date'       => $proposal->date,
			'due_date'   => null,
			'open_till'  => $proposal->open_till,
			'currency'   => (string) $proposal->currency,
			'total'      => (float) $proposal->total,
			'balance'    => null,
			'is_overdue' => false,
			'is_expired' => ProposalShaper::is_expired( $proposal ),
			'invoice_id' => ProposalShaper::get_linked_invoice_id( $proposal ),
			'public_url' => ProposalUrl::get_public_url( $proposal ),
			'_sort'      => (string) $proposal->created_at,
		);
	}
}
