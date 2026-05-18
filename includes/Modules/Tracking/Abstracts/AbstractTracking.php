<?php
/**
 * Abstract Tracking
 * Base class for tracking functionality across all communication types (Sms, WhatsApp, Email)
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Tracking\Abstracts;

use DoubleScale\Core\Utils\Utils;
use DoubleScale\Core\Constants\TrackingStatus;
use DoubleScale\Core\Constants\CampaignChannel;
use DoubleScale\Core\Constants\MessageSourceTypes;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\ContactUnsubscribeModel;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingMetaModel;

defined( 'ABSPATH' ) || exit;

/**
 * AbstractTracking Class
 */
abstract class AbstractTracking {

	/**
	 * Instance storage for child classes
	 *
	 * @var array
	 */
	private static $instances = array();

	/**
	 * Communication channel (sms, whatsapp, email)
	 *
	 * @var string
	 */
	protected $channel;

	/**
	 * Get instance - implemented by child classes
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
	 * Constructor
	 */
	public function __construct() {
		 add_action( 'init', array( $this, 'handle_tracking' ) );
		add_action( 'doublescale_ready', array( $this, 'add_hooks' ) );
	}

	/**
	 * Add hooks - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function add_hooks();

	/**
	 * Handle tracking requests - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function handle_tracking();

	/**
	 * Get webhook URL - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract public static function get_webhook_url();

	/**
	 * Handle webhook - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function handle_webhook();

	/**
	 * Get campaign model class - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected function get_campaign_model_class();

	/**
	 * Get campaign mode for unified table filtering
	 *
	 * @return int
	 */
	abstract protected function get_campaign_mode();

	/**
	 * Register standard provider hooks (common for Sms and WhatsApp)
	 * Should be called from add_hooks() in child classes
	 *
	 * @return void
	 */
	protected function register_standard_hooks() {
		$type = $this->channel;

		// Webhook handlers
		add_action( "wp_ajax_nopriv_doublescale_{$type}_webhook", array( $this, 'handle_webhook' ) );
		add_action( "wp_ajax_doublescale_{$type}_webhook", array( $this, 'handle_webhook' ) );

		// Click tracking - use generic method instead of dynamic method names
		add_action( 'template_redirect', array( $this, 'handle_click_tracking_request' ), 1 );
	}

	/**
	 * Handle standard tracking requests (common logic)
	 *
	 * @return void
	 */
	protected function handle_standard_tracking() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public tracking endpoint; identity comes from the per-message hash_key, validated downstream.
		if ( ! isset( $_GET['doublescale'] ) || ! isset( $_GET['hash_key'] ) ) {
			return;
		}

