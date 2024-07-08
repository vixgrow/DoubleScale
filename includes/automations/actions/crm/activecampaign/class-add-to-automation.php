<?php
/**
 * Class Add_To_Automation
 *
 * This class is responsible for adding list to a contact in ActiveCampaign
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
 * Add To Automation class
 */
class Add_To_Automation extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To Automation';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'activecampaign_add_to_automation';

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
	public $description = 'This action will add contact to an automation in ActiveCampaign.';

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
		$automation = $step->get_setting( 'automation', '' );
		if ( empty( $automation ) ) {
			return false;
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->get_contact( $automation_contact->contact->email );
		if ( ! $result['success'] ) {
			return false;
		}

		$contact_id = $result['data']['contacts'][0]['id'] ?? null;
		if ( ! $contact_id ) {
			return false;
		}

		$data = array(
			'contactAutomation' => array(
				'automation' => $automation,
				'contact'    => $contact_id,
			),
		);

		$result = $api->add_contact_to_automation( $data );
		if ( $result['success'] ) {
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
				'automation' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_Automation() );
