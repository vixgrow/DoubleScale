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
use QuillCRM\Models\Tracking_Model;
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
		return Tracking_Model::MODE_EMAIL;
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
				'label'       => __( 'Subject', 'quillcrm' ),
				'type'        => 'text',
				'required'    => true,
				'placeholder' => __( 'Enter email subject...', 'quillcrm' ),
			),
			'body'       => array(
				'label'    => __( 'Body', 'quillcrm' ),
				'type'     => 'open_builder',
				'required' => true,
			),
			'from_name'  => array(
				'label'       => __( 'From Name', 'quillcrm' ),
				'type'        => 'text',
				'placeholder' => get_bloginfo( 'name' ),
			),
			'from_email' => array(
				'label'       => __( 'From Email', 'quillcrm' ),
				'type'        => 'from_email',
				'placeholder' => get_option( 'admin_email' ),
			),
			'reply_to'   => array(
				'label'       => __( 'Reply To', 'quillcrm' ),
				'type'        => 'email',
				'placeholder' => __( 'Optional reply-to address', 'quillcrm' ),
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
}

Send_Email::instance();
