<?php
/**
 * Class Rest_WhatsApp_Campaign_Controller
 * This class is responsible for handling the WhatsApp campaign rest api
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
 * Rest_WhatsApp_Campaign_Controller class
 */
class REST_WhatsApp_Campaign_Controller extends Abstract_Twilio_Campaign_Controller
{

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'whatsapp-campaigns';

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type = 'whatsapp';

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

		// Get WhatsApp campaign messages
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
						'description' => __('The status of the WhatsApp message.', 'quillcrm'),
						'type' => 'string',
						'enum' => array('all', 'sent', 'failed', 'pending', 'delivered', 'read', 'clicked'),
						'required' => false,
					),
					),
				),
			)
		);

		// Send Test WhatsApp Message
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/send-test-whatsapp',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'send_test_message'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
					'args' => array(
						'phone' => array(
							'description' => __('The phone number to send the test WhatsApp message to.', 'quillcrm'),
							'type' => 'string',
							'required' => true,
							'arg_options' => array(
								'sanitize_callback' => 'sanitize_text_field',
							),
						),
						'message' => array(
							'description' => __('The message content for the test.', 'quillcrm'),
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
		return Tracking_Model::whatsapp()->where('source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN)->where('source_id', $campaign_id);
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
		return \QuillCRM\Tracking\WhatsApp::class;
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

		if (empty($message)) {
			throw new \Exception(__('Message content is required', 'quillcrm'));
		}

		$processed_message = $this->process_merge_tags($message, $contact);
		
		$whatsapp_data = array(
			'To' => $phone,
			'Body' => $processed_message,
		);

		return $whatsapp_data;
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
		return $api->send_whatsapp($message_data);
	}

	/**
	 * Get WhatsApp-specific error messages
	 * Override parent method to provide WhatsApp-specific error handling
	 *
	 * @param int $error_code Twilio error code
	 * @param string $original_message Original error message
	 * @return string|false WhatsApp-specific error message or false if not handled
	 */
	protected function get_service_specific_error_message($error_code, $original_message)
	{
		// WhatsApp-specific error codes
		$whatsapp_errors = array(
			21612 => 'WhatsApp 24-hour window restriction: The recipient must have messaged your WhatsApp number within the last 24 hours, or you must use an approved message template.',
			63031 => 'Cannot send WhatsApp message to the same number as the sender. Please use a different phone number.',
			63016 => 'WhatsApp template not found or not approved. Please check your Twilio console.',
			63017 => 'WhatsApp template variables mismatch. Please verify template parameters.',
		);

		return $whatsapp_errors[$error_code] ?? false;
	}

	/**
	 * Get success message - override parent method
	 *
	 * @return string
	 */
	protected function get_success_message()
	{
		return 'Test WhatsApp message sent successfully';
	}


	/**
	 * Schema for the WhatsApp campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The WhatsApp campaign schema
	 */
	public function get_item_schema()
	{
		$status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'whatsapp_campaign',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('Unique identifier for the object.', 'quillcrm'),
					'type' => 'integer',
					'readonly' => true,
				),
				'name' => array(
					'description' => __('The name of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'required' => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __('The description of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status' => array(
					'description' => __('The status of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => $status_manager->get_all_statuses(),
					'default' => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array($this, 'validate_campaign_status'),
				),
				'type' => array(
					'description' => __('The type of the campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => array('whatsapp'),
					'default' => 'whatsapp',
				),
				'settings' => array(
					'description' => __('The settings of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'object',
					'properties' => array(
						'whatsapp' => array(
							'description' => __('WhatsApp specific settings.', 'quillcrm'),
							'type' => 'object',
							'properties' => array(
								'message_type' => array(
									'description' => __('Type of WhatsApp message.', 'quillcrm'),
									'type' => 'string',
									'enum' => array('text', 'media'),
									'default' => 'text',
								),
								'message' => array(
									'description' => __('Message content for text messages.', 'quillcrm'),
									'type' => 'string',
								),
								'media_url' => array(
									'description' => __('Media URL for media messages.', 'quillcrm'),
									'type' => 'string',
								),
								'add_unsubscribe' => array(
									'description' => __('Whether to add unsubscribe option.', 'quillcrm'),
									'type' => 'boolean',
									'default' => true,
								),
							),
						),
						'filters' => array(
							'description' => __('Contact filters for the campaign.', 'quillcrm'),
							'type' => 'array',
						),
					),
				),
				'count' => array(
					'description' => __('The count of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at' => array(
					'description' => __('The execute at of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at' => array(
					'description' => __('The created at of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
				'updated_at' => array(
					'description' => __('The updated at of the WhatsApp campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
			),
		);
	}

	/**
	 * Get WhatsApp campaign messages
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
			$message_type = $request->get_param('message_type') ? $request->get_param('message_type') : '';

			$query = $this->get_campaign_message_query($campaign_id);

			// Filter by status
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
