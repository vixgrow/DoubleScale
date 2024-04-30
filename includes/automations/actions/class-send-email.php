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
use QuillCRM\Models\Contact_Model;
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
	 * @param Automation_Model      $automation Automation Model.
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param Contact_Model         $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact ) {
		$template_id = $step->get_setting( 'template_id' );
		$template    = Template_Model::find( $template_id );

		if ( empty( $template ) ) {
			return false;
		}

		$template_settings = $template->settings;
		$subject           = $template->subject;
		$body              = $template->body;
		$to_email          = $template_settings['to_email'] ?? $contact->email;

		$emails = new Emails();
		$result = $emails->send(
			$to_email,
			$subject,
			$body,
		);

		error_log( 'Email Sent: ' . $result );

		return $result;
	}


}

Actions_Manager::instance()->register( new Send_Email() );
