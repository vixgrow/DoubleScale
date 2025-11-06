<?php
/**
 * Send WhatsApp Action
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
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Campaign\WhatsApp_Processing;

/**
 * Send WhatsApp Action
 */
class Send_WhatsApp extends Abstract_Send_Message {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send WhatsApp';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_whatsapp';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'whatsapp';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a WhatsApp message to the user with full tracking and analytics.';

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
		return \QuillCRM\Constants\Campaign_Channel::CHANNEL_WHATSAPP;
	}

	/**
	 * Get tracking mode
	 *
	 * @return int
	 */
	protected function get_tracking_mode() {
		return Tracking_Model::MODE_WHATSAPP;
	}

	/**
	 * Get recipient from contact
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return string|null
	 */
	protected function get_recipient( Contact_Model $contact ) {
		return $contact->phone;
	}

	/**
	 * Validate recipient
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return array|null
	 */
	protected function validate_recipient( Contact_Model $contact ) {
		if ( empty( $contact->phone ) ) {
			return array(
				'status'  => 'skipped',
				'message' => 'Contact has no phone number',
			);
		}

		// Validate phone number format (minimum 10 digits, E.164 format)
		if ( strlen( $contact->phone ) < 10 || ! preg_match( '/^\+?[0-9]+$/', $contact->phone ) ) {
			return array(
				'status'  => 'skipped',
				'message' => 'Invalid phone number format. Use E.164 format: +1234567890',
			);
		}

		return null;
	}

	/**
	 * Get processing instance
	 *
	 * @return WhatsApp_Processing
	 */
	protected function get_processing_instance() {
		return WhatsApp_Processing::instance();
	}

	/**
	 * Get channel name for logging
	 *
	 * @return string
	 */
	protected function get_channel_name() {
		return 'WhatsApp';
	}

	/**
	 * Get fields for UI
	 * User composes WhatsApp message directly (no template selection)
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'body' => array(
				'label'       => __( 'Message', 'quillcrm' ),
				'type'        => 'textarea',
				'required'    => true,
				'placeholder' => __( 'Enter WhatsApp message...', 'quillcrm' ),
				'description' => __( 'Use merge tags like {{contact:first_name}} to personalize.', 'quillcrm' ),
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
				'body' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Send_WhatsApp::instance();

