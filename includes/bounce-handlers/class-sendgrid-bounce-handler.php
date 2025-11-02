<?php
/**
 * SendGrid Bounce Handler
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Bounce_Handlers;

use QuillCRM\Abstracts\Bounce_Handler;
use QuillCRM\Managers\Bounce_Handler_Manager;

/**
 * Sendgrid_Bounce_Handler class
 */
class Sendgrid_Bounce_Handler extends Bounce_Handler {

	/**
	 * Provider name
	 *
	 * @var string
	 */
	protected $name = 'SendGrid';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		// Auto-register with manager
		add_action(
			'quillcrm_bounce_handlers_loaded',
			function () {
				Bounce_Handler_Manager::instance()->register( self::class );
			}
		);
	}

	/**
	 * Handle SendGrid webhook
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function handle() {
		if ( ! is_array( $this->data ) || empty( $this->data ) ) {
			$this->log( 'Empty or invalid data received' );
			return false;
		}

		$processed = false;

		foreach ( $this->data as $event ) {
			if ( ! is_array( $event ) || ! isset( $event['event'] ) ) {
				continue;
			}

			$event_type = $event['event'];
			$email      = $event['email'] ?? null;

			if ( ! is_email( $email ) ) {
				$this->log( 'Invalid email in event: ' . wp_json_encode( $event ) );
				continue;
			}

			$metadata = array(
				'reason'          => $event['reason'] ?? 'Unknown',
				'timestamp'       => $event['timestamp'] ?? time(),
				'provider'        => 'sendgrid',
				'diagnostic_code' => $event['reason'] ?? '',
			);

			switch ( $event_type ) {
				case 'bounce':
					$metadata['bounce_type'] = 'hard';
					$this->mark_contact_bounced( $email, $metadata );
					$processed = true;
					break;

				case 'dropped':
					$metadata['bounce_type'] = 'hard';
					$metadata['reason']      = 'Dropped by SendGrid: ' . $metadata['reason'];
					$this->mark_contact_bounced( $email, $metadata );
					$processed = true;
					break;

				case 'blocked':
					// Blocked can be treated as soft bounce
					$metadata['bounce_type'] = 'soft';
					$metadata['reason']      = 'Blocked by SendGrid: ' . $metadata['reason'];
					$this->mark_contact_bounced( $email, $metadata );
					$processed = true;
					break;
			}
		}

		return $processed;
	}
}

// Initialize handler
new Sendgrid_Bounce_Handler();
