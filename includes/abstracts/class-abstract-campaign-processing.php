<?php

/**
 * Abstract Campaign Processing
 * Single abstract class for all campaign processing types (Email, SMS, WhatsApp)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Services\Campaign_Rate_Limiter;
use QuillCRM\Services\Campaign_Contact_Filter;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Settings;

/**
 * Abstract_Campaign_Processing class
 */
abstract class Abstract_Campaign_Processing {


	/**
	 * Communication channel (email, sms, whatsapp)
	 *
	 * @var string
	 */
	protected $channel;

	/**
	 * Start time
	 *
	 * @var int
	 */
	protected $start_time;

	/**
	 * Max execution time
	 *
	 * @var int
	 */
	protected $max_execution_time;

	/**
	 * Settings
	 *
	 * @var array
	 */
	protected $settings;

	/**
	 * Rate limiter service
	 *
	 * @var Campaign_Rate_Limiter
	 */
	protected $rate_limiter;

	/**
	 * Contact filter service
	 *
	 * @var Campaign_Contact_Filter
	 */
	protected $contact_filter;

	/**
	 * Message provider instance
	 *
	 * @since 1.0.0
	 *
	 * @var \QuillCRM\Interfaces\Message_Provider_Interface|null
	 */
	protected $message_provider;

	/**
	 * Class Instance storage.
	 *
	 * @var array
	 */
	private static $instances = array();

	/**
	 * Constructor
	 */
	public function __construct() {
		 $this->settings          = Settings::get( $this->channel, array() );
		$this->max_execution_time = Utils::get_max_execution_time();
		$this->rate_limiter       = Campaign_Rate_Limiter::instance();
		$this->contact_filter     = Campaign_Contact_Filter::instance();

		add_action( 'quillcrm_loaded', array( $this, 'add_hooks' ) );
		add_action( "quillcrm_{$this->channel}_send_after", array( $this, 'send_after' ) );
	}

	/**
	 * Get instance
	 *
	 * @return static
	 */
	public static function instance() {
		 $class = get_called_class();
		if ( ! isset( self::$instances[ $class ] ) ) {
			self::$instances[ $class ] = new static();
		}
		return self::$instances[ $class ];
	}

	/**
	 * Register campaign processing hooks
	 * Common for all provider-based campaigns (SMS, WhatsApp, Email)
	 * Should be called from add_hooks() in child classes
	 *
	 * @since 1.0.0
	 * @return void
	 */
	protected function register_campaign_processing_hooks() {
		// Convert channel integer to string for hook names (e.g., 1 -> 'email')
		$type_string        = Campaign_Channel::to_string( $this->channel );
		$daily_callback_key = $this->get_daily_callback_key();

		QuillCRM::instance()->daily_tasks->register_callback( $daily_callback_key, array( $this, 'reset_daily_count' ) );
		QuillCRM::instance()->campaigns_tasks->register_callback( "quillcrm_{$type_string}_campaigns", array( $this, 'process_campaigns' ) );
		QuillCRM::instance()->campaigns_tasks->register_callback( "process_campaign_{$type_string}", array( $this, 'process_campaign_message' ) );
	}

	/**
	 * Get daily callback key for rate limiting
	 * Maps campaign types to their daily task callback identifiers
	 *
	 * @since 1.0.0
	 * @return string Daily callback key
	 */
	protected function get_daily_callback_key() {
		// Map campaign types to daily callback keys
		$callbacks = array(
			'email'    => 'quillcrm_daily3',
			'sms'      => 'quillcrm_daily3', // Shares with email
			'whatsapp' => 'quillcrm_daily4',
		);

		return $callbacks[ $this->channel ] ?? 'quillcrm_daily_' . $this->channel;
	}


	/**
	 * Send message via provider (polymorphic for SMS and WhatsApp)
	 *
	 * @since 1.0.0
	 *
	 * @param array          $message_data Prepared message data
	 * @param Contact_Model  $contact Contact model
	 * @param Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_via_provider( $message_data, Contact_Model $contact, Tracking_Model $campaign_message ) {
		try {
			// Get message provider
			$provider = $this->get_message_provider();
			if ( ! $provider ) {
				throw new \Exception( sprintf( 'No message provider available for %s', $this->channel ) );
			}

			// Prepare message data for provider API
			$api_data = array(
				'Body' => $message_data['body'],
				'To'   => $campaign_message->recipient,
			);

			// Add StatusCallback if provider supports webhooks
			$webhook_url = $provider->get_webhook_url( $this->channel );
			if ( $webhook_url ) {
				$api_data = $this->prepare_status_callback( $webhook_url, $api_data );
			}

			// Send via provider (unified method)
			$result = $provider->send_message( $this->channel, $api_data, $contact );

			// Handle response
			return $this->handle_provider_response( $result, $campaign_message, $contact );
		} catch ( \Exception $e ) {
			return $this->handle_provider_error( $e );
		}
	}

	/**
	 * Call external API - must be implemented by Twilio-based child classes
	 *
	 * @param array $api_data API data to send
	 * @return array Result from API
	 */
	protected function call_external_api( $api_data ) {
		// This method is only used by Twilio-based SMS/WhatsApp processing
		return array(
			'success' => false,
			'error'   => 'call_external_api not implemented',
		);
	}