		$action   = sanitize_text_field( wp_unslash( $_GET['doublescale'] ) );
		$hash_key = sanitize_text_field( wp_unslash( $_GET['hash_key'] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		$type     = $this->channel;

		switch ( $action ) {
			case "{$type}_click":
				$this->handle_click_tracking( $hash_key );
				break;
			case "{$type}_unsubscribe":
				$this->handle_unsubscribe( $hash_key );
				break;
		}
	}

	/**
	 * Process provider webhook (common logic for Sms and WhatsApp)
	 * Supports multi-provider detection (Twilio, Meta WhatsApp, etc.)
	 *
	 * @return void
	 */
	protected function process_provider_webhook() {
		 // Handle Meta webhook verification challenge (GET request)
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'GET' === $_SERVER['REQUEST_METHOD'] && isset( $_GET['hub_mode'] ) ) {
			$this->handle_meta_verification_challenge();
			return;
		}

		// Detect provider from request format (headers/body structure)
		$provider = $this->detect_provider_from_request();

		if ( ! $provider ) {
			doublescale_get_logger()->error(
				ucfirst( $this->channel ) . ' webhook: no provider detected',
				array(
					'code'    => "{$this->channel}_webhook_no_provider",
					'channel' => $this->channel,
				)
			);
			wp_die( 'Service Unavailable', 'Service Unavailable', 503 );
		}

		// Get raw body before WordPress processes it (needed for Meta signature verification)
		$raw_body = file_get_contents( 'php://input' );

		// Parse JSON for Meta, use $_POST for Twilio
		$webhook_data = json_decode( $raw_body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			// Not JSON, use $_POST (Twilio format)
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$webhook_data = $_POST;
		}

		// Process webhook through provider (handles signature verification and parsing)
		$webhook_result = $provider->process_webhook( $this->channel, $webhook_data );

		// Check if webhook is valid
		if ( ! isset( $webhook_result['valid'] ) || ! $webhook_result['valid'] ) {
			$error = $webhook_result['error_message'] ?? 'Invalid webhook';
			doublescale_get_logger()->info(
				ucfirst( $this->channel ) . ' webhook validation failed',
				array(
					'code'        => "{$this->channel}_webhook_validation_failed",
					'error'       => $error,
					'provider'    => $provider->get_provider_name(),
					'remote_addr' => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown',
				)
			);
			wp_die( 'Bad Request', 'Bad Request', 400 );
		}

		// Extract standardized webhook data
		$message_id    = $webhook_result['message_id'] ?? '';
		$status        = $webhook_result['status'] ?? '';
		$error_code    = $webhook_result['error_code'] ?? '';
		$error_message = $webhook_result['error_message'] ?? '';
		$metadata      = $webhook_result['metadata'] ?? array();

		// Handle incoming messages - delegate to MessagingIncoming handler.
		if ( 'received' === $status ) {
			$this->process_incoming_message( $provider, $webhook_data );
			wp_die( 'OK' );
		}

		if ( empty( $message_id ) || empty( $status ) ) {
			doublescale_get_logger()->info(
				ucfirst( $this->channel ) . ' webhook missing required fields',
				array(
					'message_id' => $message_id,
					'status'     => $status,
					'code'       => "{$this->channel}_webhook_missing_data",
				)
			);
			wp_die( 'Bad Request', 'Bad Request', 400 );
		}

		// Find tracking record by provider's message ID
		$campaign_model_class = $this->get_campaign_model_class();
		$tracking_record      = $campaign_model_class::where( 'external_id', $message_id )
			->where( 'mode', $this->get_campaign_mode() )
			->first();

		if ( ! $tracking_record ) {
			doublescale_get_logger()->info(
				ucfirst( $this->channel ) . ' webhook: tracking record not found',
				array(
					'message_id' => $message_id,
					'status'     => $status,
					'code'       => "{$this->channel}_webhook_tracking_not_found",
				)
			);
			wp_die( 'OK' ); // Acknowledge but don't process
		}

		// Update tracking record status based on webhook data
		$this->update_delivery_status( $tracking_record, $status, $error_code, $error_message, $metadata );

		wp_die( 'OK' ); // Acknowledge successful processing
	}

	/**
	 * Process incoming message from webhook
	 * Delegates to MessagingIncoming handler if available (Pro feature).
	 *
	 * @since 1.0.0
	 *
	 * @param object $provider     Message provider instance.
	 * @param array  $webhook_data Raw webhook data.
	 * @return void
	 */
	protected function process_incoming_message( $provider, $webhook_data ) {
		// Check if MessagingIncoming class exists (Pro feature).
		if ( ! class_exists( '\DoubleScale\Pro\Modules\Inbox\Incoming\MessagingIncoming' )
			&& ! class_exists( '\DoubleScale\Modules\Inbox\Incoming\MessagingIncoming' ) ) {
			doublescale_get_logger()->debug(
				ucfirst( $this->channel ) . ' incoming message received but MessagingIncoming not available',
				array(
					'code'    => "{$this->channel}_incoming_no_handler",
					'channel' => $this->channel,
				)
			);
			return;
		}

		// Parse incoming message data using provider.
		$parsed_data = $provider->parse_incoming_webhook( $webhook_data );

		// Validate required fields.
		if ( empty( $parsed_data['from_number'] ) || empty( $parsed_data['message_id'] ) ) {
			doublescale_get_logger()->info(
				ucfirst( $this->channel ) . ' incoming message: missing required fields',
				array(
					'code'    => "{$this->channel}_incoming_missing_fields",
					'channel' => $this->channel,
					'data'    => $parsed_data,
				)
			);
			return;
		}

		// Fire action for Pro to handle (MessagingIncoming listens to this).
		do_action( 'doublescale_inbox_incoming_message_process', $parsed_data, $this->channel, $provider );
	}

