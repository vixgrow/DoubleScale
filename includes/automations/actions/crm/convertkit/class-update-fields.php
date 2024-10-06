<?php
/**
 * Class Update_Fields
 *
 * This class is responsible for adding a contact to Converkit
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Converkit;

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
	public $slug = 'convertkit_update_fields';

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
	public $group = 'convertkit';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the fields of a contact in Converkit';

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

		$data = array();

		foreach ( $mapped_fields as $field_key => $value ) {
			$data['fields'][ $field_key ] = $this->merge_tags_manager->process_merge_tags( $value, $automation_contact );
		}

		$convertkit = Integrations_Manager::instance()->get_integration( 'convertkit' );
		$api        = $convertkit->connect();
		if ( ! $api ) {
			return false;
		}

		$email  = $automation_contact->contact->email;
		$result = $api->get_subscriber( $email );
		if ( ! $result['success'] ) {
			return false;
		}

		$subscriber = $result['data']['subscribers'][0] ?? null;
		if ( ! $subscriber ) {
			return false;
		}

		$subscriber_id = $subscriber['id'] ?? null;
		$result        = $api->update_subscriber( $subscriber_id, $data );
		if ( ! $result['success'] ) {
			return false;
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
				'fields'   => array(),
				'endpoint' => 'convertkit/fields',
			),
		);
	}
}

Actions_Manager::instance()->register( new Update_Fields() );