	/**
	 * Handle provider API response (common logic)
	 *
	 * @since 1.0.0
	 *
	 * @param array          $result API result
	 * @param Tracking_Model $campaign_message Campaign message record
	 * @param Contact_Model  $contact Contact model
	 * @return array Processed result
	 */
	protected function handle_provider_response( $result, Tracking_Model $campaign_message, Contact_Model $contact ) {
		// Store provider's message ID in tracking record for webhook processing
		if ( is_array( $result ) && isset( $result['success'] ) && $result['success'] && isset( $result['message_id'] ) ) {
			$campaign_message->external_id = $result['message_id']; // Store provider message ID
			$campaign_message->status      = Tracking_Status::SENT; // Update status
			$campaign_message->save();

			quillcrm_get_logger()->info(
				ucfirst( $this->channel ) . ' Message ID stored for tracking',
				array(
					'tracking_id' => $campaign_message->id,
					'message_id'  => $result['message_id'],
					'contact_id'  => $contact->id,
					'code'        => "{$this->channel}_message_id_stored",
				)
			);
		} else {
			// Log if Message ID storage failed
			quillcrm_get_logger()->warning(
				ucfirst( $this->channel ) . ' Message ID not found in response',
				array(
					'tracking_id' => $campaign_message->id,
					'contact_id'  => $contact->id,
					'result'      => $result,
					'code'        => "{$this->channel}_message_id_missing",
				)
			);
		}

		return $result ?? array( 'success' => false );
	}

	/**
	 * Handle provider API error (common logic)
	 *
	 * @since 1.0.0
	 *
	 * @param \Exception $e Exception that occurred
	 * @return array Error result
	 */
	protected function handle_provider_error( \Exception $e ) {
		quillcrm_get_logger()->error(
			sprintf( __( '%s send error.', 'quillcrm' ), ucfirst( $this->channel ) ),
			array(
				'code'  => "{$this->channel}_send_error",
				'error' => $e->getMessage(),
			)
		);
		return array(
			'success' => false,
			'error'   => $e->getMessage(),
		);
	}

	/**
	 * Prepare StatusCallback URL for Twilio requests (common logic)
	 * Excludes StatusCallback for localhost development environments
	 *
	 * @param string $webhook_url The webhook URL to use
	 * @param array  $data The message data array to modify
	 * @return array Modified data array
	 */
	protected function prepare_status_callback( $webhook_url, $data = array() ) {
		// $site_url = home_url();
		// if ( ! empty( $webhook_url ) && strpos( $site_url, 'localhost' ) === false && strpos( $site_url, '127.0.0.1' ) === false ) {
		if ( ! empty( $webhook_url ) ) {
			$data['StatusCallback'] = $webhook_url;
		}

		return $data;
	}

	/**
	 * Add hooks - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function add_hooks();

	/**
	 * Get campaign message mode - must be implemented by child classes
	 *
	 * @return int Tracking_Model mode constant
	 */
	abstract protected function get_message_mode();

	/**
	 * Get recipient field from contact - must be implemented by child classes
	 *
	 * @param Contact_Model $contact
	 * @return string|null Recipient (email or phone)
	 */
	abstract protected function get_recipient( Contact_Model $contact);

	/**
	 * Send message - must be implemented by child classes
	 *
	 * @param array          $message_data Prepared message data
	 * @param Contact_Model  $contact Contact model
	 * @param Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	abstract protected function send_message( $message_data, Contact_Model $contact, Tracking_Model $campaign_message);

	/**
	 * Get tracking class - must be implemented by child classes
	 *
	 * @return string Tracking class name
	 */
	abstract protected function get_tracking_class();

