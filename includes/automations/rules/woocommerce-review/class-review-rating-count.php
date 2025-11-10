<?php

/**
 * Class Review Rating Count
 *
 * This class is responsible for handling the review rating count rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce_Review;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Review Rating Count class
 */
class Review_Rating_Count extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Review Rating Count';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'review_rating_count';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce_review';

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
			'is_equal_to'                 => __( 'is equal to', 'quillcrm' ),
			'is_not_equal_to'             => __( 'is not equal to', 'quillcrm' ),
			'is_greater_than'             => __( 'is greater than', 'quillcrm' ),
			'is_less_than'                => __( 'is less than', 'quillcrm' ),
			'is_greater_than_or_equal_to' => __( 'is greater than or equal to', 'quillcrm' ),
			'is_less_than_or_equal_to'    => __( 'is less than or equal to', 'quillcrm' ),
		);
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
		$review_rating = $automation_contact->get_data( 'review_rating' );
		return $review_rating;
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

		switch ( $operator ) {
			case 'is_equal_to':
				return $value == $rule_value;
			case 'is_not_equal_to':
				return $value != $rule_value;
			case 'is_greater_than':
				return $value > $rule_value;
			case 'is_less_than':
				return $value < $rule_value;
			case 'is_greater_than_or_equal_to':
				return $value >= $rule_value;
			case 'is_less_than_or_equal_to':
				return $value <= $rule_value;
			default:
				return false;
		};
	}
}


Rules_Manager::instance()->register( new Review_Rating_Count() );
