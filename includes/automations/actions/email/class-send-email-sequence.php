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
use QuillCRM\Managers\Email_Sequences_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Models\Campaign_Model as Email_Sequence_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Utils;
use QuillCRM\Campaign\Email_Processing;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Campaign_Channel;


class Send_Email_Sequence extends Action {










	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Email Sequence';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_email_sequence';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a email sequence to the contact.';

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
		$email_sequence_id = $step->get_setting( 'email_sequence_id' );

		if ( empty( $email_sequence_id ) ) {
			quillcrm_get_logger()->error(
				'Email sequence ID not provided in automation action',
				array(
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
					'contact_id'    => $automation_contact->contact_id,
				)
			);
			return false;
		}

		// Validate email sequence exists
		$email_sequence = Email_Sequence_Model::find( $email_sequence_id );
		if ( ! $email_sequence || $email_sequence->get_type() !== Campaign_Channel::CHANNEL_EMAIL_SEQUENCE ) {
			quillcrm_get_logger()->error(
				'Email sequence not found or invalid type',
				array(
					'automation_id'     => $automation->id,
					'step_id'           => $step->id,
					'contact_id'        => $automation_contact->contact_id,
					'email_sequence_id' => $email_sequence_id,
				)
			);
			return false;
		}

		// Start the email sequence for this contact
		$email_sequences_manager = Email_Sequences_Manager::instance();
		$result                  = $email_sequences_manager->start_sequence_for_contact( $email_sequence_id, $automation_contact->contact_id );

		if ( $result ) {
			quillcrm_get_logger()->info(
				'Email sequence started successfully via automation',
				array(
					'automation_id'     => $automation->id,
					'step_id'           => $step->id,
					'contact_id'        => $automation_contact->contact_id,
					'email_sequence_id' => $email_sequence_id,
				)
			);

			return true;
		}

		quillcrm_get_logger()->error(
			'Failed to start email sequence via automation',
			array(
				'automation_id'     => $automation->id,
				'step_id'           => $step->id,
				'contact_id'        => $automation_contact->contact_id,
				'email_sequence_id' => $email_sequence_id,
			)
		);

		return false;
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
			'email_sequence_id'    => array(
				'label'   => __( 'Email Sequence', 'quillcrm' ),
				'type'    => 'select',
				'options' => $this->get_email_sequence_options(),
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
			'type'              => 'object',
			'properties'        => array(
				'internal_label'       => array(
					'type'     => 'string',
					'required' => false,
				),
				'internal_description' => array(
					'type'     => 'string',
					'required' => false,
				),
			),
			'email_sequence_id' => array(
				'type'     => 'integer',
				'required' => true,
			),
		);
	}

	/**
	 * Get options for email sequence
	 *
	 * @return array
	 */
	private function get_email_sequence_options() {
		 $email_sequences = Email_Sequence_Model::where( 'type', Campaign_Channel::CHANNEL_EMAIL_SEQUENCE )->get();
		return wp_list_pluck( $email_sequences->toArray(), 'name', 'id' );
	}
}

Send_Email_Sequence::instance();
