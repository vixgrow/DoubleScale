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
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Renderer;
use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Rest_Email_Campaign_Controller class
 */
class REST_Email_Campaign_Controller extends Abstract_Campaign_Controller {


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
	protected $campaign_type = 'email';

	/**
	 * Constructor
	 */
	public function __construct() {
		 parent::__construct();
	}

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Register common routes from abstract parent
		$this->register_common_routes();

		// Get email campaign messages
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/messages',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
					'per_page' => array(
						'description' => __( 'The number of items to return per page.', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 10,
					),
					'page'     => array(
						'description' => __( 'The page number.', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 1,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_messages' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'The id of the campaign.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'per_page' => array(
							'description' => __( 'The number of items to return per page.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 10,
						),
						'page'     => array(
							'description' => __( 'The page number.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 1,
						),
						'status'   => array(
							'description' => __( 'The status of the email.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'all', 'sent', 'opened', 'clicked', 'failed' ),
							'required'    => false,
						),
					),
				),
			)
		);

		// Send Test Email
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/send-test-email',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_test_message' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'emails' => array(
							'description' => __( 'Array of email addresses to send test emails to.', 'quillcrm' ),
							'type'        => 'array',
							'required'    => true,
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
	protected function get_campaign_query() {
		return Campaign_Model::query()->where( 'type', $this->campaign_type );
	}

	/**
	 * Get campaign message query - implements abstract method
	 *
	 * @param int $campaign_id
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_campaign_message_query( $campaign_id ) {
		return Tracking_Model::emails()->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN )->where( 'source_id', $campaign_id );
	}

	/**
	 * Send test message - implements abstract method
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function send_test_message( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$emails      = $request->get_param( 'emails' );

			// Validate emails array
			if ( empty( $emails ) || ! is_array( $emails ) ) {
				return new WP_Error( 'invalid_emails', __( 'Please provide an array of email addresses', 'quillcrm' ), array( 'status' => 400 ) );
			}

			// Validate all email addresses
			$invalid_emails = array();
			foreach ( $emails as $email ) {
				if ( ! is_email( $email ) ) {
					$invalid_emails[] = $email;
				}
			}

			if ( ! empty( $invalid_emails ) ) {
				return new WP_Error(
					'invalid_emails',
					sprintf(
						/* translators: %s: comma-separated list of invalid email addresses */
						__( 'Invalid email address(es): %s', 'quillcrm' ),
						implode( ', ', $invalid_emails )
					),
					array( 'status' => 400 )
				);
			}

