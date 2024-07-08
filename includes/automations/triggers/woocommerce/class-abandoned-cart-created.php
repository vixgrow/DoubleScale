<?php
/**
 * WooCommerce Abandoned Cart Created Trigger
 * This trigger will be fired when an abandoned cart is created.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Abandoned_Cart_Model;

/**
 * Abandoned Cart Created Trigger
 */
class Abandoned_Cart_Created extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Abandoned Cart';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_abandoned_cart_created';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when an abandoned cart is created.';

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
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'cart';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_abandoned_cart_created', array( $this, 'trigger' ), 10, 1 );
	}

	/**
	 * Trigger
	 *
	 * @since 1.0.0
	 *
	 * @param Abandoned_Cart_Model $cart
	 *
	 * @return void
	 */
	public function trigger( $cart ) {
		$email      = $cart->email;
		$first_name = $cart->fields['billing_first_name'] ?? '';
		$last_name  = $cart->fields['billing_last_name'] ?? '';

		$data = array(
			'first_name' => $first_name,
			'last_name'  => $last_name,
			'email'      => $email,
			'data'       => array(
				'cart_id' => $cart->id,
			),
		);

		$this->process( $data );
	}
}

Triggers_Manager::instance()->register( new Abandoned_Cart_Created() );
