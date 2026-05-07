<?php
/**
 * Whitelist-based hook compatibility: canonical `doublescale_*` also invokes legacy `quillcrm_*`.
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
		return preg_replace( '/^quillcrm_/', 'doublescale_', $legacy, 1 );
	}

	/**
	 * Hooks invoked with apply_filters() in legacy includes (static names only).
	 *
	 * @return string[]
	 */
	private static function filter_hooks(): array {
		return array(
			'quillcrm_actions',
			'quillcrm_actions_sources',
			'quillcrm_bulk_campaign_batch_size',
			'quillcrm_campaign_batch_size',
			'quillcrm_campaign_channel_labels',
			'quillcrm_campaign_channels_requiring_phone',
			'quillcrm_curl_multi_campaign_batch_size',
			'quillcrm_current_channel_context',
			'quillcrm_default_email_content',
			'quillcrm_default_test_email_content',
			'quillcrm_email_cc',
			'quillcrm_email_content_type',
			'quillcrm_email_default_content_type',
			'quillcrm_email_footer_text',
			'quillcrm_email_from_address',
			'quillcrm_email_from_name',
			'quillcrm_email_header_image',
			'quillcrm_email_headers',
			'quillcrm_email_message',
			'quillcrm_email_reply_to',
			'quillcrm_email_template',
			'quillcrm_email_template_paths',
			'quillcrm_enable_ajax_continuation',
			'quillcrm_enable_provider_webhooks',
			'quillcrm_forms',
			'quillcrm_goals',
			'quillcrm_goals_sources',
			'quillcrm_logger_add_message',
			'quillcrm_logger_days_to_retain_logs',
			'quillcrm_logger_log_message',
			'quillcrm_logging_class',
			'quillcrm_max_execution_time',
			'quillcrm_memory_limit',
			'quillcrm_merge_tag_groups',
			'quillcrm_register_log_handlers',
			'quillcrm_triggers',
			'quillcrm_triggers_sources',
		);
	}

	/**
	 * Hooks invoked with do_action() in legacy includes (static names only).
	 *
	 * @return string[]
	 */
	private static function action_hooks(): array {
		return array(
			'quillcrm_abandoned_cart_created',
			'quillcrm_abandoned_cart_recovered',
			'quillcrm_activities_bulk_deleted',
			'quillcrm_activity_before_delete',
			'quillcrm_activity_comment_added',
			'quillcrm_activity_comment_before_delete',
			'quillcrm_activity_comment_deleted',
			'quillcrm_activity_comment_updated',
			'quillcrm_activity_deleted',
			'quillcrm_activity_updated',
			'quillcrm_automation_contact_completed',
			'quillcrm_automation_contact_entered',
			'quillcrm_automation_step_failed',
			'quillcrm_call_logged',
			'quillcrm_campaign_completed',
			'quillcrm_campaign_failed',
			'quillcrm_campaign_scheduled',
			'quillcrm_contact_lists_applied',
			'quillcrm_contact_lists_removed',
			'quillcrm_contact_subscribed',
			'quillcrm_contact_tags_applied',
			'quillcrm_contact_tags_removed',
			'quillcrm_contact_unsubscribed',
			'quillcrm_contact_updated',
			'quillcrm_email_body',
			'quillcrm_email_clicked',
			'quillcrm_email_header',
			'quillcrm_email_logged',
			'quillcrm_email_opened',
			'quillcrm_email_send_after',
			'quillcrm_email_send_before',
			'quillcrm_form_submitted',
			'quillcrm_import_completed',
			'quillcrm_meeting_scheduled',
			'quillcrm_note_added',
			'quillcrm_process_incoming_message',
			'quillcrm_register_email_blocks',
			'quillcrm_register_message_providers',
			'quillcrm_run_version_migrations',
			'quillcrm_updated',
			'quillcrm_webhook_received',
		);
	}
}
