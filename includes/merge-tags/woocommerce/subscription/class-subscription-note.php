<?php

/**
 * Subscription Billing Address Merge Tag
 *
 * This class is responsible for handling the subscription billing address merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Subscription;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Subscription Billing Address Merge Tag
 */
class Subscription_Note extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Note';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscription_note';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscription Note';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'subscription';

	public $required_triggers = array(
		'wc_subscription_note_added',
	);

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$note_content = $contact->get_data( 'note_content' );

		return $note_content ?? '';
	}
}

Merge_Tags_Manager::instance()->register( new Subscription_Note() );
