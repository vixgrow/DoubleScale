<?php

/**
 * Class Cart Recovered Goal
 *
 * This class is responsible for handling the cart recovered goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Goals;


use QuillCRM\Abstracts\Goal_Pro;
use QuillCRM\Managers\Goals_Manager;

/**
 * Cart Recovered Goal class
 */
class Cart_Recovered extends Goal_Pro {


	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Cart Recovered';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'wc_cart_recovered';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact recovers an abandoned cart by completing their purchase.';

	/**
	 * Source
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'cart';
}

Goals_Manager::instance()->register( new Cart_Recovered() );
