<?php
/**
 * Booking provisioner: auto-creates / soft-retires host calendars based on CRM role grants.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\Models\AvailabilityModel;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Core\UserRoles\UserRoles;

final class BookingProvisioner {

	/**
	 * Idempotently ensure a host calendar exists (and is active) for the given user.
	 *
	 * Re-activates a previously soft-retired calendar on role re-grant.
	 *
	 * @param int $user_id WP user id.
	 * @return CalendarModel|null
	 */
	public function ensure_host_calendar( int $user_id ): ?CalendarModel {
		if ( $user_id <= 0 ) {
			return null;
		}

		$user = get_userdata( $user_id );
		if ( ! $user || ! $user->exists() ) {
			return null;
		}

		$calendar = CalendarModel::where( 'user_id', $user_id )
			->where( 'type', 'host' )
			->first();

		if ( $calendar ) {
			if ( 'active' !== $calendar->status ) {
				$calendar->status = 'active';
				$calendar->save();
			}
			// Calendars created without a stored timezone fall back to the
			// user's site/profile timezone so the settings UI never renders
			// `timezone: null` (which would disable the Save button).
			if ( ! $calendar->timezone ) {
				$calendar->timezone = self::resolve_default_timezone( $user_id );
			}
			self::ensure_default_availability( $user_id );
			return $calendar;
		}

		$name = $user->display_name ? $user->display_name : $user->user_login;

		$calendar = CalendarModel::create(
			array(
				'user_id' => $user_id,
				'name'    => $name,
				'type'    => 'host',
				'status'  => 'active',
			)
		);

		$calendar->timezone = self::resolve_default_timezone( $user_id );

		self::ensure_default_availability( $user_id );

		return $calendar;
	}

	/**
	 * Ensure the user has at least one availability row flagged as default.
	 * Required by RestEventController, which refuses to create events when no
	 * default exists for the calendar owner.
	 */
	private static function ensure_default_availability( int $user_id ): void {
		$existing = AvailabilityModel::where( 'user_id', $user_id )
			->where( 'is_default', 1 )
			->first();
		if ( $existing ) {
			return;
		}
		AvailabilityModel::createDefaultForUser( $user_id );
	}

	/**
	 * Resolve a sensible default timezone string for a user, falling back to
	 * the WP site timezone and finally UTC.
	 */
	private static function resolve_default_timezone( int $user_id ): string {
		$timezone = get_user_meta( $user_id, 'timezone_string', true );
		if ( $timezone ) {
			return (string) $timezone;
		}
		$site_tz = wp_timezone_string();
		return $site_tz ? $site_tz : 'UTC';
	}

	/**
	 * Soft-retire all host calendars for a user. Bookings are preserved.
	 *
	 * @param int $user_id WP user id.
	 */
	public function deactivate_host_calendars( int $user_id ): void {
		if ( $user_id <= 0 ) {
			return;
		}

		CalendarModel::where( 'user_id', $user_id )
			->where( 'type', 'host' )
			->update( array( 'status' => 'inactive' ) );
	}

	/**
	 * Clean up booking-side data when a user is no longer a booking host.
	 *
	 * Used both when a user is removed from the CRM team (role revoked, WP
	 * user still exists) and when the WP user is deleted entirely. In both
	 * cases the user is no longer a host, so their dead config (availability
	 * + calendars without bookings) is removed. Calendars with historical
	 * bookings are deactivated rather than deleted so `bookings`/`booking_hosts`
	 * keep referential context for past appointments. `booking_hosts` rows
	 * are intentionally left in place — past attendees should still see who
	 * they were booked with even after the host is gone.
	 */
	public function purge_host_data( int $user_id ): void {
		if ( $user_id <= 0 ) {
			return;
		}

		try {
			$calendars = CalendarModel::where( 'user_id', $user_id )->get();
			foreach ( $calendars as $calendar ) {
				if ( $calendar->bookings()->exists() ) {
					$calendar->status = 'inactive';
					$calendar->save();
					continue;
				}

				foreach ( $calendar->events as $event ) {
					$event->delete();
				}
				$calendar->meta()->delete();
				$calendar->delete();
			}

			AvailabilityModel::where( 'user_id', $user_id )->delete();
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Failed to purge booking host data',
				array(
					'source'  => 'booking-provisioner',
					'user_id' => $user_id,
					'error'   => $e->getMessage(),
				)
			);
		}
	}

	/**
	 * Whether a role slug entitles its holder to a host calendar.
	 */
	public static function is_booking_eligible_role( string $role ): bool {
		return in_array(
			$role,
			array(
				'administrator',
				UserRoles::CRM_MANAGER,
				UserRoles::SALES_MANAGER,
				UserRoles::SALES_REP,
			),
			true
		);
	}

	/**
	 * Whether the user currently holds any booking-eligible role.
	 */
	public static function user_has_any_booking_role( int $user_id ): bool {
		$user = get_userdata( $user_id );
		if ( ! $user || ! $user->exists() ) {
			return false;
		}

		foreach ( (array) $user->roles as $role ) {
			if ( self::is_booking_eligible_role( $role ) ) {
				return true;
			}
		}

		return false;
	}

	/*
	------------------------------------------------------------------ *
	 * Action listeners (wired in Module::boot()).
	 *
	 * `on_role_assigned` / `on_role_revoked` fire from the CRM Team REST
	 * controller (Settings → Team UI), which is the source of truth for booking
	 * hosts. `on_set_user_role` / `on_user_register` are gated on the
	 * `administrator` role at the hook layer in Module::register_provisioner_hooks().
	 * ------------------------------------------------------------------ */

	public function on_role_assigned( int $user_id, string $role ): void {
		if ( ! self::is_booking_eligible_role( $role ) ) {
			return;
		}
		$this->ensure_host_calendar( $user_id );
	}

	public function on_role_revoked( int $user_id, string $role ): void {
		unset( $role );
		if ( self::user_has_any_booking_role( $user_id ) ) {
			return;
		}
		$this->purge_host_data( $user_id );
	}

	public function on_set_user_role( int $user_id, string $role ): void {
		if ( self::is_booking_eligible_role( $role ) ) {
			$this->ensure_host_calendar( $user_id );
			return;
		}

		// Role replaced with a non-booking role: clean up if no other booking role remains.
		if ( ! self::user_has_any_booking_role( $user_id ) ) {
			$this->purge_host_data( $user_id );
		}
	}

	public function on_user_register( int $user_id ): void {
		if ( self::user_has_any_booking_role( $user_id ) ) {
			$this->ensure_host_calendar( $user_id );
		}
	}
}
