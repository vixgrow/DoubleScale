<?php
/**
 * Public guest access to proposals via hash.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\ProposalModel;
use DoubleScale\Modules\Sales\Rest\ProposalShaper;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestPublicProposalController class.
 */
class RestPublicProposalController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales/public/proposals';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<hash>[a-f0-9]{32})',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => '__return_true',
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<hash>[a-f0-9]{32})/accept',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'accept' ),
					'permission_callback' => '__return_true',
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<hash>[a-f0-9]{32})/decline',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'decline' ),
					'permission_callback' => '__return_true',
				),
			)
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
		if ( ! $this->check_rate_limit() ) {
			return new WP_Error( 'rate_limited', __( 'Too many requests. Please try again later.', 'doublescale' ), array( 'status' => 429 ) );
		}

		$proposal = $this->resolve_by_hash( $request );
		if ( is_wp_error( $proposal ) ) {
			return $proposal;
		}

		if ( ProposalStatus::SENT === (string) $proposal->status ) {
			$proposal->status = ProposalStatus::OPEN;
			$proposal->save();
		}

		return new WP_REST_Response( ProposalShaper::shape_public( $proposal ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function accept( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}
		if ( ! $this->check_rate_limit() ) {
			return new WP_Error( 'rate_limited', __( 'Too many requests. Please try again later.', 'doublescale' ), array( 'status' => 429 ) );
		}

		$proposal = $this->resolve_by_hash( $request );
		if ( is_wp_error( $proposal ) ) {
			return $proposal;
		}

		if ( ! ProposalShaper::can_respond( $proposal ) ) {
			return new WP_Error( 'invalid_status', __( 'This proposal can no longer be accepted.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$proposal->status      = ProposalStatus::ACCEPTED;
		$proposal->accepted_at = current_time( 'mysql' );
		$proposal->save();

		$this->log_status_activity(
			$proposal,
			ProposalStatus::ACCEPTED,
			__( 'Customer accepted the proposal.', 'doublescale' )
		);

		do_action( 'doublescale_sales_proposal_accepted', $proposal );

		return new WP_REST_Response( ProposalShaper::shape_public( $proposal ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function decline( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}
		if ( ! $this->check_rate_limit() ) {
			return new WP_Error( 'rate_limited', __( 'Too many requests. Please try again later.', 'doublescale' ), array( 'status' => 429 ) );
		}

		$proposal = $this->resolve_by_hash( $request );
		if ( is_wp_error( $proposal ) ) {
			return $proposal;
		}

		if ( ! ProposalShaper::can_respond( $proposal ) ) {
			return new WP_Error( 'invalid_status', __( 'This proposal can no longer be declined.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}
		$reason = isset( $params['reason'] ) ? sanitize_textarea_field( (string) $params['reason'] ) : '';

		$proposal->status         = ProposalStatus::DECLINED;
		$proposal->declined_at    = current_time( 'mysql' );
		$proposal->decline_reason = '' !== $reason ? $reason : null;
		$proposal->save();

		$note = __( 'Customer declined the proposal.', 'doublescale' );
		if ( '' !== $reason ) {
			$note .= ' ' . sprintf(
				/* translators: %s: decline reason */
				__( 'Reason: %s', 'doublescale' ),
				$reason
			);
		}

		$this->log_status_activity( $proposal, ProposalStatus::DECLINED, $note );

		do_action( 'doublescale_sales_proposal_declined', $proposal, $reason );

		return new WP_REST_Response( ProposalShaper::shape_public( $proposal ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return ProposalModel|WP_Error
	 */
	private function resolve_by_hash( WP_REST_Request $request ) {
		$hash     = (string) $request->get_param( 'hash' );
		$proposal = ProposalModel::get_by_hash( $hash );
		if ( ! $proposal ) {
			return new WP_Error( 'not_found', __( 'Proposal not found.', 'doublescale' ), array( 'status' => 404 ) );
		}
		return $proposal;
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $status New status.
	 * @param string        $note Activity note.
	 * @return void
	 */
	private function log_status_activity( ProposalModel $proposal, string $status, string $note ): void {
		if ( ! class_exists( ActivityModel::class ) ) {
			return;
		}

		ActivityModel::create(
			array(
				'contact_id'    => (int) $proposal->contact_id,
				'activity_type' => ActivityTypes::STATUS_CHANGED,
				'data'          => array(
					'title'       => __( 'Proposal updated', 'doublescale' ),
					'type'        => 'system',
					'note'        => $note,
					'proposal_id' => (int) $proposal->id,
					'status'      => $status,
				),
				'user_id'       => null,
			)
		);
	}

	/**
	 * @return bool
	 */
	private function check_rate_limit(): bool {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- IP used only for rate-limit key.
		$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
		$key   = 'ds_sales_pub_' . md5( $ip );
		$count = (int) get_transient( $key );
		if ( $count > 120 ) {
			return false;
		}
		set_transient( $key, $count + 1, MINUTE_IN_SECONDS );
		return true;
	}
}
