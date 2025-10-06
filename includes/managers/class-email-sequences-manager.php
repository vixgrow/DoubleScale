<?php

/**
 * Class Email Sequences Manager
 * This class is responsible for handling email sequence processing
 * including delay, time range, and specific days scheduling
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Campaign\Email_Processing;

/**
 * Email Sequences Manager class
 */
final class Email_Sequences_Manager {







	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Email_Sequences_Manager
	 */
	private static $instance;

	/**
	 * Email processor instance
	 *
	 * @var Email_Processing
	 */
	private $email_processor;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Email_Sequences_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->email_processor = Email_Processing::instance();
		$this->add_hooks();
	}

	/**
	 * Add hooks
	 */
	private function add_hooks() {
		add_action( 'quillcrm_process_email_sequence', array( $this, 'process_sequence_email' ), 10, 3 );
		add_action(
			'init',
			function () {
				QuillCRM::instance()->campaigns_tasks->register_callback( 'quillcrm_email_sequences', array( $this, 'process_pending_sequences' ) );
			}
		);
	}

	/**
	 * Process pending email sequences
	 * Called by cron to check and send sequences that are ready
	 */
	public function process_pending_sequences() {
		try {
			// Get all sequence mails that are ready to be sent
			$ready_sequences = $this->get_ready_sequences();

			foreach ( $ready_sequences as $sequence ) {
				$this->process_sequence( $sequence );
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				'Email sequence processing error',
				array(
					'code'  => 'email_sequence_processing_error',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'trace'   => $e->getTraceAsString(),
					),
				)
			);
		}
	}

	/**
	 * Get sequences that are ready to be sent
	 *
	 * @return array
	 */
	private function get_ready_sequences() {
		$sequences = Campaign_Model::where( 'type', 'sequence_mail' )
			->get();

		$ready_sequences = array();

		foreach ( $sequences as $sequence ) {
			if ( $this->has_ready_contacts( $sequence ) ) {
				$ready_sequences[] = $sequence;
			}
		}

		return $ready_sequences;
	}

	/**
	 * Check if a sequence has contacts ready to receive emails
	 *
	 * @param Campaign_Model $sequence
	 * @return bool
	 */
	private function has_ready_contacts( Campaign_Model $sequence ) {
		// Get contacts for this sequence
		$contacts = $this->get_sequence_contacts( $sequence );

		foreach ( $contacts as $contact ) {
			if ( $this->is_contact_ready_for_sequence( $sequence, $contact ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a specific contact is ready to receive a sequence email
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 * @return bool
	 */
	private function is_contact_ready_for_sequence( Campaign_Model $sequence, Contact_Model $contact ) {
		// Check if email already sent to this contact for this sequence
		$existing_message = Tracking_Model::where( 'contact_id', $contact->id )
			->where( 'source_id', $sequence->id )
			->where( 'source_type', Message_Source_Types::CAMPAIGN )
			->where( 'mode', Tracking_Model::MODE_EMAIL )
			->first();

		if ( $existing_message ) {
			return false; // Already sent
		}

		// Get contact's enrollment time for this sequence
		$enrollment_time = $this->get_contact_enrollment_time( $sequence, $contact );
		if ( ! $enrollment_time ) {
			return false; // Contact not enrolled
		}

		// Calculate when this contact should receive this sequence email
		$settings       = $sequence->settings;
		$delay          = $settings['delay'] ?? array(
			'value' => 0,
			'unit'  => 'Minutes',
		);
		$execution_time = $this->calculate_execution_time_from_base( $delay, $enrollment_time );

		// Check if it's time to send
		if ( strtotime( $execution_time ) > time() ) {
			return false; // Not time yet
		}

		// Check time range and specific days
		return $this->is_sequence_ready_to_send( $sequence );
	}

	/**
	 * Check if a sequence is ready to send based on time range and specific days
	 *
	 * @param Campaign_Model $sequence
	 * @return bool
	 */
	private function is_sequence_ready_to_send( Campaign_Model $sequence ) {
		$settings = $sequence->settings;

		// Check if specific days are enabled
		if ( ! empty( $settings['enable_specific_days'] ) && $settings['enable_specific_days'] ) {
			if ( ! $this->is_allowed_day( $settings ) ) {
				return false;
			}
		}

		// Check time range
		if ( ! empty( $settings['sending_time_range'] ) ) {
			if ( ! $this->is_within_time_range( $settings['sending_time_range'] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Check if current day is allowed for sending
	 *
	 * @param array $settings
	 * @return bool
	 */
	private function is_allowed_day( $settings ) {
		if ( empty( $settings['days'] ) ) {
			return true;
		}

		$current_day = strtolower( current_time( 'l' ) ); // monday, tuesday, etc.
		$days        = $settings['days'];

		return ! empty( $days[ $current_day ] );
	}

	/**
	 * Check if current time is within allowed sending time range
	 *
	 * @param array $time_range
	 * @return bool
	 */
	private function is_within_time_range( $time_range ) {
		if ( empty( $time_range['from'] ) || empty( $time_range['to'] ) ) {
			return true;
		}

		$current_time = current_time( 'H:i' );
		$from_time    = $time_range['from'];
		$to_time      = $time_range['to'];

		// Handle cases where time range spans midnight
		if ( $from_time <= $to_time ) {
			// Same day range (e.g., 09:00 to 17:00)
			return $current_time >= $from_time && $current_time <= $to_time;
		} else {
			// Overnight range (e.g., 22:00 to 06:00)
			return $current_time >= $from_time || $current_time <= $to_time;
		}
	}

	/**
	 * Get contact's enrollment time for a sequence
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 * @return string|null
	 */
	private function get_contact_enrollment_time( Campaign_Model $sequence, Contact_Model $contact ) {
		// Get parent sequence
		$parent_sequence = Campaign_Model::find( $sequence->parent_id );
		if ( ! $parent_sequence ) {
			return null;
		}

		// Check if contact is enrolled and get enrollment time
		$settings            = $parent_sequence->settings;
		$contact_enrollments = $settings['contact_enrollments'] ?? array();

		return $contact_enrollments[ $contact->id ] ?? null;
	}

	/**
	 * Process a single email sequence
	 *
	 * @param Campaign_Model $sequence
	 */
	private function process_sequence( Campaign_Model $sequence ) {
		try {
			// Get contacts for this sequence
			$contacts = $this->get_sequence_contacts( $sequence );

			foreach ( $contacts as $contact ) {
				if ( $this->is_contact_ready_for_sequence( $sequence, $contact ) ) {
					$this->send_sequence_email( $sequence, $contact );
				}
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				'Single email sequence processing error',
				array(
					'sequence_id' => $sequence->id,
					'error'       => $e->getMessage(),
					'trace'       => $e->getTraceAsString(),
				)
			);
		}
	}


	/**
	 * Get contacts for a sequence
	 *
	 * @param Campaign_Model $sequence
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	private function get_sequence_contacts( Campaign_Model $sequence ) {
		// Get parent sequence to find contacts
		$parent_sequence = Campaign_Model::find( $sequence->parent_id );
		if ( ! $parent_sequence ) {
			return collect( array() );
		}

		$settings    = $parent_sequence->settings;
		$contact_ids = $settings['contact_ids'] ?? array();
		return Contact_Model::whereIn( 'id', $contact_ids )->get();
	}

	/**
	 * Send sequence email to a contact
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 */
	private function send_sequence_email( Campaign_Model $sequence, Contact_Model $contact ) {
		try {
			// Check if email already sent to this contact for this sequence
			$existing_message = Tracking_Model::where( 'contact_id', $contact->id )
				->where( 'source_id', $sequence->id )
				->where( 'source_type', Message_Source_Types::CAMPAIGN )
				->where( 'mode', Tracking_Model::MODE_EMAIL )
				->first();

			if ( $existing_message ) {
				return; // Already sent
			}

			// Get template for sequence
			$template_id = $this->email_processor->get_template_for_contact( $sequence, $contact ) ?? 0;
			if ( ! $template_id ) {
				return;
			}

			// Create campaign message tracking record
			$campaign_message_data = array(
				'contact_id'  => $contact->id,
				'template_id' => $template_id,
				'mode'        => Tracking_Model::MODE_EMAIL,
				'source_type' => Message_Source_Types::CAMPAIGN,
				'source_id'   => $sequence->id,
				'recipient'   => $contact->email,
				'status'      => 'pending',
				'hash_key'    => Utils::generate_hash_key(),
			);

			$campaign_message = Tracking_Model::create( $campaign_message_data );

			// Process and send the email
			$this->email_processor->process_campaign_message( $sequence, $contact, $campaign_message );

			quillcrm_get_logger()->info(
				'Email sequence sent successfully',
				array(
					'sequence_id' => $sequence->id,
					'contact_id'  => $contact->id,
					'message_id'  => $campaign_message->id,
				)
			);
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				'Email sequence send error',
				array(
					'sequence_id' => $sequence->id,
					'contact_id'  => $contact->id,
					'error'       => $e->getMessage(),
				)
			);
		}
	}


	/**
	 * Calculate execution time based on delay settings
	 *
	 * @param array $delay
	 * @return string
	 */
	public function calculate_execution_time( $delay, $base_time = null ) {
		$value = intval( $delay['value'] ?? 0 );
		$unit  = strtolower( $delay['unit'] ?? 'minutes' );

		$time = $base_time ?? time();

		switch ( $unit ) {
			case 'minutes':
				$time = strtotime( "+{$value} minutes", $time );
				break;
			case 'hours':
				$time = strtotime( "+{$value} hours", $time );
				break;
			case 'days':
				$time = strtotime( "+{$value} days", $time );
				break;
			default:
				$time = strtotime( "+{$value} minutes", $time );
				break;
		}

		return date( 'Y-m-d H:i:s', $time );
	}

	/**
	 * Calculate execution time based on delay settings from a base time
	 *
	 * @param array  $delay
	 * @param string $base_time
	 * @return string
	 */
	public function calculate_execution_time_from_base( $delay, $base_time ) {
		$time = strtotime( $base_time );
		return $this->calculate_execution_time( $delay, $time );
	}

	/**
	 * Process a specific sequence email (called by action hook)
	 *
	 * @param int $sequence_id
	 * @param int $contact_id
	 * @param int $message_id
	 */
	public function process_sequence_email( $sequence_id, $contact_id, $message_id ) {
		try {
			$sequence = Campaign_Model::find( $sequence_id );
			$contact  = Contact_Model::find( $contact_id );
			$message  = Tracking_Model::find( $message_id );

			if ( ! $sequence || ! $contact || ! $message ) {
				return;
			}

			// Check if sequence is ready to send
			if ( ! $this->is_sequence_ready_to_send( $sequence ) ) {
				// Reschedule for later
				$this->reschedule_sequence_email( $sequence, $contact, $message );
				return;
			}

			// Process the email
			$this->email_processor->process_campaign_message( $sequence, $contact, $message );
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				'Process sequence email error',
				array(
					'sequence_id' => $sequence_id,
					'contact_id'  => $contact_id,
					'message_id'  => $message_id,
					'error'       => $e->getMessage(),
				)
			);
		}
	}

	/**
	 * Reschedule a sequence email for later
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 * @param Tracking_Model $message
	 */
	private function reschedule_sequence_email( Campaign_Model $sequence, Contact_Model $contact, Tracking_Model $message ) {
		// Schedule to check again in 15 minutes using Action Scheduler
		$reschedule_time = time() + ( 15 * 60 );

		QuillCRM::instance()->campaigns_tasks->schedule_single(
			$reschedule_time,
			'process_email_sequence',
			$sequence->id,
			$contact->id,
			$message->id
		);
	}

	/**
	 * Start an email sequence for a contact
	 *
	 * @param int $sequence_id Parent sequence ID
	 * @param int $contact_id Contact ID
	 */
	public function start_sequence_for_contact( $sequence_id, $contact_id ) {
		try {
			$parent_sequence = Campaign_Model::find( $sequence_id );
			$contact         = Contact_Model::find( $contact_id );

			if ( ! $parent_sequence || ! $contact ) {
				return false;
			}

			$settings = $parent_sequence->settings;

			// Add contact to contact_ids if not already there
			if ( ! in_array( $contact_id, $settings['contact_ids'] ?? array() ) ) {
				$settings['contact_ids'][] = $contact_id;
			}

			// Track enrollment time for this contact
			$settings['contact_enrollments'][ $contact_id ] = current_time( 'mysql' );

			$parent_sequence->settings = $settings;
			$parent_sequence->save();

			return true;
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				'Start sequence for contact error',
				array(
					'sequence_id' => $sequence_id,
					'contact_id'  => $contact_id,
					'error'       => $e->getMessage(),
				)
			);
			return false;
		}
	}
}

// Initialize the manager
Email_Sequences_Manager::instance();
