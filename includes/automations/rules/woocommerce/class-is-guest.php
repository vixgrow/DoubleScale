<?php

namespace QuillCRM\Automations\Rules\WooCommerce;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Is Guest class
 */
class Is_Guest extends Rule {






	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Is guest ?';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'is_guest';

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
	public $type = 'select';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'equal' => __( 'equal', 'quillcrm' ),
		);
	}


	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		 return array(
			 'yes' => __( 'Yes', 'quillcrm' ),
			 'no'  => __( 'No', 'quillcrm' ),
		 );
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return bool
	 */
	public function get_value( $automation_contact ) {
		$contact = $automation_contact->contact;

		if ( ! $contact || empty( $contact->email ) ) {
			return false;
		}

		$user = get_user_by( 'email', $contact->email );

		return ! $user;
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
		$is_guest   = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'] ?? '';

		switch ( $operator ) {
			case 'equal':
				if ( $rule_value === 'yes' ) {
					return $is_guest === true;
				} elseif ( $rule_value === 'no' ) {
					return $is_guest === false;
				}
				return false;

			default:
				return false;
		}
	}
}
add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Is_Guest() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Is_Guest() );
				}
			);
		}
	},
	99
);
