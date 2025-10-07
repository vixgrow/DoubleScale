<?php


/**
 * Send Campaign Email
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Email;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Utils;
use QuillCRM\Campaign\Email_Processing;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;


class Send_Campaign_Email extends Action {


	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Campaign Email';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_campaign_email';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a campaign email to the contact.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'email';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'email';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		try {
			$campaign_id = $step->get_setting( 'campaign_id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return false;
			}

			$contact = $automation_contact->contact;

			// Validate contact has email
			if ( empty( $contact->email ) ) {
				return false;
			}

			// Use process_campaign_message for the actual sending
			$email_processor = Email_Processing::instance();
			// Get template for campaign (with A/B testing support)
			$template_id = $email_processor->get_template_for_contact( $campaign, $contact );
			if ( ! $template_id ) {
				return false;
			}

			// Check for existing message to prevent duplicates
			$existing_message = $this->check_existing_campaign_message( $contact, $template_id );
			if ( $existing_message ) {
				return true; // Already sent, skip
			}

			// Create campaign message tracking record
			$campaign_message_data = array(
				'contact_id'  => $contact->id,
				'template_id' => $template_id,
				'mode'        => Tracking_Model::MODE_EMAIL,
				'source_type' => Message_Source_Types::AUTOMATION,
				'source_id'   => $automation->id,
				'recipient'   => $contact->email,
				'status'      => Tracking_Status::PENDING,
				'hash_key'    => Utils::generate_hash_key(),
			);

			$campaign_message = Tracking_Model::create( $campaign_message_data );

			$email_processor->process_campaign_message( $campaign, $contact, $campaign_message );
			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'internal_label'       => array(
				'label' => __( 'Internal Label', 'quillcrm' ),
				'type'  => 'text',
			),
			'internal_description' => array(
				'label' => __( 'Internal Description', 'quillcrm' ),
				'type'  => 'text',
			),
			'campaign_id'          => array(
				'label'   => __( 'Campaign', 'quillcrm' ),
				'type'    => 'select',
				'options' => $this->get_campaign_options(),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'        => 'object',
			'properties'  => array(
				'internal_label'       => array(
					'type'     => 'string',
					'required' => false,
				),
				'internal_description' => array(
					'type'     => 'string',
					'required' => false,
				),
			),
			'campaign_id' => array(
				'type'     => 'integer',
				'required' => true,
			),
		);
	}

	/**
	 * Get options for campaign
	 *
	 * @return array
	 */
	private function get_campaign_options() {
		$campaigns = Campaign_Model::all();
		return wp_list_pluck( $campaigns->toArray(), 'name', 'id' );
	}

	/**
	 * Check for existing campaign message for a contact.
	 *
	 * @param Campaign_Model           $campaign The campaign model.
	 * @param Automation_Contact_Model $contact The contact model.
	 * @return Tracking_Model|false The existing message or false if none.
	 */
	private function check_existing_campaign_message( $contact, $template_id ) {
		return Tracking_Model::where( 'contact_id', $contact->id )
			->where( 'mode', Tracking_Model::MODE_EMAIL )
			->where( 'template_id', $template_id )
			->first();
	}

	/**
	 * Get the template ID for a specific contact based on campaign settings.
	 *
	 * @param Campaign_Model           $campaign The campaign model.
	 * @param Automation_Contact_Model $contact The contact model.
	 * @return int|false The template ID or false if no template found.
	 */
	private function get_template_id( $campaign, $contact ) {
		$template_ids = $campaign->get_template_ids();
		return reset( $template_ids );
	}
}

Send_Campaign_Email::instance();
