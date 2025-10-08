<?php
/**
 * Class Rest_Email_Campaign_Controller
 * This class is responsible for handling the Email campaign rest api
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Campaign_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Emails\Emails;
use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Rest_Email_Campaign_Controller class
 */
class REST_Email_Campaign_Controller extends Abstract_Campaign_Controller
{

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'email-campaigns';

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $channel = 'email';

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
	}

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes()
	{
		// Register common routes from abstract parent
		$this->register_common_routes();

		// Get email campaign messages
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/messages',
			array(
				'args' => array(
					'id' => array(
						'description' => __('Unique identifier for the object.', 'quillcrm'),
						'type' => 'integer',
					),
					'per_page' => array(
						'description' => __('The number of items to return per page.', 'quillcrm'),
						'type' => 'integer',
						'default' => 10,
					),
					'page' => array(
						'description' => __('The page number.', 'quillcrm'),
						'type' => 'integer',
						'default' => 1,
					),
				),
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_campaign_messages'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
					'args' => array(
						'id' => array(
							'description' => __('The id of the campaign.', 'quillcrm'),
							'type' => 'integer',
							'required' => true,
						),
						'per_page' => array(
							'description' => __('The number of items to return per page.', 'quillcrm'),
							'type' => 'integer',
							'default' => 10,
						),
						'page' => array(
							'description' => __('The page number.', 'quillcrm'),
							'type' => 'integer',
							'default' => 1,
						),
						'status' => array(
							'description' => __('The status of the email.', 'quillcrm'),
							'type' => 'string',
							'enum' => array('all', 'sent', 'opened', 'clicked', 'failed'),
							'required' => false,
						),
					),
				),
			)
		);

		// Send Test Email
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/send-test-email',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'send_test_message'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
					'args' => array(
						'email' => array(
							'description' => __('The email to send the test email to.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_email',
							),
						),
						'subject' => array(
							'description' => __('The subject of the test email.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_text_field',
							),
						),
						'body' => array(
							'description' => __('The body of the test email.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'wp_kses_post',
							),
						),
						'from_name' => array(
							'description' => __('The from name of the test email.', 'quillcrm'),
							'type' => 'string',
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_text_field',
							),
						),
						'from_email' => array(
							'description' => __('The from email of the test email.', 'quillcrm'),
							'type' => 'string',
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_email',
							),
						),
						'reply_to' => array(
							'description' => __('The reply to of the test email.', 'quillcrm'),
							'type' => 'string',
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_email',
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Get campaign query - implements abstract method
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_campaign_query()
	{
		return Campaign_Model::query()->where('type', $this->campaign_type);
	}

	/**
	 * Get campaign message query - implements abstract method
	 *
	 * @param int $campaign_id
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_campaign_message_query($campaign_id)
	{
		return Tracking_Model::emails()->where('source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN)->where('source_id', $campaign_id);
	}

	/**
	 * Send test message - implements abstract method
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function send_test_message($request)
	{
		try {
			$email = $request->get_param('email');
			$subject = $request->get_param('subject');
			$body = $request->get_param('body');
			$from_name = $request->get_param('from_name') ?: get_option('blogname');
			$from_email = $request->get_param('from_email') ?: get_option('admin_email');
			$reply_to = $request->get_param('reply_to');

			$emails = new Emails();
			$emails->from_address = $from_email;
			$emails->from_name = $from_name;
			if (!empty($reply_to)) {
				$emails->reply_to = $reply_to;
			}

			$for_testing_body = !empty($body) ? $body : $this->get_default_test_email_content();

			$contact = Contact_Model::get_by_email($email) ?? null;
			$result = $emails->send(
				$email,
				$subject,
				$this->process_merge_tags($for_testing_body, $contact),
			);

			if (!$result) {
				return new WP_Error('error', __('Failed to send test email', 'quillcrm'), array('status' => 500));
			}

			return new WP_REST_Response(array('message' => 'Test email sent successfully'), 200);
		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
	}

	// get_campaign_messages() is now inherited from Abstract_Campaign_Controller
	// No override needed - parent implementation handles all status filters including 'opened' and 'clicked'

	/**
	 * Get default test email content
	 *
	 * @return string
	 */
	protected function get_default_test_email_content()
	{
		$default_content = sprintf(
			__('<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>', 'quillcrm')
		);
		
		return apply_filters('quillcrm_default_test_email_content', $default_content);
	}

	/**
	 * Schema for the email campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The email campaign schema
	 */
	public function get_item_schema()
	{
		$status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'email_campaign',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('Unique identifier for the object.', 'quillcrm'),
					'type' => 'integer',
					'readonly' => true,
				),
				'name' => array(
					'description' => __('The name of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'required' => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __('The description of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status' => array(
					'description' => __('The status of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => $status_manager->get_all_statuses(),
					'default' => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array($this, 'validate_campaign_status'),
				),
				'type' => array(
					'description' => __('The type of the campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => array('email'),
					'default' => 'email',
				),
				'settings' => array(
					'description' => __('The settings of the email campaign.', 'quillcrm'),
					'type' => 'object',
				),
				'count' => array(
					'description' => __('The count of the email campaign.', 'quillcrm'),
					'type' => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at' => array(
					'description' => __('The execute at of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at' => array(
					'description' => __('The created at of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
				'updated_at' => array(
					'description' => __('The updated at of the email campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
			),
		);
	}
}
