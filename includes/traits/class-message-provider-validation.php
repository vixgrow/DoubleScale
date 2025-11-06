<?php
/**
 * Message Provider Validation Trait
 * Shared methods for validating message provider connections
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Traits;

use QuillCRM\Managers\Message_Provider_Registry;
use WP_Error;

/**
 * Trait Message_Provider_Validation
 *
 * Provides common methods for validating message provider connections.
 * Used by: Campaign Controller, Contact Controller, Integration Controller
 *
 * @since 1.0.0
 */
trait Message_Provider_Validation {

	/**
	 * Validate provider connection for SMS/WhatsApp
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type ('sms', 'whatsapp').
	 * @return true|WP_Error True if provider is connected, WP_Error otherwise.
	 */
	protected function validate_provider_connection( $channel ) {
		$provider = Message_Provider_Registry::instance()->get_provider( $channel );

		if ( ! $provider ) {
			$provider_name = $this->get_default_provider_name( $channel );

			return new WP_Error(
				'provider_not_configured',
				sprintf(
					/* translators: 1: Channel name (SMS/WhatsApp), 2: Provider name (Twilio) */
					__( '%1$s provider (%2$s) is not configured. Please configure the integration in Settings > Integrations.', 'quillcrm' ),
					ucfirst( $channel ),
					$provider_name
				),
				array(
					'status'        => 400,
					'channel'       => $channel,
					'provider_name' => $provider_name,
					'help_link'     => admin_url( 'admin.php?page=quillcrm#/settings/integrations' ),
				)
			);
		}

		if ( ! $provider->is_configured() ) {
			return new WP_Error(
				'provider_not_connected',
				sprintf(
					/* translators: 1: Channel name (SMS/WhatsApp), 2: Provider name */
					__( '%1$s provider (%2$s) is not connected. Please connect the integration in Settings > Integrations.', 'quillcrm' ),
					ucfirst( $channel ),
					$provider->get_provider_name()
				),
				array(
					'status'        => 400,
					'channel'       => $channel,
					'provider_name' => $provider->get_provider_name(),
					'provider_slug' => $provider->get_provider_slug(),
					'help_link'     => admin_url( 'admin.php?page=quillcrm#/settings/integrations' ),
				)
			);
		}

		return true;
	}

	/**
	 * Get default provider name for channel
	 *
	 * Maps provider slugs to user-friendly display names.
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type.
	 * @return string Provider name.
	 */
	protected function get_default_provider_name( $channel ) {
		$default_slug = Message_Provider_Registry::instance()->get_default_provider_slug( $channel );

		// Map common provider slugs to friendly names
		$provider_names = array(
			'twilio' => 'Twilio',
		);

		return $provider_names[ $default_slug ] ?? ucfirst( $default_slug );
	}
}

