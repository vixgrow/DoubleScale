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

	// Meta key constants to avoid magic strings.
	const META_SOFT_BOUNCE_COUNT  = '_soft_bounce_count';
	const META_LAST_BOUNCE_REASON = '_last_bounce_reason';
	const META_LAST_BOUNCE_DATE   = '_last_bounce_date';
	const META_BOUNCE_REASON      = '_bounce_reason';
	const META_BOUNCE_TYPE        = '_bounce_type';
	const META_BOUNCE_DATE        = '_bounce_date';
	const META_BOUNCE_DIAGNOSTIC  = '_bounce_diagnostic';
	const META_BOUNCE_PROVIDER    = '_bounce_provider';

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
	 * @param array $data Webhook data.
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
	 * @param string $email Contact email.
	 * @param array  $metadata Bounce metadata.
	 *
	 * @return bool
	 */
	protected function mark_contact_bounced( $email, $metadata = array() ) {
		// Sanitize email first.
		$email = sanitize_email( $email );

		if ( ! is_email( $email ) ) {
			$this->log(
				'Invalid email for bounce: ' . $email,
				'warning',
				array( 'email' => $email )
			);
			return false;
		}

		// Sanitize metadata before processing.
		$metadata = $this->sanitize_metadata( $metadata );

		// Get contact.
		$contact = Contact_Model::get_by_email( $email );

		if ( ! $contact ) {
			$this->log(
				"Contact not found for email: $email",
				'info',
				array( 'email' => $email )
			);
			return false;
		}

		// Handle soft bounces.
		if ( isset( $metadata['bounce_type'] ) && $metadata['bounce_type'] === 'soft' ) {
			return $this->handle_soft_bounce( $contact, $metadata );
		}

		// Mark as hard bounced.
		return $this->mark_hard_bounced( $contact, $metadata );
	}

	/**
	 * Sanitize metadata before storing
	 *
	 * @since 1.0.0
	 *
	 * @param array $metadata Raw metadata from webhook.
	 *
	 * @return array Sanitized metadata.
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
	 * @param Contact_Model $contact Contact model instance.
	 * @param array         $metadata Bounce metadata.
	 *
	 * @return bool
	 */
	protected function handle_soft_bounce( $contact, $metadata ) {
		$soft_bounce_count = (int) quillcrm_get_contact_meta( $contact->id, self::META_SOFT_BOUNCE_COUNT, true );
		$soft_bounce_limit = apply_filters( 'quillcrm_soft_bounce_limit', 1 );

		if ( $soft_bounce_count < $soft_bounce_limit ) {
			// Increment soft bounce counter.
			quillcrm_update_contact_meta( $contact->id, self::META_SOFT_BOUNCE_COUNT, $soft_bounce_count + 1 );
			quillcrm_update_contact_meta( $contact->id, self::META_LAST_BOUNCE_REASON, $metadata['reason'] ?? 'Soft bounce' );
			quillcrm_update_contact_meta( $contact->id, self::META_LAST_BOUNCE_DATE, current_time( 'mysql' ) );

			do_action( 'quillcrm_contact_soft_bounced', $contact, $metadata );

			$this->log(
				sprintf(
					'Soft bounce recorded for contact ID %d (%s). Count: %d/%d. Reason: %s',
					$contact->id,
					$contact->email,
					$soft_bounce_count + 1,
					$soft_bounce_limit,
					$metadata['reason'] ?? 'Unknown'
				),
				'info',
				array(
					'contact_id'    => $contact->id,
					'email'         => $contact->email,
					'bounce_count'  => $soft_bounce_count + 1,
					'bounce_limit'  => $soft_bounce_limit,
					'bounce_reason' => $metadata['reason'] ?? 'Unknown',
				)
			);

			return true;
		}

		// Exceeded soft bounce limit, convert to hard bounce.
		$this->log(
			sprintf(
				'Contact ID %d (%s) exceeded soft bounce limit (%d). Converting to hard bounce.',
				$contact->id,
				$contact->email,
				$soft_bounce_limit
			),
			'warning',
			array(
				'contact_id'   => $contact->id,
				'email'        => $contact->email,
				'bounce_limit' => $soft_bounce_limit,
			)
		);

		$metadata['reason']      = 'Exceeded soft bounce limit (' . $soft_bounce_limit . ')';
		$metadata['bounce_type'] = 'hard';

		return $this->mark_hard_bounced( $contact, $metadata );
	}

	/**
	 * Mark contact as hard bounced
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact model instance.
	 * @param array         $metadata Bounce metadata.
	 *
	 * @return bool
	 */
	protected function mark_hard_bounced( $contact, $metadata ) {
		$old_status = $contact->status;

		// Update contact status.
		$contact->status = 'bounced';
		$contact->save();

		// Store bounce metadata using constants.
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

		$this->log(
			sprintf(
				'Contact ID %d (%s) marked as hard bounced. Previous status: %s. Reason: %s. Provider: %s',
				$contact->id,
				$contact->email,
				$old_status,
				$metadata['reason'] ?? 'Unknown',
				$metadata['provider'] ?? 'Unknown'
			),
			'notice',
			array(
				'contact_id'      => $contact->id,
				'email'           => $contact->email,
				'previous_status' => $old_status,
				'bounce_reason'   => $metadata['reason'] ?? 'Unknown',
				'bounce_provider' => $metadata['provider'] ?? 'Unknown',
				'diagnostic_code' => $metadata['diagnostic_code'] ?? '',
			)
		);

		return true;
	}

	/**
	 * Log message
	 *
	 * @since 1.0.0
	 *
	 * @param string $message Log message.
	 * @param string $level   Log level (info, notice, warning, error).
	 * @param array  $context Additional context data.
	 *
	 * @return void
	 */
	protected function log( $message, $level = 'info', $context = array() ) {
		// Add provider name to context.
		$context = array_merge(
			array(
				'source'   => 'bounce-handler',
				'provider' => $this->name,
			),
			$context
		);

		// Use QuillCRM's centralized logger.
		$logger = quillcrm_get_logger();

		switch ( $level ) {
			case 'error':
				$logger->error( $message, $context );
				break;
			case 'warning':
				$logger->warning( $message, $context );
				break;
			case 'notice':
				$logger->notice( $message, $context );
				break;
			case 'info':
			default:
				$logger->info( $message, $context );
				break;
		}
	}
}
