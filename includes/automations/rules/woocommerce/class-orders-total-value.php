<?php

/**
 * Class Order Total Value
 *
 * This class is responsible for handling the order total value rule
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
 * Order Total Value class
 */
class Orders_Total_Value extends Rule {



	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Total Orders Value';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'orders_total_value';

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
	 * @return float
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

		try {
			$customer = new \WC_Customer( $user->ID );
			return (float) $customer->get_total_spent();
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

Rules_Manager::instance()->register( new Orders_Total_Value() );
