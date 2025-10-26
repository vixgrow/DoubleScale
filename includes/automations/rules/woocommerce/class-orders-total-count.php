<?php

/**
 * Class Orders Total Count
 *
 * This class is responsible for handling the orders total count rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Orders Total Count class
 */
class Orders_Total_Count extends Rule {






	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Total Orders Count';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'orders_total_count';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'number';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'greater_than' => __( 'Greater than', 'quillcrm' ),
			'less_than'    => __( 'Less than', 'quillcrm' ),
			'equal'        => __( 'equal', 'quillcrm' ),
			'not_equal'    => __( 'does not equal', 'quillcrm' ),
		);
	}


	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return int
	 */
	public function get_value( $automation_contact ) {
		$contact = $automation_contact->contact;
		if ( ! $contact || empty( $contact->email ) ) {
			return 0;
		}

		// Ensure WooCommerce is active
		if ( ! class_exists( '\WC_Customer' ) ) {
			return 0;
		}

		// Get user by email
		$user = get_user_by( 'email', $contact->email );
		if ( ! $user ) {
			return 0;
		}

		// Create WooCommerce customer object
		try {
			$customer = new \WC_Customer( $user->ID );
			return (int) $customer->get_order_count();
		} catch ( \Exception $e ) {
			return 0;
		}
	}


	/**
	 * Is met
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param array                    $rule Rule.
	 *
	 * @return bool
	 */
	public function is_met( Automation_Contact_Model $automation_contact, $rule = array() ) {
		$value      = (float) $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = (float) $rule['value'];

		switch ( $operator ) {
			case 'equal':
				return $value === $rule_value;
			case 'not_equal':
				return $value !== $rule_value;
			case 'greater_than':
				return $value > $rule_value;
			case 'less_than':
				return $value < $rule_value;
			default:
				return false;
		};
	}
}

Rules_Manager::instance()->register( new Orders_Total_Count() );
