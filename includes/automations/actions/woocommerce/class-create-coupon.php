<?php

/**
 * Create Coupon Action
 *
 * This action will create a coupon.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Create Coupon Action
 */
class Create_Coupon extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Create Coupon';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'create_coupon';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will create a coupon.';

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
	public $group = 'coupon';
}

Create_Coupon::instance();
