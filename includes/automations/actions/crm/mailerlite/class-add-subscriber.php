<?php
/**
 * Class Add_Subscriber
 *
 * This class is responsible for adding a subscriber to MailerLite
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\MailerLite;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add Subscriber class
 */
class Add_Subscriber extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Subscriber';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mailerlite_add_subscriber';

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
	public $group = 'mailerlite';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a subscriber to MailerLite';

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
	}

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
		$data       = array(
			'email'  => $email,
			'fields' => array(
				'first_name' => $first_name,
				'last_name'  => $last_name,
			),
		);

		$mailerlite = Integrations_Manager::instance()->get_integration( 'mailerlite' );
		$api        = $mailerlite->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->add_subscriber( $data );
		error_log( wp_json_encode( $result ) );
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

Actions_Manager::instance()->register( new Add_Subscriber() );
