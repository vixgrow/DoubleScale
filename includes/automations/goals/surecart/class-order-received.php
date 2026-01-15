<?php

/**
 * SureCart Order Received Goal
 * This goal will be achieved when a SureCart order is received.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Goals\SureCart;

use QuillCRM\Abstracts\Goal_Pro;
use QuillCRM\Managers\Goals_Manager;

/**
 * Order Received Goal
 */
class Order_Received extends Goal_Pro {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Order Received';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'surecart_order_received';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a SureCart order is received.';

	/**
	 * Source
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $source = 'surecart';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'order';
}

Goals_Manager::instance()->register( new Order_Received() );