	/**
	 * Handle Meta webhook verification challenge
	 * Meta sends: GET /webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
	 *
	 * @return void
	 */
	protected function handle_meta_verification_challenge() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Meta webhook verification endpoint; the verify_token is the shared secret validated against settings.
		$mode      = isset( $_GET['hub_mode'] ) ? sanitize_text_field( wp_unslash( $_GET['hub_mode'] ) ) : '';
		$token     = isset( $_GET['hub_verify_token'] ) ? sanitize_text_field( wp_unslash( $_GET['hub_verify_token'] ) ) : '';
		$challenge = isset( $_GET['hub_challenge'] ) ? sanitize_text_field( wp_unslash( $_GET['hub_challenge'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		// Get Meta integration
		$integration  = \DoubleScale\Core\Managers\IntegrationsManager::instance()->get_integration( 'meta-whatsapp' );
		$stored_token = $integration ? $integration->get_setting( 'webhook_verify_token' ) : '';

		if ( 'subscribe' === $mode && ! empty( $stored_token ) && hash_equals( $stored_token, $token ) ) {
			doublescale_get_logger()->info(
				'Meta WhatsApp webhook verification successful',
				array(
					'code' => 'meta_webhook_verified',
				)
			);

			status_header( 200 );
			header( 'Content-Type: text/plain; charset=utf-8' );
			echo esc_html( $challenge );
			exit;
		}

		doublescale_get_logger()->info(
			'Meta WhatsApp webhook verification failed',
			array(
				'code' => 'meta_webhook_verification_failed',
				'mode' => $mode,
			)
		);

		status_header( 403 );
		echo 'Verification failed';
		exit;
	}

	/**
	 * Detect provider from webhook request format
	 *
	 * @return object|null Provider instance or null.
	 */
	protected function detect_provider_from_request() {
		$registry_class = '\DoubleScale\Pro\Modules\Inbox\Services\MessageProviderRegistry';
		if ( ! class_exists( $registry_class ) ) {
			return null;
		}
		/** @var object $registry */
		$registry = $registry_class::instance();

		// Check for Meta webhook signature header
		if ( ! empty( $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ) ) {
			$provider = $registry->get_provider_by_slug( 'meta-whatsapp' );
			if ( $provider && $provider->is_configured() ) {
				return $provider;
			}
		}

		// Check for Twilio webhook signature header
		if ( ! empty( $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ) ) {
			$provider = $registry->get_provider_by_slug( 'twilio' );
			if ( $provider && $provider->is_configured() ) {
				return $provider;
			}
		}

		// Check request body format
		$raw_body  = file_get_contents( 'php://input' );
		$json_data = json_decode( $raw_body, true );

		// Meta uses "entry" array structure (JSON)
		if ( is_array( $json_data ) && isset( $json_data['entry'] ) ) {
			$provider = $registry->get_provider_by_slug( 'meta-whatsapp' );
			if ( $provider && $provider->is_configured() ) {
				return $provider;
			}
		}

		// Twilio uses form-encoded with MessageSid/SmsSid
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST['MessageSid'] ) || isset( $_POST['SmsSid'] ) ) {
			$provider = $registry->get_provider_by_slug( 'twilio' );
			if ( $provider && $provider->is_configured() ) {
				return $provider;
			}
		}

		// Fallback to default provider for channel
		return $registry->get_provider( $this->channel );
	}

