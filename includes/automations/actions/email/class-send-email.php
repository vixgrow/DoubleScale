<?php

/**
 * Send Email Action
 * Auto-generates templates and creates tracking records
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Abstract_Send_Message;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Campaign\Email_Processing;

/**
 * Send Email Action
 */
class Send_Email extends Abstract_Send_Message {





	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Email';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_email';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'email';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'email';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send an email to the user with full tracking and analytics.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Get channel type
	 *
	 * @return string
	 */
	protected function get_channel_type() {
		 return 'email';
	}

	/**
	 * Get tracking mode
	 *
	 * @return int
	 */
	protected function get_tracking_mode() {
		return Communication_Tracking_Model::MODE_EMAIL;
	}

	/**
	 * Get recipient from contact
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return string|null
	 */
	protected function get_recipient( Contact_Model $contact ) {
		return $contact->email;
	}

	/**
	 * Validate recipient
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return array|null
	 */
	protected function validate_recipient( Contact_Model $contact ) {
		if ( empty( $contact->email ) || ! filter_var( $contact->email, FILTER_VALIDATE_EMAIL ) ) {
			return array(
				'status'  => 'skipped',
				'message' => 'Contact has no valid email address',
			);
		}
		return null;
	}

	/**
	 * Get processing instance
	 *
	 * @return Email_Processing
	 */
	protected function get_processing_instance() {
		return Email_Processing::instance();
	}

	/**
	 * Get channel name for logging
	 *
	 * @return string
	 */
	protected function get_channel_name() {
		 return 'Email';
	}

	/**
	 * Get fields for UI
	 * User composes email directly (no template selection)
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'subject'    => array(
				'label'       => __( 'Subject', 'quill-crm' ),
				'type'        => 'text',
				'required'    => true,
				'placeholder' => __( 'Enter email subject...', 'quill-crm' ),
			),
			'body'       => array(
				'label'    => __( 'Body', 'quill-crm' ),
				'type'     => 'open_builder',
				'required' => true,
			),
			'from_name'  => array(
				'label'       => __( 'From Name', 'quill-crm' ),
				'type'        => 'text',
				'placeholder' => get_bloginfo( 'name' ),
			),
			'from_email' => array(
				'label'       => __( 'From Email', 'quill-crm' ),
				'type'        => 'from_email',
				'placeholder' => get_option( 'admin_email' ),
			),
			'reply_to'   => array(
				'label'       => __( 'Reply To', 'quill-crm' ),
				'type'        => 'email',
				'placeholder' => __( 'Optional reply-to address', 'quill-crm' ),
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
			'type'       => 'object',
			'properties' => array(
				'subject'    => array(
					'type'     => 'string',
					'required' => true,
				),
				'body'       => array(
					'type'     => 'string',
					'required' => true,
				),
				'from_name'  => array(
					'type' => 'string',
				),
				'from_email' => array(
					'type'   => 'string',
					'format' => 'email',
				),
				'reply_to'   => array(
					'type'   => 'string',
					'format' => 'email',
				),
			),
		);
	}

	/**
	 * Prepare channel-specific message data for sending
	 *
	 * For Email, this returns the subject, body, and optional from/reply fields.
	 * Template auto-generation is handled by Automation_Step_Model events.
	 *
	 * @param Automation_Step_Model        $step     Automation Step Model.
	 * @param Contact_Model                $contact  Contact Model.
	 * @param Communication_Tracking_Model $tracking Communication Tracking Model.
	 * @return array Prepared message data with subject, body, from_name, from_email, reply_to.
	 * @throws \Exception If required fields are empty.
	 */
	protected function prepare_message_data( Automation_Step_Model $step, Contact_Model $contact, Communication_Tracking_Model $tracking ) {
		$subject    = $step->get_setting( 'subject' );
		$body       = $step->get_setting( 'body' );
		$from_name  = $step->get_setting( 'from_name' );
		$from_email = $step->get_setting( 'from_email' );
		$reply_to   = $step->get_setting( 'reply_to' );

		if ( empty( $subject ) ) {
			throw new \Exception( __( 'Email subject is empty.', 'quill-crm' ) );
		}

		if ( empty( $body ) ) {
			throw new \Exception( __( 'Email body is empty.', 'quill-crm' ) );
		}

		return array(
			'subject'    => $subject,
			'body'       => $body,
			'from_name'  => $from_name,
			'from_email' => $from_email,
			'reply_to'   => $reply_to,
		);
	}
}

Send_Email::instance();
