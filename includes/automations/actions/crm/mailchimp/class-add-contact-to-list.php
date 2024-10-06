<?php
/**
 * Class Add Contact
 *
 * This class is responsible for adding contact to a list in Mailchimp
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Mailchimp;

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
	public $slug = 'mailchimp_add_contact';

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
	public $group = 'mailchimp';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add contact to a list in Mailchimp.';

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
		$list = $step->get_setting( 'list', '' );
		if ( empty( $list ) ) {
			return false;
		}

		$mailchimp = Integrations_Manager::instance()->get_integration( 'mailchimp' );
		$api       = $mailchimp->connect();
		if ( ! $api ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'email_address'   => $email,
			'status'          => 'subscribed',
			'update_existing' => true,
		);

		$result = $api->add_subscriber( $list, $data );
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
				'list' => array(
					'type'     => 'string',
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
			'list' => array(
				'label'    => __( 'List ID', 'quillcrm' ),
				'type'     => 'api_select',
				'endpoint' => 'mailchimp/lists',
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_Contact() );
