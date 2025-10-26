<?php

/**
 * Class Order Status
 *
 * This class is responsible for handling the order status constants
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Constants;



/**
 * Order Status class
 */
class Order_Status {


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
			self::PENDING_PAYMENT => __( 'Pending Payment', 'quillcrm' ),
			self::PROCESSING      => __( 'Processing', 'quillcrm' ),
			self::ON_HOLD         => __( 'On Hold', 'quillcrm' ),
			self::COMPLETED       => __( 'Completed', 'quillcrm' ),
			self::CANCELLED       => __( 'Cancelled', 'quillcrm' ),
			self::REFUNDED        => __( 'Refunded', 'quillcrm' ),
			self::FAILED          => __( 'Failed', 'quillcrm' ),
			self::CHECKOUT_DRAFT  => __( 'Checkout Draft', 'quillcrm' ),
		);
	}
}
