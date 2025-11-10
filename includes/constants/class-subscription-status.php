<?php

/**
 * Class Subscription Status
 *
 * This class is responsible for handling the subscription status constants
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Constants;

/**
 * Subscription Status class
 */
class Subscription_Status {



	/**
	 * Pending
	 */
	const PENDING = 'wc-pending';

	/**
	 * Active
	 */
	const ACTIVE = 'wc-active';

	/**
	 * On Hold
	 */
	const ON_HOLD = 'wc-on-hold';

	/**
	 * Cancelled
	 */
	const CANCELLED = 'wc-cancelled';

	/**
	 * Switched
	 */
	const SWITCHED = 'wc-switched';

	/**
	 * Expired
	 */
	const EXPIRED = 'wc-expired';

	/**
	 * Pending Cancellation
	 */
	const PENDING_CANCEL = 'wc-pending-cancel';

	/**
	 * Get all statuses
	 *
	 * @return array
	 */
	public static function get_all() {
		return array(
			self::PENDING        => __( 'Pending', 'quillcrm' ),
			self::ACTIVE         => __( 'Active', 'quillcrm' ),
			self::ON_HOLD        => __( 'On Hold', 'quillcrm' ),
			self::CANCELLED      => __( 'Cancelled', 'quillcrm' ),
			self::SWITCHED       => __( 'Switched', 'quillcrm' ),
			self::EXPIRED        => __( 'Expired', 'quillcrm' ),
			self::PENDING_CANCEL => __( 'Pending Cancellation', 'quillcrm' ),
		);
	}

	/**
	 * Get active statuses
	 *
	 * @return array
	 */
	public static function get_active_statuses() {
		return array(
			self::ACTIVE,
			self::ON_HOLD,
		);
	}

	/**
	 * Get inactive statuses
	 *
	 * @return array
	 */
	public static function get_inactive_statuses() {
		return array(
			self::CANCELLED,
			self::EXPIRED,
			self::SWITCHED,
		);
	}

	/**
	 * Check if status is active
	 *
	 * @param string $status Status to check.
	 * @return bool
	 */
	public static function is_active( $status ) {
		return in_array( $status, self::get_active_statuses(), true );
	}

	/**
	 * Check if status is inactive
	 *
	 * @param string $status Status to check.
	 * @return bool
	 */
	public static function is_inactive( $status ) {
		return in_array( $status, self::get_inactive_statuses(), true );
	}
}
