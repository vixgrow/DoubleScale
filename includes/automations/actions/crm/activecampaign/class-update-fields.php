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
			quillcrm_get_logger()->error(
				__( 'ActiveCampaign Update Fields: Mapped Fields is empty.', 'quill-crm' ),
				array(
					'code'          => 'activecampaign_update_fields',
					'data'          => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'mapped_fields' => $mapped_fields,
				)
			);
			return false;
		}

		$data = array(
			'email' => $automation_contact->contact->email,
		);

		foreach ( $mapped_fields as $field ) {
			$field_key = $field['key'];
			$value     = $field['value'];
			if ( empty( $value ) || empty( $field_key ) ) {
				continue;
			}

			if ( in_array( $field_key, array( 'email', 'first_name', 'last_name' ) ) ) {
				$data[ $field_key ] = $this->merge_tags_manager->process_merge_tags( $value, $automation_contact );
				continue;
			}

			$data['fieldValues'][] = array(
				'field' => $field_key,
				'value' => $this->merge_tags_manager->process_merge_tags( $value, $automation_contact ),
			);
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'ActiveCampaign API connection failed.', 'quill-crm' ),
				array(
					'code' => 'activecampaign_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
				)
			);
			return false;
		}

		$result = $api->create_or_update(
			array(
				'contact' => $data,
			)
		);

		if ( $result['success'] ) {
			quillcrm_get_logger()->info(
				__( 'ActiveCampaign Update Fields: Contact updated successfully.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_update_fields',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return true;
		}

		if ( 422 === $result['code'] ) {
			quillcrm_get_logger()->error(
				__( 'ActiveCampaign Update Fields: Failed to update contact.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_update_fields',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return true;
		}

		quillcrm_get_logger()->error(
			__( 'ActiveCampaign Update Fields: Failed to update contact.', 'quill-crm' ),
			array(
				'code'     => 'activecampaign_update_fields',
				'data'     => array(
					'automation' => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
					'step'       => array(
						'id'   => $step->id,
						'type' => $step->type,
					),
				),
				'response' => $result,
			)
		);
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
				'label'    => __( 'Mapped Fields', 'quill-crm' ),
				'type'     => 'api_mapped_fields',
				'fields'   => array(
					'email'      => array(
						'label' => __( 'Email', 'quill-crm' ),
					),
					'first_name' => array(
						'label' => __( 'First Name', 'quill-crm' ),
					),
					'last_name'  => array(
						'label' => __( 'Last Name', 'quill-crm' ),
					),
				),
				'endpoint' => 'activecampaign/fields',
			),
		);
	}
}

Update_Fields::instance();
