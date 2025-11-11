<?php
/**
 * Class Remove User From Group
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
 * Remove User From Group
 */
class Remove_User_From_Group extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User From Group';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_remove_user_from_group';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user from a group.';

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
			quillcrm_get_logger()->warning(
				__( 'User not found for LearnDash group removal', 'quillcrm' ),
				array(
					'code'          => 'learndash_user_not_found',
					'contact_email' => $contact->email,
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		$group_id = $step->get_setting( 'group_id' );
		if ( ! $group_id ) {
			quillcrm_get_logger()->warning(
				__( 'Group ID not configured for LearnDash removal action', 'quillcrm' ),
				array(
					'code'          => 'learndash_group_id_missing',
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		$group_id = absint( $group_id );

		// Check if LearnDash function exists
		if ( ! function_exists( 'ld_update_group_access' ) ) {
			quillcrm_get_logger()->error(
				__( 'LearnDash plugin is not active. Cannot remove user from group.', 'quillcrm' ),
				array(
					'code'          => 'learndash_plugin_inactive',
					'user_id'       => $user->ID,
					'group_id'      => $group_id,
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		// Execute the action
		ld_update_group_access( $user->ID, $group_id, true );

		quillcrm_get_logger()->info(
			__( 'User successfully removed from LearnDash group', 'quillcrm' ),
			array(
				'code'          => 'learndash_group_removed',
				'user_id'       => $user->ID,
				'group_id'      => $group_id,
				'automation_id' => $automation->id,
				'step_id'       => $step->id,
			)
		);

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

Remove_User_From_Group::instance();