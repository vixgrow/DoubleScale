<?php

/**
 * Send Email Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Emails\Emails;
use QuillCRM\Models\Template_Model;

/**
 * Send Email Action
 */
class Send_Email extends Action {


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
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'email';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send an email to the user.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

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
		$template_id = $step->get_setting( 'template_id' );
		$template    = Template_Model::find( $template_id );

		if ( empty( $template ) ) {
			return false;
		}
		$contact  = $automation_contact->contact;
		$subject  = $this->merge_tags_manager->process_merge_tags( $template->subject, $automation_contact );
		$body     = $this->merge_tags_manager->process_merge_tags( $template->body, $automation_contact );
		$to_email = $template->get_setting( 'to_email' ) ?? $contact->email;

		$emails = new Emails();
		$result = $emails->send(
			$to_email,
			$subject,
			$body,
		);

		return $result;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'subject' => array(
				'label' => __( 'Subject', 'quillcrm' ),
				'type'  => 'text',
			),
			'body'    => array(
				'label' => __( 'Body', 'quillcrm' ),
				'type'  => 'textarea',
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
				'subject' => array(
					'type'    => 'string',
					'default' => '',
				),
				'body'    => array(
					'type'    => 'string',
					'default' => '',
				),
			),
		);
	}
}

Send_Email::instance();
