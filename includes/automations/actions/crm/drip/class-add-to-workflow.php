<?php
/**
 * Class Add_To_Workflow
 *
 * This class is responsible for adding a subscriber to a Drip workflow
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Drip;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add To Workflow class
 */
class Add_To_Workflow extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To Workflow';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'drip_add_to_workflow';

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
	public $group = 'drip';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a subscriber to a Drip workflow.';

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
		$workflow_id = $step->get_setting( 'workflow_id', '' );
		if ( empty( $workflow_id ) ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'subscribers' => array(
				array(
					'email' => $email,
				),
			),
		);

		$drip = Integrations_Manager::instance()->get_integration( 'drip' );
		$api  = $drip->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->add_subscriber_to_workflow( $workflow_id, $data );

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
				'workflow_id' => array(
					'type'     => array( 'string', 'number' ),
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_Workflow() );
