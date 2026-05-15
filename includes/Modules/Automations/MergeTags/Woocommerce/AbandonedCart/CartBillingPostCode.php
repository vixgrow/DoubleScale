<?php
/**
 * WooCommerce Abandoned Cart Billing Post Code
 *
 * This class is responsible for handling the Abandoned Cart Billing Post Code
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\MergeTags\Woocommerce\AbandonedCart;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Automations\Abstracts\MergeTag;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\Automations\Models\AbandonedCartModel;
use DoubleScale\Core\Managers\MergeTagsManager;

/**
 * Abandoned Cart Billing Post_Code Merge Tag
 */
class CartBillingPostCode extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Billing Post Code';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'billing_post_code';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Billing Post Code';

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

		// WooCommerce uses billing_postcode; some front-ends may send billing_post_code.
		$fields            = is_array( $abandoned_cart->fields ) ? $abandoned_cart->fields : array();
		$billing_post_code = $fields['billing_postcode'] ?? $fields['billing_post_code'] ?? '';

		return $billing_post_code;
	}
}

MergeTagsManager::instance()->register( new CartBillingPostCode() );
