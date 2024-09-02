<?php
/**
 * Update User Meta Action
 *
 * This action will update the user meta.
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
 * Update User Meta Action
 */
class Update_User_Meta extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update User Meta';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_user_meta';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the user meta.';

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

		$meta = $step->get_attribute( 'meta', array() );
		foreach ( $meta as $item ) {
			update_user_meta( $user->ID, $item['key'], $item['value'] );
		}

		return true;
	}

	/**
	 * Get fields.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'meta' => array(
				'type'        => 'repeater',
				'label'       => __( 'Meta', 'quillcrm' ),
				'description' => __( 'User meta to update.', 'quillcrm' ),
				'fields'      => array(
					'key'   => array(
						'type'        => 'string',
						'label'       => __( 'Meta Key', 'quillcrm' ),
						'description' => __( 'Meta key to update.', 'quillcrm' ),
					),
					'value' => array(
						'type'        => 'string',
						'label'       => __( 'Meta Value', 'quillcrm' ),
						'description' => __( 'Meta value to update.', 'quillcrm' ),
					),
				),
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
				'meta' => array(
					'type'        => 'array',
					'label'       => 'Meta',
					'description' => 'User meta to update.',
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'key'   => array(
								'type'        => 'string',
								'label'       => 'Meta Key',
								'description' => 'Meta key to update.',
							),
							'value' => array(
								'type'        => 'string',
								'label'       => 'Meta Value',
								'description' => 'Meta value to update.',
							),
						),
					),
					'required'    => true,
				),
			),
		);
	}
}
