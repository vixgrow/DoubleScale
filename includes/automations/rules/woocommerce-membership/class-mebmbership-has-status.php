<?php

/**
 * Class Membership Has Status
 *
 * This class is responsible for handling the membership has status rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce_Membership;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Membership Has Status class
 */
class Membership_Has_Status extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Membership Has Status';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'membership_has_status';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce_membership';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'multiselect';


	/**
	 * Has options
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_options() {
		return true;
	}

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'     => __( 'Is', 'quillcrm' ),
			'is_not' => __( 'Is not', 'quillcrm' ),
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

		if ( ! function_exists( 'wc_memberships_get_user_membership_statuses' ) ) {
			return array();
		}

		$options        = wc_memberships_get_user_membership_statuses( false, false );
		$formatted_opts = array();

		foreach ( $options as $key => $label ) {
			$formatted_opts[ $label ] = strtoupper( $label );
		}

		return $formatted_opts;
	}


	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		$status = $automation_contact->get_data( 'status' );
		return $status ? $status : '';
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
		$value      = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'];

		if ( ! is_array( $rule_value ) ) {
			$rule_value = array( $rule_value );
		}

		switch ( $operator ) {
			case 'is':
				return in_array( $value, $rule_value, true );
			case 'is_not':
				return ! in_array( $value, $rule_value, true );
			default:
				return false;
		};
	}
}


add_action(
	'init',
	function () {
		if ( class_exists( 'WC_Memberships' ) ) {
			Rules_Manager::instance()->register( new Membership_Has_Status() );
		} else {
			add_action(
				'woocommerce_memberships_loaded',
				function () {
					Rules_Manager::instance()->register( new Membership_Has_Status() );
				}
			);
		}
	},
	99
);
