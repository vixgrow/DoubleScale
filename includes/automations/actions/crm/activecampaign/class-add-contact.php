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
		$email      = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'email' ), $automation_contact );
		$first_name = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'first_name' ), $automation_contact );
		$last_name  = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'last_name' ), $automation_contact );

		if ( empty( $email ) ) {
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
				'email'      => array(
					'description' => __( 'Email', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
				),
				'first_name' => array(
					'description' => __( 'First Name', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
				),
				'last_name'  => array(
					'description' => __( 'Last Name', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_Contact() );
