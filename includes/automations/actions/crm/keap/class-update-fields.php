<?php
/**
 * Class Update_Fields
 *
 * This class is responsible for adding a contact to Keap
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Keap;

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
	public $slug = 'keap_update_fields';

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
	public $group = 'keap';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the fields of a contact in Keap';

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

		$data = array(
			'email_addresses'  => array(
				array(
					'email' => $automation_contact->contact->email,
					'field' => 'EMAIL1',
				),
			),
			'duplicate_option' => 'Email',
		);

		foreach ( $mapped_fields as $field_key => $value ) {
			$data['custom_fields'][] = array(
				'id'      => $field_key,
				'content' => $this->merge_tags_manager->process_merge_tags( $value, $automation_contact ),
			);
		}

		$keap = Integrations_Manager::instance()->get_integration( 'keap' );
		$api  = $keap->connect();
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
