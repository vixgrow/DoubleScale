<?php
/**
 * Class Add_Contact
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
	public $slug = 'keap_add_contact';

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
	public $description = 'This action will add a contact to Keap.';

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
		$email         = $this->merge_tags_manager->process_merge_tags( $mapped_fields['email'], $automation_contact );
		$first_name    = $this->merge_tags_manager->process_merge_tags( $mapped_fields['first_name'], $automation_contact );
		$last_name     = $this->merge_tags_manager->process_merge_tags( $mapped_fields['last_name'], $automation_contact );

		if ( empty( $email ) ) {
			quillcrm_get_logger()->error(
				__( 'Keap Add Contact: Email is required.', 'quillcrm' ),
				array(
					'code' => 'keap_add_contact',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		$data = array(
			'email_addresses'  => array(
				array(
					'email' => $email,
					'field' => 'EMAIL1',
				),
			),
			'given_name'       => $first_name,
			'family_name'      => $last_name,
			'duplicate_option' => 'Email',
		);

		$keap = Integrations_Manager::instance()->get_integration( 'keap' );
		$api  = $keap->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Keap Add Contact: API connection failed.', 'quillcrm' ),
				array(
					'code' => 'keap_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		$result = $api->create_or_update( $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Keap Add Contact: Failed to create or update contact.', 'quillcrm' ),
				array(
					'code'     => 'keap_create_or_update_contact',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'Keap Add Contact: Contact added successfully.', 'quillcrm' ),
			array(
				'code'     => 'keap_add_contact',
				'response' => $result,
			)
		);

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
				'label'  => __( 'Mapped Fields', 'quillcrm' ),
				'type'   => 'mapped_fields',
				'fields' => array(
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
			),
		);
	}
}

Add_Contact::instance();
