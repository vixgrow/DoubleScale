<?php
/**
 * Class Rest_SMS_Campaign_Controller
 * This class is responsible for handling the SMS campaign rest api
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
use QuillCRM\Abstracts\Abstract_Twilio_Campaign_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Rest_SMS_Campaign_Controller class
 */
class REST_SMS_Campaign_Controller extends Abstract_Twilio_Campaign_Controller
{

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'sms-campaigns';

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type = 'sms';

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

		// Get SMS campaign messages
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
						'description' => __('The status of the SMS.', 'quillcrm'),
						'type' => 'string',
						'enum' => array('all', 'sent', 'failed', 'pending', 'delivered', 'clicked'),
						'required' => false,
					),
					),
				),
			)
		);

		// Send Test SMS
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/send-test-sms',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'send_test_message'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
					'args' => array(
						'phone' => array(
							'description' => __('The phone number to send the test SMS to.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_text_field',
							),
						),
						'message' => array(
							'description' => __('The message of the test SMS.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_textarea_field',
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
		return Tracking_Model::sms()->where('source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN)->where('source_id', $campaign_id);
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
		return $this->send_test_message_common($request);
	}

	/**
	 * Get Twilio tracking class - implementation of abstract method
	 *
	 * @return string
	 */
	protected function get_twilio_tracking_class()
	{
		return \QuillCRM\Tracking\SMS::class;
	}

	/**
	 * Prepare test message data - implementation of abstract method
	 *
	 * @param WP_REST_Request $request
	 * @param mixed $api
	 * @param Contact_Model $contact
	 * @return array
	 */
	protected function prepare_test_message_data($request, $api, $contact)
	{
		$phone = $request->get_param('phone');
		$message = $request->get_param('message');

		// Process merge tags
		$processed_message = $this->process_merge_tags($message, $contact);

		return array(
			'To' => $phone,
			'Body' => $processed_message,
		);
	}

	/**
	 * Send message via Twilio API - implementation of abstract method
	 *
	 * @param mixed $api
	 * @param array $message_data
	 * @return array
	 */
	protected function send_twilio_message($api, $message_data)
	{
		return $api->send_sms($message_data);
	}

	/**
	 * Get SMS-specific error messages
	 * Override parent method to provide SMS-specific error handling
	 *
	 * @param int $error_code Twilio error code
	 * @param string $original_message Original error message
	 * @return string|false SMS-specific error message or false if not handled
	 */
	protected function get_service_specific_error_message($error_code, $original_message)
	{
		// SMS-specific error codes
		$sms_errors = array(
			21612 => 'The "To" phone number is not a valid mobile number for SMS.',
			21266 => 'Cannot send SMS to the same number as the sender. Please use a different phone number.',
			63038 => 'Daily SMS limit exceeded for this Twilio account. Please check your account limits or upgrade your plan.',
		);

		return $sms_errors[$error_code] ?? false;
	}

	/**
	 * Get success message - override parent method
	 *
	 * @return string
	 */
	protected function get_success_message()
	{
		return 'Test SMS sent successfully';
	}

	/**
	 * Schema for the SMS campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The SMS campaign schema
	 */
	public function get_item_schema()
	{
		$status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'sms_campaign',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('Unique identifier for the object.', 'quillcrm'),
					'type' => 'integer',
					'readonly' => true,
				),
				'name' => array(
					'description' => __('The name of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'required' => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __('The description of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status' => array(
					'description' => __('The status of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => $status_manager->get_all_statuses(),
					'default' => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array($this, 'validate_campaign_status'),
				),
				'type' => array(
					'description' => __('The type of the campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => array('sms'),
					'default' => 'sms',
				),
				'settings' => array(
					'description' => __('The settings of the SMS campaign.', 'quillcrm'),
					'type' => 'object',
				),
				'count' => array(
					'description' => __('The count of the SMS campaign.', 'quillcrm'),
					'type' => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at' => array(
					'description' => __('The execute at of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at' => array(
					'description' => __('The created at of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
				'updated_at' => array(
					'description' => __('The updated at of the SMS campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
			),
		);
	}



	/**
	 * Get SMS campaign messages
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_campaign_messages($request)
	{
		try {
			$campaign_id = $request->get_param('id');
			$per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 10;
			$page = $request->get_param('page') ? $request->get_param('page') : 1;
			$status = $request->get_param('status') ? $request->get_param('status') : '';

			$query = $this->get_campaign_message_query($campaign_id);

			switch ($status) {
				case 'failed':
					$query->where('status', 'failed');
					break;
				case 'sent':
					$query->where('status', 'sent');
					break;
				case 'pending':
					$query->where('status', 'pending');
					break;
			}

			$campaign_messages = $query->with('contact', 'template')
				->paginate($per_page, array('*'), 'page', $page);

			return new WP_REST_Response($campaign_messages, 200);
		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
	}




}