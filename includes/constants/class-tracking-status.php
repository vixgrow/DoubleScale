<?php
/**
 * Tracking Status Constants
 * Defines integer constants for message tracking statuses
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Constants;

/**
 * Tracking_Status class
 */
class Tracking_Status {

	/**
	 * Pending - Message queued but not sent yet
	 */
	const PENDING = 1;

	/**
	 * Sent - Message successfully sent
	 */
	const SENT = 2;

	/**
	 * Failed - Message failed to send
	 */
	const FAILED = 3;

	/**
	 * Delivered - Message delivered (SMS/WhatsApp)
	 */
	const DELIVERED = 4;

	/**
	 * Scheduled - Message scheduled for future sending
	 */
	const SCHEDULED = 5;

	/**
	 * Get all statuses
	 *
	 * @return array Associative array of status constants to labels
	 */
	public static function get_all() {
		return array(
			self::PENDING   => __( 'Pending', 'quillcrm' ),
			self::SENT      => __( 'Sent', 'quillcrm' ),
			self::FAILED    => __( 'Failed', 'quillcrm' ),
			self::DELIVERED => __( 'Delivered', 'quillcrm' ),
			self::SCHEDULED => __( 'Scheduled', 'quillcrm' ),
		);
	}

	/**
	 * Get status name/label
	 *
	 * @param int $status Status constant value.
	 * @return string Status label
	 */
	public static function get_name( $status ) {
		$statuses = self::get_all();
		return $statuses[ $status ] ?? __( 'Unknown', 'quillcrm' );
	}

	/**
	 * Get status slug (for backwards compatibility and API)
	 *
	 * @param int $status Status constant value.
	 * @return string Status slug
	 */
	public static function get_slug( $status ) {
		$map = array(
			self::PENDING   => 'pending',
			self::SENT      => 'sent',
			self::FAILED    => 'failed',
			self::DELIVERED => 'delivered',
			self::SCHEDULED => 'scheduled',
		);
		return $map[ $status ] ?? 'unknown';
	}

	/**
	 * Get status constant from slug (for API input)
	 *
	 * @param string $slug Status slug.
	 * @return int|null Status constant or null if not found
	 */
	public static function from_slug( $slug ) {
		$map = array(
			'pending'   => self::PENDING,
			'sent'      => self::SENT,
			'failed'    => self::FAILED,
			'delivered' => self::DELIVERED,
			'scheduled' => self::SCHEDULED,
		);
		return $map[ strtolower( $slug ) ] ?? null;
	}

	/**
	 * Check if status is valid
	 *
	 * @param int $status Status to validate.
	 * @return bool True if valid status
	 */
	public static function is_valid( $status ) {
		$statuses = self::get_all();
		return isset( $statuses[ $status ] );
	}

	/**
	 * Get statuses for email mode
	 *
	 * @return array Status constants applicable to emails
	 */
	public static function get_email_statuses() {
		return array(
			self::PENDING   => self::get_name( self::PENDING ),
			self::SENT      => self::get_name( self::SENT ),
			self::FAILED    => self::get_name( self::FAILED ),
			self::SCHEDULED => self::get_name( self::SCHEDULED ),
		);
	}

	/**
	 * Get statuses for SMS/WhatsApp mode
	 *
	 * @return array Status constants applicable to SMS/WhatsApp
	 */
	public static function get_messaging_statuses() {
		return array(
			self::PENDING   => self::get_name( self::PENDING ),
			self::SENT      => self::get_name( self::SENT ),
			self::DELIVERED => self::get_name( self::DELIVERED ),
			self::FAILED    => self::get_name( self::FAILED ),
			self::SCHEDULED => self::get_name( self::SCHEDULED ),
		);
	}

	/**
	 * Get status color class for UI
	 *
	 * @param int $status Status constant.
	 * @return string CSS class name
	 */
	public static function get_status_class( $status ) {
		$classes = array(
			self::PENDING   => 'status-pending',
			self::SENT      => 'status-sent',
			self::FAILED    => 'status-failed',
			self::DELIVERED => 'status-delivered',
			self::SCHEDULED => 'status-scheduled',
		);
		return $classes[ $status ] ?? 'status-unknown';
	}

}

