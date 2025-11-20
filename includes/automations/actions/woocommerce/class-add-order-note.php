<?php

/**
 * Add Order Note Action
 *
 * This action will add a note to the order.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;


use QuillCRM\Abstracts\Action_Pro;

/**
 * Add Order Note Action
 */
class Add_Order_Note extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Order Note';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_order_note';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a note to the order.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'order';

	/**
	 * Required triggers for this action to be enabled
	 *
	 * @var array
	 */
	public $required_triggers = array( 'wc_order_created', 'wc_order_completed', 'wc_order_status_changed', 'wc_order_refunded' );
}

Add_Order_Note::instance();
