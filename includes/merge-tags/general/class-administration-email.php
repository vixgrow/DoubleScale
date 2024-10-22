<?php
/**
 * Class Admin_Email
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\General;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Admin_Email class
 */
class Admin_Email extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Administration Email';

	/**
	 * Tag
	 *
	 * @var string
	 */
	public $slug = 'admin_email';

	/**
	 * Description
	 *
	 * @var string
	 */
	public $description = 'Website administration email';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'general';

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
		return get_option( 'admin_email' );
	}
}

Merge_Tags_Manager::instance()->register( new Admin_Email() );
