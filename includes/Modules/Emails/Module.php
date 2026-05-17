<?php
/**
 * Emails module bootstrap.
 *
 * Owns: email builder, renderer, block registry, bulk/curl-multi mailers,
 * bulkmailer adapters, layout handlers, email templates.
 *
 * Shared infrastructure used by Campaigns, Automations, Booking, Inbox,
 * Notifications, etc. — not campaign-specific.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Emails;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'emails';
	}

	public function label(): string {
		return __( 'Emails', 'doublescale' );
	}

	public function description(): string {
		return __( 'Email builder, renderer, and delivery infrastructure shared across modules.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function is_toggleable(): bool {
		return false;
	}

	public function dependencies(): array {
		return array( 'core' );
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		// Register block-registration hook BEFORE EmailBuilder::instance() so we
		// catch the doublescale_register_email_blocks action whether the registry
		// constructs eagerly or lazily.
		add_action( 'doublescale_register_email_blocks', array( $this, 'register_email_blocks' ) );

		EmailBuilder::instance();
	}

	/**
	 * Registers the blocks that BlockRegistry::register_default_blocks() does
	 * not seed (Banner, Divider, Menu, Product, SocialMedia, Timer).
	 *
	 * Slice 2 will relocate the Pro block PHP classes to the Pro plugin and
	 * have Pro hook this same `doublescale_register_email_blocks` action with
	 * its own registrations; Free will then only seed Text/Button.
	 */
	public function register_email_blocks( $registry ) {
		$registry->register_block( new Blocks\BannerBlock() );
		$registry->register_block( new Blocks\DividerBlock() );
		$registry->register_block( new Blocks\MenuBlock() );
		$registry->register_block( new Blocks\ProductBlock() );
		$registry->register_block( new Blocks\SocialMediaBlock() );
		$registry->register_block( new Blocks\TimerBlock() );
	}
}
