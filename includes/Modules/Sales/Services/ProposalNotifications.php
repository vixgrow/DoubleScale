<?php
/**
 * Outbound proposal emails to customers.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Communication\EmailIdentityResolver;
use DoubleScale\Modules\Emails\Emails;
use DoubleScale\Modules\Sales\Models\ProposalModel;

/**
 * ProposalNotifications service.
 */
final class ProposalNotifications {

	/**
	 * Send the proposal link to the customer.
	 *
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $custom_message Optional message from the sender.
	 * @return bool
	 */
	public function send_proposal( ProposalModel $proposal, string $custom_message = '' ): bool {
		$to = $this->resolve_recipient_email( $proposal );
		if ( '' === $to ) {
			return false;
		}

		$url = ProposalUrl::get_public_url( $proposal );
		if ( '' === $url ) {
			return false;
		}

		$host_user_id = $proposal->assigned_user_id ? (int) $proposal->assigned_user_id : null;
		$identity     = EmailIdentityResolver::resolve( $host_user_id );

		$customer_name = $proposal->to_name ? (string) $proposal->to_name : __( 'there', 'doublescale' );
		$subject       = sprintf(
			/* translators: %s: proposal subject */
			__( 'Proposal: %s', 'doublescale' ),
			(string) $proposal->subject
		);

		$body = $this->build_body( $proposal, $customer_name, $url, $custom_message );

		$emails = new Emails();
		$emails->from_address = $identity['from_address'];
		$emails->from_name    = $identity['from_name'];
		$emails->reply_to     = $identity['reply_to'];

		try {
			return (bool) $emails->send( $to, $subject, $body );
		} catch ( \Throwable $e ) {
			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'Proposal email failed',
					array(
						'source'      => 'sales-proposal-email',
						'proposal_id' => (int) $proposal->id,
						'error'       => $e->getMessage(),
					)
				);
			}
			return false;
		}
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @return string
	 */
	private function resolve_recipient_email( ProposalModel $proposal ): string {
		$email = sanitize_email( (string) ( $proposal->email ?? '' ) );
		if ( is_email( $email ) ) {
			return $email;
		}

		$proposal->loadMissing( 'contact' );
		if ( $proposal->contact && is_email( (string) $proposal->contact->email ) ) {
			return sanitize_email( (string) $proposal->contact->email );
		}

		return '';
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $customer_name Customer display name.
	 * @param string        $url Public proposal URL.
	 * @param string        $custom_message Optional custom message.
	 * @return string
	 */
	private function build_body( ProposalModel $proposal, string $customer_name, string $url, string $custom_message ): string {
		$lines   = array();
		$lines[] = sprintf(
			/* translators: %s: customer name */
			__( 'Hi %s,', 'doublescale' ),
			esc_html( $customer_name )
		);
		$lines[] = '';

		if ( '' !== trim( $custom_message ) ) {
			$lines[] = nl2br( esc_html( $custom_message ) );
			$lines[] = '';
		} else {
			$lines[] = esc_html__( 'Please review the proposal below and let us know if you would like to accept or decline.', 'doublescale' );
			$lines[] = '';
		}

		$lines[] = '<strong>' . esc_html( (string) $proposal->subject ) . '</strong>';
		$lines[] = esc_html(
			sprintf(
				/* translators: 1: proposal number, 2: formatted total, 3: currency */
				__( 'Reference: %1$s — Total: %2$s %3$s', 'doublescale' ),
				(string) $proposal->proposal_number,
				number_format_i18n( (float) $proposal->total, 2 ),
				(string) $proposal->currency
			)
		);

		if ( $proposal->open_till ) {
			$lines[] = esc_html(
				sprintf(
					/* translators: %s: open till date */
					__( 'Valid until: %s', 'doublescale' ),
					(string) $proposal->open_till
				)
			);
		}

		$lines[] = '';
		$lines[] = sprintf(
			'<a href="%1$s" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">%2$s</a>',
			esc_url( $url ),
			esc_html__( 'View Proposal', 'doublescale' )
		);
		$lines[] = '';
		$lines[] = '<span style="color:#64748b;font-size:12px;">' . esc_html__( 'If the button does not work, copy and paste this link into your browser:', 'doublescale' ) . '</span><br />';
		$lines[] = '<a href="' . esc_url( $url ) . '">' . esc_html( $url ) . '</a>';

		return '<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">' . implode( '<br />', $lines ) . '</div>';
	}
}
