<?php
/**
 * Integrations module bootstrap.
 *
 * Owns: third-party CRM and messaging integrations (per-vendor folders). Each
 * vendor ships Integration.php plus Api/RemoteData/RestController as needed.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'integrations';
	}

	public function label(): string {
		return __( 'Integrations', 'doublescale' );
	}

	public function description(): string {
		return __( 'Third-party integrations for Twilio, Slack, Meta WhatsApp, and more.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts', 'automations', 'inbox' );
	}

	public function restControllers(): array {
		return array(
			Rest\RestIntegrationController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		$legacy_controllers = $this->restControllers();
		add_action(
			'rest_api_init',
			static function () use ( $legacy_controllers ) {
				foreach ( $legacy_controllers as $class ) {
					if ( ! is_string( $class ) || ! is_subclass_of( $class, RestController::class, true ) ) {
						continue;
					}
					if ( ! method_exists( $class, 'register_routes_legacy' ) ) {
						continue;
					}
					( new $class() )->register_routes_legacy();
				}
			},
			11
		);

		Gohighlevel\GohighlevelOauth::init();

		Stripe\Migrations\MigrateStripeFromBooking::run();

		$this->loadManifestOrGlobs(
			array( 'includes/Modules/Integrations/*/Integration.php' ),
			'integrations'
		);

		$this->register_message_providers();
	}

	private function register_message_providers(): void {
		$manager = \DoubleScale\Managers\IntegrationsManager::instance();

		$manager->register( new Twilio\Integration(), true );
		$manager->register( Stripe\Integration::instance(), true );
		$manager->register( new Slack\Integration(), true );
		$manager->register( new MetaWhatsapp\Integration() );

		$registry = \DoubleScale\Modules\Inbox\Services\MessageProviderRegistry::instance();
		$registry->register( new \DoubleScale\Modules\Inbox\MessageProviders\TwilioMessageProvider() );
		$registry->register( new \DoubleScale\Modules\Inbox\MessageProviders\MetaWhatsappProvider() );

		do_action( 'doublescale_register_message_providers' );
	}
}
