<?php

/**
 * Wishlist ID Merge Tag
 *
 * This class is responsible for handling the wishlist ID merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Review;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Review Content Merge Tag
 */
class Review_Content extends Merge_Tag {



	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Review Content';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'review_content';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Review Content';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'review';

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array( 'wc_review_received' );

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$review_content = $contact->get_data( 'review_content' );

		if ( ! $review_content ) {
			return '';
		}

		return (string) $review_content;
	}
}

Merge_Tags_Manager::instance()->register( new Review_Content() );
