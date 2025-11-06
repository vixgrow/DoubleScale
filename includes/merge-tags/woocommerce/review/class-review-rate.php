<?php

/**
 * Review Rate Merge Tag
 *
 * This class is responsible for handling the review rate merge tag
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
 * Review Rate Merge Tag
 */
class Review_Rate extends Merge_Tag {


	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Review Rate';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'review_rate';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Review Rate';

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
		$review_rate = $contact->get_data( 'review_rating' );

		if ( ! $review_rate ) {
			return '';
		}

		return (string) $review_rate;
	}
}

Merge_Tags_Manager::instance()->register( new Review_Rate() );