	/**
	 * Get source type for messages - can be overridden by child classes
	 *
	 * @return int Source type constant
	 */
	protected function get_source_type() {
		return Message_Source_Types::CAMPAIGN;
	}

	/**
	 * Get source ID for messages - can be overridden by child classes
	 *
	 * @param Campaign_Model $campaign
	 * @return int Source ID
	 */
	protected function get_source_id( Campaign_Model $campaign ) {
		return $campaign->id;
	}

	/**
	 * Process campaigns - unified logic for all types
	 *
	 * @return void
	 */
	public function process_campaigns() {
		// Check daily rate limit
		$max_per_day = $this->settings['max_in_day'] ?? $this->get_default_max_per_day();

		if ( $this->rate_limiter->is_daily_limit_reached( $this->channel, $max_per_day ) ) {
			$daily_count = $this->rate_limiter->get_daily_count( $this->channel );
			$this->rate_limiter->log_daily_limit_reached( $this->channel, $daily_count, $max_per_day );
			return;
		}

		$this->start_time = microtime( true );

		// Check if memory limit is reached
		if ( Utils::is_memory_limit_reached() ) {
			return;
		}

		try {
			// Handle resending first if applicable
			if ( $this->handle_resending() ) {
				return;
			}

			// Get first campaign for processing
			$campaign = $this->get_next_campaign();
			if ( ! $campaign ) {
				return;
			}

			if ( 'schedule' === $campaign->status ) {
				$campaign->status = 'processing';
				$campaign->save();
			}

			$this->process_campaign( $campaign );
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				sprintf( __( '%s Campaign processing error.', 'quillcrm' ), ucfirst( $this->channel ) ),
				array(
					'code'  => "{$this->channel}_campaign_error",
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
		}
	}

	/**
	 * Get next campaign for processing
	 *
	 * @return Campaign_Model|null
	 */
	protected function get_next_campaign() {
		return Campaign_Model::where(
			function ( $query ) {
				$query->where( 'status', 'processing' )
					->orWhere(
						function ( $subQuery ) {
							$subQuery->where( 'status', 'schedule' )
								->whereDate( 'execute_at', '<=', date( 'Y-m-d H:i:s' ) );
						}
					);
			}
		)
			->where( 'type', $this->channel )
			->orderBy( 'updated_at', 'asc' )
			->first();
	}

	/**
	 * Process individual campaign
	 *
	 * @param Campaign_Model $campaign
	 * @return void
	 */
	protected function process_campaign( Campaign_Model $campaign ) {
		// Validate that the campaign type matches this processor
		$campaign_type = $campaign->get_type();
		if ( $campaign_type !== $this->channel ) {
			quillcrm_get_logger()->error(
				__( 'Campaign type mismatch detected.', 'quillcrm' ),
				array(
					'code'          => 'campaign_type_mismatch',
					'campaign_id'   => $campaign->id,
					'expected_type' => $this->channel,
					'actual_type'   => $campaign_type,
					'processor'     => get_class( $this ),
				)
			);
			return;
		}

		$last_contact_offset = get_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", 0 );
		$filters             = $campaign->get_setting( 'filters', array() );

		$campaign_recipients_count = $this->contact_filter->get_contact_count( $this->channel, $filters );

		if ( $campaign->count != $campaign_recipients_count ) {
			$campaign->count = $campaign_recipients_count;
			$campaign->save();
		}

		if ( $last_contact_offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
			return;
		}

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Sleep to prevent server overload
			usleep( 100000 );

			if ( $last_contact_offset >= $campaign_recipients_count ) {
				$this->complete_campaign( $campaign, $campaign_recipients_count );
				break;
			}

			$max_per_second = $this->settings['max_in_second'] ?? $this->get_default_max_per_second();
			$contacts       = $this->contact_filter->get_contacts_for_processing(
				$this->channel,
				$filters,
				$last_contact_offset,
				$max_per_second
			);

			if ( $contacts->isEmpty() ) {
				break;
			}

			foreach ( $contacts as $contact ) {
				// Get fresh offset each time to ensure database consistency
				$current_offset = get_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", 0 );

				$result = $this->add_message( $campaign, $contact, $current_offset );
				if ( ! $result ) {
					// If message failed to add, break to avoid infinite loop
					break;
				}
			}

			// Update the loop condition variable with fresh database value
			$last_contact_offset = get_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", 0 );
		}

		// Final completion check
		$final_last_offset      = get_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", 0 );
		$final_recipients_count = $this->contact_filter->get_contact_count( $this->channel, $filters );

		if ( $final_last_offset >= $final_recipients_count ) {
			$this->complete_campaign( $campaign, $final_recipients_count );
		}
	}

