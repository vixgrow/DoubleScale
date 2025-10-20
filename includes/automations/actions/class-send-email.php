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

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Services\Auto_Template_Manager;
use QuillCRM\Campaign\Email_Processing;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Utils;

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
	public $source = 'message';

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
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $automation_contact Automation Contact Model.
	 *
	 * @return bool|array True on success, false or array with status on failure
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		try {
			// 1. Get email content from step settings (user composes directly in UI)
			$subject    = $step->get_setting( 'subject' );
			$body       = $step->get_setting( 'body' );
			$from_name  = $step->get_setting( 'from_name' ) ?: get_bloginfo( 'name' );
			$from_email = $step->get_setting( 'from_email' ) ?: get_option( 'admin_email' );
			$reply_to   = $step->get_setting( 'reply_to' ) ?: '';

			$contact = $automation_contact->contact;

			// Validate required fields
			if ( empty( $subject ) ) {
				quillcrm_get_logger()->error(
					'Send Email action: Subject is required',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_email_no_subject',
					)
				);
				return false;
			}

			if ( empty( $body ) ) {
				quillcrm_get_logger()->error(
					'Send Email action: Body is required',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_email_no_body',
					)
				);
				return false;
			}

			if ( empty( $contact->email ) || ! filter_var( $contact->email, FILTER_VALIDATE_EMAIL ) ) {
				quillcrm_get_logger()->warning(
					'Send Email action: Contact has no valid email',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'email'         => $contact->email ?? 'empty',
						'code'          => 'send_email_no_email',
					)
				);
				return array(
					'status'  => 'skipped',
					'message' => 'Contact has no valid email address',
				);
			}

			// Check if contact is unsubscribed
			if ( $contact->status === 'unsubscribed' ) {
				quillcrm_get_logger()->info(
					'Send Email action: Contact is unsubscribed',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_email_unsubscribed',
					)
				);
				return array(
					'status'  => 'skipped',
					'message' => 'Contact is unsubscribed',
				);
			}

			// 2. Auto-create or find template (with deduplication)
			$template = Auto_Template_Manager::find_or_create(
				$subject,
				$body,
				array(
					'from_name'       => $from_name,
					'from_email'      => $from_email,
					'reply_to'        => $reply_to,
					'add_unsubscribe' => true,
					'enable_utm'      => false,
				)
			);

			// 3. Create tracking record BEFORE sending (critical for analytics)
			$tracking = Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => Tracking_Model::MODE_EMAIL,
					'source_type' => Message_Source_Types::AUTOMATION,
					'source_id'   => $automation->id,
					'recipient'   => $contact->email,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			// 4. Create dummy campaign for process_campaign_message() to work
			// This allows us to reuse 100% of existing campaign infrastructure
			$dummy_campaign = new Campaign_Model(
				array(
					'id'       => $automation->id,
					'name'     => 'Automation: ' . $automation->name,
					'type'     => 'email',
					'settings' => array(),
				)
			);
			$dummy_campaign->exists = true; // Mark as existing to prevent save attempts

			// 5. ✅ REUSE EXISTING CAMPAIGN INFRASTRUCTURE
			// This gives us: merge tags, tracking pixel, click tracking, footer, UTM, etc.
			Email_Processing::instance()->process_campaign_message(
				$dummy_campaign,
				$contact,
				$tracking
			);

			// 6. Check result and return
			$tracking->refresh();

			if ( $tracking->status === Tracking_Status::SENT ) {
				quillcrm_get_logger()->info(
					'Send Email action: Email sent successfully',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'template_id'   => $template->id,
						'code'          => 'send_email_success',
					)
				);
				return true;
			} else {
				quillcrm_get_logger()->error(
					'Send Email action: Email sending failed',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'status'        => $tracking->status,
						'code'          => 'send_email_failed',
					)
				);
				return false;
			}
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				'Send Email action: Exception occurred',
				array(
					'automation_id' => $automation->id ?? 0,
					'contact_id'    => $automation_contact->contact->id ?? 0,
					'error'         => $e->getMessage(),
					'code'          => 'send_email_exception',
				)
			);
			return false;
		}
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
				'type'     => 'wysiwyg',
				'required' => true,
			),
			'from_name'  => array(
				'label'       => __( 'From Name', 'quillcrm' ),
				'type'        => 'text',
				'placeholder' => get_bloginfo( 'name' ),
			),
			'from_email' => array(
				'label'       => __( 'From Email', 'quillcrm' ),
				'type'        => 'email',
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