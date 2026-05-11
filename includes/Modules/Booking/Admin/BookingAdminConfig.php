<?php
/**
 * Injects booking-specific config into window.doublescaleConfig.booking.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Admin;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Modules\Booking\Models\AvailabilityModel;
use DoubleScale\Modules\Booking\Managers\FieldsManager;
use DoubleScale\Modules\Booking\Managers\LocationsManager;
use DoubleScale\Modules\Booking\Managers\MergeTagsManager;
use DoubleScale\Modules\Booking\Managers\IntegrationsManager;
use DoubleScale\Modules\Booking\Helpers\IntegrationsHelper;
use DoubleScale\Modules\Booking\Integrations\Google\Integration as GoogleIntegration;
use DoubleScale\Modules\Booking\Integrations\Outlook\Integration as OutlookIntegration;
use DoubleScale\Modules\Booking\Integrations\Apple\Integration as AppleIntegration;
use DoubleScale\Modules\Booking\Integrations\Zoom\Integration as ZoomIntegration;
use DoubleScale\UserRoles\Permissions;

final class BookingAdminConfig {

	public static function register(): void {
		add_filter( 'doublescale_admin_config', array( __CLASS__, 'inject_booking_config' ) );
	}

	/**
	 * Build integration definitions for the booking admin bundle (host calendar popups, global settings tabs).
	 *
	 * Mirrors {@see IntegrationsManager::get_options()} after ensuring calendar integrations are registered.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private static function get_booking_integrations_for_admin(): array {
		if ( ! IntegrationsHelper::has_integrations() ) {
			return array();
		}

		$manager = IntegrationsManager::instance();
		$options = $manager->get_options();

		$calendar_primer = array(
			GoogleIntegration::class,
			OutlookIntegration::class,
			AppleIntegration::class,
			ZoomIntegration::class,
		);

		$calendar_slugs = array( 'google', 'outlook', 'apple', 'zoom' );
		$needs_primer   = empty( $options );
		if ( ! $needs_primer ) {
			foreach ( $calendar_slugs as $slug ) {
				$fields = $options[ $slug ]['fields'] ?? null;
				if ( ! is_array( $fields ) || array() === $fields ) {
					$needs_primer = true;
					break;
				}
			}
		}

		if ( $needs_primer ) {
			foreach ( $calendar_primer as $class ) {
				if ( class_exists( $class ) && method_exists( $class, 'instance' ) ) {
					try {
						$class::instance();
					} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
						// One broken integration must not block the rest of the admin config payload.
					}
				}
			}
			$options = $manager->get_options();
		}

		return $options;
	}

	/**
	 * @param array $config The existing admin config payload.
	 * @return array Config with booking data appended.
	 */
	public static function inject_booking_config( array $config ): array {
		$user_id = get_current_user_id();

		$has_calendars    = CalendarModel::where( 'user_id', $user_id )->exists();
		$availabilities   = AvailabilityModel::where( 'user_id', $user_id )->get()->toArray();
		$has_availability = ! empty( $availabilities );

		$locations    = LocationsManager::instance()->get_options();
		$fields_types = FieldsManager::instance()->get_options();
		$merge_tags   = MergeTagsManager::instance()->get_groups();

		$timezones = \DateTimeZone::listIdentifiers();
		$tz_map    = array();
		foreach ( $timezones as $tz ) {
			$tz_map[ $tz ] = $tz;
		}

		$wp_user = wp_get_current_user();

		$config['booking'] = array(
			'hasCalendars'    => $has_calendars,
			'hasAvailability' => $has_availability,
			'timezones'       => $tz_map,
			'locations'       => $locations,
			'availabilities'  => $availabilities,
			'fieldsTypes'     => $fields_types,
			'mergeTags'       => $merge_tags,
			'integrations'    => self::get_booking_integrations_for_admin(),
			'paymentGateways' => array(),
			'capabilities'    => array(),
			'currentUser'     => array(
				'id'           => (int) $wp_user->ID,
				'display_name' => $wp_user->display_name,
				'email'        => $wp_user->user_email,
				// `is_admin` collapses Administrator into CRM Manager — same
				// pattern as {@see Permissions::is_crm_manager()} in CRM core.
				// Admins and CRM Managers both evaluate true; Sales Manager
				// and Sales Rep evaluate false.
				'is_admin'     => Permissions::is_crm_manager(),
				'capabilities' => array(),
			),
		);

		return self::append_booking_caps_and_gateways( $config );
	}

	/**
	 * Merge booking caps and gateway options into config['booking'] (must exist).
	 *
	 * @param array $config Admin config with booking key set.
	 * @return array
	 */
	private static function append_booking_caps_and_gateways( array $config ): array {
		$booking_caps = array();
		$all_caps     = wp_get_current_user()->allcaps;
		foreach ( $all_caps as $cap => $granted ) {
			if ( strpos( $cap, 'doublescale_booking_' ) === 0 && $granted ) {
				$booking_caps[ $cap ] = true;
			}
		}
		$config['booking']['capabilities']                  = $booking_caps;
		$config['booking']['currentUser']['capabilities']   = $booking_caps;

		$payment_gateways = (array) apply_filters( 'doublescale_booking_payment_gateways', array() );
		$gw_options       = array();
		foreach ( $payment_gateways as $gw ) {
			if ( is_object( $gw ) && method_exists( $gw, 'get_options' ) ) {
				$gw_options[ $gw->slug ] = $gw->get_options();
			}
		}
		$config['booking']['paymentGateways'] = array_replace( (array) $config['booking']['paymentGateways'], $gw_options );

		return $config;
	}
}
