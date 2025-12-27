<?php
/**
 * Message Provider Registry
 * Central registry for all message providers
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use QuillCRM\Interfaces\Message_Provider_Interface;

/**
 * Message_Provider_Registry class
 *
 * Manages registration and retrieval of message providers.
 * Inspired by QuillSMTP's Mailers registry pattern.
 *
 * @since 1.0.0
 */
class Message_Provider_Registry {

	/**
	 * Singleton instance
	 *
	 * @since 1.0.0
	 *
	 * @var Message_Provider_Registry
	 */
	private static $instance;

	/**
	 * Registered providers
	 *
	 * @since 1.0.0
	 *
	 * @var Message_Provider_Interface[]
	 */
	private $providers = array();

	/**
	 * Default provider slugs per channel
	 * SMS: Twilio (only provider)
	 * WhatsApp: Meta WhatsApp (preferred), falls back to Twilio if not configured
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	private $default_providers = array(
		'sms'      => 'twilio',
		'whatsapp' => 'meta-whatsapp',
	);

	/**
	 * Get singleton instance
	 *
	 * @since 1.0.0
	 *
	 * @return Message_Provider_Registry
	 */
	public static function instance(): Message_Provider_Registry {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor (singleton pattern)
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		// Prevent direct instantiation
	}

	/**
	 * Register a message provider
	 *
	 * @since 1.0.0
	 *
	 * @param Message_Provider_Interface $provider Provider instance to register
	 * @return void
	 */
	public function register( Message_Provider_Interface $provider): void {
		$slug = $provider->get_provider_slug();

		if ( isset( $this->providers[ $slug ] ) ) {
			quillcrm_get_logger()->warning(
				sprintf( 'Provider "%s" is already registered, overwriting', $slug ),
				array(
					'code'          => 'provider_already_registered',
					'provider_slug' => $slug,
				)
			);
		}

		$this->providers[ $slug ] = $provider;

		quillcrm_get_logger()->debug(
			sprintf( 'Registered message provider: %s', $provider->get_provider_name() ),
			array(
				'code'          => 'provider_registered',
				'provider_slug' => $slug,
				'provider_name' => $provider->get_provider_name(),
				'channels'      => array_filter(
					array( 'sms', 'whatsapp' ),
					array( $provider, 'supports_channel' )
				),
			)
		);
	}

	/**
	 * Get provider for a specific channel
	 *
	 * Returns a configured provider for the channel. If a preferred provider is specified,
	 * it will be used if available and configured. Otherwise, falls back to:
	 * 1. The default provider for the channel (if configured)
	 * 2. Any other configured provider that supports the channel
	 *
	 * @since 1.0.0
	 *
	 * @param string      $channel Channel type ('sms', 'whatsapp')
	 * @param string|null $preferred_provider Optional provider slug
	 * @return Message_Provider_Interface|null Provider instance or null if not available
	 */
	public function get_provider( string $channel, ?string $preferred_provider = null): ?Message_Provider_Interface {
		// If preferred provider is specified, try it first
		if ( $preferred_provider ) {
			$provider = $this->get_configured_provider_by_slug( $preferred_provider, $channel );
			if ( $provider ) {
				return $provider;
			}
		}

		// Try the default provider for this channel
		$default_slug = $this->default_providers[ $channel ] ?? null;
		if ( $default_slug ) {
			$provider = $this->get_configured_provider_by_slug( $default_slug, $channel );
			if ( $provider ) {
				return $provider;
			}
		}

		// Fallback: Find any configured provider that supports this channel
		foreach ( $this->providers as $slug => $provider ) {
			if ( $provider->supports_channel( $channel ) && $provider->is_configured() ) {
				quillcrm_get_logger()->debug(
					sprintf( 'Using fallback provider "%s" for channel: %s', $slug, $channel ),
					array(
						'code'          => 'fallback_provider_used',
						'provider_slug' => $slug,
						'channel'       => $channel,
					)
				);
				return $provider;
			}
		}

		// No configured provider found
		quillcrm_get_logger()->debug(
			sprintf( 'No configured provider found for channel: %s', $channel ),
			array(
				'code'    => 'no_configured_provider',
				'channel' => $channel,
			)
		);
		return null;
	}

	/**
	 * Get a configured provider by slug for a specific channel
	 *
	 * @since 1.0.0
	 *
	 * @param string $provider_slug Provider slug
	 * @param string $channel Channel type
	 * @return Message_Provider_Interface|null Provider if found, supports channel, and is configured
	 */
	private function get_configured_provider_by_slug( string $provider_slug, string $channel ): ?Message_Provider_Interface {
		if ( ! isset( $this->providers[ $provider_slug ] ) ) {
			return null;
		}

		$provider = $this->providers[ $provider_slug ];

		if ( ! $provider->supports_channel( $channel ) ) {
			return null;
		}

		if ( ! $provider->is_configured() ) {
			return null;
		}

		return $provider;
	}

	/**
	 * Get provider by slug
	 *
	 * @since 1.0.0
	 *
	 * @param string $provider_slug Provider slug (e.g., 'twilio', 'vonage')
	 * @return Message_Provider_Interface|null Provider instance or null if not found
	 */
	public function get_provider_by_slug( string $provider_slug ): ?Message_Provider_Interface {
		return $this->providers[ $provider_slug ] ?? null;
	}

	/**
	 * Get all registered providers
	 *
	 * @since 1.0.0
	 *
	 * @return Message_Provider_Interface[] Array of provider instances
	 */
	public function get_all_providers(): array {
		return $this->providers;
	}

	/**
	 * Set default provider for a channel
	 * Future: This can be made dynamic via settings
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type
	 * @param string $provider_slug Provider slug
	 * @return void
	 */
	public function set_default_provider( string $channel, string $provider_slug): void {
		$this->default_providers[ $channel ] = $provider_slug;
	}

	/**
	 * Get default provider slug for a channel
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type
	 * @return string|null Provider slug or null if no default
	 */
	public function get_default_provider_slug( string $channel): ?string {
		return $this->default_providers[ $channel ] ?? null;
	}
}


