<?php
/**
 * WooCommerce Abandoned Cart Billing Email
 *
 * This class is responsible for handling the Abandoned Cart Billing Email
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
 * Abandoned Cart Billing Email Merge Tag
 */
class CartBillingEmail extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Billing Email';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'billing_email';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Billing Email';

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

		$billing_email = $abandoned_cart->fields['billing_email'] ?? '';

		return $billing_email;
	}
}

MergeTagsManager::instance()->register( new CartBillingEmail() );