	/**
	 * Update delivery status for tracking record
	 * Centralized status update logic with campaign-type-specific handling
	 *
	 * @param object $tracking_record Tracking record
	 * @param string $status Delivery status from provider
	 * @param string $error_code Error code if any
	 * @param string $error_message Error message if any
	 * @param array  $metadata Additional metadata from provider (e.g., opt-out info)
	 * @return void
	 */
	protected function update_delivery_status( $tracking_record, $status, $error_code = '', $error_message = '', $metadata = array() ) {
		$previous_status = $tracking_record->status;

		// Handle status updates
		switch ( $status ) {
			case 'sent':
				$tracking_record->status  = TrackingStatus::SENT;
				$tracking_record->sent_at = current_time( 'mysql', true );
				break;
			case 'delivered':
				$tracking_record->status = TrackingStatus::DELIVERED;
				break;
			case 'read':
				// WhatsApp read receipt
				if ( $this->channel === CampaignChannel::STR_WHATSAPP ) {
					$tracking_record->status = TrackingStatus::READ;
				}
				break;
			case 'failed':
			case 'undelivered':
				$tracking_record->status = TrackingStatus::FAILED;
				break;
		}

		$tracking_record->save();

		// Store error information in meta table for failed messages
		if ( ( 'failed' === $status || 'undelivered' === $status ) && ( ! empty( $error_code ) || ! empty( $error_message ) ) ) {
			CommunicationTrackingMetaModel::store_error_info(
				$tracking_record->id,
				$error_code,
				$error_message
			);
		}

		// Handle provider-reported opt-out (e.g., Meta WhatsApp blocked/spam errors)
		// This auto-unsubscribes contacts who have opted out at the provider level
		if ( ! empty( $metadata['is_opt_out'] ) && $tracking_record->contact_id ) {
			$this->handle_provider_opt_out( $tracking_record, $metadata );
		}

		// Log status update
		doublescale_get_logger()->info(
			ucfirst( $this->channel ) . ' delivery status updated',
			array(
				'tracking_record_id' => $tracking_record->id,
				'previous_status'    => $previous_status,
				'new_status'         => $status,
				'contact_id'         => $tracking_record->contact_id,
				'source_id'          => $tracking_record->source_id,
				'source_type'        => $tracking_record->source_type,
				'error_code'         => $error_code,
				'error_message'      => $error_message,
				'is_opt_out'         => ! empty( $metadata['is_opt_out'] ),
				'code'               => "{$this->channel}_delivery_status_updated",
			)
		);

		// Trigger delivery status hooks
		do_action( "doublescale_{$this->channel}_delivery_status_updated", $tracking_record, $status, $previous_status );
	}

	/**
	 * Handle provider-reported opt-out
	 *
	 * When a provider (like Meta WhatsApp) reports that a user has blocked the business
	 * or opted out via their platform controls, automatically unsubscribe them in Plugin.
	 *
	 * @since 1.0.0
	 *
	 * @param object $tracking_record Tracking record with contact_id
	 * @param array  $metadata Metadata containing opt_out_reason
	 * @return void
	 */
	protected function handle_provider_opt_out( $tracking_record, $metadata ) {
		$contact = ContactModel::find( $tracking_record->contact_id );

		if ( ! $contact ) {
			doublescale_get_logger()->info(
				ucfirst( $this->channel ) . ' provider opt-out: contact not found',
				array(
					'contact_id'     => $tracking_record->contact_id,
					'opt_out_reason' => $metadata['opt_out_reason'] ?? 'unknown',
					'code'           => "{$this->channel}_provider_optout_no_contact",
				)
			);
			return;
		}

		$opt_out_reason = $metadata['opt_out_reason'] ?? 'provider_reported';

		// Get the channel status field
		$status_field = $this->channel . '_status';

		// Only unsubscribe if not already unsubscribed
		if ( 'unsubscribed' === $contact->getAttribute( $status_field ) ) {
			doublescale_get_logger()->debug(
				ucfirst( $this->channel ) . ' provider opt-out: contact already unsubscribed',
				array(
					'contact_id'     => $contact->id,
					'opt_out_reason' => $opt_out_reason,
					'code'           => "{$this->channel}_provider_optout_already_unsubscribed",
				)
			);
			return;
		}

		// Use the standard unsubscribe method
		$contact->unsubscribe_from_mode(
			$this->get_campaign_mode(),
			$opt_out_reason, // Reason will be stored (e.g., 'meta_user_blocked', 'meta_offers_announcements')
			$tracking_record->source_type,
			$tracking_record->source_id
		);

		doublescale_get_logger()->info(
			ucfirst( $this->channel ) . ' contact auto-unsubscribed due to provider opt-out',
			array(
				'contact_id'     => $contact->id,
				'opt_out_reason' => $opt_out_reason,
				'source_type'    => $tracking_record->source_type,
				'source_id'      => $tracking_record->source_id,
				'code'           => "{$this->channel}_provider_optout_unsubscribed",
			)
		);

		// Fire specific action for provider opt-out (different from keyword unsubscribe)
		do_action( "doublescale_{$this->channel}_provider_optout", $contact, $opt_out_reason, $tracking_record );
	}

