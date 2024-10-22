<?php
/**
 * Class Tags
 *
 * This class is responsible for handling the contact class tags rule
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
 * Tags class
 */
class Tags extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Tags';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'tags_segment';

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
	public $type = 'tags';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'               => __( 'Is', 'quillcrm' ),
			'is_not'           => __( 'Is not', 'quillcrm' ),
			'contains'         => __( 'Contains', 'quillcrm' ),
			'does_not_contain' => __( 'Does not contain', 'quillcrm' ),
			'is_empty'         => __( 'Is empty', 'quillcrm' ),
			'is_not_empty'     => __( 'Is not empty', 'quillcrm' ),
		);
	}

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
		$tags = array();

		if ( '' === $list_name ) {
			$tags = List_Model::paginate( 10, array( '*' ), 'page', 1 );
		} else {
			$tags = List_Model::where( 'name', 'LIKE', '%' . $list_name . '%' )->paginate( 10, array( '*' ), 'page', 1 );
		}

		return $tags;
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
		$ids     = $contact->tags->pluck( 'id' )->toArray();
		return $ids;
	}
}

Rules_Manager::instance()->register( new Tags() );
