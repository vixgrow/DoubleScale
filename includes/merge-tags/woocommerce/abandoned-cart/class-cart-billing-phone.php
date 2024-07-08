<?php
/**
 * WooCommerce Abandoned Cart Billing Phone
 *
 * This class is responsible for handling the Abandoned Cart Billing Phone
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Abandoned_Cart;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Abandoned Cart Billing Phone Merge Tag
 */
class Cart_Billing_Phone extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Billing Phone';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'billing_phone';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Billing Phone';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'abandoned_cart';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag         Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$abandoned_cart_id = $automation_contact->get_data( 'cart_id', 0 );
		$abandoned_cart    = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart ) {
			return '';
		}

		$billing_phone = $abandoned_cart->fields['billing_phone'] ?? '';

		return $billing_phone;
	}
}

Merge_Tags_Manager::instance()->register( new Cart_Billing_Phone() );
