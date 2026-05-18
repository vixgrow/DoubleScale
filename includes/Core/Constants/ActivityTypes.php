<?php
/**
 * Activity Types Constants
 * Defines all valid activity types in the system
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Constants;


defined( 'ABSPATH' ) || exit;

/**
 * Activity Types class
 */
class ActivityTypes {

	/**
	 * User-generated activity types
	 */
	const NOTE              = 'note';
	const EMAIL_SENT        = 'email_sent';
	const EMAIL_RECEIVED    = 'email_received';
	const CALL_LOGGED       = 'call_logged';
	const MEETING_SCHEDULED = 'meeting_scheduled';

	/**
	 * Messaging activity types
	 */
	const SMS_SENT          = 'sms_sent';
	const SMS_RECEIVED      = 'sms_received';
	const WHATSAPP_SENT     = 'whatsapp_sent';
	const WHATSAPP_RECEIVED = 'whatsapp_received';

	/**
	 * System-generated activity types
	 */
	const CREATED        = 'created';
	const DEAL_CREATED   = 'deal_created';
	const STAGE_CHANGED  = 'stage_changed';
	const VALUE_CHANGED  = 'value_changed';
	const STATUS_CHANGED = 'status_changed';

	/**
	 * Authentication activity types
	 */
	const LOGGED_IN  = 'logged_in';
	const LOGGED_OUT = 'logged_out';

	/**
	 * Booking lifecycle types — virtual rows projected from `doublescale_bookings`
	 * via `ActivityManager::build_bookings_union_sql()`. Read-only; the source of
	 * truth is the booking row itself, edits go through booking endpoints.
	 */
	const BOOKING_SCHEDULED   = 'booking_scheduled';
	const BOOKING_CONFIRMED   = 'booking_confirmed';
	const BOOKING_PENDING     = 'booking_pending';
	const BOOKING_RESCHEDULED = 'booking_rescheduled';
	const BOOKING_CANCELLED   = 'booking_cancelled';
	const BOOKING_COMPLETED   = 'booking_completed';
	const BOOKING_REJECTED    = 'booking_rejected';

	/**
	 * Get all valid activity types
	 *
	 * @since 1.0.0
	 *
	 * @return array All activity type constants
	 */
	public static function get_all_types() {
		return array(
			self::NOTE,
			self::EMAIL_SENT,
			self::EMAIL_RECEIVED,
			self::CALL_LOGGED,
			self::MEETING_SCHEDULED,
			self::SMS_SENT,
			self::SMS_RECEIVED,
			self::WHATSAPP_SENT,
			self::WHATSAPP_RECEIVED,
			self::CREATED,
			self::DEAL_CREATED,
			self::STAGE_CHANGED,
			self::VALUE_CHANGED,
			self::STATUS_CHANGED,
			self::LOGGED_IN,
			self::LOGGED_OUT,
			self::BOOKING_SCHEDULED,
			self::BOOKING_CONFIRMED,
			self::BOOKING_PENDING,
			self::BOOKING_RESCHEDULED,
			self::BOOKING_CANCELLED,
			self::BOOKING_COMPLETED,
			self::BOOKING_REJECTED,
		);
	}

	/**
	 * Get editable activity types
	 *
	 * @since 1.0.0
	 *
	 * @return array Editable activity types
	 */
	public static function get_editable_types() {
		return array(
			self::NOTE,
			self::EMAIL_SENT,
			self::CALL_LOGGED,
			self::MEETING_SCHEDULED,
		);
	}

	/**
	 * Get system-generated activity types
	 *
	 * @since 1.0.0
	 *
	 * @return array System-generated activity types
	 */
	public static function get_system_types() {
		 return array(
			 self::CREATED,
			 self::DEAL_CREATED,
			 self::STAGE_CHANGED,
			 self::VALUE_CHANGED,
			 self::STATUS_CHANGED,
		 );
	}

	/**
	 * Get validation rule for activity types
	 *
	 * @since 1.0.0
	 *
	 * @return string Validation rule
	 */
	public static function get_validation_rule() {
		return 'required|in:' . implode( ',', self::get_all_types() );
	}