	/**
	 * Add campaign message - unified logic for all types
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param int            $last_contact_offset
	 * @return bool
	 */
	protected function add_message( Campaign_Model $campaign, Contact_Model $contact, $last_contact_offset ) {
		try {
			// Get recipient field (email or phone)
			$recipient = $this->get_recipient( $contact );
			if ( empty( $recipient ) ) {
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					$this->channel === Campaign_Channel::CHANNEL_EMAIL ? 'no email' : 'no phone number'
				);
				// Increment offset for skipped contact to avoid reprocessing
				update_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", intval( $last_contact_offset ) + 1 );
				return true; // Count as processed to avoid infinite loop
			}

			// Get template for campaign (with A/B testing support)
			$template_id = $this->get_template_for_contact( $campaign, $contact );
			if ( ! $template_id ) {
				quillcrm_get_logger()->error(
					sprintf( __( 'No template found for %s campaign.', 'quillcrm' ), $this->channel ),
					array(
						'code'        => "{$this->channel}_no_template",
						'campaign_id' => $campaign->id,
						'contact_id'  => $contact->id,
					)
				);
				return false;
			}

			$campaign_message_data = array(
				'contact_id'  => $contact->id,
				'template_id' => $template_id,
				'mode'        => $this->get_message_mode(),
				'source_type' => $this->get_source_type(),
				'source_id'   => $this->get_source_id( $campaign ),
				'recipient'   => $recipient,
				'status'      => Tracking_Status::PENDING,
				'hash_key'    => Utils::generate_hash_key(),
			);

			$campaign_message = Tracking_Model::create( $campaign_message_data );

			// Update last contact offset
			update_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", intval( $last_contact_offset ) + 1 );

			// Enqueue processing task (convert channel integer to string for hook name)
			$channel_string = Campaign_Channel::to_string( $this->channel );
			QuillCRM::instance()->campaigns_tasks->enqueue_sync( "process_campaign_{$channel_string}", $campaign, $contact, $campaign_message );

			quillcrm_get_logger()->info(
				sprintf( __( 'Campaign %s enqueued.', 'quillcrm' ), $this->channel ),
				array(
					'code'             => "add_campaign_{$this->channel}",
					'campaign_message' => array(
						'id'       => $campaign_message->id,
						'hash_key' => $campaign_message->hash_key,
					),
				)
			);
			return true;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				sprintf( __( 'Add campaign %s error.', 'quillcrm' ), $this->channel ),
				array(
					'code'  => "add_campaign_{$this->channel}",
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return false;
		}
	}

