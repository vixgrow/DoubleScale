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
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Message_Direction;
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
	 * Cached merge tag keys for current template
	 *
	 * @var array|null
	 */
	private $template_merge_tag_keys = null;

	/**
	 * Temporarily store rendered conditional section IDs by tracking ID
	 * Used to write conditional_sections meta only after successful send
	 *
	 * @var array Array of tracking_id => rendered_section_ids
	 */
	private $pending_conditional_sections = array();

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
		$this->settings           = Settings::get( $this->channel, array() );
		$this->max_execution_time = Utils::get_max_execution_time();
		$this->rate_limiter       = Campaign_Rate_Limiter::instance();
		$this->contact_filter     = Campaign_Contact_Filter::instance();

		add_action( 'quillcrm_loaded', array( $this, 'add_hooks' ) );
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
		// Channel is already a string ('email', 'sms', 'whatsapp')
		$type_string = $this->channel;

		QuillCRM::instance()->campaigns_tasks->register_callback( "quillcrm_{$type_string}_campaigns", array( $this, 'process_campaigns' ) );
		QuillCRM::instance()->campaigns_tasks->register_callback( "process_campaign_{$type_string}", array( $this, 'process_campaign_message' ) );

		// Register continuation handler (Action Scheduler fallback)
		QuillCRM::instance()->campaigns_tasks->register_callback(
			"continue_{$type_string}_campaign",
			array( $this, 'continue_campaign_processing' )
		);

		// Register AJAX continuation handler (faster, immediate processing)
		$this->register_ajax_continuation_hooks();
	}


	/**
	 * Continue processing a campaign (triggered by Action Scheduler)
	 *
	 * @param int $campaign_id Campaign ID to continue processing
	 * @return void
	 */
	public function continue_campaign_processing( $campaign_id ) {
		// === CONCURRENCY LOCK (Database-based, works without Redis/Memcached) ===
		// IMPORTANT: Uses the SAME lock key as process_campaign() to prevent overlap
		$lock_key = "quillcrm_{$this->channel}_campaign_lock_{$campaign_id}";
		$lock_duration = apply_filters(
			'quillcrm_campaign_lock_duration',
			300, // 5 minutes default
			$this->channel,
			$campaign_id
		);

		// Try to acquire lock using transients (database-backed)
		if ( ! $this->acquire_campaign_lock( $lock_key, $lock_duration ) ) {
			quillcrm_get_logger()->debug(
				sprintf( __( 'Campaign %s continuation skipped - already being processed', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_continuation_locked",
					'campaign_id' => $campaign_id,
				)
			);
			return; // Another process is already handling this campaign
		}

		try {
			$campaign = Campaign_Model::find( $campaign_id );

			if ( ! $campaign || $campaign->status !== 'processing' ) {
				// Don't release here - finally block will handle it
				return;
			}

			// Check if progress was made since last continuation
			$progress_key    = "quillcrm_{$this->channel}_campaign_last_offset_{$campaign_id}";
			$no_progress_key = "quillcrm_{$this->channel}_campaign_no_progress_count_{$campaign_id}";
			$last_offset     = get_transient( $progress_key );
			$current_offset  = get_option( "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign_id}", 0 );

			// Check if progress was made
			if ( $last_offset !== false && $last_offset == $current_offset ) {
				// No progress made - increment counter
				$no_progress_count = (int) get_transient( $no_progress_key );
				$no_progress_count++;

				// Maximum consecutive "no progress" attempts (configurable, default 5)
				$max_no_progress = apply_filters(
					'quillcrm_campaign_max_no_progress_attempts',
					5,
					$this->channel,
					$campaign_id
				);

				if ( $no_progress_count >= $max_no_progress ) {
					// Too many consecutive attempts with no progress - mark as failed
					quillcrm_get_logger()->error(
						sprintf( __( 'Campaign %1$s failed: no progress after %2$d consecutive attempts', 'quillcrm' ), $this->channel, $no_progress_count ),
						array(
							'code'        => "{$this->channel}_no_progress_limit_exceeded",
							'campaign_id' => $campaign_id,
							'offset'      => $current_offset,
							'attempts'    => $no_progress_count,
						)
					);
					$campaign->status = 'failed';
					$campaign->save();
					return;
				}

				// Log warning for no progress
				set_transient( $no_progress_key, $no_progress_count, HOUR_IN_SECONDS );
				quillcrm_get_logger()->warning(
					sprintf( __( 'Campaign %1$s continuation made no progress (attempt %2$d/%3$d)', 'quillcrm' ), $this->channel, $no_progress_count, $max_no_progress ),
					array(
						'code'        => "{$this->channel}_no_progress",
						'campaign_id' => $campaign_id,
						'offset'      => $current_offset,
						'attempt'     => $no_progress_count,
					)
				);
			} else {
				// Progress was made - reset no progress counter
				delete_transient( $no_progress_key );
			}

			// Update progress tracker
			set_transient( $progress_key, $current_offset, HOUR_IN_SECONDS );

			// Raise memory limit
			wp_raise_memory_limit( 'admin' );

			// Reset timing
			$this->start_time = microtime( true );

			// IMPORTANT: Call do_process_campaign() directly, NOT process_campaign()
			// process_campaign() would try to acquire the same lock again and fail!
			// We already hold the lock, so skip straight to the processing logic.
			$this->do_process_campaign( $campaign );
		} finally {
			$this->release_campaign_lock( $lock_key );
		}
	}


	/**
	 * Send message via provider (polymorphic for SMS and WhatsApp)
	 *
	 * @since 1.0.0
	 *
	 * @param array                        $message_data Prepared message data
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_via_provider( $message_data, Contact_Model $contact, Communication_Tracking_Model $campaign_message ) {
		try {
			// Get message provider
			$provider = $this->get_message_provider();
			if ( ! $provider ) {
				throw new \Exception( sprintf( 'No message provider available for %s', $this->channel ) );
			}

			// Validate provider is configured before attempting to send
			if ( ! $provider->is_configured() ) {
				throw new \Exception(
					sprintf(
						'%s provider (%s) is not configured. Please configure it in Settings > Integrations before sending messages.',
						ucfirst( $this->channel ),
						$provider->get_provider_name()
					)
				);
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
	 * @param array                        $result API result
	 * @param Communication_Tracking_Model $campaign_message Campaign message record
	 * @param Contact_Model                $contact Contact model
	 * @return array Processed result
	 */
	protected function handle_provider_response( $result, Communication_Tracking_Model $campaign_message, Contact_Model $contact ) {
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
	 *
	 * IMPORTANT: StatusCallback is enabled for all environments including localhost.
	 * For local development webhook testing, you must use a tunneling service like:
	 * - ngrok (https://ngrok.com)
	 * - Expose (https://expose.dev)
	 * - LocalTunnel (https://localtunnel.github.io)
	 *
	 * Without a tunnel, Twilio cannot reach localhost URLs and webhooks will fail silently.
	 * This is expected behavior and does not affect message delivery, only delivery tracking.
	 *
	 * To disable webhooks entirely (e.g., for testing), use this filter:
	 * add_filter( 'quillcrm_enable_provider_webhooks', '__return_false' );
	 *
	 * @since 1.0.0
	 * @param string $webhook_url The webhook URL to use
	 * @param array  $data The message data array to modify
	 * @return array Modified data array with StatusCallback added
	 */
	protected function prepare_status_callback( $webhook_url, $data = array() ) {
		// Allow filtering webhook behavior
		$webhooks_enabled = apply_filters( 'quillcrm_enable_provider_webhooks', true );

		if ( ! empty( $webhook_url ) && $webhooks_enabled ) {
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
	 * @return int Communication_Tracking_Model mode constant
	 */
	abstract protected function get_message_mode();

	/**
	 * Get recipient field from contact - must be implemented by child classes
	 *
	 * @param Contact_Model $contact
	 * @return string|null Recipient (email or phone)
	 */
	abstract protected function get_recipient( Contact_Model $contact );

	/**
	 * Send message - must be implemented by child classes
	 *
	 * @param array                        $message_data Prepared message data
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	abstract protected function send_message( $message_data, Contact_Model $contact, Communication_Tracking_Model $campaign_message );

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
		$this->start_time = microtime( true );

		// Update heartbeat at the start to track that cron is running
		if ( ! QuillCRM::instance()->campaigns_tasks->update_heartbeat( "quillcrm_{$this->channel}_campaigns" ) ) {
			quillcrm_get_logger()->warning(
				sprintf( __( 'Failed to update heartbeat for %s campaigns', 'quillcrm' ), $this->channel ),
				array(
					'channel' => $this->channel,
					'context' => 'campaign_processing_start',
				)
			);
		}

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
			// Convert string to integer for database query (DB boundary)
			->where( 'type', Campaign_Channel::to_integer( $this->channel ) )
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
		// Validate campaign type
		if ( $campaign->type !== $this->channel ) {
			quillcrm_get_logger()->error(
				__( 'Campaign type mismatch detected.', 'quillcrm' ),
				array(
					'code'          => 'campaign_type_mismatch',
					'campaign_id'   => $campaign->id,
					'expected_type' => $this->channel,
					'actual_type'   => $campaign->type,
					'processor'     => get_class( $this ),
				)
			);
			return;
		}

		// === CONCURRENCY LOCK (Database-based, works without Redis/Memcached) ===
		// Prevent multiple cron workers from processing the same campaign simultaneously
		$lock_key = "quillcrm_{$this->channel}_campaign_lock_{$campaign->id}";
		$lock_duration = apply_filters(
			'quillcrm_campaign_lock_duration',
			300, // 5 minutes default
			$this->channel,
			$campaign->id
		);

		// Try to acquire lock using transients (database-backed)
		if ( ! $this->acquire_campaign_lock( $lock_key, $lock_duration ) ) {
			quillcrm_get_logger()->info(
				sprintf( __( 'Campaign %s already being processed by another worker, skipping', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_campaign_locked",
					'campaign_id' => $campaign->id,
				)
			);
			return; // Another cron/worker is already processing this campaign
		}

		// Wrap everything in try/finally to ensure lock is always released
		try {
			$this->do_process_campaign( $campaign );
		} finally {
			// Always release the lock when done (success or failure)
			$this->release_campaign_lock( $lock_key );
		}
	}

	/**
	 * Acquire a campaign processing lock (database-based)
	 * 
	 * Uses timestamp-based approach for simplicity and reliability.
	 * This approach is simpler than transient-based locking and avoids race conditions.
	 * 
	 * How it works:
	 * 1. Check if lock timestamp exists and is recent (< 55 seconds old)
	 * 2. If yes, another process is running - skip
	 * 3. If no, atomically UPDATE the timestamp using conditional UPDATE
	 * 4. If UPDATE affects 1 row, we got the lock
	 * 5. If UPDATE affects 0 rows, another process got it first
	 * 
	 * Advantages:
	 * - UPDATE operations are atomic in MySQL
	 * - No complex INSERT IGNORE logic
	 * - Natural expiration (55 seconds) handles crashed processes
	 * - Simpler code, easier to maintain
	 *
	 * @param string $lock_key Lock identifier
	 * @param int    $lock_duration Lock duration in seconds (not used in this approach, kept for compatibility)
	 * @return bool True if lock acquired, false if already locked
	 */
	protected function acquire_campaign_lock( $lock_key, $lock_duration ) {
		global $wpdb;

		// Lock key already includes 'quillcrm_' prefix, use it directly
		$option_name = $lock_key;
		$current_time = time();
		$lock_expiry_seconds = 55; // If process hasn't updated in 55 seconds, consider it dead

		// Step 1: Check if lock exists and is still active (recent timestamp)
		$last_process_time = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
				$option_name
			)
		);

		// If lock exists and timestamp is recent (< 55 seconds), another process is running
		if ( $last_process_time && ( $current_time - (int) $last_process_time ) < $lock_expiry_seconds ) {
			return false;
		}

		// Step 2: Atomically try to acquire the lock using conditional UPDATE
		// This UPDATE will only succeed if:
		// - The option doesn't exist (INSERT via UPDATE won't work, so we handle that separately)
		// - OR the timestamp is expired (older than 55 seconds)
		// 
		// We use a two-step approach:
		// 1. Try INSERT (if option doesn't exist)
		// 2. Try UPDATE with WHERE condition (if option exists but is expired)

		// First, try to INSERT if it doesn't exist
		$inserted = $wpdb->query(
			$wpdb->prepare(
				"INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %d, 'no')",
				$option_name,
				$current_time
			)
		);

		// If INSERT succeeded (1 row affected), we got the lock
		if ( $inserted && $wpdb->rows_affected === 1 ) {
			return true;
		}

		// If INSERT didn't succeed (option already exists), try conditional UPDATE
		// Only update if the timestamp is expired (older than 55 seconds) or doesn't exist
		$expired_threshold = $current_time - $lock_expiry_seconds;
		$updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->options} 
				SET option_value = %d 
				WHERE option_name = %s 
				AND (option_value IS NULL OR CAST(option_value AS UNSIGNED) <= %d)",
				$current_time,
				$option_name,
				$expired_threshold
			)
		);

		// If UPDATE affected 1 row, we successfully acquired the lock
		if ( $updated !== false && $wpdb->rows_affected === 1 ) {
			return true;
		}

		// If UPDATE affected 0 rows, another process got the lock (or it's still active)
		return false;
	}

	/**
	 * Release a campaign processing lock
	 * 
	 * Sets timestamp to 0 to clear the lock
	 *
	 * @param string $lock_key Lock identifier
	 * @return void
	 */
	protected function release_campaign_lock( $lock_key ) {
		global $wpdb;

		// Lock key already includes 'quillcrm_' prefix, use it directly
		$option_name = $lock_key;
		$wpdb->update(
			$wpdb->options,
			array( 'option_value' => '0' ),
			array( 'option_name' => $option_name ),
			array( '%s' ),
			array( '%s' )
		);
	}

	/**
	 * Refresh/extend a campaign processing lock
	 * 
	 * Updates timestamp to current time to keep lock alive.
	 * Call this periodically during long-running operations to prevent
	 * the lock from expiring while processing is still active.
	 *
	 * @param string $lock_key Lock identifier
	 * @param int    $lock_duration New duration in seconds (not used, kept for compatibility)
	 * @return bool True if refreshed successfully
	 */
	protected function refresh_campaign_lock( $lock_key, $lock_duration = 300 ) {
		global $wpdb;
		
		// Lock key already includes 'quillcrm_' prefix, use it directly
		$option_name = $lock_key;
		$current_time = time();
		
		// Update the timestamp to current time to keep the lock alive
		$updated = $wpdb->update(
			$wpdb->options,
			array( 'option_value' => $current_time ),
			array( 'option_name' => $option_name ),
			array( '%d' ),
			array( '%s' )
		);
		
		return $updated !== false;
	}

	/**
	 * Internal campaign processing logic (called by process_campaign after lock acquired)
	 *
	 * @param Campaign_Model $campaign
	 * @return void
	 */
	protected function do_process_campaign( Campaign_Model $campaign ) {
		wp_raise_memory_limit( 'admin' );

		// Lock key for refreshing during long operations
		$lock_key = "quillcrm_{$this->channel}_campaign_lock_{$campaign->id}";
		$lock_duration = apply_filters(
			'quillcrm_campaign_lock_duration',
			300, // 5 minutes default
			$this->channel,
			$campaign->id
		);

		$offset_key = "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}";
		$filters    = $campaign->get_setting( 'filters', array() );

		$campaign_recipients_count = $this->contact_filter->get_contact_count( $this->channel, $filters );

		if ( $campaign->count != $campaign_recipients_count ) {
			$campaign->count = $campaign_recipients_count;
			$campaign->save();
		}

		$offset = (int) get_option( $offset_key, 0 );

		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
			return;
		}

		// Get settings
		$batch_size     = apply_filters( 'quillcrm_campaign_batch_size', 100, $this->channel );
		$max_per_second = $this->settings['max_in_second'] ?? $this->rate_limiter->get_default_per_second_limit( $this->channel );

		// Initialize per-second tracker
		$this->rate_limiter->init_second_tracker( $this->channel );

		// Track last lock refresh time for periodic refresh during long batch processing
		$last_lock_refresh_time = time();

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {

			usleep( 100000 ); // 0.1 second delay to prevent server overload

			// Refresh lock at START of each batch iteration
			// This ensures lock is always fresh before processing any batch
			$this->refresh_campaign_lock( $lock_key, $lock_duration );
			$last_lock_refresh_time = time();

			// Check if campaign was paused/cancelled by admin during processing
			// Re-fetch from database to get current status
			$fresh_campaign = Campaign_Model::find( $campaign->id );
			if ( ! $fresh_campaign || $fresh_campaign->status !== 'processing' ) {
				quillcrm_get_logger()->info(
					sprintf( __( 'Campaign %s stopped - status changed during processing', 'quillcrm' ), $this->channel ),
					array(
						'code'           => "{$this->channel}_campaign_status_changed",
						'campaign_id'    => $campaign->id,
						'current_status' => $fresh_campaign ? $fresh_campaign->status : 'deleted',
						'offset'         => $offset,
					)
				);
				update_option( $offset_key, $offset );
				return;
			}

			// Check completion
			if ( $offset >= $campaign_recipients_count ) {
				$this->complete_campaign( $campaign, $campaign_recipients_count );
				return;
			}

			// Fetch batch
			$contacts = $this->contact_filter->get_contacts_for_processing(
				$this->channel,
				$filters,
				$offset,
				$batch_size
			);

			if ( $contacts->isEmpty() ) {
				break;
			}

			// Process batch with rate limiting
			foreach ( $contacts as $contact ) {

				// Check and wait for per-second limit (blocking call)
				$this->rate_limiter->check_and_wait_per_second( $this->channel, $max_per_second );

				// Re-check time/memory after potential wait
				if ( $this->get_current_execution_time() >= $this->max_execution_time || Utils::is_memory_limit_reached() ) {
					update_option( $offset_key, $offset );
					break 2;
				}

				// CRITICAL: Refresh lock periodically during batch processing
				// This handles the case where a single batch takes > 55 seconds due to rate limiting
				// Refresh every 30 seconds to stay well under the 55-second expiry
				$time_since_last_refresh = time() - $last_lock_refresh_time;
				if ( $time_since_last_refresh >= 30 ) {
					$this->refresh_campaign_lock( $lock_key, $lock_duration );
					$last_lock_refresh_time = time();
				}

				// Process contact
				$result = $this->add_message( $campaign, $contact );

				if ( ! $result['success'] ) {
					update_option( $offset_key, $offset );

					if ( $result['fatal'] || 'failed' === $campaign->status ) {
						return;
					}
					break 2;
				}

				// Track per-second rate (in-memory only, for throttling)
				$this->rate_limiter->record_sent( $this->channel );

				$offset++;
			}

			// Save progress after each batch
			update_option( $offset_key, $offset );
		}

		// Check if more work remains
		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
		} else {
			$this->queue_continuation( $campaign->id );
		}
	}

	/**
	 * Queue continuation with AJAX first, Action Scheduler fallback
	 *
	 * This method uses a hybrid approach:
	 * 1. First tries immediate AJAX continuation (non-blocking, ~50-200ms delay)
	 * 2. Falls back to Action Scheduler if AJAX fails (reliable, 0-60s delay)
	 *
	 * Both approaches are NON-BLOCKING - they don't block the current PHP process.
	 *
	 * @param int $campaign_id
	 * @return void
	 */
	protected function queue_continuation( $campaign_id ) {
		// Quick check before queuing - don't queue if campaign is no longer processing
		$campaign = Campaign_Model::find( $campaign_id );
		if ( ! $campaign || $campaign->status !== 'processing' ) {
			return; // Don't queue if campaign is no longer processing
		}

		// Try immediate AJAX continuation first (much faster - non-blocking)
		// Wrap in try-catch to ensure fallback always works
		try {
			$ajax_success = $this->trigger_ajax_continuation( $campaign_id );

			if ( $ajax_success ) {
				quillcrm_get_logger()->info(
					sprintf( __( 'Campaign %s continuation triggered via AJAX (non-blocking)', 'quillcrm' ), $this->channel ),
					array(
						'code'        => "{$this->channel}_continuation_ajax",
						'campaign_id' => $campaign_id,
					)
				);
				return; // Success - no need for Action Scheduler fallback
			}
		} catch ( \Exception $e ) {
			// Log error but continue to fallback
			quillcrm_get_logger()->warning(
				sprintf( __( 'AJAX continuation attempt failed for campaign %s, using Action Scheduler fallback', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_ajax_continuation_exception",
					'campaign_id' => $campaign_id,
					'error'       => $e->getMessage(),
				)
			);
		}

		// Fallback to Action Scheduler if AJAX fails or is disabled (reliable, non-blocking)
		// This ensures campaigns always continue processing
		$action_id = QuillCRM::instance()->campaigns_tasks->enqueue_async(
			"continue_{$this->channel}_campaign",
			$campaign_id
		);

		if ( ! $action_id ) {
			quillcrm_get_logger()->error(
				sprintf( __( 'Failed to queue campaign %s continuation (both AJAX and Action Scheduler failed)', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_continuation_queue_failed",
					'campaign_id' => $campaign_id,
				)
			);
			return;
		}

		quillcrm_get_logger()->info(
			sprintf( __( 'Campaign %s continuation queued via Action Scheduler (fallback, non-blocking)', 'quillcrm' ), $this->channel ),
			array(
				'code'        => "{$this->channel}_continuation_queued",
				'campaign_id' => $campaign_id,
				'action_id'   => $action_id,
			)
		);
	}

	/**
	 * Register AJAX continuation hooks
	 *
	 * Registers handlers for both authenticated and unauthenticated requests
	 * to ensure continuation works regardless of user session state.
	 *
	 * Uses channel-specific hook names to avoid conflicts between email/SMS/WhatsApp processors.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	protected function register_ajax_continuation_hooks() {
		// Use channel-specific hook names to avoid conflicts
		// Each channel (email, sms, whatsapp) registers its own handler
		$ajax_action = "quillcrm-continue-campaign-{$this->channel}";

		// Register for both authenticated and unauthenticated requests
		// This ensures continuation works even if user session expires
		// Note: These hooks can be registered at any time, WordPress will handle them
		add_action( "wp_ajax_nopriv_{$ajax_action}", array( $this, 'handle_ajax_continuation' ) );
		add_action( "wp_ajax_{$ajax_action}", array( $this, 'handle_ajax_continuation' ) );
	}

	/**
	 * Trigger immediate AJAX continuation (non-blocking)
	 *
	 * This method sends a non-blocking HTTP request to admin-ajax.php.
	 * The request is "fire and forget" - it doesn't wait for a response.
	 * The continuation processing happens in a completely separate PHP process.
	 *
	 * @param int $campaign_id Campaign ID to continue
	 * @return bool True if AJAX request was sent successfully, false otherwise
	 */
	protected function trigger_ajax_continuation( $campaign_id ) {
		// Check if AJAX continuation is enabled (can be disabled via filter for testing)
		if ( ! apply_filters( 'quillcrm_enable_ajax_continuation', true, $this->channel, $campaign_id ) ) {
			return false;
		}

		// Safety check: ensure we're not in a CLI context where AJAX won't work
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return false; // Use Action Scheduler in CLI context
		}

		// Check if we should use AJAX based on Action Scheduler schedule
		// If Action Scheduler is about to run soon, let it handle it
		try {
			if ( ! $this->should_use_ajax_continuation() ) {
				return false; // Let Action Scheduler handle it
			}
		} catch ( \Exception $e ) {
			// If there's an error checking Action Scheduler, fall back to Action Scheduler
			quillcrm_get_logger()->warning(
				sprintf( __( 'Error checking AJAX continuation eligibility for campaign %s', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_ajax_check_error",
					'campaign_id' => $campaign_id,
					'error'       => $e->getMessage(),
				)
			);
			return false;
		}

		// Build AJAX URL with channel-specific action and security nonce
		$ajax_action = "quillcrm-continue-campaign-{$this->channel}";
		$url         = add_query_arg(
			array(
				'action'      => $ajax_action,
				'campaign_id' => $campaign_id,
				'channel'     => $this->channel,
				'nonce'       => wp_create_nonce( 'quillcrm_continue_campaign_' . $campaign_id ),
				'time'        => time(),
			),
			admin_url( 'admin-ajax.php' )
		);

		// Send non-blocking HTTP request
		// blocking => false means: send request, don't wait for response, return immediately
		$response = wp_remote_post(
			$url,
			array(
				'sslverify' => false,  // Don't verify SSL (faster, acceptable for internal requests)
				'blocking'  => false,  // NON-BLOCKING - returns immediately, doesn't wait
				'timeout'   => 1,       // Fast timeout (request is non-blocking anyway)
				'body'      => array(
					'campaign_id' => $campaign_id,
					'channel'     => $this->channel,
				),
			)
		);

		// Return true if request was sent (even if we don't wait for response)
		return ! is_wp_error( $response );
	}

	/**
	 * Determine if AJAX continuation should be used
	 *
	 * Uses AJAX if Action Scheduler won't run soon enough.
	 * This prevents unnecessary AJAX calls when Action Scheduler is about to run.
	 *
	 * @return bool True if AJAX should be used, false to use Action Scheduler
	 */
	protected function should_use_ajax_continuation() {
		// Build the full hook name with group prefix
		$full_hook = "quillcrm_campaigns_continue_{$this->channel}_campaign";

		// Check when Action Scheduler will run next
		$next_action = as_next_scheduled_action( $full_hook );

		if ( ! $next_action ) {
			return true; // No scheduled action, use AJAX for immediate processing
		}

		$time_until_action = $next_action - time();

		// Use AJAX if next action is more than threshold seconds away
		// This ensures immediate continuation for better performance
		$ajax_threshold = apply_filters(
			'quillcrm_ajax_continuation_threshold',
			5, // seconds - if Action Scheduler runs in >5 seconds, use AJAX
			$this->channel
		);

		return $time_until_action > $ajax_threshold;
	}

	/**
	 * Handle AJAX continuation request
	 *
	 * This method processes the AJAX continuation request.
	 * It runs in a SEPARATE PHP process/request, so it doesn't block the original request.
	 *
	 * IMPORTANT: This is non-blocking from the original request's perspective.
	 * The continuation processing happens in a completely separate HTTP request.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function handle_ajax_continuation() {
		// Set no-cache headers
		nocache_headers();

		// Verify nonce for security
		$campaign_id = isset( $_REQUEST['campaign_id'] ) ? (int) $_REQUEST['campaign_id'] : 0;
		$channel     = isset( $_REQUEST['channel'] ) ? sanitize_text_field( $_REQUEST['channel'] ) : '';
		$nonce       = isset( $_REQUEST['nonce'] ) ? sanitize_text_field( $_REQUEST['nonce'] ) : '';

		// Validate parameters
		if ( ! $campaign_id ) {
			wp_send_json_error( array( 'message' => 'Invalid campaign ID' ) );
			return;
		}

		// Verify channel matches (double-check since hook is channel-specific)
		if ( $channel && $channel !== $this->channel ) {
			wp_send_json_error( array( 'message' => 'Channel mismatch' ) );
			return;
		}

		// Verify nonce
		if ( ! wp_verify_nonce( $nonce, 'quillcrm_continue_campaign_' . $campaign_id ) ) {
			wp_send_json_error( array( 'message' => 'Invalid nonce' ) );
			return;
		}

		// Check if Action Scheduler is about to run (prevent unnecessary AJAX if cron is imminent)
		$full_hook   = "quillcrm_campaigns_continue_{$this->channel}_campaign";
		$next_action = as_next_scheduled_action( $full_hook );
		if ( $next_action ) {
			$time_until_action = $next_action - time();
			// If Action Scheduler runs in < 3 seconds, let it handle it instead
			if ( $time_until_action > 0 && $time_until_action <= 3 ) {
				wp_send_json_success( array( 'message' => 'Action Scheduler will handle it soon' ) );
				return;
			}
		}

		// NOTE: Locking is handled inside continue_campaign_processing()
		// using the unified lock key: quillcrm_{channel}_campaign_processing_{id}
		// This ensures AJAX, Action Scheduler, and main cron all respect the same lock.

		try {
			// Process continuation (reuse existing method)
			// This runs in a separate PHP process, so it doesn't block the original request
			// The lock is acquired inside continue_campaign_processing()
			$this->continue_campaign_processing( $campaign_id );

			wp_send_json_success(
				array(
					'message'     => 'Processed',
					'campaign_id' => $campaign_id,
					'channel'     => $this->channel,
				)
			);
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				sprintf( __( 'AJAX continuation error for campaign %s', 'quillcrm' ), $this->channel ),
				array(
					'code'        => "{$this->channel}_ajax_continuation_error",
					'campaign_id' => $campaign_id,
					'error'       => $e->getMessage(),
					'trace'       => $e->getTraceAsString(),
				)
			);

			wp_send_json_error(
				array(
					'message'     => $e->getMessage(),
					'campaign_id' => $campaign_id,
				)
			);
		}
		// NOTE: Lock cleanup is handled inside continue_campaign_processing()
	}

	/**
	 * Add campaign message - unified logic for all types
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @return array
	 */
	protected function add_message( Campaign_Model $campaign, Contact_Model $contact ) {
		try {
			$recipient = $this->get_recipient( $contact );

			if ( empty( $recipient ) ) {
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					$this->channel === Campaign_Channel::STR_EMAIL ? 'no email' : 'no phone number'
				);
				// Don't update DB here - caller handles offset
				return array(
					'success' => true,
					'skipped' => true,
					'fatal'   => false,
				);
			}

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

				global $wpdb;
				$wpdb->update(
					$wpdb->prefix . 'quillcrm_campaigns',
					array( 'status' => 'failed' ),
					array( 'id' => $campaign->id ),
					array( '%s' ),
					array( '%d' )
				);
				$campaign->status = 'failed';

				return array(
					'success' => false,
					'skipped' => false,
					'fatal'   => true,
				);
			}

			$campaign_message = Communication_Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template_id,
					'mode'        => $this->get_message_mode(),
					'direction'   => Message_Direction::OUTBOUND,
					'source_type' => $this->get_source_type(),
					'source_id'   => $this->get_source_id( $campaign ),
					'recipient'   => $recipient,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			// Don't update offset here - caller handles it after batch

			$channel_string = $this->channel;
			QuillCRM::instance()->campaigns_tasks->enqueue_sync(
				"process_campaign_{$channel_string}",
				$campaign,
				$contact,
				$campaign_message
			);

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

			return array(
				'success' => true,
				'skipped' => false,
				'fatal'   => false,
			);
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				sprintf( __( 'Add campaign %s error.', 'quillcrm' ), $this->channel ),
				array(
					'code'  => "add_campaign_{$this->channel}",
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
					),
				)
			);
			return array(
				'success' => false,
				'skipped' => false,
				'fatal'   => false,
			);
		}
	}



	/**
	 * Process campaign message - unified logic for all types
	 *
	 * @param Campaign_Model                         $campaign
	 * @param Contact_Model|Automation_Contact_Model $contact_or_automation_contact Contact or Automation Contact Model
	 * @param Communication_Tracking_Model           $campaign_message
	 * @return void
	 */
	public function process_campaign_message( Campaign_Model $campaign, $contact_or_automation_contact, Communication_Tracking_Model $campaign_message ) {
		// Extract actual contact for operations that need it (validation, sending, etc.)
		// But preserve the original for merge tag processing
		$contact = $contact_or_automation_contact instanceof Automation_Contact_Model
			? $contact_or_automation_contact->contact
			: $contact_or_automation_contact;

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

			// Requeue the task for later processing - pass the original contact model
			$channel_string = $this->channel;
			QuillCRM::instance()->campaigns_tasks->enqueue_async( "process_campaign_{$channel_string}", $campaign, $contact_or_automation_contact, $campaign_message );
			return;
		}

		// Clear retry counter on successful processing attempt (memory OK)
		$retry_key = "quillcrm_retry_{$this->channel}_{$campaign_message->id}";
		delete_transient( $retry_key );

		// Get message provider (for SMS/WhatsApp campaigns)
		// Email campaigns skip this check
		if ( $this->channel !== Campaign_Channel::STR_EMAIL ) {
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

			// Prepare message content - pass the original contact model for merge tags
			$message_data = $this->prepare_message_content( $template, $contact_or_automation_contact, $campaign_message );

			// Send the message - use actual contact for sending
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
	 * @param \QuillCRM\Models\Template_Model        $template
	 * @param Contact_Model|Automation_Contact_Model $contact_or_automation_contact Contact or Automation Contact Model for merge tags
	 * @param Communication_Tracking_Model           $campaign_message
	 * @return array Prepared message data
	 */
	protected function prepare_message_content( $template, $contact_or_automation_contact, Communication_Tracking_Model $campaign_message ) {
		$subject         = $template->subject ?? '';
		$message         = $template->body ?? $this->get_default_campaign_content();
		$add_unsubscribe = $template->get_setting( 'add_unsubscribe', true );

		// Extract actual contact for operations that need Contact_Model
		$contact = $contact_or_automation_contact instanceof Automation_Contact_Model
			? $contact_or_automation_contact->contact
			: $contact_or_automation_contact;

		// STEP 1: Extract merge tag keys if not already cached
		if ( is_null( $this->template_merge_tag_keys ) ) {
			$combined_content              = $subject . ' ' . $message;
			$this->template_merge_tag_keys = Merge_Tags_Manager::instance()->extract_merge_tag_keys( $combined_content );
		}

		// STEP 2: Capture merge tag values for this contact using pre-extracted keys
		if ( ! empty( $this->template_merge_tag_keys ) ) {
			\QuillCRM\Models\Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$campaign_message->id,
				$this->template_merge_tag_keys,
				$contact
			);
		}

		// Check if the message is in builder JSON format and render it to HTML
		// Pass the original contact model for merge tags
		$renderer = null;
		$message  = $this->render_builder_content_with_tracking( $message, $contact_or_automation_contact, $campaign_message->id, $renderer );

		// Process merge tags - use the original contact model to support automation merge tags
		$processed_message = Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact_or_automation_contact );
		$processed_subject = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact_or_automation_contact );

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
	 * Render builder content with conditional section tracking
	 *
	 * @param string                                 $content The content to render (could be HTML or JSON)
	 * @param Contact_Model|Automation_Contact_Model $contact_or_automation_contact Contact model for merge tags
	 * @param int|null                               $tracking_id Communication tracking ID (null if not yet created)
	 * @param object|null                            &$renderer Renderer instance (passed by reference to capture rendered section IDs)
	 * @param string                                 $footer_html Optional footer HTML to inject before </body> tag
	 * @return string Rendered HTML content
	 */
	protected function render_builder_content_with_tracking( $content, $contact_or_automation_contact, $tracking_id = null, &$renderer = null, $footer_html = '' ) {
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

				// Extract preview text if available
				$preview_text = '';

				$html = $renderer->render_from_builder_data( $builder_data, $contact_or_automation_contact, $preview_text, $footer_html );

				// Capture rendered conditional section IDs for later storage (only after successful send)
				// IMPORTANT: Do NOT write conditional_sections meta here - it should only be written
				// after the email is successfully sent, not during rendering/preparation phase
				$rendered_section_ids = $renderer->get_rendered_section_ids();

				if ( $tracking_id ) {
					// Validate that rendered_section_ids is an array
					if ( ! is_array( $rendered_section_ids ) ) {
						$rendered_section_ids = array();
					}

					// Filter out any invalid values (ensure all items are strings)
					$rendered_section_ids = array_filter(
						$rendered_section_ids,
						function ( $id ) {
							return is_string( $id ) && ! empty( $id );
						}
					);
					// Re-index array after filtering
					$rendered_section_ids = array_values( $rendered_section_ids );

					// Store rendered section IDs temporarily - will be written to meta only after successful send
					// This ensures conditional_sections meta is only recorded for emails that were actually sent
					$this->pending_conditional_sections[ $tracking_id ] = $rendered_section_ids;
				}

				return $html;
			}
		}

		// If it's JSON but not builder format, return as-is (might be legacy format)
		return $content;
	}

	/**
	 * Render builder content to HTML if it's in builder JSON format
	 *
	 * @param string                                 $content The content to render (could be HTML or JSON)
	 * @param Contact_Model|Automation_Contact_Model $contact_or_automation_contact Contact model for merge tags
	 * @param string                                 $footer_html Optional footer HTML to inject before </body> tag
	 * @return string Rendered HTML content
	 */
	protected function render_builder_content( $content, $contact_or_automation_contact, $footer_html = '' ) {
		$renderer = null;
		return $this->render_builder_content_with_tracking( $content, $contact_or_automation_contact, null, $renderer, $footer_html );
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

		// Clear progress trackers
		delete_transient( "quillcrm_{$this->channel}_campaign_last_offset_{$campaign->id}" );
		delete_transient( "quillcrm_{$this->channel}_campaign_no_progress_count_{$campaign->id}" );

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
	 * @param Communication_Tracking_Model $campaign_message
	 * @param array                        $result Send result
	 * @return void
	 */
	protected function handle_send_result( Communication_Tracking_Model $campaign_message, $result ) {
		if ( $result && $result['success'] ) {
			$campaign_message->status  = Tracking_Status::SENT;
			$campaign_message->sent_at = current_time( 'mysql' );

			// Write conditional_sections meta ONLY after successful send
			// This ensures we only track sections for emails that were actually sent
			$this->store_conditional_sections_meta( $campaign_message->id );
		} else {
			$campaign_message->status = Tracking_Status::FAILED;

			// Clear pending conditional sections if send failed - don't track sections for unsent emails
			if ( isset( $this->pending_conditional_sections[ $campaign_message->id ] ) ) {
				unset( $this->pending_conditional_sections[ $campaign_message->id ] );
			}

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
	 * Store conditional sections meta for a tracking record
	 * Called only after successful send to ensure meta is only recorded for sent emails
	 *
	 * @param int $tracking_id Communication tracking ID
	 * @return void
	 */
	private function store_conditional_sections_meta( $tracking_id ) {
		// Check if we have pending conditional sections for this tracking ID
		if ( ! isset( $this->pending_conditional_sections[ $tracking_id ] ) ) {
			return; // No conditional sections were rendered for this email
		}

		$rendered_section_ids = $this->pending_conditional_sections[ $tracking_id ];

		// Only save if we have valid section IDs
		if ( ! empty( $rendered_section_ids ) && is_array( $rendered_section_ids ) ) {
			// Check if record already exists
			$existing_meta = \QuillCRM\Models\Communication_Tracking_Meta_Model::where( 'communication_tracking_id', $tracking_id )
				->where( 'meta_key', 'conditional_sections' )
				->first();

			if ( $existing_meta ) {
				$existing_meta->meta_value = $rendered_section_ids;
				$existing_meta->save();
			} else {
				\QuillCRM\Models\Communication_Tracking_Meta_Model::create(
					array(
						'communication_tracking_id' => $tracking_id,
						'meta_key'                  => 'conditional_sections',
						'meta_value'                => $rendered_section_ids,
					)
				);
			}
		}

		// Clean up temporary storage
		unset( $this->pending_conditional_sections[ $tracking_id ] );
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

		if ( $this->channel === Campaign_Channel::STR_EMAIL ) {
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
	 * @param Campaign_Model               $campaign
	 * @param Contact_Model                $contact
	 * @param Communication_Tracking_Model $campaign_message
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
	 * @param Campaign_Model               $campaign
	 * @param Contact_Model                $contact
	 * @param Communication_Tracking_Model $campaign_message
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
	 * @param Campaign_Model               $campaign
	 * @param Contact_Model                $contact
	 * @param Communication_Tracking_Model $campaign_message
	 * @param \Exception                   $exception
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
	 * Handle resending logic - unified implementation for all campaign types
	 *
	 * @return bool True if resending was handled
	 */
	protected function handle_resending() {
		 // Convert string to integer for database query (DB boundary)
		$type_int = Campaign_Channel::to_integer( $this->channel );

		$resending_campaign = Campaign_Model::where( 'status', 'resending' )
			->where( 'type', $type_int )
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

				$max_per_second  = $this->settings['max_in_second'] ?? $this->rate_limiter->get_default_per_second_limit( $this->channel );
				$failed_messages = $this->get_failed_messages( $campaign, $last_offset, $max_per_second );

				if ( $failed_messages->isEmpty() ) {
					break;
				}

				foreach ( $failed_messages as $message ) {
					$this->resend_single_message( $campaign, $message->contact, $message );
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
	 * Resend a single message
	 * Helper method to resend a single tracking message
	 *
	 * @param Campaign_Model               $campaign
	 * @param Contact_Model                $contact
	 * @param Communication_Tracking_Model $message
	 * @return void
	 */
	public function resend_single_message( $campaign, $contact, $message ) {
		$message->status = Tracking_Status::SCHEDULED;
		$message->save();

		// Channel is already a string
		$channel_string = $this->channel;
		QuillCRM::instance()->campaigns_tasks->enqueue_sync(
			"process_campaign_{$channel_string}",
			$campaign,
			$contact,
			$message
		);
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
		if ( $campaign_type === Campaign_Channel::STR_EMAIL && empty( trim( $template->subject ) ) ) {
			quillcrm_get_logger()->warning(
				__( 'Email template missing subject', 'quillcrm' ),
				array( 'template_id' => $template->id )
			);
		}

		// Validate HTML structure for email templates
		if ( $campaign_type === Campaign_Channel::STR_EMAIL ) {
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