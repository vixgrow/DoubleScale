<?php
/**
 * Campaigns module bootstrap.
 *
 * Owns: campaigns, templates, email builder/blocks, sequences,
 * campaign REST API, AI email builder hooks.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Campaigns;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'campaigns';
	}

	public function label(): string {
		return __( 'Campaigns', 'doublescale' );
	}

	public function description(): string {
		return __( 'Email and SMS campaigns, templates, and email sequences.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function is_toggleable(): bool {
		return true;
	}

	public function dependencies(): array {
		return array( 'core', 'contacts' );
	}

	/**
	 * @return array<int, array{0: string, 1: string}>
	 */
	public function scheduledHooks(): array {
		return array(
			array( 'doublescale_campaigns', 'doublescale_email_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_sms_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_whatsapp_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_email_sequences' ),
		);
	}

	public function register( Container $container ): void {
		$container->singleton(
			Services\EmailSequencesManager::class,
			static fn() => Services\EmailSequencesManager::instance()
		);

		$container->singleton(
			Services\CampaignStatusManager::class,
			static fn() => Services\CampaignStatusManager::instance()
		);

	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestCampaignController::class,
			Rest\Controllers\RestTemplateController::class,
			Rest\Controllers\RestEmailSequenceController::class,
			Rest\Controllers\RestAiEmailBuilderController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		Emails\EmailBuilder::instance();
		Campaign\EmailProcessing::instance();
		Campaign\SmsProcessing::instance();
		Campaign\WhatsappProcessing::instance();
		Campaign\AutomatedCampaignHandler::instance();
		$container->get( Services\EmailSequencesManager::class );

		add_action( 'doublescale_register_email_blocks', array( $this, 'register_email_blocks' ) );
		add_action( 'init', array( $this, 'register_cron_schedules' ) );
	}

	public function register_cron_schedules() {
		if ( get_transient( 'doublescale_register_tasks_lock_campaigns' ) ) {
			return;
		}
		set_transient( 'doublescale_register_tasks_lock_campaigns', 1, MINUTE_IN_SECONDS );
		$tasks = new \DoubleScale\Core\Tasks( 'doublescale_campaigns' );

		if ( $tasks->get_next_timestamp( 'doublescale_email_campaigns' ) === false ) {
			$tasks->schedule_recurring( time(), 60, 'doublescale_email_campaigns' );
		}
		if ( $tasks->get_next_timestamp( 'doublescale_sms_campaigns' ) === false ) {
			$tasks->schedule_recurring( time(), 60, 'doublescale_sms_campaigns' );
		}
		if ( $tasks->get_next_timestamp( 'doublescale_email_sequences' ) === false ) {
			$tasks->schedule_recurring( time(), 60, 'doublescale_email_sequences' );
		}
	}

	public function register_email_blocks( $registry ) {
		$registry->register_block( new Emails\Blocks\BannerBlock() );
		$registry->register_block( new Emails\Blocks\DividerBlock() );
		$registry->register_block( new Emails\Blocks\MenuBlock() );
		$registry->register_block( new Emails\Blocks\ProductBlock() );
		$registry->register_block( new Emails\Blocks\SocialMediaBlock() );
		$registry->register_block( new Emails\Blocks\TimerBlock() );
	}
}
