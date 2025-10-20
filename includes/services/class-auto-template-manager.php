<?php
/**
 * Auto Template Manager
 * Manages automatic template creation and deduplication for automation emails
 * auto-create templates from email content
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Models\Template_Model;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\Settings;

/**
 * Auto_Template_Manager class
 */
class Auto_Template_Manager {

	/**
	 * Find or create template from email content
	 * Uses content hash for deduplication
	 * Race-condition safe with atomic firstOrCreate
	 *
	 * @param string $subject Email subject
	 * @param string $body Email body
	 * @param array  $settings Template settings (from_name, from_email, reply_to, etc.)
	 * @return Template_Model Template instance
	 */
	public static function find_or_create( $subject, $body, $settings = array() ) {
		// Generate content hash for deduplication
		$content_hash = self::generate_content_hash( $subject, $body );

		// Use firstOrCreate for atomic operation (prevents race conditions)
		// This is safe even with concurrent automations due to UNIQUE index
		$was_recently_created = false;
		
		try {
			$template = Template_Model::firstOrCreate(
				// Search conditions (with UNIQUE index for safety)
				array(
					'content_hash'      => $content_hash,
					'is_auto_generated' => 1,
				),
				// Attributes to set if creating new record
				array(
					'name'     => self::generate_template_name( $subject ),
					'type'     => Campaign_Channel::CHANNEL_EMAIL,
					'subject'  => $subject,
					'body'     => $body,
					'settings' => array_merge(
						self::get_default_settings(),
						$settings
					),
					'hidden'   => 1,
					'category' => 'automation',
				)
			);
			
			$was_recently_created = $template->wasRecentlyCreated;
			
		} catch ( \Exception $e ) {
			// Handle duplicate key errors gracefully (race condition fallback)
			// If UNIQUE constraint fails, retry with simple find
			$template = Template_Model::where( 'content_hash', $content_hash )
				->where( 'is_auto_generated', 1 )
				->first();
			
			if ( ! $template ) {
				// If still not found, re-throw the original exception
				throw $e;
			}
		}

		// Log the action
		if ( $was_recently_created ) {
			quillcrm_get_logger()->info(
				'Created new auto-generated template',
				array(
					'template_id'   => $template->id,
					'content_hash'  => $content_hash,
					'template_name' => $template->name,
					'code'          => 'auto_template_created',
				)
			);
		} else {
			quillcrm_get_logger()->info(
				'Reusing existing auto-generated template',
				array(
					'template_id'   => $template->id,
					'content_hash'  => $content_hash,
					'template_name' => $template->name,
					'code'          => 'auto_template_reused',
				)
			);
		}

		return $template;
	}

	/**
	 * Generate content hash for deduplication
	 * Uses SHA-256 hash of subject + body
	 *
	 * @param string $subject Email subject
	 * @param string $body Email body
	 * @return string 64-character hash
	 */
	private static function generate_content_hash( $subject, $body ) {
		// Normalize content before hashing to improve deduplication
		$normalized_subject = trim( $subject );
		$normalized_body    = trim( $body );

		// Generate SHA-256 hash
		return hash( 'sha256', $normalized_subject . '|' . $normalized_body );
	}

	/**
	 * Generate template name from subject
	 * Format: "Auto: [First 50 chars of subject] - [timestamp]"
	 *
	 * @param string $subject Email subject
	 * @return string Template name
	 */
	private static function generate_template_name( $subject ) {
		$truncated_subject = mb_substr( $subject, 0, 50 );

		// Remove any merge tags from the name for readability
		$truncated_subject = preg_replace( '/\{\{[^}]+\}\}/', '', $truncated_subject );
		$truncated_subject = trim( $truncated_subject );

		if ( empty( $truncated_subject ) ) {
			$truncated_subject = __( 'Untitled Email', 'quillcrm' );
		}

		return sprintf(
			'Auto: %s - %s',
			$truncated_subject,
			date( 'Y-m-d H:i:s' )
		);
	}

	/**
	 * Get default template settings
	 *
	 * @return array Default settings
	 */
	private static function get_default_settings() {
		$global_settings = Settings::get( 'email', array() );

		return array(
			'from_name'       => $global_settings['from_name'] ?? get_bloginfo( 'name' ),
			'from_email'      => $global_settings['from_email'] ?? get_option( 'admin_email' ),
			'reply_to'        => $global_settings['reply_to'] ?? '',
			'add_unsubscribe' => true,
			'enable_utm'      => false,
		);
	}

	/**
	 * Clean up unused auto-generated templates
	 * Deletes templates that haven't been used in X days
	 *
	 * @param int $days_threshold Number of days of inactivity before deletion (default: 90)
	 * @return int Number of templates deleted
	 */
	public static function cleanup_unused_templates( $days_threshold = 90 ) {
		$cutoff_date = date( 'Y-m-d H:i:s', strtotime( "-{$days_threshold} days" ) );

		// Find auto-generated templates not used recently
		$unused_templates = Template_Model::where( 'is_auto_generated', 1 )
			->where( 'updated_at', '<', $cutoff_date )
			->whereDoesntHave( 'tracking_records', function ( $query ) use ( $cutoff_date ) {
				$query->where( 'created_at', '>=', $cutoff_date );
			} )
			->get();

		$deleted_count = 0;
		foreach ( $unused_templates as $template ) {
			// Double-check template has no recent tracking records
			$recent_usage_count = \QuillCRM\Models\Tracking_Model::where( 'template_id', $template->id )
				->where( 'created_at', '>=', $cutoff_date )
				->count();

			if ( $recent_usage_count === 0 ) {
				$template->delete();
				$deleted_count++;
			}
		}

		if ( $deleted_count > 0 ) {
			quillcrm_get_logger()->info(
				'Cleaned up unused auto-generated templates',
				array(
					'deleted_count'   => $deleted_count,
					'days_threshold'  => $days_threshold,
					'code'            => 'auto_template_cleanup',
				)
			);
		}

		return $deleted_count;
	}
}
