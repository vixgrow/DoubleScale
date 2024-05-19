<?php
/**
 * Class Current_Date
 *
 * Merge tag for current date
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\General;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Current Date Merge Tag
 */
class Current_Date extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Current Date';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'current_date';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Current Date';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'general';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		// Merge tag will be like this: {{current_date}} or {{current_date format='Y-m-d'}}.
		$format = $this->get_format( $merge_tag );
		error_log( 'Current Date Format: ' . $format );
		$current_date = date( $format );

		return $current_date;
	}

	/**
	 * Get the format from the merge tag
	 *
	 * @param string $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	private function get_format( $merge_tag ) {
		$format  = 'Y-m-d';
		$matches = array();
		preg_match( '/format=\'(.*?)\'/', $merge_tag, $matches );
		if ( ! empty( $matches[1] ) ) {
			$format = $matches[1];
		}

		return $format;
	}
}

Merge_Tags_Manager::instance()->register( new Current_Date() );
