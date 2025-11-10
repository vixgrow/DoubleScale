<?php

/**
 * Wishlist Items Count Merge Tag
 *
 * This class is responsible for handling the wishlist items count merge tag
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
 * Wishlist Items Count Merge Tag
 */
class Wishlist_Items_Count extends Merge_Tag {













	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist Items Count';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'wishlist_items_count';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Wishlist Items Count';

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
			return '0';
		}

		$wishlist_items = get_post_meta( $wishlist_id, '_wishlist_items', true );
		$items_count    = count( $wishlist_items );
		return (string) $items_count;
	}
}

Merge_Tags_Manager::instance()->register( new Wishlist_Items_Count() );
