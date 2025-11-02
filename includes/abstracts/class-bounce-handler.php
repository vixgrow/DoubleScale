<?php
/**
 * Abstract Bounce_Handler
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Contact_Model;

/**
 * Bounce_Handler abstract class
 */
abstract class Bounce_Handler {

	// Meta key constants to avoid magic strings
	const META_SOFT_BOUNCE_COUNT = '_soft_bounce_count';
	const META_LAST_BOUNCE_REASON = '_last_bounce_reason';
	const META_LAST_BOUNCE_DATE = '_last_bounce_date';
	const META_BOUNCE_REASON = '_bounce_reason';
	const META_BOUNCE_TYPE = '_bounce_type';
	const META_BOUNCE_DATE = '_bounce_date';
	const META_BOUNCE_DIAGNOSTIC = '_bounce_diagnostic';
	const META_BOUNCE_PROVIDER = '_bounce_provider';

	/**
	 * Provider Name
	 *
	 * @var string
	 */
	protected $name = '';

	/**
	 * Webhook data
	 *
	 * @var array
	 */
	protected $data = array();

	/**
	 * Get provider name
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Set webhook data
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Webhook data
	 *
	 * @return void
	 */
	public function set_data( $data ) {
		$this->data = $data;
	}

	/**
	 * Handle webhook
	 * Must be implemented by provider-specific handlers
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	abstract public function handle();

	/**
	 * Mark contact as bounced
	 *
	 * @since 1.0.0
	 *
	 * @param string $email Contact email
	 * @param array  $metadata Bounce metadata
	 *
	 * @return bool
	 */
	protected function mark_contact_bounced( $email, $metadata = array() ) {
		// Sanitize email first
		$email = sanitize_email( $email );

		if ( ! is_email( $email ) ) {
			$this->log( 'Invalid email for bounce: ' . $email );
			return false;
		}

		// Sanitize metadata before processing
		$metadata = $this->sanitize_metadata( $metadata );

		// Get contact
		$contact = Contact_Model::get_by_email( $email );

		if ( ! $contact ) {
			$this->log( "Contact not found for email: $email" );
			return false;
		}

		// Handle soft bounces
		if ( isset( $metadata['bounce_type'] ) && $metadata['bounce_type'] === 'soft' ) {
			return $this->handle_soft_bounce( $contact, $metadata );
		}

		// Mark as hard bounced
		return $this->mark_hard_bounced( $contact, $metadata );
	}

	/**
	 * Sanitize metadata before storing
	 *
	 * @since 1.0.0
	 *
	 * @param array $metadata Raw metadata from webhook
	 *
	 * @return array Sanitized metadata
	 */
	protected function sanitize_metadata( $metadata ) {
		$clean = array();

		if ( isset( $metadata['reason'] ) ) {
			$clean['reason'] = sanitize_text_field( $metadata['reason'] );
		}

		if ( isset( $metadata['bounce_type'] ) && in_array( $metadata['bounce_type'], array( 'hard', 'soft' ), true ) ) {
			$clean['bounce_type'] = $metadata['bounce_type'];
		}

		if ( isset( $metadata['timestamp'] ) ) {
			$clean['timestamp'] = absint( $metadata['timestamp'] );
		}

		if ( isset( $metadata['diagnostic_code'] ) ) {
			$clean['diagnostic_code'] = sanitize_textarea_field( $metadata['diagnostic_code'] );
		}

		if ( isset( $metadata['provider'] ) ) {
			$clean['provider'] = sanitize_key( $metadata['provider'] );
		}

		return $clean;
	}

	/**
	 * Handle soft bounce
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact model instance
	 * @param array         $metadata Bounce metadata
	 *
	 * @return bool
	 */
	protected function handle_soft_bounce( $contact, $metadata ) {
		$soft_bounce_count = (int) quillcrm_get_contact_meta( $contact->id, self::META_SOFT_BOUNCE_COUNT, true );
		$soft_bounce_limit = apply_filters( 'quillcrm_soft_bounce_limit', 1 );

		if ( $soft_bounce_count < $soft_bounce_limit ) {
			// Increment soft bounce counter
			quillcrm_update_contact_meta( $contact->id, self::META_SOFT_BOUNCE_COUNT, $soft_bounce_count + 1 );
			quillcrm_update_contact_meta( $contact->id, self::META_LAST_BOUNCE_REASON, $metadata['reason'] ?? 'Soft bounce' );
			quillcrm_update_contact_meta( $contact->id, self::META_LAST_BOUNCE_DATE, current_time( 'mysql' ) );

			do_action( 'quillcrm_contact_soft_bounced', $contact, $metadata );

			$this->log( "Soft bounce recorded for contact ID {$contact->id} (count: " . ( $soft_bounce_count + 1 ) . "/{$soft_bounce_limit})" );

			return true;
		}

		// Exceeded soft bounce limit, convert to hard bounce
		$metadata['reason'] = 'Exceeded soft bounce limit (' . $soft_bounce_limit . ')';
		$metadata['bounce_type'] = 'hard';

		return $this->mark_hard_bounced( $contact, $metadata );
	}

	/**
	 * Mark contact as hard bounced
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact model instance
	 * @param array         $metadata Bounce metadata
	 *
	 * @return bool
	 */
	protected function mark_hard_bounced( $contact, $metadata ) {
		$old_status = $contact->status;

		// Update contact status
		$contact->status = 'bounced';
		$contact->save();

		// Store bounce metadata using constants
		quillcrm_update_contact_meta( $contact->id, self::META_BOUNCE_REASON, $metadata['reason'] ?? 'Email bounced' );
		quillcrm_update_contact_meta( $contact->id, self::META_BOUNCE_TYPE, $metadata['bounce_type'] ?? 'hard' );
		quillcrm_update_contact_meta( $contact->id, self::META_BOUNCE_DATE, current_time( 'mysql' ) );

		if ( isset( $metadata['diagnostic_code'] ) ) {
			quillcrm_update_contact_meta( $contact->id, self::META_BOUNCE_DIAGNOSTIC, $metadata['diagnostic_code'] );
		}

		if ( isset( $metadata['provider'] ) ) {
			quillcrm_update_contact_meta( $contact->id, self::META_BOUNCE_PROVIDER, $metadata['provider'] );
		}

		do_action( 'quillcrm_contact_bounced', $contact, $old_status, $metadata );

		$this->log( "Contact ID {$contact->id} ({$contact->email}) marked as bounced" );

		return true;
	}

	/**
	 * Log message
	 *
	 * @since 1.0.0
	 *
	 * @param string $message Log message
	 *
	 * @return void
	 */
	protected function log( $message ) {
		if ( defined( 'QUILLCRM_BOUNCE_DEBUG' ) && QUILLCRM_BOUNCE_DEBUG ) {
			error_log( 'QuillCRM Bounce Handler: ' . $message );
		}
	}
}
