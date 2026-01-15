<?php

/**
 * SureCart Order Success Trigger
 * This trigger will be fired when an order payment is successful.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\SureCart\Order;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Order Success Trigger
 */
class Order_Success extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Order Success';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'surecart_order_success';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a SureCart order payment is successful.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'surecart';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'order';
}

Triggers_Manager::instance()->register( new Order_Success() );
