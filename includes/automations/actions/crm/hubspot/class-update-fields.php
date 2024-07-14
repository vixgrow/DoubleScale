<?php
/**
 * Class Update_Fields
 *
 * This class is responsible for adding a contact to Hubspot
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Hubspot;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Update Fields class
 */
class Update_Fields extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update Fields';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'hubspot_update_fields';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'hubspot';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the fields of a contact in Hubspot';

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
		$mapped_fields = $step->get_setting( 'mapped_fields', array() );
		if ( empty( $mapped_fields ) ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'properties' => array(
				'email'     => $email,
				'firstname' => $automation_contact->contact->first_name,
				'lastname'  => $automation_contact->contact->last_name,
			),
		);

		foreach ( $mapped_fields as $field_key => $value ) {
			$data['properties'][ $field_key ] = $this->merge_tags_manager->process_merge_tags( $value, $automation_contact );
		}

		$hubspot = Integrations_Manager::instance()->get_integration( 'hubspot' );
		$api     = $hubspot->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->create_or_update( $data );

		return $result['success'];
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
				'mapped_fields' => array(
					'type'     => 'object',
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Update_Fields() );