			// Get campaign
			$campaign = Campaign_Model::find( $campaign_id );
			if ( ! $campaign ) {
				return new WP_Error( 'campaign_not_found', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Get template ID from campaign
			$campaign_settings = is_array( $campaign->settings ) ? $campaign->settings : json_decode( $campaign->settings, true );

			// Email campaigns store template_ids, while SMS/WhatsApp store full templates
			$template_id = $campaign_settings['template_ids'][0] ?? $campaign_settings['templates'][0]['id'] ?? null;

			if ( ! $template_id ) {
				return new WP_Error( 'template_not_found', __( 'Campaign template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Get template
			$template = Template_Model::find( $template_id );
			if ( ! $template ) {
				return new WP_Error( 'template_not_found', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Extract template settings
			$template_settings = is_array( $template->settings ) ? $template->settings : json_decode( $template->settings, true );
			$from_name         = $template_settings['from_name'] ?? get_option( 'blogname' );
			$from_email        = $template_settings['from_email'] ?? get_option( 'admin_email' );
			$reply_to          = $template_settings['reply_to'] ?? '';
			$subject           = $template->subject ?? 'Test Email';

			// Track results
			$sent_count    = 0;
			$failed_count  = 0;
			$failed_emails = array();

			// Send to each recipient
			foreach ( $emails as $recipient_email ) {
				$email_sender               = new Emails();
				$email_sender->from_address = $from_email;
				$email_sender->from_name    = $from_name;
				if ( ! empty( $reply_to ) && is_email( $reply_to ) ) {
					$email_sender->reply_to = $reply_to;
				}

				// Get contact for merge tags
				$contact = Contact_Model::get_by_email( $recipient_email ) ?? null;

				// Render template
				$email_renderer = new Email_Renderer();
				$body_content   = $email_renderer->render_template( $template_id, $contact );

				if ( empty( $body_content ) ) {
					$failed_count++;
					$failed_emails[] = $recipient_email;
					continue;
				}

				// Process subject with merge tags
				$processed_subject = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact );

				// Send email
				$result = $email_sender->send( $recipient_email, $processed_subject, $body_content );

				if ( $result ) {
					$sent_count++;
				} else {
					$failed_count++;
					$failed_emails[] = $recipient_email;
				}
			}

			// Prepare response
			if ( $sent_count > 0 && $failed_count === 0 ) {
				return new WP_REST_Response(
					array(
						'success'    => true,
						'message'    => sprintf(
							/* translators: %d: number of emails sent */
							_n(
								'Test email sent successfully to %d recipient',
								'Test emails sent successfully to %d recipients',
								$sent_count,
								'quillcrm'
							),
							$sent_count
						),
						'sent_count' => $sent_count,
					),
					200
				);
			} elseif ( $sent_count > 0 && $failed_count > 0 ) {
				return new WP_REST_Response(
					array(
						'success'       => true,
						'message'       => sprintf(
							/* translators: 1: number of successful sends, 2: number of failures */
							__( 'Test emails sent: %1$d succeeded, %2$d failed', 'quillcrm' ),
							$sent_count,
							$failed_count
						),
						'sent_count'    => $sent_count,
						'failed_count'  => $failed_count,
						'failed_emails' => $failed_emails,
					),
					200
				);
			} else {
				return new WP_Error(
					'send_failed',
					sprintf(
						/* translators: %s: comma-separated list of failed email addresses */
						__( 'Failed to send test email to: %s', 'quillcrm' ),
						implode( ', ', $failed_emails )
					),
					array( 'status' => 500 )
				);
			}
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get email campaign messages
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_campaign_messages( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$per_page    = $request->get_param( 'per_page' ) ?: 10;
			$page        = $request->get_param( 'page' ) ?: 1;
			$status      = $request->get_param( 'status' ) ?: '';

			$query = $this->get_campaign_message_query( $campaign_id );

			switch ( $status ) {
				case 'opened':
					$query->where( 'opened', 1 );
					break;
				case 'clicked':
					$query->where( 'clicked', 1 );
					break;
				case 'failed':
					$query->where( 'status', 'failed' );
					break;
				case 'sent':
					$query->where( 'status', 'sent' );
					break;
			}

			$campaign_emails = $query->with( 'contact', 'template' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $campaign_emails, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get default test email content
	 *
	 * @return string
	 */
	protected function get_default_test_email_content() {
		$default_content = sprintf(
			__( '<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>', 'quillcrm' )
		);

		return apply_filters( 'quillcrm_default_test_email_content', $default_content );
	}

	/**
	 * Schema for the email campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The email campaign schema
	 */
	public function get_item_schema() {
		 $status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'email_campaign',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'The name of the email campaign.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __( 'The description of the email campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status'      => array(
					'description'       => __( 'The status of the email campaign.', 'quillcrm' ),
					'type'              => 'string',
					'enum'              => $status_manager->get_all_statuses(),
					'default'           => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array( $this, 'validate_campaign_status' ),
				),
				'type'        => array(
					'description' => __( 'The type of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'email' ),
					'default'     => 'email',
				),
				'settings'    => array(
					'description' => __( 'The settings of the email campaign.', 'quillcrm' ),
					'type'        => 'object',
				),
				'count'       => array(
					'description' => __( 'The count of the email campaign.', 'quillcrm' ),
					'type'        => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at'  => array(
					'description' => __( 'The execute at of the email campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at'  => array(
					'description' => __( 'The created at of the email campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'updated_at'  => array(
					'description' => __( 'The updated at of the email campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);
	}
}
