<?php
/**
 * WooCommerce Abandoned Cart Shipping First Name
 *
 * This class is responsible for handling the Abandoned Cart Shipping First Name
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\MergeTags\Woocommerce\AbandonedCart;

use DoubleScale\Modules\Automations\Abstracts\MergeTag;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\Automations\Models\AbandonedCartModel;
use DoubleScale\Managers\MergeTagsManager;

/**
 * Abandoned Cart Shipping First Name Merge Tag
 */
class CartShippingFirstName extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Shipping First Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'shipping_first_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Shipping First Name';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'abandoned_cart';

	/**
	 * Get Merge Tag Value
	 *
	 * @param AutomationContactModel $contact Contact Model. Contact Model.
	 * @param string                   $merge_tag         Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$abandoned_cart_id = $contact->get_data( 'cart_id', 0 );
		$abandoned_cart    = AbandonedCartModel::find( $abandoned_cart_id );
		if ( ! $abandoned_cart ) {
			return '';
		}

		$shipping_first_name = $abandoned_cart->fields['shipping_first_name'] ?? '';

		return $shipping_first_name;
	}
}

MergeTagsManager::instance()->register( new CartShippingFirstName() );
