<?php
/**
 * Change Status Action
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
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Change Status Action
 */
class Change_Status extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Change Status';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'change_contact_status';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will change the status of the contact.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'contact';

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
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$new_status = $step->get_setting( 'new_status', 'unverified' );
		$contact    = $automation_contact->contact;
		if ( $contact->email_status === $new_status ) {
			return true;
		}
		$contact->email_status = $new_status;
		$contact->save();

		return true;
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
			'new_status' => array(
				'type'     => 'select',
				'label'    => __( 'New Status', 'quill-crm' ),
				'required' => true,
				'options'  => array(
					'unverified'   => __( 'Unverified', 'quill-crm' ),
					'subscribed'   => __( 'Subscribed', 'quill-crm' ),
					'unsubscribed' => __( 'Unsubscribed', 'quill-crm' ),
					'bounced'      => __( 'Bounced', 'quill-crm' ),
				),
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
				'new_status' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Change_Status::instance();
