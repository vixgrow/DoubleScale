<?php
/**
 * Class Lists
 *
 * This class is responsible for handling the contact class lists rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\Segments;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Lists class
 */
class Lists extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Lists';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'lists_segment';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'segments';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'select';

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @param string $list_name The list name
	 *
	 * @return array
	 */
	public function get_options( $list_name = '' ) {
		$lists = array();

		if ( '' === $list_name ) {
			$lists = List_Model::paginate( 10, array( '*' ), 'page', 1 );
		} else {
			$lists = List_Model::where( 'name', 'LIKE', '%' . $list_name . '%' )->paginate( 10, array( '*' ), 'page', 1 );
		}

		return $lists;
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		$contact = $automation_contact->contact;
		return $contact->lists;
	}
}

Rules_Manager::instance()->register( new Lists() );
