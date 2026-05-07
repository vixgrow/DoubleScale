<?php
/**
 * Tracking module bootstrap.
 *
 * Owns: email/SMS/WhatsApp tracking, link triggers, IMAP client helper, related
 * models/migrations, and link-trigger REST API. Website/page-visit tracking is
 * in the Website Tracking module.
 *
 * @package DoubleScale\Modules\Tracking
 */

namespace DoubleScale\Modules\Tracking;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'tracking';
	}

	public function label(): string {
		return __( 'Tracking', 'doublescale' );
	}

	public function description(): string {
		return __( 'Email, SMS, and channel tracking with link triggers.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts', 'automations' );
	}

	public function register( Container $container ): void {
		$container->singleton(
			LinkTriggers::class,
			static fn() => LinkTriggers::instance()
		);

		$container->singleton(
			Email::class,
			static fn() => Email::instance()
		);

		$container->singleton(
			Sms::class,
			static fn() => Sms::instance()
		);

		$container->singleton(
			Whatsapp::class,
			static fn() => Whatsapp::instance()
		);

		$container->singleton( Services\TrackingService::class );
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestLinkTriggerController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		$container->get( Email::class );
		$container->get( Sms::class );
		$container->get( Whatsapp::class );
		$container->get( LinkTriggers::class );
	}
}
