<?php
/**
 * WooCommerce Abandoned Cart URL
 *
 * This class is responsible for handling the Abandoned Cart URL
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
 * Abandoned Cart URL Merge Tag
 */
class Cart_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Recovery URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Recovery URL';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'abandoned_cart';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model. Contact Model.
	 * @param string                   $merge_tag         Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$abandoned_cart_id = $contact->get_data( 'cart_id', 0 );
		$abandoned_cart    = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart ) {
			return '';
		}

		$abandoned_cart_hash = $abandoned_cart->hash_key;
		$abandoned_cart_url  = add_query_arg( 'quillcrm-cart-id', $abandoned_cart_hash, home_url() );

		return $abandoned_cart_url;
	}
}

Merge_Tags_Manager::instance()->register( new Cart_URL() );
