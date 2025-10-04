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
