<?php
/**
 * Sales module settings (email templates, notifications).
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\PaymentMode;
use DoubleScale\Core\Payment\GatewayManager;

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
			'proposal_expiry_reminder_days' => 3,
			'require_signature_on_accept'   => true,
			'default_offline_payment_modes' => array(
				PaymentMode::BANK_TRANSFER,
				PaymentMode::CASH,
				PaymentMode::CHECK,
			),
			'default_online_payment_gateways' => array(
				PaymentMode::STRIPE,
			),
			'rep_notification_templates'      => SalesRepNotificationTemplates::defaults(),
			'pdf_company_address'             => '',
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
		$merged = array_merge( self::defaults(), $stored );
		$merged['enabled_online_gateways'] = self::get_resolved_enabled_online_gateways();
		$merged['rep_notification_templates'] = self::merge_rep_notification_templates(
			$merged['rep_notification_templates'] ?? array()
		);

		return $merged;
	}

	/**
	 * @param mixed $stored Stored templates.
	 * @return array<string, array{title: string, message: string}>
	 */
	private static function merge_rep_notification_templates( $stored ): array {
		$defaults = SalesRepNotificationTemplates::defaults();
		if ( ! is_array( $stored ) ) {
			return $defaults;
		}

		$merged = array();
		foreach ( $defaults as $key => $default ) {
			$custom = isset( $stored[ $key ] ) && is_array( $stored[ $key ] ) ? $stored[ $key ] : array();
			$merged[ $key ] = array(
				'title'   => '' !== trim( (string) ( $custom['title'] ?? '' ) )
					? (string) $custom['title']
					: (string) $default['title'],
				'message' => '' !== trim( (string) ( $custom['message'] ?? '' ) )
					? (string) $custom['message']
					: (string) $default['message'],
			);
		}

		return $merged;
	}

	/**
	 * Explicit enabled gateway slugs from storage, or null when unset (all registered).
	 *
	 * @return string[]|null
	 */
	public static function get_enabled_online_gateways(): ?array {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) || ! array_key_exists( 'enabled_online_gateways', $stored ) ) {
			return null;
		}

		return PaymentMode::normalize_list( $stored['enabled_online_gateways'] );
	}

	/**
	 * Gateways enabled for sales invoices (intersected with registered implementations).
	 *
	 * @return string[]
	 */
	public static function get_resolved_enabled_online_gateways(): array {
		$registered = GatewayManager::instance()->invoice_slugs();
		$explicit   = self::get_enabled_online_gateways();

		if ( null === $explicit ) {
			return $registered;
		}

		return array_values( array_intersect( $explicit, $registered ) );
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
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		$merged = array_merge( self::defaults(), $stored, $settings );
		$clean  = array();

		$string_keys = array(
			'proposal_email_subject',
			'proposal_email_intro',
			'invoice_email_subject',
			'invoice_email_intro',
			'pdf_company_address',
		);
		foreach ( $string_keys as $key ) {
			if ( ! array_key_exists( $key, $merged ) ) {
				continue;
			}
			if ( 'pdf_company_address' === $key ) {
				$clean[ $key ] = sanitize_textarea_field( (string) $merged[ $key ] );
			} else {
				$clean[ $key ] = sanitize_text_field( (string) $merged[ $key ] );
			}
		}

		$bool_keys = array(
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

		if ( array_key_exists( 'rep_notification_templates', $merged ) ) {
			$clean['rep_notification_templates'] = SalesRepNotificationTemplates::sanitize_templates(
				$merged['rep_notification_templates']
			);
		}

		$mode_list_keys = array(
			'enabled_online_gateways',
			'default_offline_payment_modes',
			'default_online_payment_gateways',
		);
		foreach ( $mode_list_keys as $key ) {
			if ( ! array_key_exists( $key, $merged ) ) {
				continue;
			}

			$list = PaymentMode::normalize_list( $merged[ $key ] );

			if ( 'enabled_online_gateways' === $key ) {
				$list = array_values( array_intersect( $list, GatewayManager::instance()->invoice_slugs() ) );
			} elseif ( 'default_offline_payment_modes' === $key ) {
				$list = array_values(
					array_filter(
						$list,
						static function ( string $mode ): bool {
							return PaymentMode::is_offline( $mode );
						}
					)
				);
			} elseif ( 'default_online_payment_gateways' === $key ) {
				$list = array_values(
					array_filter(
						$list,
						static function ( string $mode ): bool {
							return PaymentMode::is_online_gateway( $mode );
						}
					)
				);
			}

			$clean[ $key ] = $list;
		}

		update_option( self::OPTION_KEY, array_merge( $stored, $clean ) );
	}
}