	/**
	 * Check if an activity type is editable
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_editable_type( $type ) {
		return in_array( $type, self::get_editable_types(), true );
	}

	/**
	 * Check if an activity type is system-generated
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_system_type( $type ) {
		return in_array( $type, self::get_system_types(), true );
	}

	/**
	 * Check if an activity type is valid
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_valid_type( $type ) {
		 return in_array( $type, self::get_all_types(), true );
	}

	/**
	 * Get formatted message for activity type
	 *
	 * @since 1.0.0
	 *
	 * @param string $type      Activity type.
	 * @param string $user_name User who performed the action.
	 *
	 * @return string Formatted activity message
	 */
	public static function get_activity_message( $type, $user_name = null ) {
		if ( null === $user_name ) {
			$user_name = __( 'Unknown User', 'doublescale');
		}

		$messages = array(
			/* translators: %s: user name */
			self::NOTE              => sprintf( __( '%s added a note', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::EMAIL_SENT        => sprintf( __( '%s sent an email', 'doublescale'), $user_name ),
			self::EMAIL_RECEIVED    => __( 'Email received', 'doublescale'),
			/* translators: %s: user name */
			self::CALL_LOGGED       => sprintf( __( '%s logged a call', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::MEETING_SCHEDULED => sprintf( __( '%s scheduled a meeting', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::SMS_SENT          => sprintf( __( '%s sent an Sms', 'doublescale'), $user_name ),
			self::SMS_RECEIVED      => __( 'Sms received', 'doublescale'),
			/* translators: %s: user name */
			self::WHATSAPP_SENT     => sprintf( __( '%s sent a WhatsApp message', 'doublescale'), $user_name ),
			self::WHATSAPP_RECEIVED => __( 'Whatsapp message received', 'doublescale'),
			/* translators: %s: user name */
			self::DEAL_CREATED      => sprintf( __( '%s created this record', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::STAGE_CHANGED     => sprintf( __( '%s changed the stage', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::VALUE_CHANGED     => sprintf( __( '%s updated the value', 'doublescale'), $user_name ),
			/* translators: %s: user name */
			self::STATUS_CHANGED    => sprintf( __( '%s changed the status', 'doublescale'), $user_name ),
			self::LOGGED_IN         => __( 'Contact logged in', 'doublescale'),
			self::LOGGED_OUT        => __( 'Contact logged out', 'doublescale'),
		);

		/* translators: %s: user name */
		return isset( $messages[ $type ] ) ? $messages[ $type ] : sprintf( __( '%s performed an action', 'doublescale'), ucfirst( $user_name ) );
	}

	/**
	 * Get activity type label
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Activity type.
	 *
	 * @return string Activity type label
	 */
	public static function get_type_label( $type ) {
		$labels = array(
			self::NOTE              => __( 'Note', 'doublescale'),
			self::EMAIL_SENT        => __( 'Email Sent', 'doublescale'),
			self::EMAIL_RECEIVED    => __( 'Email Received', 'doublescale'),
			self::CALL_LOGGED       => __( 'Call Logged', 'doublescale'),
			self::MEETING_SCHEDULED => __( 'Meeting Scheduled', 'doublescale'),
			self::SMS_SENT          => __( 'Sms Sent', 'doublescale'),
			self::SMS_RECEIVED      => __( 'Sms Received', 'doublescale'),
			self::WHATSAPP_SENT     => __( 'Whatsapp Sent', 'doublescale'),
			self::WHATSAPP_RECEIVED => __( 'Whatsapp Received', 'doublescale'),
			self::CREATED           => __( 'Created', 'doublescale'),
			self::DEAL_CREATED      => __( 'Deal Created', 'doublescale'),
			self::STAGE_CHANGED     => __( 'Stage Changed', 'doublescale'),
			self::VALUE_CHANGED     => __( 'Value Changed', 'doublescale'),
			self::STATUS_CHANGED    => __( 'Status Changed', 'doublescale'),
			self::LOGGED_IN         => __( 'Logged In', 'doublescale'),
			self::LOGGED_OUT        => __( 'Logged Out', 'doublescale'),
			self::BOOKING_SCHEDULED   => __( 'Booking Scheduled', 'doublescale' ),
			self::BOOKING_CONFIRMED   => __( 'Booking Confirmed', 'doublescale' ),
			self::BOOKING_PENDING     => __( 'Booking Pending', 'doublescale' ),
			self::BOOKING_RESCHEDULED => __( 'Booking Rescheduled', 'doublescale' ),
			self::BOOKING_CANCELLED   => __( 'Booking Cancelled', 'doublescale' ),
			self::BOOKING_COMPLETED   => __( 'Booking Completed', 'doublescale' ),
			self::BOOKING_REJECTED    => __( 'Booking Rejected', 'doublescale' ),
		);

		return isset( $labels[ $type ] ) ? $labels[ $type ] : ucfirst( str_replace( '_', ' ', $type ) );
	}
}