	/**
	 * Handle click tracking request from template_redirect hook
	 * Centralized method that checks for channel type and processes click tracking
	 *
	 * @return void
	 */
	public function handle_click_tracking_request() {
		$expected_action = "{$this->channel}_click";

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public click tracking, nonce not applicable
		if ( ! isset( $_GET['doublescale'] ) || $_GET['doublescale'] !== $expected_action ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public click tracking, nonce not applicable
		if ( ! isset( $_GET['hash_key'] ) || ! isset( $_GET['original'] ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public click tracking, nonce not applicable
		$hash_key = sanitize_text_field( wp_unslash( $_GET['hash_key'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public click tracking, nonce not applicable
		$original_url = urldecode( sanitize_url( wp_unslash( $_GET['original'] ) ) );

		$this->handle_click_tracking( $hash_key, $original_url );
	}

	/**
	 * Add click tracking to message content
	 * Common click tracking logic for all Twilio services
	 *
	 * @param string $message Message content
	 * @param string $hash_key Campaign hash key
	 * @return string Modified message with tracking
	 */
	public static function add_click_tracking( $message, $hash_key ) {
		// Find URLs in the message
		$pattern = '/https?:\/\/[^\s]+/i';

		return preg_replace_callback(
			$pattern,
			function ( $matches ) use ( $hash_key ) {
				$original_url = $matches[0];

				// Create tracking URL
				$tracking_url = add_query_arg(
					array(
						'doublescale' => static::get_tracking_action(),
						'hash_key' => $hash_key,
						'original' => urlencode( $original_url ),
					),
					home_url()
				);

				return $tracking_url;
			},
			$message
		);
	}

	/**
	 * Add unsubscribe link to message content
	 * Common unsubscribe link logic for all Twilio services
	 *
	 * @param string $message Message content
	 * @param string $hash_key Campaign hash key
	 * @return string Modified message with unsubscribe link
	 */
	public static function add_unsubscribe_link( $message, $hash_key ) {
		$unsubscribe_url = add_query_arg(
			array(
				'doublescale' => static::get_unsubscribe_action(),
				'hash_key' => $hash_key,
			),
			home_url()
		);

		$unsubscribe_text = apply_filters(
			'doublescale_' . static::get_channel_type() . '_unsubscribe_text',
			"\n\nTo unsubscribe: {$unsubscribe_url}"
		);

		return $message . $unsubscribe_text;
	}

	/**
	 * Handle click tracking
	 * Common click tracking logic for all Twilio services
	 *
	 * @param string $hash_key Campaign hash key
	 * @param string $original_url Original URL to redirect to
	 * @return void
	 */
	protected function handle_click_tracking( $hash_key, $original_url = null ) {
		try {
			$campaign_model_class = $this->get_campaign_model_class();
			$campaign_record      = $campaign_model_class::where( 'hash_key', $hash_key )
				->where( 'mode', $this->get_campaign_mode() )
				->first();

			if ( ! $campaign_record ) {
				doublescale_get_logger()->info(
					"{$this->channel} click tracking: Invalid hash key",
					array(
						'hash_key' => $hash_key,
						'code'     => "invalid_{$this->channel}_hash_key",
					)
				);

				if ( $original_url ) {
					// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect to tracked external URL
					wp_redirect( esc_url_raw( $original_url ) );
					exit;
				}
				return;
			}

			// Update click tracking
			if ( ! $campaign_record->clicked ) {
				$campaign_record->clicked    = 1;
				$campaign_record->clicked_at = current_time( 'mysql', true );
				$campaign_record->save();

				doublescale_get_logger()->info(
					"{$this->channel} click tracked",
					array(
						'campaign_record_id' => $campaign_record->id,
						'contact_id'         => $campaign_record->contact_id,
						'source_id'          => $campaign_record->source_id,
						'source_type'        => $campaign_record->source_type,
						'code'               => "{$this->channel}_click_tracked",
					)
				);

				// Trigger click automation if enabled
				do_action( "doublescale_{$this->channel}_clicked", $campaign_record );
			}

			// Redirect to original URL
			if ( $original_url ) {
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect to tracked external URL
				wp_redirect( esc_url_raw( $original_url ) );
				exit;
			}
		} catch ( \Exception $e ) {
			doublescale_get_logger()->error(
				"{$this->channel} click tracking error",
				array(
					'hash_key' => $hash_key,
					'error'    => $e->getMessage(),
					'code'     => "{$this->channel}_click_error",
				)
			);

			if ( $original_url ) {
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect to tracked external URL
				wp_redirect( esc_url_raw( $original_url ) );
				exit;
			}
		}
	}

	/**
	 * Handle unsubscribe request
	 * Common unsubscribe logic for all Twilio services
	 *
	 * @param string $hash_key Campaign hash key
	 * @return void
	 */
	protected function handle_unsubscribe( $hash_key ) {
		try {
			$campaign_model_class = $this->get_campaign_model_class();
			$campaign_record      = $campaign_model_class::where( 'hash_key', $hash_key )
				->where( 'mode', $this->get_campaign_mode() )
				->first();

			if ( ! $campaign_record ) {
				doublescale_get_logger()->info(
					"{$this->channel} unsubscribe: Invalid hash key",
					array(
						'hash_key' => $hash_key,
						'code'     => "invalid_{$this->channel}_hash_key",
					)
				);
				return;
			}

			$contact = $campaign_record->contact;
			if ( $contact ) {
				// Use mode directly from tracking record (integer)
				$mode        = $campaign_record->mode; // 1=Email, 2=Sms, 3=Whatsapp
				$source_type = $campaign_record->source_type; // 1=Campaign, 2=Automation
				$source_id   = $campaign_record->source_id;

				// Unsubscribe using mode
				$contact->unsubscribe_from_mode(
					$mode,
					'link_click',
					$source_type,
					$source_id
				);

				// Trigger unsubscribe automation
				do_action( "doublescale_{$this->channel}_unsubscribed", $contact, $campaign_record );

				// Redirect to unsubscribe page
				$unsubscribe_page = apply_filters( "doublescale_{$this->channel}_unsubscribe_redirect", home_url() );
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect URL is filtered, may be external
				wp_redirect( esc_url_raw( $unsubscribe_page ) );
				exit;
			}
		} catch ( \Exception $e ) {
			doublescale_get_logger()->error(
				"{$this->channel} unsubscribe error",
				array(
					'hash_key' => $hash_key,
					'error'    => $e->getMessage(),
					'code'     => "{$this->channel}_unsubscribe_error",
				)
			);
		}
	}

	/**
	 * Get tracking action name - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_tracking_action();

	/**
	 * Get unsubscribe action name - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_unsubscribe_action();

	/**
	 * Get channel type - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_channel_type();
}
