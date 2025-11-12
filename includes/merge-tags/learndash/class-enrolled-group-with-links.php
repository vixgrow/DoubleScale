<?php

/**
 * Class Enrolled Course With Links Merge Tag
 *
 * This class is responsible for handling the enrolled group with links merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\LearnDash;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Enrolled Group With Links Merge Tag
 */
class Enrolled_Group_With_Links extends Merge_Tag {


	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Enrolled Group With Links (list)';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'enrolled_group_with_links';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Enrolled Group With Links';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'learndash';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$contact_id = $contact->contact_id;
		$contact    = Contact_Model::find( $contact_id );

		if ( ! $contact ) {
			return '';
		}

		$user = get_user_by( 'email', $contact->email );

		if ( ! $user ) {
			return '';
		}

		$enrolled_groups = learndash_get_users_group_ids( $user->ID );
		$group_links     = array();

		foreach ( $enrolled_groups as $group_id ) {
			$group_title = get_the_title( $group_id );
			$group_url   = get_permalink( $group_id );

			if ( $group_title && $group_url ) {
				$group_links[] = sprintf( '<li><a href="%s">%s</a></li>', esc_url( $group_url ), esc_html( $group_title ) );
			}
		}

		if ( empty( $group_links ) ) {
			return '';
		}

		return '<ul>' . implode( '', $group_links ) . '</ul>';
	}
}

Merge_Tags_Manager::instance()->register( new Enrolled_Group_With_Links() );
