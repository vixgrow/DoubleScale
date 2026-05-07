<?php

/**
 * Class Order Status
 *
 * This class is responsible for handling the order status constants
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Constants;



/**
 * Order Status class
 */
class OrderStatus {


	/**
	 * Pending Payment
	 */
	const PENDING_PAYMENT = 'wc-pending';

	/**
	 * Processing
	 */
	const PROCESSING = 'wc-processing';

	/**
	 * On Hold
	 */
	const ON_HOLD = 'wc-on-hold';

	/**
	 * Completed
	 */
	const COMPLETED = 'wc-completed';

	/**
	 * Cancelled
	 */
	const CANCELLED = 'wc-cancelled';

	/**
	 * Refunded
	 */
	const REFUNDED = 'wc-refunded';

	/**
	 * Failed
	 */
	const FAILED = 'wc-failed';

	/**
	 * Checkout Draft
	 */
	const CHECKOUT_DRAFT = 'wc-checkout-draft';

	/**
	 * Get all statuses
	 *
	 * @return array
	 */
	public static function get_all() {
		return array(
			self::PENDING_PAYMENT => __( 'Pending Payment', 'doublescale'),
			self::PROCESSING      => __( 'Processing', 'doublescale'),
			self::ON_HOLD         => __( 'On Hold', 'doublescale'),
			self::COMPLETED       => __( 'Completed', 'doublescale'),
			self::CANCELLED       => __( 'Cancelled', 'doublescale'),
			self::REFUNDED        => __( 'Refunded', 'doublescale'),
			self::FAILED          => __( 'Failed', 'doublescale'),
			self::CHECKOUT_DRAFT  => __( 'Checkout Draft', 'doublescale'),
		);
	}
}
