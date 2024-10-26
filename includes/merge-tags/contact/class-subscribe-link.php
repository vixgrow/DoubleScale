<?php
/**
 * Class Subscribe Link Merge Tag
 *
 * Merge tag for subscribe link
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
 * Subscribe Link Merge Tag
 */
class Subscribe_Link extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscribe Link';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscribe_link';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscribe Link';

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
			'quillcrm-subscribe' => '1',
			'id'                 => $hash_id,
		);
		$link    = add_query_arg( $args, home_url() );

		return $link;
	}
}

Merge_Tags_Manager::instance()->register( new Subscribe_Link() );
