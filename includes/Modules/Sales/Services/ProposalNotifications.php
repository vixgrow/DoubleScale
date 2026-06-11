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
		$intro = '' !== trim( $custom_message )
			? nl2br( esc_html( $custom_message ) )
			: esc_html__( 'Please review the proposal below and let us know if you would like to accept or decline.', 'doublescale' );

		$formatted_total = sprintf(
			'%1$s %2$s',
			number_format_i18n( (float) $proposal->total, 2 ),
			(string) $proposal->currency
		);

		$summary_rows = array(
			array(
				'label' => __( 'Subject', 'doublescale' ),
				'value' => (string) $proposal->subject,
			),
			array(
				'label' => __( 'Reference', 'doublescale' ),
				'value' => (string) $proposal->proposal_number,
			),
			array(
				'label' => __( 'Total', 'doublescale' ),
				'value' => $formatted_total,
			),
		);

		if ( $proposal->open_till ) {
			$summary_rows[] = array(
				'label' => __( 'Valid until', 'doublescale' ),
				'value' => (string) $proposal->open_till,
			);
		}

		$summary_html = '';
		foreach ( $summary_rows as $row ) {
			$summary_html .= sprintf(
				'<tr>'
				. '<td style="padding:8px 0;color:#718096;font-size:13px;font-family:Helvetica,Arial,sans-serif;width:34%%;vertical-align:top;">%1$s</td>'
				. '<td style="padding:8px 0;color:#1a202c;font-size:13px;font-family:Helvetica,Arial,sans-serif;font-weight:600;vertical-align:top;">%2$s</td>'
				. '</tr>',
				esc_html( $row['label'] ),
				esc_html( $row['value'] )
			);
		}

		$html  = '<div style="font-family:Helvetica,Arial,sans-serif;color:#1a202c;">';
		$html .= sprintf(
			'<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a202c;">%1$s <strong>%2$s</strong>,</p>',
			esc_html__( 'Hi', 'doublescale' ),
			esc_html( $customer_name )
		);
		$html .= sprintf(
			'<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#4a5568;">%s</p>',
			$intro // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above or via esc_html__.
		);

		$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;border-collapse:collapse;background-color:#f7fafc;border:1px solid #edf2f7;border-top:4px solid #4c6fff;border-radius:8px;">';
		$html .= '<tr><td style="padding:18px 20px;">';
		$html .= sprintf(
			'<p style="margin:0 0 12px;font-size:12px;line-height:1.4;color:#4c6fff;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">%s</p>',
			esc_html__( 'Proposal Summary', 'doublescale' )
		);
		$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">';
		$html .= $summary_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with escaped values.
		$html .= '</table>';
		$html .= '</td></tr></table>';

		$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px;border-collapse:collapse;">';
		$html .= '<tr><td align="center" bgcolor="#4c6fff" style="border-radius:8px;background-color:#4c6fff;">';
		$html .= sprintf(
			'<a href="%1$s" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">%2$s</a>',
			esc_url( $url ),
			esc_html__( 'View Proposal', 'doublescale' )
		);
		$html .= '</td></tr></table>';

		$html .= sprintf(
			'<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#718096;">%s</p>',
			esc_html__( 'If the button does not work, copy and paste this link into your browser:', 'doublescale' )
		);
		$html .= sprintf(
			'<p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;"><a href="%1$s" style="color:#4c6fff;text-decoration:underline;">%1$s</a></p>',
			esc_url( $url )
		);
		$html .= '</div>';

		return $html;
	}
}
