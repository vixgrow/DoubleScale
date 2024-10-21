<?php
/**
 * Class Add User To Group
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LearnDash;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Actions_Manager;

/**
 * Add User To Group
 */
class Add_User_To_Group extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add User To Group';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_add_user_to_group';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a user to a group.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'lms';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'learndash';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$contact = $automation_contact->contact;
		$user    = get_user_by( 'email', $contact->email );
		if ( ! $user ) {
			return false;
		}

		$group_id = $step->get_setting( 'group_id' );
		if ( ! $group_id ) {
			return false;
		}

		$group_id = absint( $group_id );

		ld_update_group_access( $user->ID, $group_id );

		return true;
	}

	/**
	 * Get Groups
	 *
	 * @since 1.0.0
	 */
	public function get_groups() {
		if ( ! function_exists( 'learndash_get_groups' ) ) {
			return array();
		}
		$groups = learndash_get_groups( array( 'posts_per_page' => -1 ) );

		$options = array();
		foreach ( $groups as $group ) {
			$options[ $group->ID ] = $group->post_title;
		}

		return $options;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'group_id' => array(
				'type'    => 'select',
				'label'   => __( 'Group', 'quillcrm' ),
				'options' => $this->get_groups(),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'group_id' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_User_To_Group() );
