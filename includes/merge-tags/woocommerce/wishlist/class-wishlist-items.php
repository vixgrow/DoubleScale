<?php

/**
 * Wishlist Items Merge Tag
 *
 * This class is responsible for handling the wishlist items merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Wishlist;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Wishlist Items Merge Tag
 */
class Wishlist_Items extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist Items';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'wishlist_items';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Wishlist Items';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'wishlist';

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array( 'wc_user_adds_product_to_wishlist', 'wc_wishlist_item_on_sale', 'wc_wishlist_reminder' );

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$wishlist_id = $contact->get_data( 'wishlist_id' );

		if ( ! $wishlist_id ) {
			return '';
		}
		$wishlist_items = get_post_meta( $wishlist_id, '_wishlist_items', true );
		if ( empty( $wishlist_items ) ) {
			return '';
		}

		$products = array();
		foreach ( $wishlist_items as $item ) {
			$product    = wc_get_product( $item['product_id'] );
			$products[] = $product;
		}
		return implode( ', ', $products );
	}
}

Merge_Tags_Manager::instance()->register( new Wishlist_Items() );
