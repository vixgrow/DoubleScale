<?php
/**
 * Class Add_To_Sequence
 *
 * This class is responsible for adding a contact to a sequence in Convertkit
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Convertkit;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Add To Sequence class
 */
class Add_To_Sequence extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To Sequence';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'convertkit_add_to_sequence';

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
	public $description = 'This action will add a contact to a sequence in Convertkit';

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
		$sequence_id = $step->get_setting( 'sequence_id' );
		if ( empty( $sequence_id ) ) {
			return false;
		}

		$convertkit = Integrations_Manager::instance()->get_integration( 'convertkit' );
		$api        = $convertkit->connect();
		if ( ! $api ) {
			return false;
		}

		$email  = $automation_contact->contact->email;
		$result = $api->add_subscriber_to_sequence( $email, $sequence_id );

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
				'sequence_id' => array(
					'type' => array( 'string', 'integer' ),
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_Sequence() );
