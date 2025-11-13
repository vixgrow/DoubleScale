<?php
/**
 * Unified Campaign Controller
 * Handles all campaign types (email, sms, whatsapp) through a single unified endpoint
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\Abstract_Campaign_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Campaign_Status_Manager;
use QuillCRM\Managers\Message_Provider_Registry;
use QuillCRM\Emails\Emails;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Traits\Message_Provider_Validation;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Campaign\Email_Processing;
use QuillCRM\Campaign\SMS_Processing;
use QuillCRM\Campaign\WhatsApp_Processing;
use QuillCRM\QuillCRM;

/**
 * REST_Campaign_Controller class
 *
 * Unified controller handling all campaign operations across email, sms, and whatsapp channels.
 * Routes: /qc/v1/campaigns with type/channel parameter
 */
class REST_Campaign_Controller extends Abstract_Campaign_Controller {

	use Message_Provider_Validation;

	/**
	 * REST Base
	 *
	 * @var string
	 */
	protected $rest_base = 'campaigns';

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
	}

	/**
	 * Register the routes for the controller
	 */
	public function register_routes() {
		// Register all standard CRUD routes from parent.
		$this->register_common_routes();

		// Campaign messages route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/messages',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'Campaign ID', 'quillcrm' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'per_page' => array(
						'description' => __( 'Items per page', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 10,
					),
					'page'     => array(
						'description' => __( 'Page number', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 1,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_messages' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'status' => array(
							'description' => __( 'Message status filter', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'all', 'sent', 'opened', 'clicked', 'failed', 'pending', 'delivered', 'scheduled' ),
							'required'    => false,
						),
					),
				),
			)
		);

		// Campaign unsubscribes route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/unsubscribes',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'Campaign ID', 'quillcrm' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'per_page' => array(
						'description' => __( 'Items per page', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 10,
					),
					'page'     => array(
						'description' => __( 'Page number', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 1,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_unsubscribes' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		// Resend single message endpoint
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/messages/(?P<message_id>[\d]+)/resend',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'resend_message' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'         => array(
							'description' => __( 'Campaign ID', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'message_id' => array(
							'description' => __( 'Message/Tracking ID', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);

		// Send test message endpoint (unified for all channels).
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/send-test-message',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_test_message' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'channel'    => array(
							'description' => __( 'Channel type', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
							'enum'        => Campaign_Channel::get_core_channel_strings(),
						),
						// Email parameters.
						'email'      => array(
							'description' => __( 'Email address (for email channel)', 'quillcrm' ),
							'type'        => 'string',
						),
						'subject'    => array(
							'description' => __( 'Email subject (for email channel)', 'quillcrm' ),
							'type'        => 'string',
						),
						'from_name'  => array(
							'description' => __( 'From name (for email channel)', 'quillcrm' ),
							'type'        => 'string',
						),
						'from_email' => array(
							'description' => __( 'From email (for email channel)', 'quillcrm' ),
							'type'        => 'string',
						),
						'reply_to'   => array(
							'description' => __( 'Reply-to email (for email channel)', 'quillcrm' ),
							'type'        => 'string',
						),
						// SMS/WhatsApp parameters.
						'phone'      => array(
							'description' => __( 'Phone number (for SMS/WhatsApp channels)', 'quillcrm' ),
							'type'        => 'string',
						),
						// Common parameter.
						'message'    => array(
							'description' => __( 'Message content (body for email, message for SMS/WhatsApp)', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
			)
		);

		// Bulk delete endpoint (cross-type).
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk-delete',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'bulk_delete' ),
					'permission_callback' => array( $this, 'bulk_delete_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'Array of campaign IDs to delete', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array( 'type' => 'integer' ),
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Get all campaigns - override to set channel from request
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		// Set channel from query parameter for filtering
		$channel = $request->get_param( 'channel' );
		
		if ( ! empty( $channel ) ) {
			// Validate it's a valid channel string
			$valid_channels = Campaign_Channel::get_core_channel_strings();
			if ( in_array( $channel, $valid_channels, true ) ) {
				$this->channel = $channel;
			}
		}

		return parent::get_items( $request );
	}

	/**
	 * Create campaign - override to set channel from request
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		// Set channel from type parameter (string: 'email', 'sms', 'whatsapp').
		$type = $request->get_param( 'type' );

		// Validate it's a valid channel string.
		$valid_channels = Campaign_Channel::get_core_channel_strings();
		if ( ! in_array( $type, $valid_channels, true ) ) {
			return new WP_Error(
				'invalid_type',
				__( 'Invalid campaign type. Must be "email", "sms", or "whatsapp".', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		$this->channel = $type;

		// Validate provider connection for SMS/WhatsApp campaigns.
		if ( $type === Campaign_Channel::STR_SMS || $type === Campaign_Channel::STR_WHATSAPP ) {
			$provider_check = $this->validate_provider_connection( $type );
			if ( is_wp_error( $provider_check ) ) {
				return $provider_check;
			}
		}

		return parent::create_item( $request );
	}

	/**
	 * Update campaign - override to set channel from existing campaign
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$campaign_id = $request->get_param( 'id' );
		$campaign    = Campaign_Model::find( $campaign_id );

		if ( $campaign ) {
			$this->channel = $campaign->type;
		}

		return parent::update_item( $request );
	}

	/**
	 * Get single campaign - override to set channel
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$campaign_id = $request->get_param( 'id' );
		$campaign    = Campaign_Model::find( $campaign_id );

		if ( $campaign ) {
			$this->channel = $campaign->type;
		}

		return parent::get_item( $request );
	}

	/**
	 * Delete campaign - override to set channel
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$campaign_id = $request->get_param( 'id' );
		$campaign    = Campaign_Model::find( $campaign_id );

		if ( $campaign ) {
			$this->channel = $campaign->type;
		}

		return parent::delete_item( $request );
	}

	/**
	 * Duplicate campaign - override to set channel
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate_item( $request ) {
		$campaign_id = $request->get_param( 'id' );
		$campaign    = Campaign_Model::find( $campaign_id );

		if ( $campaign ) {
			$this->channel = $campaign->type;
		}

		return parent::duplicate_item( $request );
	}

	/**
	 * Get campaign messages - override to set channel
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_campaign_messages( $request ) {
		$campaign_id = $request->get_param( 'id' );
		$campaign    = Campaign_Model::find( $campaign_id );

		if ( $campaign ) {
			$this->channel = $campaign->type;
		}

		return parent::get_campaign_messages( $request );
	}

	/**
	 * Send test message - unified implementation for all channels
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function send_test_message( $request ) {
		$channel = $request->get_param( 'channel' );

		if ( empty( $channel ) ) {
			return new WP_Error(
				'missing_channel',
				__( 'Channel parameter is required', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		$this->channel = $channel;

		if ( $channel === Campaign_Channel::STR_EMAIL ) {
			return $this->send_test_email( $request );
		} else {
			return $this->send_test_provider_message( $request, $channel );
		}
	}

	/**
	 * Send test email (inlined from REST_Email_Campaign_Controller)
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	private function send_test_email( $request ) {
		try {
			$email      = $request->get_param( 'email' );
			$subject    = $request->get_param( 'subject' );
			$body       = $request->get_param( 'message' );
			$from_name  = $request->get_param( 'from_name' ) ?: get_option( 'blogname' );
			$from_email = $request->get_param( 'from_email' ) ?: get_option( 'admin_email' );
			$reply_to   = $request->get_param( 'reply_to' );

			if ( empty( $email ) ) {
				return new WP_Error(
					'missing_email',
					__( 'Email address is required for email channel', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			if ( empty( $subject ) ) {
				return new WP_Error(
					'missing_subject',
					__( 'Subject is required for email channel', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			$emails               = new Emails();
			$emails->from_address = $from_email;
			$emails->from_name    = $from_name;

			if ( ! empty( $reply_to ) ) {
				$emails->reply_to = $reply_to;
			}

			$for_testing_body = ! empty( $body ) ? $body : $this->get_default_test_email_content();

			$contact = Contact_Model::get_by_email( $email ) ?? null;
			$result  = $emails->send(
				$email,
				$subject,
				$this->process_merge_tags( $for_testing_body, $contact )
			);

			if ( ! $result ) {
				return new WP_Error(
					'send_failed',
					__( 'Failed to send test email', 'quillcrm' ),
					array( 'status' => 500 )
				);
			}

			return new WP_REST_Response(
				array( 'message' => __( 'Test email sent successfully', 'quillcrm' ) ),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Send test provider message for SMS/WhatsApp (inlined from Abstract_Messaging_Campaign_Controller)
	 *
	 * @param WP_REST_Request $request
	 * @param string          $channel
	 * @return WP_REST_Response|WP_Error
	 */
	private function send_test_provider_message( $request, $channel ) {
		try {
			$phone   = $request->get_param( 'phone' );
			$message = $request->get_param( 'message' );

			if ( empty( $phone ) ) {
				return new WP_Error(
					'missing_phone',
					sprintf( __( 'Phone number is required for %s channel', 'quillcrm' ), $channel ),
					array( 'status' => 400 )
				);
			}

			// Get provider for this channel
			$provider = Message_Provider_Registry::instance()->get_provider( $channel );

			if ( ! $provider ) {
				return new WP_Error(
					'provider_not_available',
					sprintf( __( 'No provider configured for %s channel', 'quillcrm' ), $channel ),
					array( 'status' => 500 )
				);
			}

			// Find contact for merge tag processing
			$contact = Contact_Model::where( 'phone', $phone )->first() ?? null;

			// Process merge tags
			$processed_message = $this->process_merge_tags( $message, $contact );

			// Prepare message data
			$message_data = array(
				'To'   => $phone,
				'Body' => $processed_message,
			);

			// Add webhook URL for tracking
			$webhook_url = $provider->get_webhook_url( $channel );
			if ( $webhook_url && ! isset( $message_data['StatusCallback'] ) ) {
				$message_data['StatusCallback'] = $webhook_url;
			}

			// Send message using provider
			$result = $provider->send_message( $channel, $message_data, $contact ?? new Contact_Model() );

			// Handle result
			if ( ! isset( $result['success'] ) || ! $result['success'] ) {
				$error_message = $result['error'] ?? 'Failed to send test message';

				// Check for provider error details
				if ( isset( $result['metadata']['error_details'] ) ) {
					$error_details = $result['metadata']['error_details'];

					if ( is_string( $error_details ) ) {
						$error_message = $error_details;
					} elseif ( is_array( $error_details ) && isset( $error_details['message'] ) ) {
						$error_message = $error_details['message'];
					}
				}

				return new WP_Error( 'send_failed', __( $error_message, 'quillcrm' ), array( 'status' => 400 ) );
			}

			$channel_upper = strtoupper( $channel );

			return new WP_REST_Response(
				array( 'message' => sprintf( __( 'Test %s sent successfully', 'quillcrm' ), $channel_upper ) ),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get default test email content
	 *
	 * @return string
	 */
	private function get_default_test_email_content() {
		$default_content = sprintf(
			__( '<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>', 'quillcrm' )
		);

		return apply_filters( 'quillcrm_default_test_email_content', $default_content );
	}

	/**
	 * Bulk delete campaigns (cross-type)
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function bulk_delete( $request ) {
		try {
			$campaign_ids = $request->get_param( 'ids' );

			if ( empty( $campaign_ids ) || ! is_array( $campaign_ids ) ) {
				return new WP_Error(
					'invalid_ids',
					__( 'Invalid campaign IDs provided', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			// Get campaigns to verify they exist
			$campaigns = Campaign_Model::whereIn( 'id', $campaign_ids )->get();

			if ( $campaigns->isEmpty() ) {
				return new WP_Error(
					'campaigns_not_found',
					__( 'No campaigns found with the provided IDs', 'quillcrm' ),
					array( 'status' => 404 )
				);
			}

			// Delete campaigns (works across all types: email, sms, whatsapp)
			Campaign_Model::destroy( $campaign_ids );

			return new WP_REST_Response(
				array(
					'deleted' => count( $campaign_ids ),
					'message' => __( 'Campaigns deleted successfully', 'quillcrm' ),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Permission check for bulk delete
	 *
	 * @param WP_REST_Request $request
	 * @return bool
	 */
	public function bulk_delete_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Resend a single message
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function resend_message( $request ) {
		try {
			$campaign_id = (int) $request->get_param( 'id' );
			$message_id  = (int) $request->get_param( 'message_id' );

			// Get campaign
			$campaign = Campaign_Model::find( $campaign_id );
			if ( ! $campaign ) {
				return new WP_Error(
					'campaign_not_found',
					__( 'Campaign not found', 'quillcrm' ),
					array( 'status' => 404 )
				);
			}

			// Get tracking entry
			$tracking = Tracking_Model::find( $message_id );
			if ( ! $tracking ) {
				return new WP_Error(
					'message_not_found',
					__( 'Message not found', 'quillcrm' ),
					array( 'status' => 404 )
				);
			}

			// Verify the message belongs to this campaign
			if ( (int) $tracking->source_id !== $campaign_id || (int) $tracking->source_type !== Message_Source_Types::CAMPAIGN ) {
				return new WP_Error(
					'invalid_message',
					__( 'Message does not belong to this campaign', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			// Get contact
			$contact = $tracking->contact;
			if ( ! $contact ) {
				return new WP_Error(
					'contact_not_found',
					__( 'Contact not found', 'quillcrm' ),
					array( 'status' => 404 )
				);
			}

			// Get the appropriate processor based on campaign type
			// Use get_type() to get integer value for comparison
			$campaign_type = $campaign->get_type();
			$processor     = null;
			
			switch ( $campaign_type ) {
				case Campaign_Channel::CHANNEL_EMAIL:
					$processor = Email_Processing::instance();
					break;
				case Campaign_Channel::CHANNEL_SMS:
					$processor = SMS_Processing::instance();
					break;
				case Campaign_Channel::CHANNEL_WHATSAPP:
					$processor = WhatsApp_Processing::instance();
					break;
				default:
					return new WP_Error(
						'invalid_campaign_type',
						__( 'Invalid campaign type', 'quillcrm' ),
						array( 'status' => 400 )
					);
			}

			// Use the processor's resend_single_message method
			$processor->resend_single_message( $campaign, $contact, $tracking );

			return rest_ensure_response(
				array(
					'success' => true,
					'message' => __( 'Message queued for resending', 'quillcrm' ),
				)
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'resend_failed',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Get campaign unsubscribes
	 *
	 * Returns contacts who unsubscribed after receiving this campaign
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_campaign_unsubscribes( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$per_page    = $request->get_param( 'per_page' ) ?: 10;
			$page        = $request->get_param( 'page' ) ?: 1;
			$keywords    = $request->get_param( 'keywords' ) ?: '';

			// Get tracking records for this campaign
			$query = Tracking_Model::where( 'source_type', Message_Source_Types::CAMPAIGN )
				->where( 'source_id', $campaign_id )
				->whereHas(
					'contact',
					function ( $q ) use ( $keywords ) {
						// Only get contacts who are currently unsubscribed
						$q->where( 'status', 'unsubscribed' );

						// Apply keyword search if provided
						if ( ! empty( $keywords ) ) {
							$q->where(
								function ( $query ) use ( $keywords ) {
									$query->where( 'email', 'LIKE', '%' . $keywords . '%' )
										->orWhere( 'first_name', 'LIKE', '%' . $keywords . '%' )
										->orWhere( 'last_name', 'LIKE', '%' . $keywords . '%' )
										->orWhere( 'phone', 'LIKE', '%' . $keywords . '%' );
								}
							);
						}
					}
				)
				->with( 'contact', 'contact.notes', 'template' );

			$results = $query->paginate( $per_page, array( '*' ), 'page', $page );

			// Extract unsubscribe reason from contact notes and add to each item
			if ( isset( $results['data'] ) && is_array( $results['data'] ) ) {
				foreach ( $results['data'] as $tracking ) {
					$tracking->unsubscribe_reason = $this->extract_unsubscribe_reason( $tracking->contact );
				}
			}

			return new WP_REST_Response( $results, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Extract unsubscribe reason from contact notes
	 *
	 * @param Contact_Model|null $contact
	 * @return string
	 */
	private function extract_unsubscribe_reason( $contact ) {
		if ( ! $contact || ! $contact->notes ) {
			return '';
		}

		// Find the most recent "Unsubscribed" note
		foreach ( $contact->notes as $note ) {
			if ( $note->title === 'Unsubscribed' && ! empty( $note->note ) ) {
				// Extract reason from note text: "Contact unsubscribed from the email list. Reason: {reason}"
				if ( preg_match( '/Reason:\s*(.+)$/i', $note->note, $matches ) ) {
					return trim( $matches[1] );
				}
			}
		}

		return '';
	}

}
