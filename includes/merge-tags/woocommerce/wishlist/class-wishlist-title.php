<?php

/**
 * Wishlist Title Merge Tag
 *
 * This class is responsible for handling the wishlist title merge tag
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
 * Wishlist Title Merge Tag
 */
class Wishlist_Title extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist Title';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'wishlist_title';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Wishlist Title';

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

		$wishlist = get_post( $wishlist_id );

		return $wishlist->post_title ?? '';
	}
}

Merge_Tags_Manager::instance()->register( new Wishlist_Title() );
