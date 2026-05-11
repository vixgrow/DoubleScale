<?php
/**
 * Booking module capabilities.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking;

use WP_Roles;
use WP_User;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Modules\Booking\Models\EventModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\UserRoles\UserRoles;

class Capabilities {

	public static function get_core_capabilities() {
		return array(
			'calendars'    => array(
				'title'        => __( 'Calendar Management', 'doublescale' ),
				'capabilities' => array(
					'doublescale_booking_manage_own_calendars' => __( 'Manage only the user\'s own calendars', 'doublescale' ),
					'doublescale_booking_read_all_calendars'   => __( 'Read access to all calendars across users', 'doublescale' ),
					'doublescale_booking_manage_all_calendars' => __( 'Manage all calendars created by all users', 'doublescale' ),
				),
			),
			'bookings'     => array(
				'title'        => __( 'Booking Access', 'doublescale' ),
				'capabilities' => array(
					'doublescale_booking_read_own_bookings'   => __( 'Read only the user\'s own bookings', 'doublescale' ),
					'doublescale_booking_read_all_bookings'   => __( 'Read access to all bookings', 'doublescale' ),
					'doublescale_booking_manage_own_bookings' => __( 'Manage only the user\'s own bookings', 'doublescale' ),
					'doublescale_booking_manage_all_bookings' => __( 'Manage all bookings across calendars', 'doublescale' ),
				),
			),
			'availability' => array(
				'title'        => __( 'Availability Management', 'doublescale' ),
				'capabilities' => array(
					'doublescale_booking_read_own_availability'   => __( 'Read only the user\'s own availability', 'doublescale' ),
					'doublescale_booking_read_all_availability'   => __( 'Read access to all availability schedules across users', 'doublescale' ),
					'doublescale_booking_manage_own_availability' => __( 'Manage only the user\'s own availability schedules', 'doublescale' ),
					'doublescale_booking_manage_all_availability' => __( 'Manage all availability schedules for all users', 'doublescale' ),
				),
			),
		);
	}

	public static function current_user_can( $capability ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}
		return current_user_can( $capability );
	}

	public static function get_current_user_capabilities() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return array();
		}

		if ( is_multisite() && is_super_admin( $user_id ) ) {
			$all_caps = self::get_all_capabilities();
			return array_fill_keys( $all_caps, true );
		}

		$user         = new WP_User( $user_id );
		$capabilities = $user->get_role_caps();
		$booking_caps = self::get_all_capabilities();
		$allowed_keys = array_merge( $booking_caps, array( 'manage_options' ) );

		return array_intersect_key( $capabilities, array_flip( $allowed_keys ) );
	}

	public static function get_all_capabilities() {
		$capabilities     = self::get_core_capabilities();
		$all_capabilities = array( 'doublescale_access' );

		foreach ( $capabilities as $group ) {
			$all_capabilities = array_merge( $all_capabilities, array_keys( $group['capabilities'] ) );
		}

		return $all_capabilities;
	}

	public static function get_basic_capabilities() {
		$capabilities       = self::get_core_capabilities();
		$basic_capabilities = array( 'doublescale_access' );

		foreach ( $capabilities as $group ) {
			foreach ( $group['capabilities'] as $capability => $description ) {
				if ( strpos( $capability, 'own' ) !== false ) {
					$basic_capabilities[] = $capability;
				}
			}
		}

		return $basic_capabilities;
	}

	/**
	 * Capabilities granted to a single role per the matrix.
	 *
	 * - administrator + CRM Manager: full caps (own + all_*).
	 * - Sales Manager: own caps + read_all_* (visibility into the team's calendars/bookings/availability, no edit).
	 * - Sales Rep: own caps only.
	 *
	 * @param string $role Role slug.
	 * @return string[] Capability names.
	 */
	public static function get_caps_for_role( string $role ): array {
		switch ( $role ) {
			case 'administrator':
			case UserRoles::CRM_MANAGER:
				return self::get_all_capabilities();

			case UserRoles::SALES_MANAGER:
				$caps = array( 'doublescale_access' );
				foreach ( self::get_core_capabilities() as $group ) {
					foreach ( $group['capabilities'] as $capability => $description ) {
						if ( strpos( $capability, '_own_' ) !== false || strpos( $capability, '_read_all_' ) !== false ) {
							$caps[] = $capability;
						}
					}
				}
				return $caps;

			case UserRoles::SALES_REP:
				return self::get_basic_capabilities();
		}

		return array();
	}

	/**
	 * Roles that receive booking caps.
	 *
	 * @return string[]
	 */
	private static function managed_roles(): array {
		return array(
			'administrator',
			UserRoles::CRM_MANAGER,
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
		);
	}

	public static function assign_capabilities_for_user_roles() {
		global $wp_roles;

		if ( ! class_exists( 'WP_Roles' ) ) {
			return;
		}

		if ( ! isset( $wp_roles ) ) {
			$wp_roles = new WP_Roles();
		}

		// TODO: multisite — `$wp_roles->add_cap()` only affects the current blog. For multisite installs
		// where non-super-admins should receive booking caps on sub-sites, wrap this loop in a
		// `switch_to_blog()` over `get_sites()`. Single-site is the assumption for now.
		foreach ( self::managed_roles() as $role_slug ) {
			foreach ( self::get_caps_for_role( $role_slug ) as $capability ) {
				$wp_roles->add_cap( $role_slug, $capability );
			}
		}

		if ( is_multisite() ) {
			add_filter( 'user_has_cap', array( __CLASS__, 'grant_super_admin_capabilities' ), 10, 4 );
		}
	}

	public static function grant_super_admin_capabilities( $allcaps, $caps, $args, $user ) {
		if ( ! is_multisite() || ! is_super_admin( $user->ID ) ) {
			return $allcaps;
		}

		$plugin_capabilities = self::get_all_capabilities();

		foreach ( $caps as $cap ) {
			if ( in_array( $cap, $plugin_capabilities, true ) ) {
				$allcaps[ $cap ] = true;
			}
		}

		return $allcaps;
	}

	public static function can_manage_calendar( $calendar_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		$calendar = CalendarModel::find( $calendar_id );

		if ( ! $calendar ) {
			return true;
		}

		if ( $calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	public static function can_read_calendar( $calendar_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		$calendar = CalendarModel::find( $calendar_id );

		if ( ! $calendar ) {
			return true;
		}

		if ( $calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'doublescale_booking_read_all_calendars' );
	}

	public static function can_manage_event( $event_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		$event = EventModel::find( $event_id );

		if ( ! $event ) {
			return true;
		}

		if ( $event->calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	public static function can_read_event( $event_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		$event = EventModel::find( $event_id );

		if ( ! $event ) {
			return false;
		}

		if ( $event->calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'doublescale_booking_read_all_calendars' );
	}

	public static function can_manage_booking( $booking_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		if ( current_user_can( 'doublescale_booking_manage_all_bookings' ) ) {
			return true;
		}

		$booking = BookingModel::find( $booking_id );

		if ( ! $booking ) {
			return false;
		}

		return $booking->getOwnerUserId() === get_current_user_id();
	}

	public static function can_read_booking( $booking_id ) {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		if ( current_user_can( 'doublescale_booking_read_all_bookings' ) ) {
			return true;
		}

		$booking = BookingModel::with( 'event', 'calendar' )->find( $booking_id );

		if ( ! $booking ) {
			return false;
		}

		if ( current_user_can( 'doublescale_booking_read_own_bookings' ) && $booking->getOwnerUserId() === get_current_user_id() ) {
			return true;
		}

		return false;
	}

	public static function remove_capabilities() {
		global $wp_roles;

		if ( ! class_exists( 'WP_Roles' ) ) {
			return;
		}

		if ( ! isset( $wp_roles ) ) {
			$wp_roles = new WP_Roles();
		}

		$all_caps = self::get_all_capabilities();

		foreach ( self::managed_roles() as $role_slug ) {
			foreach ( $all_caps as $capability ) {
				$wp_roles->remove_cap( $role_slug, $capability );
			}
		}

		remove_filter( 'user_has_cap', array( __CLASS__, 'grant_super_admin_capabilities' ), 10 );
	}
}
