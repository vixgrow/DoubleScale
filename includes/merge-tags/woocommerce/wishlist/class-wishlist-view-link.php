<?php

/**
 * Wishlist View Link Merge Tag
 *
 * This class is responsible for handling the wishlist view link merge tag
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
 * Wishlist View Link Merge Tag
 */
class Wishlist_View_Link extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist View Link';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'wishlist_view_link';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Wishlist View Link';

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

		$view_link = get_permalink( $wishlist_id );

		return $view_link;
	}
}

Merge_Tags_Manager::instance()->register( new Wishlist_View_Link() );
