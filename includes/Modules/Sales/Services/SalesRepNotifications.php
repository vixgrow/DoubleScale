<?php
/**
 * Internal notifications to assigned sales reps.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Emails\Emails;
use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\ProposalModel;

/**
 * SalesRepNotifications service.
 */
final class SalesRepNotifications {

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $event Event key: sent|accepted|declined.
	 * @return void
	 */
	public function notify_proposal_event( ProposalModel $proposal, string $event ): void {
		$setting_key = 'notify_rep_proposal_' . $event;
		if ( ! SalesSettings::get( $setting_key, false ) ) {
			return;
		}

		$user_id = $proposal->assigned_user_id ? (int) $proposal->assigned_user_id : 0;
		if ( $user_id <= 0 ) {
			return;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user || ! is_email( $user->user_email ) ) {
			return;
		}

		$labels = array(
			'sent'     => __( 'Proposal sent to customer', 'doublescale' ),
			'accepted' => __( 'Proposal accepted by customer', 'doublescale' ),
			'declined' => __( 'Proposal declined by customer', 'doublescale' ),
		);

		$subject = sprintf(
			/* translators: 1: event label, 2: proposal number */
			__( '%1$s: %2$s', 'doublescale' ),
			$labels[ $event ] ?? __( 'Proposal update', 'doublescale' ),
			(string) $proposal->proposal_number
		);

		$body = sprintf(
			'<p>%s</p><p><strong>%s</strong><br/>%s</p>',
			esc_html( $labels[ $event ] ?? '' ),
			esc_html( (string) $proposal->proposal_number ),
			esc_html( (string) $proposal->subject )
		);

		if ( ProposalStatus::DECLINED === (string) $proposal->status && $proposal->decline_reason ) {
			$body .= '<p>' . esc_html( (string) $proposal->decline_reason ) . '</p>';
		}

		$this->send_to_rep( $user->user_email, $subject, $body, $user_id );
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return void
	 */
	public function notify_invoice_paid( InvoiceModel $invoice ): void {
		if ( ! SalesSettings::get( 'notify_rep_invoice_paid', true ) ) {
			return;
		}

		$user_id = $invoice->sale_agent_user_id ? (int) $invoice->sale_agent_user_id : 0;
		if ( $user_id <= 0 ) {
			return;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user || ! is_email( $user->user_email ) ) {
			return;
		}

		$subject = sprintf(
			/* translators: %s: invoice number */
			__( 'Invoice paid: %s', 'doublescale' ),
			(string) $invoice->invoice_number
		);

		$body = sprintf(
			'<p>%s</p><p><strong>%s</strong></p>',
			esc_html__( 'An invoice has been paid in full.', 'doublescale' ),
			esc_html( (string) $invoice->invoice_number )
		);

		$this->send_to_rep( $user->user_email, $subject, $body, $user_id );
	}

	/**
	 * @param string $to Recipient email.
	 * @param string $subject Subject.
	 * @param string $body HTML body.
	 * @param int    $host_user_id Rep user ID.
	 * @return void
	 */
	private function send_to_rep( string $to, string $subject, string $body, int $host_user_id ): void {
		$identity = \DoubleScale\Core\Communication\EmailIdentityResolver::resolve( $host_user_id );
		$emails   = new Emails();
		$emails->from_address = $identity['from_address'];
		$emails->from_name    = $identity['from_name'];
		$emails->reply_to     = $identity['reply_to'];

		try {
			$emails->send( $to, $subject, $body );
		} catch ( \Throwable $e ) {
			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'Sales rep notification failed',
					array(
						'source' => 'sales-rep-notifications',
						'error'  => $e->getMessage(),
					)
				);
			}
		}
	}
}
