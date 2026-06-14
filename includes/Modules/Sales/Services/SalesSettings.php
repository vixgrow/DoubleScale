<?php
/**
 * Sales module settings (email templates, notifications).
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

/**
 * SalesSettings service.
 */
final class SalesSettings {

	private const OPTION_KEY = 'doublescale_sales_settings';

	/**
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'proposal_email_subject'        => __( 'Proposal: {subject}', 'doublescale' ),
			'proposal_email_intro'          => __( 'Please review the proposal below and let us know if you would like to accept or decline.', 'doublescale' ),
			'invoice_email_subject'         => __( 'Invoice: {invoice_number}', 'doublescale' ),
			'invoice_email_intro'           => __( 'Please review your invoice and pay the balance due when ready.', 'doublescale' ),
			'notify_rep_proposal_sent'      => true,
			'notify_rep_proposal_accepted'  => true,
			'notify_rep_proposal_declined'  => true,
			'notify_rep_invoice_paid'       => true,
			'proposal_expiry_reminder_days' => 3,
			'require_signature_on_accept'   => true,
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	public static function get_all(): array {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		return array_merge( self::defaults(), $stored );
	}

	/**
	 * @param string $key Setting key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	public static function get( string $key, $default = null ) {
		$all = self::get_all();
		if ( array_key_exists( $key, $all ) ) {
			return $all[ $key ];
		}
		return null !== $default ? $default : ( self::defaults()[ $key ] ?? null );
	}

	/**
	 * @param array<string, mixed> $settings Settings payload.
	 * @return void
	 */
	public static function update( array $settings ): void {
		$merged = array_merge( self::defaults(), self::get_all(), $settings );
		$clean  = array();

		$string_keys = array(
			'proposal_email_subject',
			'proposal_email_intro',
			'invoice_email_subject',
			'invoice_email_intro',
		);
		foreach ( $string_keys as $key ) {
			if ( array_key_exists( $key, $merged ) ) {
				$clean[ $key ] = sanitize_text_field( (string) $merged[ $key ] );
			}
		}

		$bool_keys = array(
			'notify_rep_proposal_sent',
			'notify_rep_proposal_accepted',
			'notify_rep_proposal_declined',
			'notify_rep_invoice_paid',
			'require_signature_on_accept',
		);
		foreach ( $bool_keys as $key ) {
			if ( array_key_exists( $key, $merged ) ) {
				$clean[ $key ] = (bool) $merged[ $key ];
			}
		}

		if ( array_key_exists( 'proposal_expiry_reminder_days', $merged ) ) {
			$clean['proposal_expiry_reminder_days'] = max( 0, min( 30, (int) $merged['proposal_expiry_reminder_days'] ) );
		}

		update_option( self::OPTION_KEY, array_merge( self::get_all(), $clean ) );
	}
}
