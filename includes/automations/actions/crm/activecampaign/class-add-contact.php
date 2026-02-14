<?php
/**
 * Class Add_Contact
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

/**
 * Add Contact class
 */
class Add_Contact extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Contact';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'activecampaign_add_contact';

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
	public $description = 'This action will add a contact to ActiveCampaign.';

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = true;

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
		$mapped_fields = $step->get_setting(
			'mapped_fields',
			array(
				'email'      => '',
				'first_name' => '',
				'last_name'  => '',
			)
		);

		$email      = $this->merge_tags_manager->process_merge_tags( $mapped_fields['email'], $automation_contact );
		$first_name = $this->merge_tags_manager->process_merge_tags( $mapped_fields['first_name'], $automation_contact );
		$last_name  = $this->merge_tags_manager->process_merge_tags( $mapped_fields['last_name'], $automation_contact );

		if ( empty( $email ) ) {
			quillcrm_get_logger()->error(
				__( 'Failed to add contact to ActiveCampaign. Email is required.', 'quill-crm' ),
				array(
					'code' => 'activecampaign_add_contact',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
						'data'       => array(
							'email'      => $email,
							'first_name' => $first_name,
							'last_name'  => $last_name,
						),
					),
				)
			);
			return false;
		}

		$data = array(
			'contact' => array(
				'email'      => $email,
				'first_name' => $first_name,
				'last_name'  => $last_name,
			),
		);

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		error_log( 'email1: ' . $email );
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Failed to connect to ActiveCampaign.', 'quill-crm' ),
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
						'data'       => array(
							'email'      => $email,
							'first_name' => $first_name,
							'last_name'  => $last_name,
						),
					),
				)
			);
			return false;
		}

		$result = $api->create_or_update( $data );
		if ( $result['success'] ) {
			quillcrm_get_logger()->info(
				__( 'Contact added to ActiveCampaign.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_add_contact',
					'response' => $result,
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
						'data'       => array(
							'email'      => $email,
							'first_name' => $first_name,
							'last_name'  => $last_name,
						),
					),
				)
			);
			error_log( 'email2: ' . $email );
			return true;
		}

		if ( 422 === $result['code'] ) {
			quillcrm_get_logger()->error(
				__( 'Contact already exists.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_add_contact',
					'response' => $result,
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
						'data'       => array(
							'email'      => $email,
							'first_name' => $first_name,
							'last_name'  => $last_name,
						),
					),
				)
			);
			error_log( 'email3: ' . $email );
			return true;
		}

		quillcrm_get_logger()->error(
			__( 'Failed to add contact to ActiveCampaign.', 'quill-crm' ),
			array(
				'code'     => 'activecampaign_add_contact',
				'response' => $result,
				'data'     => array(
					'automation' => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
					'step'       => array(
						'id'   => $step->id,
						'type' => $step->type,
					),
					'data'       => array(
						'email'      => $email,
						'first_name' => $first_name,
						'last_name'  => $last_name,
					),
				),
			)
		);
		error_log( 'email4: ' . $email );
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
					'type'       => 'object',
					'properties' => array(
						'email'      => array(
							'type'     => 'string',
							'required' => true,
						),
						'first_name' => array(
							'type'     => 'string',
							'required' => false,
						),
						'last_name'  => array(
							'type'     => 'string',
							'required' => false,
						),
					),
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
				'label'  => __( 'Mapped Fields', 'quill-crm' ),
				'type'   => 'mapped_fields',
				'fields' => array(
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
			),
		);
	}
}

Add_Contact::instance();
