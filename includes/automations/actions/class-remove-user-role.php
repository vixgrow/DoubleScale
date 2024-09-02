<?php
/**
 * Remove User Role Action
 * This action will remove a user role.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Remove User Role Action
 */
class Remove_User_Role extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User Role';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'remove_user_role';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user role.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'wp';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'user';

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

		$role = $step->get_attribute( 'role' );
		if ( ! $role ) {
			return false;
		}

		$user->remove_role( $role );

		return true;
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		// Get all WordPress roles
		global $wp_roles;

		if ( ! isset( $wp_roles ) ) {
			$wp_roles = new \WP_Roles();
		}

		$roles   = $wp_roles->roles;
		$options = array();

		foreach ( $roles as $role => $role_data ) {
			$options[ $role ] = $role_data['name'];
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
			'role' => array(
				'type'     => 'select',
				'label'    => __( 'Role', 'quillcrm' ),
				'required' => true,
				'options'  => $this->get_options(),
			),
		);
	}

	/**
	 * Get Attributes schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'role' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}