	/**
	 * Process campaign message - unified logic for all types
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param Tracking_Model $campaign_message
	 * @return void
	 */
	public function process_campaign_message( Campaign_Model $campaign, Contact_Model $contact, Tracking_Model $campaign_message ) {
		// Check if memory limit is reached
		if ( Utils::is_memory_limit_reached() ) {
			// Track retry attempts using transients to prevent infinite requeue loop
			$retry_key   = "quillcrm_retry_{$this->channel}_{$campaign_message->id}";
			$retry_count = (int) get_transient( $retry_key );

			// Maximum 3 retries for memory issues
			if ( $retry_count >= 3 ) {
				// Give up after 3 retries - mark as failed
				$campaign_message->status = Tracking_Status::FAILED;
				$campaign_message->save();

				// Clean up retry transient
				delete_transient( $retry_key );

				quillcrm_get_logger()->error(
					sprintf( __( '%s message failed after memory limit retries', 'quillcrm' ), ucfirst( $this->channel ) ),
					array(
						'code'         => "{$this->channel}_memory_retry_exceeded",
						'tracking_id'  => $campaign_message->id,
						'contact_id'   => $contact->id,
						'campaign_id'  => $campaign->id,
						'retry_count'  => $retry_count,
						'memory_usage' => memory_get_usage( true ),
						'memory_limit' => Utils::get_memory_limit(),
					)
				);
				return;
			}

			// Increment retry counter (expires after 1 hour to handle stuck tasks)
			set_transient( $retry_key, $retry_count + 1, HOUR_IN_SECONDS );

			// Log retry attempt
			quillcrm_get_logger()->warning(
				sprintf( __( '%1$s message requeued due to memory limit (attempt %2$d/3)', 'quillcrm' ), ucfirst( $this->channel ), $retry_count + 1 ),
				array(
					'code'         => "{$this->channel}_memory_requeue",
					'tracking_id'  => $campaign_message->id,
					'retry_count'  => $retry_count + 1,
					'memory_usage' => memory_get_usage( true ),
					'memory_limit' => Utils::get_memory_limit(),
				)
			);

			// Requeue the task for later processing (convert channel integer to string for hook name)
			$channel_string = Campaign_Channel::to_string( $this->channel );
			QuillCRM::instance()->campaigns_tasks->enqueue_async( "process_campaign_{$channel_string}", $campaign, $contact, $campaign_message );
			return;
		}

		// Clear retry counter on successful processing attempt (memory OK)
		$retry_key = "quillcrm_retry_{$this->channel}_{$campaign_message->id}";
		delete_transient( $retry_key );

		// Get message provider (for SMS/WhatsApp campaigns)
		// Email campaigns skip this check
		if ( $this->channel !== Campaign_Channel::CHANNEL_EMAIL ) {
			$provider = $this->get_message_provider();
			if ( ! $provider ) {
				$this->log_provider_connection_error( $campaign, $contact, $campaign_message );
				return;
			}
		}

		try {
			// Get template data
			$template = \QuillCRM\Models\Template_Model::find( $campaign_message->template_id );
			if ( ! $template ) {
				throw new \Exception( sprintf( __( 'Template not found for %s campaign', 'quillcrm' ), $this->channel ) );
			}

			// Validate template content
			$this->validate_template( $template, $this->channel );

			// Prepare message content
			$message_data = $this->prepare_message_content( $template, $contact, $campaign_message );

			// Send the message
			$result = $this->send_message( $message_data, $contact, $campaign_message );

			// Handle result
			$this->handle_send_result( $campaign_message, $result );

			// Log processing result
			$this->log_campaign_processing_result( $campaign, $contact, $campaign_message );

			// Clean up retry counter on successful processing
			$retry_key = "quillcrm_retry_{$this->channel}_{$campaign_message->id}";
			delete_transient( $retry_key );
		} catch ( \Exception $e ) {
			// Log processing error
			$this->log_campaign_processing_error( $campaign, $contact, $campaign_message, $e );

			// Clean up retry counter on error (will be handled by error status)
			$retry_key = "quillcrm_retry_{$this->channel}_{$campaign_message->id}";
			delete_transient( $retry_key );
		}
	}

