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

namespace QuillCRM\Goals;

use QuillCRM\Abstracts\Goal;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Goals_Manager;

/**
 * Used Dynamic Coupon Goal class
 */
class Used_Dynamic_Coupon extends Goal {









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

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'woocommerce_thankyou', array( $this, 'used_dynamic_coupon' ), 10, 1 );
	}

	/**
	 * Used Dynamic Coupon
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact_id Contact.
	 * @param string        $coupon_code Coupon code.
	 *
	 * @return void
	 */
	public function used_dynamic_coupon( $order_id ) {
		if ( ! $order_id ) {
			return;
		}

		if ( ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		// user email
		$user_email = $order->get_billing_email();
		if ( ! $user_email ) {
			return;
		}

		// contact
		$contact = Contact_Model::where( 'email', $user_email )->first();
		if ( ! $contact ) {
			return;
		}

		$coupons = $order->get_coupon_codes();
		if ( empty( $coupons ) ) {
			return;
		}

		foreach ( $coupons as $coupon ) {
			$data[] = $coupon;
		}

		$this->process( $contact, $data );
	}

	/**
	 * Check if the goal is completed
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Automation Contact Model.
	 * @param array                    $data Data.
	 *
	 * @return bool
	 */
	public function is_completed( Automation_Contact_Model $automation_contact, $data ) {
		$coupon_codes = is_array( $data ) ? $data : array();
		$current_step = Automation_Step_Model::find( $automation_contact->current_step );

		if ( ! $current_step ) {
			return false;
		}

		$merge_tag = $current_step->get_setting( 'merge_tag', '' );

		if ( ! preg_match( '/dynamic_id_(\d+)/', $merge_tag, $matches ) ) {
			return false;
		}

		$step_id = (int) $matches[1];

		if ( ! $step_id ) {
			return false;
		}

		$stored_coupons = $automation_contact->get_data( 'coupon_codes', array() );

		$incoming_codes = array_map( 'strtolower', $coupon_codes );

		foreach ( $stored_coupons as $stored_coupon ) {
			if ( isset( $stored_coupon['step_id'] ) && $stored_coupon['step_id'] == $step_id ) {

				$stored_code = strtolower( $stored_coupon['code'] );

				if ( in_array( $stored_code, $incoming_codes, true ) ) {
					return true;
				}
			}
		}

		return false;
	}



	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'merge_tag' => array(
				'label'   => __( 'Merge Tag', 'quillcrm' ),
				'type'    => 'text',
				'tooltip' => __( 'Copy the merge tag step that needs to track the coupon used, but make sure this step is ordered before the goal step.', 'quillcrm' ),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'merge_tag' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Goals_Manager::instance()->register( new Used_Dynamic_Coupon() );
