<?php

/**
 * Class List Added Goal
 *
 * This class is responsible for handling the list added goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Goals;


use QuillCRM\Abstracts\Goal_Pro;
use QuillCRM\Managers\Goals_Manager;

/**
 * Used Dynamic Coupon Goal class
 */
class Used_Dynamic_Coupon extends Goal_Pro {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Used Dynamic Coupon';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'used_dynamic_coupon';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact uses a dynamic coupon.';

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
	public $group = 'coupon';
}

Goals_Manager::instance()->register( new Used_Dynamic_Coupon() );