	/**
	 * Prepare message content - unified logic for all types
	 *
	 * @param \QuillCRM\Models\Template_Model $template
	 * @param Contact_Model                   $contact
	 * @param Tracking_Model                  $campaign_message
	 * @return array Prepared message data
	 */
	protected function prepare_message_content( $template, Contact_Model $contact, Tracking_Model $campaign_message ) {
		$subject         = $template->subject ?? '';
		$message         = $template->body ?? $this->get_default_campaign_content();
		$add_unsubscribe = $template->get_setting( 'add_unsubscribe', true );

		// Check if the message is in builder JSON format and render it to HTML
		$message = $this->render_builder_content( $message, $contact );

		// Process merge tags
		$processed_message = Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact );
		$processed_subject = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact );

		// Add click tracking to URLs in the message (if tracking class supports it)
		$tracking_class = $this->get_tracking_class();
		if ( method_exists( $tracking_class, 'add_click_tracking' ) ) {
			$tracked_message = $tracking_class::add_click_tracking( $processed_message, $campaign_message->hash_key );
		} else {
			$tracked_message = $processed_message;
		}

		// Add unsubscribe link if enabled (if tracking class supports it)
		if ( $add_unsubscribe && method_exists( $tracking_class, 'add_unsubscribe_link' ) ) {
			$tracked_message = $tracking_class::add_unsubscribe_link( $tracked_message, $campaign_message->hash_key );
		}

		return array(
			'subject'   => $processed_subject,
			'body'      => $tracked_message,
			'recipient' => $campaign_message->recipient,
			'hash_key'  => $campaign_message->hash_key,
		);
	}

	/**
	 * Render builder content to HTML if it's in builder JSON format
	 *
	 * @param string        $content The content to render (could be HTML or JSON)
	 * @param Contact_Model $contact Contact model for merge tags
	 * @return string Rendered HTML content
	 */
	protected function render_builder_content( $content, Contact_Model $contact ) {
		// Try to decode the content to see if it's JSON
		$decoded = json_decode( $content, true );

		// If it's not valid JSON, return as-is (it's already HTML)
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return $content;
		}

		// Check if this is a builder format with type='builder' structure
		if ( isset( $decoded['type'] ) && $decoded['type'] === 'builder' && isset( $decoded['value'] ) ) {
			// Use Email_Renderer to convert builder JSON to HTML
			if ( class_exists( '\QuillCRM\Emails\Email_Renderer' ) ) {
				$renderer     = new \QuillCRM\Emails\Email_Renderer();
				$builder_data = $decoded['value'];

				// Prepare merge tags array from contact
				$merge_tags = array( 'contact' => $contact );

				// Extract preview text if available
				$preview_text = '';

				return $renderer->render_from_builder_data( $builder_data, $merge_tags, $preview_text );
			}
		}

		// If it's JSON but not builder format, return as-is (might be legacy format)
		return $content;
	}


	/**
	 * Complete campaign
	 *
	 * @param Campaign_Model $campaign
	 * @param int            $recipients_count
	 * @return void
	 */
	protected function complete_campaign( Campaign_Model $campaign, $recipients_count ) {
		$campaign->status = 'completed';
		$campaign->save();
		update_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}", $recipients_count );

		quillcrm_get_logger()->info(
			sprintf( __( '%s Campaign completed.', 'quillcrm' ), ucfirst( $this->channel ) ),
			array(
				'code'     => "{$this->channel}_campaign_completed",
				'campaign' => array(
					'id'   => $campaign->id,
					'name' => $campaign->name,
				),
			)
		);
	}

	/**
	 * Get template for contact (A/B testing support)
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @return int|null Template ID or null if no template found
	 */
	public function get_template_for_contact( Campaign_Model $campaign, Contact_Model $contact ) {
		$template_ids = $campaign->get_template_ids();

		if ( empty( $template_ids ) ) {
			return null;
		}

		// Single template - no A/B testing
		if ( count( $template_ids ) === 1 ) {
			return $template_ids[0];
		}

		// A/B testing: distribute templates evenly based on contact ID
		$template_index = $contact->id % count( $template_ids );
		return $template_ids[ $template_index ];
	}

	/**
	 * Handle send result - unified logic for all types
	 *
	 * @param Tracking_Model $campaign_message
	 * @param array          $result Send result
	 * @return void
	 */
	protected function handle_send_result( Tracking_Model $campaign_message, $result ) {
		if ( $result && $result['success'] ) {
			$campaign_message->status  = Tracking_Status::SENT;
			$campaign_message->sent_at = current_time( 'mysql' );

			do_action( "quillcrm_{$this->channel}_send_after", $this );
		} else {
			$campaign_message->status = Tracking_Status::FAILED;

			// Log error details if available
			if ( isset( $result['error'] ) ) {
				quillcrm_get_logger()->error(
					sprintf( __( '%1$s message failed: %2$s', 'quillcrm' ), ucfirst( $this->channel ), $result['error'] ),
					array(
						'campaign_id' => $campaign_message->source_id,
						'contact_id'  => $campaign_message->contact_id,
						'error'       => $result['error'],
					)
				);
			}

			// Log additional debug info if available
			if ( isset( $result['debug'] ) ) {
				quillcrm_get_logger()->debug(
					sprintf( __( '%s message failed with debug info', 'quillcrm' ), ucfirst( $this->channel ) ),
					$result['debug']
				);
			}
		}

		$campaign_message->save();
	}


	/**
	 * Get message provider for this channel
	 *
	 * @since 1.0.0
	 *
	 * @return \QuillCRM\Interfaces\Message_Provider_Interface|null
	 */
	protected function get_message_provider() {
		if ( $this->message_provider ) {
			return $this->message_provider;
		}

		if ( $this->channel === Campaign_Channel::CHANNEL_EMAIL ) {
			return null;
		}

		// Get provider from registry
		$this->message_provider = \QuillCRM\Managers\Message_Provider_Registry::instance()
			->get_provider( $this->channel );

		return $this->message_provider;
	}

	/**
	 * Log provider connection error
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param Tracking_Model $campaign_message
	 * @return void
	 */
	protected function log_provider_connection_error( $campaign, $contact, $campaign_message ) {
		$campaign_message->status = Tracking_Status::FAILED;
		$campaign_message->save();

		quillcrm_get_logger()->error(
			sprintf( __( 'Failed to connect to message provider for %s campaign.', 'quillcrm' ), $this->channel ),
			array(
				'code'        => 'provider_connect_failed',
				'campaign_id' => $campaign->id,
				'contact_id'  => $contact->id,
			)
		);
	}

	/**
	 * Log campaign processing result
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param Tracking_Model $campaign_message
	 * @return void
	 */
	protected function log_campaign_processing_result( $campaign, $contact, $campaign_message ) {
		quillcrm_get_logger()->info(
			sprintf( __( 'Campaign %s message processed.', 'quillcrm' ), ucfirst( $this->channel ) ),
			array(
				'code'        => "campaign_{$this->channel}_processed",
				'status'      => $campaign_message->status,
				'contact_id'  => $contact->id,
				'campaign_id' => $campaign->id,
			)
		);
	}

	/**
	 * Log campaign processing error
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param Tracking_Model $campaign_message
	 * @param \Exception     $exception
	 * @return void
	 */
	protected function log_campaign_processing_error( $campaign, $contact, $campaign_message, $exception ) {
		$campaign_message->status = Tracking_Status::FAILED;
		$campaign_message->save();

		quillcrm_get_logger()->error(
			sprintf( __( 'Campaign %s message processing error.', 'quillcrm' ), ucfirst( $this->channel ) ),
			array(
				'code'        => "campaign_{$this->channel}_error",
				'error'       => $exception->getMessage(),
				'contact_id'  => $contact->id,
				'campaign_id' => $campaign->id,
			)
		);
	}

	/**
	 * Get current execution time
	 *
	 * @return int
	 */
	public function get_current_execution_time() {
		return microtime( true ) - $this->start_time;
	}

	/**
	 * Reset daily count
	 *
	 * @return void
	 */
	public function reset_daily_count() {
		$this->rate_limiter->reset_daily_count( $this->channel );
	}

	/**
	 * Increment daily count after sending
	 *
	 * @return void
	 */
	public function send_after() {
		$this->rate_limiter->increment_daily_count( $this->channel );
	}

	/**
	 * Handle resending logic - unified implementation for all campaign types
	 *
	 * @return bool True if resending was handled
	 */
	protected function handle_resending() {
		 $resending_campaign = Campaign_Model::where( 'status', 'resending' )
			->where( 'type', $this->channel )
			->orderBy( 'updated_at', 'asc' )
			->first();

		if ( $resending_campaign ) {
			$this->resend_failed( $resending_campaign );
			return true;
		}
		return false;
	}

	/**
	 * Resend failed messages - unified implementation for all campaign types
	 * Uses polymorphic methods to handle type-specific differences
	 *
	 * @param Campaign_Model $campaign
	 * @return void
	 */
	protected function resend_failed( $campaign ) {
		try {
			$offset_key  = "quillcrm_campaigns_last_resent_{$this->channel}_offset_{$campaign->id}";
			$last_offset = get_option( $offset_key, 0 );

			// Get failed messages using type-specific query method
			$count = $this->get_failed_messages_count( $campaign );

			if ( $last_offset >= $count ) {
				$this->complete_resending( $campaign, $offset_key );
				return;
			}

			while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
				usleep( 100000 ); // 0.1 second delay to prevent server overload

				if ( $last_offset >= $count ) {
					$this->complete_resending( $campaign, $offset_key );
					break;
				}

				$max_per_second  = $this->settings['max_in_second'] ?? $this->get_default_max_per_second();
				$failed_messages = $this->get_failed_messages( $campaign, $last_offset, $max_per_second );

				if ( $failed_messages->isEmpty() ) {
					break;
				}

				foreach ( $failed_messages as $message ) {
					$message->status = Tracking_Status::SCHEDULED;
					$message->save();
					QuillCRM::instance()->campaigns_tasks->enqueue_sync(
						"process_campaign_{$this->channel}",
						$campaign,
						$message->contact,
						$message
					);
					$last_offset++;
					update_option( $offset_key, $last_offset );
				}
			}
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				sprintf( __( 'Resent failed %s messages error.', 'quillcrm' ), $this->channel ),
				array(
					'code'  => "resent_failed_{$this->channel}",
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
		}
	}

	/**
	 * Complete resending process
	 *
	 * @param Campaign_Model $campaign
	 * @param string         $offset_key
	 * @return void
	 */
	protected function complete_resending( $campaign, $offset_key ) {
		$campaign->status = 'completed';
		$campaign->save();
		update_option( $offset_key, 0 );

		quillcrm_get_logger()->info(
			sprintf( __( 'Resent failed %s messages completed.', 'quillcrm' ), $this->channel ),
			array(
				'code'     => "resent_failed_{$this->channel}",
				'campaign' => $campaign->id,
			)
		);
	}

	/**
	 * Get count of failed messages - can be overridden by child classes if needed
	 *
	 * @param Campaign_Model $campaign
	 * @return int
	 */
	protected function get_failed_messages_count( $campaign ) {
		$mode = $this->get_message_mode();
		return $campaign->messages()->where( 'mode', $mode )->where( 'status', Tracking_Status::FAILED )->count();
	}

	/**
	 * Get failed messages for resending - can be overridden by child classes if needed
	 *
	 * @param Campaign_Model $campaign
	 * @param int            $offset
	 * @param int            $limit
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	protected function get_failed_messages( $campaign, $offset, $limit ) {
		$mode = $this->get_message_mode();
		return $campaign->messages()
			->where( 'mode', $mode )
			->where( 'status', Tracking_Status::FAILED )
			->offset( $offset )
			->limit( $limit )
			->get();
	}

	/**
	 * Get default max per day - must be implemented by child classes
	 *
	 * @return int
	 */
	abstract protected function get_default_max_per_day();

	/**
	 * Get default max per second - must be implemented by child classes
	 *
	 * @return int
	 */
	abstract protected function get_default_max_per_second();

	/**
	 * Get default campaign content - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected function get_default_campaign_content();

	/**
	 * Validate template content comprehensively
	 *
	 * @param \QuillCRM\Models\Template_Model $template Template to validate
	 * @param string                          $campaign_type Campaign type
	 * @throws \Exception If template validation fails
	 * @return bool True if valid
	 */
	protected function validate_template( $template, $campaign_type ) {
		if ( ! $template ) {
			throw new \Exception( sprintf( __( 'Template not found for %s campaign', 'quillcrm' ), $campaign_type ) );
		}

		// Check for empty body
		if ( empty( trim( $template->body ) ) ) {
			throw new \Exception( __( 'Template body cannot be empty', 'quillcrm' ) );
		}

		// Check for subject in email templates
		if ( $campaign_type === Campaign_Channel::CHANNEL_EMAIL && empty( trim( $template->subject ) ) ) {
			quillcrm_get_logger()->warning(
				__( 'Email template missing subject', 'quillcrm' ),
				array( 'template_id' => $template->id )
			);
		}

		// Validate HTML structure for email templates
		if ( $campaign_type === Campaign_Channel::CHANNEL_EMAIL ) {
			if ( ! $this->is_valid_html( $template->body ) ) {
				quillcrm_get_logger()->warning(
					__( 'Email template contains potentially invalid HTML', 'quillcrm' ),
					array( 'template_id' => $template->id )
				);
			}
		}

		// Check for required unsubscribe link in email templates
		// Note: Validation disabled - footer automatically adds unsubscribe link via default_email_footer()
		// if ( $campaign_type === 'email' && strpos( $template->body, '{{contact:unsubscribe_link}}' ) === false ) {
		// quillcrm_get_logger()->warning(
		// __( 'Email template missing unsubscribe link', 'quillcrm' ),
		// array(
		// 'template_id'   => $template->id,
		// 'template_name' => $template->name ?? 'Unknown',
		// )
		// );
		// }

		// Validate content length for SMS/WhatsApp
		if ( in_array( $campaign_type, array( 'sms', 'whatsapp' ) ) ) {
			$plain_text = wp_strip_all_tags( $template->body );
			if ( strlen( $plain_text ) > 1600 ) { // SMS limit is typically 1600 chars
				quillcrm_get_logger()->warning(
					sprintf( __( '%1$s template content may be too long (%2$d characters)', 'quillcrm' ), ucfirst( $campaign_type ), strlen( $plain_text ) ),
					array(
						'template_id' => $template->id,
						'length'      => strlen( $plain_text ),
					)
				);
			}
		}

		return true;
	}

	/**
	 * Basic HTML validation
	 *
	 * @param string $html HTML content to validate
	 * @return bool True if valid HTML
	 */
	protected function is_valid_html( $html ) {
		if ( empty( $html ) ) {
			return false;
		}

		// Basic validation - check for malformed tags
		$tag_count_open  = substr_count( $html, '<' );
		$tag_count_close = substr_count( $html, '>' );

		if ( $tag_count_open !== $tag_count_close ) {
			return false;
		}

		// Use libxml for more thorough validation if available
		if ( class_exists( 'DOMDocument' ) ) {
			libxml_use_internal_errors( true );
			$doc    = new \DOMDocument();
			$result = $doc->loadHTML( $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
			libxml_clear_errors();
			return $result !== false;
		}

		return true;
	}
}
