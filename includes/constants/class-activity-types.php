<?php
/**
 * Activity Types Constants
 * Defines all valid activity types in the system
 *
 * @since 1.2.0
 * @package QuillCRM
 */

namespace QuillCRM\Constants;

/**
 * Activity Types class
 */
class Activity_Types
{
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
	 * Get all valid activity types
	 *
	 * @since 1.2.0
	 *
	 * @return array All activity type constants
	 */
	public static function get_all_types()
	{
		return [
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
		];
	}

	/**
	 * Get editable activity types
	 *
	 * @since 1.2.0
	 *
	 * @return array Editable activity types
	 */
	public static function get_editable_types()
	{
		return [
			self::NOTE,
			self::EMAIL_SENT,
			self::CALL_LOGGED,
			self::MEETING_SCHEDULED,
		];
	}

	/**
	 * Get system-generated activity types
	 *
	 * @since 1.2.0
	 *
	 * @return array System-generated activity types
	 */
	public static function get_system_types()
	{
		return [
			self::CREATED,
			self::DEAL_CREATED,
			self::STAGE_CHANGED,
			self::VALUE_CHANGED,
			self::STATUS_CHANGED,
		];
	}

	/**
	 * Get validation rule for activity types
	 *
	 * @since 1.2.0
	 *
	 * @return string Validation rule
	 */
	public static function get_validation_rule()
	{
		return 'required|in:' . implode( ',', self::get_all_types() );
	}

	/**
	 * Check if an activity type is editable
	 *
	 * @since 1.2.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_editable_type( $type )
	{
		return in_array( $type, self::get_editable_types(), true );
	}

	/**
	 * Check if an activity type is system-generated
	 *
	 * @since 1.2.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_system_type( $type )
	{
		return in_array( $type, self::get_system_types(), true );
	}

	/**
	 * Check if an activity type is valid
	 *
	 * @since 1.2.0
	 *
	 * @param string $type Activity type to check.
	 *
	 * @return bool
	 */
	public static function is_valid_type( $type )
	{
		return in_array( $type, self::get_all_types(), true );
	}

	/**
	 * Get formatted message for activity type
	 *
	 * @since 1.2.0
	 *
	 * @param string $type      Activity type.
	 * @param string $user_name User who performed the action.
	 *
	 * @return string Formatted activity message
	 */
	public static function get_activity_message( $type, $user_name = null )
	{
		if ( null === $user_name ) {
			$user_name = __( 'Unknown User', 'quill-crm' );
		}

		$messages = [
			/* translators: %s: user name */
			self::NOTE              => sprintf( __( '%s added a note', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::EMAIL_SENT        => sprintf( __( '%s sent an email', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::CALL_LOGGED       => sprintf( __( '%s logged a call', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::MEETING_SCHEDULED => sprintf( __( '%s scheduled a meeting', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::DEAL_CREATED      => sprintf( __( '%s created this record', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::STAGE_CHANGED     => sprintf( __( '%s changed the stage', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::VALUE_CHANGED     => sprintf( __( '%s updated the value', 'quill-crm' ), $user_name ),
			/* translators: %s: user name */
			self::STATUS_CHANGED    => sprintf( __( '%s changed the status', 'quill-crm' ), $user_name ),
			self::LOGGED_IN         => __( 'Contact logged in', 'quill-crm' ),
			self::LOGGED_OUT        => __( 'Contact logged out', 'quill-crm' ),
		];

		/* translators: %s: user name */
		return isset( $messages[ $type ] ) ? $messages[ $type ] : sprintf( __( '%s performed an action', 'quill-crm' ), ucfirst( $user_name ) );
	}

	/**
	 * Get activity type label
	 *
	 * @since 1.2.0
	 *
	 * @param string $type Activity type.
	 *
	 * @return string Activity type label
	 */
	public static function get_type_label( $type )
	{
		$labels = [
			self::NOTE              => __( 'Note', 'quill-crm' ),
			self::EMAIL_SENT        => __( 'Email Sent', 'quill-crm' ),
			self::EMAIL_RECEIVED    => __( 'Email Received', 'quill-crm' ),
			self::CALL_LOGGED       => __( 'Call Logged', 'quill-crm' ),
			self::MEETING_SCHEDULED => __( 'Meeting Scheduled', 'quill-crm' ),
			self::SMS_SENT          => __( 'SMS Sent', 'quill-crm' ),
			self::SMS_RECEIVED      => __( 'SMS Received', 'quill-crm' ),
			self::WHATSAPP_SENT     => __( 'WhatsApp Sent', 'quill-crm' ),
			self::WHATSAPP_RECEIVED => __( 'WhatsApp Received', 'quill-crm' ),
			self::CREATED           => __( 'Created', 'quill-crm' ),
			self::DEAL_CREATED      => __( 'Deal Created', 'quill-crm' ),
			self::STAGE_CHANGED     => __( 'Stage Changed', 'quill-crm' ),
			self::VALUE_CHANGED     => __( 'Value Changed', 'quill-crm' ),
			self::STATUS_CHANGED    => __( 'Status Changed', 'quill-crm' ),
			self::LOGGED_IN         => __( 'Logged In', 'quill-crm' ),
			self::LOGGED_OUT        => __( 'Logged Out', 'quill-crm' ),
		];

		return isset( $labels[ $type ] ) ? $labels[ $type ] : ucfirst( str_replace( '_', ' ', $type ) );
	}
}
