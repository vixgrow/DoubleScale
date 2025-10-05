<?php
/**
 * Abstract Message Provider
 * Base class with common logic for all message providers
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Interfaces\Message_Provider_Interface;

/**
 * Abstract_Message_Provider class
 *
 * Provides common functionality for all message providers including:
 * - Standardized result formatting
 * - Logging helpers
 * - Error handling
 *
 * @since 1.0.0
 */
abstract class Abstract_Message_Provider implements Message_Provider_Interface {

	/**
	 * Provider slug
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $provider_slug;

	/**
	 * Provider name
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $provider_name;

	/**
	 * Supported channels
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $supported_channels = array();

	/**
	 * Cached integration instance
	 *
	 * @since 1.0.0
	 *
	 * @var mixed
	 */
	private $integration;

	/**
	 * Get provider slug
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_provider_slug(): string {
		return $this->provider_slug;
	}

	/**
	 * Get provider name
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_provider_name(): string {
		return $this->provider_name;
	}

	/**
	 * Check if provider supports a channel
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type
	 * @return bool
	 */
	public function supports_channel( string $channel): bool {
		return in_array( $channel, $this->supported_channels, true );
	}

	/**
	 * Get integration instance for this provider
	 * Uses provider_slug to lookup and cache the integration
	 *
	 * @since 1.0.0
	 *
	 * @return mixed|null Integration instance or null if not found
	 */
	protected function get_integration() {
		if ( ! $this->integration ) {
			if ( ! $this->provider_slug ) {
				$this->log(
					'error',
					sprintf( 'Provider slug not set for class: %s', get_class( $this ) ),
					array( 'code' => 'provider_slug_missing' )
				);
				return null;
			}

			$this->integration = \QuillCRM\Managers\Integrations_Manager::instance()->get_integration( $this->provider_slug );

			if ( ! $this->integration ) {
				$this->log(
					'warning',
					sprintf( 'Integration "%s" not found for provider', $this->provider_slug ),
					array(
						'code'          => 'integration_not_found',
						'provider_slug' => $this->provider_slug,
					)
				);
			}
		}

		return $this->integration;
	}

	/**
	 * Check if provider is configured
	 * Uses provider_slug to check integration status
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		$integration = $this->get_integration();
		return $integration && method_exists( $integration, 'is_connected' ) && $integration->is_connected();
	}

	/**
	 * Send message via specified channel
	 *
	 * Default implementation that validates channel support.
	 * Child classes should override this to implement actual sending logic.
	 *
	 * @since 1.0.0
	 *
	 * @param string        $channel Channel type ('sms', 'whatsapp', 'voice', etc.)
	 * @param array         $data Message data
	 * @param \QuillCRM\Models\Contact_Model $contact Contact model
	 * @return array Result array
	 */
	public function send_message( string $channel, array $data, \QuillCRM\Models\Contact_Model $contact ): array {
		// Validate channel support
		if ( ! $this->supports_channel( $channel ) ) {
			$this->log(
				'error',
				sprintf( 'Provider does not support channel: %s', $channel ),
				array(
					'channel'            => $channel,
					'supported_channels' => $this->supported_channels,
				)
			);

			return $this->error_result(
				sprintf(
					'Provider "%s" does not support channel "%s". Supported channels: %s',
					$this->provider_name,
					$channel,
					implode( ', ', $this->supported_channels )
				)
			);
		}

		// Child class should override this method to implement actual sending
		return $this->error_result(
			sprintf( 'send_message() not implemented for channel: %s', $channel )
		);
	}

	/**
	 * Format success result
	 *
	 * @since 1.0.0
	 *
	 * @param string $message_id Provider's message ID
	 * @param array  $metadata Additional provider-specific data
	 * @return array Standardized success result
	 */
	protected function success_result( string $message_id, array $metadata = array()): array {
		return array(
			'success'    => true,
			'message_id' => $message_id,
			'error'      => null,
			'metadata'   => $metadata,
		);
	}

	/**
	 * Format error result
	 *
	 * @since 1.0.0
	 *
	 * @param string $error Error message
	 * @param array  $metadata Additional error context
	 * @return array Standardized error result
	 */
	protected function error_result( string $error, array $metadata = array()): array {
		return array(
			'success'    => false,
			'message_id' => null,
			'error'      => $error,
			'metadata'   => $metadata,
		);
	}

	/**
	 * Process webhook from provider
	 *
	 * Default implementation that child classes should override with provider-specific logic.
	 * Returns invalid webhook response by default.
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type
	 * @param array  $webhook_data Raw webhook data
	 * @return array Webhook processing result
	 */
	public function process_webhook( string $channel, array $webhook_data ): array {
		// Validate channel support
		if ( ! $this->supports_channel( $channel ) ) {
			$this->log(
				'error',
				sprintf( 'Webhook received for unsupported channel: %s', $channel ),
				array(
					'channel'            => $channel,
					'supported_channels' => $this->supported_channels,
				)
			);

			return $this->webhook_error_result( 'Channel not supported' );
		}

		// Default: webhook processing not implemented
		$this->log(
			'warning',
			sprintf( 'Webhook processing not implemented for provider: %s', $this->provider_name ),
			array( 'channel' => $channel )
		);

		return $this->webhook_error_result( 'Webhook processing not implemented' );
	}

	/**
	 * Format webhook success result
	 *
	 * @since 1.0.0
	 *
	 * @param string      $message_id Provider's message ID
	 * @param string      $status Delivery status
	 * @param string|null $error_code Error code if any
	 * @param string|null $error_message Error message if any
	 * @param array       $metadata Additional data
	 * @return array Standardized webhook result
	 */
	protected function webhook_success_result( string $message_id, string $status, ?string $error_code = null, ?string $error_message = null, array $metadata = array()): array {
		return array(
			'valid'         => true,
			'message_id'    => $message_id,
			'status'        => $status,
			'error_code'    => $error_code,
			'error_message' => $error_message,
			'metadata'      => $metadata,
		);
	}

	/**
	 * Format webhook error result
	 *
	 * @since 1.0.0
	 *
	 * @param string $error Error message
	 * @param array  $metadata Additional error context
	 * @return array Standardized webhook error result
	 */
	protected function webhook_error_result( string $error, array $metadata = array()): array {
		return array(
			'valid'         => false,
			'message_id'    => null,
			'status'        => null,
			'error_code'    => null,
			'error_message' => $error,
			'metadata'      => $metadata,
		);
	}

	/**
	 * Log provider activity
	 *
	 * @since 1.0.0
	 *
	 * @param string $level Log level (error, warning, info, debug)
	 * @param string $message Log message
	 * @param array  $context Additional context
	 * @return void
	 */
	protected function log( string $level, string $message, array $context = array()): void {
		$context['provider'] = $this->provider_slug;

		if ( function_exists( 'quillcrm_get_logger' ) ) {
			$logger = quillcrm_get_logger();
			$logger->$level( $message, $context );
		}
	}
}
