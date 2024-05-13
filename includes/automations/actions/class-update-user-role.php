<?php
/**
 * Update User Role Action
 * This action will update the user role.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Contact_Model;
use WP_User;

/**
 * Update User Role Action
 */
class Update_User_Role extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update User Role';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_user_role';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the user role.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model      $automation Automation Model.
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param Contact_Model         $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact ) {
		$user = get_user_by( 'email', $contact->email );
		if ( ! $user ) {
			return false;
		}

		$role    = $step->get_attribute( 'role' );
		$replace = $step->get_attribute( 'replace' );

		if ( $replace ) {
			$user->set_role( $role );
		} else {
			$user->add_role( $role );
		}

		return true;
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
				'role'    => array(
					'type'        => 'string',
					'title'       => 'Role',
					'description' => 'Enter the role.',
					'required'    => true,
				),
				'replace' => array(
					'type'        => 'boolean',
					'title'       => 'Replace',
					'description' => 'Replace the existing roles.',
					'default'     => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Update_User_Role() );
