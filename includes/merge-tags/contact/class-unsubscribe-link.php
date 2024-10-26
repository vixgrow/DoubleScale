<?php
/**
 * Class Unsubscribe Link Merge Tag
 *
 * Merge tag for unsubscribe link
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Contact;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Unsubscribe Link Merge Tag
 */
class Unsubscribe_Link extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Unsubscribe Link';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'unsubscribe_link';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Unsubscribe Link';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'contact';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;

	/**
	 * Get Merge Tag Value
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @param string        $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		if ( is_null( $contact ) ) {
			return '#';
		}

		$hash_id = $contact->hash_id;
		$args    = array(
			'quillcrm-unsubscribe' => '1',
			'id'                   => $hash_id,
		);
		$link    = add_query_arg( $args, home_url() );

		return $link;
	}
}

Merge_Tags_Manager::instance()->register( new Unsubscribe_Link() );
