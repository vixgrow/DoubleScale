<?php
/**
 * Whitelist-based hook compatibility: canonical `doublescale_*` also invokes legacy `doublescale_*`.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

final class HookShim {

	private const DEPRECATED_VERSION = '2.0';

	public static function register(): void {
		foreach ( self::filter_hooks() as $legacy ) {
			$new = self::to_new( $legacy );
			add_filter(
				$new,
				static function ( $value ) use ( $legacy, $new ) {
					return apply_filters_deprecated( $legacy, array( $value ), self::DEPRECATED_VERSION, $new );
				},
				5,
				1
			);
		}

		foreach ( self::action_hooks() as $legacy ) {
			$new = self::to_new( $legacy );
			add_action(
				$new,
				static function ( ...$args ) use ( $legacy, $new ) {
					do_action_deprecated( $legacy, $args, self::DEPRECATED_VERSION, $new );
				},
				PHP_INT_MAX,
				99
			);
		}
	}

	private static function to_new( string $legacy ): string {
		return preg_replace( '/^doublescale_/', 'doublescale_', $legacy, 1 );
	}

	/**
	 * Hooks invoked with apply_filters() in legacy includes (static names only).
	 *
	 * @return string[]
	 */
	private static function filter_hooks(): array {
		return array(
			'doublescale_actions',
			'doublescale_actions_sources',
			'doublescale_bulk_campaign_batch_size',
			'doublescale_campaign_batch_size',
			'doublescale_campaign_channel_labels',
			'doublescale_campaign_channels_requiring_phone',
			'doublescale_curl_multi_campaign_batch_size',
			'doublescale_current_channel_context',
			'doublescale_default_email_content',
			'doublescale_default_test_email_content',
			'doublescale_email_cc',
			'doublescale_email_content_type',
			'doublescale_email_default_content_type',
			'doublescale_email_footer_text',
			'doublescale_email_from_address',
			'doublescale_email_from_name',
			'doublescale_email_header_image',
			'doublescale_email_headers',
			'doublescale_email_message',
			'doublescale_email_reply_to',
			'doublescale_email_template',
			'doublescale_email_template_paths',
			'doublescale_enable_ajax_continuation',
			'doublescale_enable_provider_webhooks',
			'doublescale_forms',
			'doublescale_goals',
			'doublescale_goals_sources',
			'doublescale_logger_add_message',
			'doublescale_logger_days_to_retain_logs',
			'doublescale_logger_log_message',
			'doublescale_logging_class',
			'doublescale_max_execution_time',
			'doublescale_memory_limit',
			'doublescale_merge_tag_groups',
			'doublescale_register_log_handlers',
			'doublescale_triggers',
			'doublescale_triggers_sources',
		);
	}

	/**
	 * Hooks invoked with do_action() in legacy includes (static names only).
	 *
	 * @return string[]
	 */
	private static function action_hooks(): array {
		return array(
			'doublescale_abandoned_cart_created',
			'doublescale_abandoned_cart_recovered',
			'doublescale_activities_bulk_deleted',
			'doublescale_activity_before_delete',
			'doublescale_activity_comment_added',
			'doublescale_activity_comment_before_delete',
			'doublescale_activity_comment_deleted',
			'doublescale_activity_comment_updated',
			'doublescale_activity_deleted',
			'doublescale_activity_updated',
			'doublescale_automation_contact_completed',
			'doublescale_automation_contact_entered',
			'doublescale_automation_step_failed',
			'doublescale_call_logged',
			'doublescale_campaign_completed',
			'doublescale_campaign_failed',
			'doublescale_campaign_scheduled',
			'doublescale_contact_lists_applied',
			'doublescale_contact_lists_removed',
			'doublescale_contact_subscribed',
			'doublescale_contact_tags_applied',
			'doublescale_contact_tags_removed',
			'doublescale_contact_unsubscribed',
			'doublescale_contact_updated',
			'doublescale_email_body',
			'doublescale_email_clicked',
			'doublescale_email_header',
			'doublescale_email_logged',
			'doublescale_email_opened',
			'doublescale_email_send_after',
			'doublescale_email_send_before',
			'doublescale_form_submitted',
			'doublescale_import_completed',
			'doublescale_meeting_scheduled',
			'doublescale_note_added',
			'doublescale_process_incoming_message',
			'doublescale_register_email_blocks',
			'doublescale_register_message_providers',
			'doublescale_run_version_migrations',
			'doublescale_updated',
			'doublescale_webhook_received',
		);
	}
}
