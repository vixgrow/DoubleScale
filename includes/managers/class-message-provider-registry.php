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
	 * MVP: Hardcoded to Twilio for SMS and WhatsApp
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	private $default_providers = array(
		'sms'      => 'twilio',
		// 'whatsapp' => 'twilio',
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
	 * MVP: Returns default provider (Twilio) for SMS/WhatsApp
	 * Future: Can accept preferred provider parameter
	 *
	 * @since 1.0.0
	 *
	 * @param string      $channel Channel type ('sms', 'whatsapp')
	 * @param string|null $preferred_provider Optional provider slug (for future use)
	 * @return Message_Provider_Interface|null Provider instance or null if not available
	 */
	public function get_provider( string $channel, ?string $preferred_provider = null): ?Message_Provider_Interface {
		// Determine which provider to use
		$provider_slug = $preferred_provider ?? $this->default_providers[ $channel ] ?? null;

		if ( ! $provider_slug ) {
			quillcrm_get_logger()->error(
				sprintf( 'No default provider configured for channel: %s', $channel ),
				array(
					'code'    => 'no_default_provider',
					'channel' => $channel,
				)
			);
			return null;
		}

		// Get provider instance
		if ( ! isset( $this->providers[ $provider_slug ] ) ) {
			quillcrm_get_logger()->error(
				sprintf( 'Provider "%s" not registered for channel: %s', $provider_slug, $channel ),
				array(
					'code'          => 'provider_not_registered',
					'provider_slug' => $provider_slug,
					'channel'       => $channel,
				)
			);
			return null;
		}

		$provider = $this->providers[ $provider_slug ];

		// Verify provider supports the channel
		if ( ! $provider->supports_channel( $channel ) ) {
			quillcrm_get_logger()->error(
				sprintf( 'Provider "%s" does not support channel: %s', $provider_slug, $channel ),
				array(
					'code'          => 'provider_channel_not_supported',
					'provider_slug' => $provider_slug,
					'provider_name' => $provider->get_provider_name(),
					'channel'       => $channel,
				)
			);
			return null;
		}

		// Verify provider is configured
		if ( ! $provider->is_configured() ) {
			quillcrm_get_logger()->error(
				sprintf( 'Provider "%s" is not configured', $provider->get_provider_name() ),
				array(
					'code'          => 'provider_not_configured',
					'provider_slug' => $provider_slug,
					'provider_name' => $provider->get_provider_name(),
					'channel'       => $channel,
				)
			);
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
