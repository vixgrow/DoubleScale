<?php
/**
 * Class Update_Fields
 *
 * This class is responsible for adding a contact to ActiveCampaign
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\ActiveCampaign;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Automations\Integrations\ActiveCampaign;

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
	public $slug = 'activecampaign_update_fields';

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
	public $group = 'activecampaign';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the fields of a contact in ActiveCampaign';

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
			'email' => $automation_contact->contact->email,
		);

		foreach ( $mapped_fields as $field_key => $value ) {
			$data['fieldValues'][] = array(
				'field' => $field_key,
				'value' => $this->merge_tags_manager->process_merge_tags( $value, $automation_contact ),
			);
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->create_or_update( $data );
		if ( $result['success'] ) {
			return true;
		}

		if ( 422 === $result['response']['code'] ) {
			return true;
		}

		return false;
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

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'mapped_fields' => array(
				'label'    => __( 'Mapped Fields', 'quillcrm' ),
				'type'     => 'api_mapped_fields',
				'fields'   => array(
					'email'      => array(
						'label' => __( 'Email', 'quillcrm' ),
					),
					'first_name' => array(
						'label' => __( 'First Name', 'quillcrm' ),
					),
					'last_name'  => array(
						'label' => __( 'Last Name', 'quillcrm' ),
					),
				),
				'endpoint' => 'activecampaign/fields',
			),
		);
	}
}

Actions_Manager::instance()->register( new Update_Fields() );
