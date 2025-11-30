<?php

/**
 * WooCommerce Abandoned Cart Created Trigger
 * This trigger will be fired when an abandoned cart is created.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Cart;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\QuillCRM;

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

	/**
	 * Process automations
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Arguments
	 *
	 * @return void
	 */
	public function process( $args ) {
		try {
			$automations = Automation_Model::get_automations_by_trigger( $this->slug );
			if ( count( $automations ) === 0 ) {
				do_action( 'quillcrm_abandoned_cart_skipped', $args['data']['cart_id'] ?? null );
				return;
			}

			foreach ( $automations as $automation ) {
				if ( ! $this->is_processable( $automation, $args ) ) {
					continue;
				}

				QuillCRM::instance()->automations_tasks->enqueue_sync( 'process_automations', $automation, $args );
			}
		} catch ( \Exception $e ) {
			error_log( 'Error processing Abandoned Cart Created Trigger: ' . $e->getMessage() );
		}
	}
}

Triggers_Manager::instance()->register( new Abandoned_Cart_Created() );
