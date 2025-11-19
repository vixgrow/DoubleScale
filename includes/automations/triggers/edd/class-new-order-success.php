<?php

/**
 * EDD Trigger for New Order Success
 *
 * This trigger will be fired when a new order is successfully placed.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\EDD;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * New Order Success Trigger
 */
class New_Order_Success extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'New Order Success';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'edd_new_order_success';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a new order is successfully placed.';

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
	public $source = 'edd';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'order';
}

Triggers_Manager::instance()->register( new New_Order_Success() );
