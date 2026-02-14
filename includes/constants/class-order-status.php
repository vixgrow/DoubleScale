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
			self::PENDING_PAYMENT => __( 'Pending Payment', 'quill-crm' ),
			self::PROCESSING      => __( 'Processing', 'quill-crm' ),
			self::ON_HOLD         => __( 'On Hold', 'quill-crm' ),
			self::COMPLETED       => __( 'Completed', 'quill-crm' ),
			self::CANCELLED       => __( 'Cancelled', 'quill-crm' ),
			self::REFUNDED        => __( 'Refunded', 'quill-crm' ),
			self::FAILED          => __( 'Failed', 'quill-crm' ),
			self::CHECKOUT_DRAFT  => __( 'Checkout Draft', 'quill-crm' ),
		);
	}
}
