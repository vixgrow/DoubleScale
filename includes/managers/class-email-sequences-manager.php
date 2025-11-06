<?php

/**
 * Class Email Sequences Manager
 * This class is responsible for handling email sequence processing
 * including delay, time range, and specific days scheduling with rate limiting
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
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Campaign\Email_Processing;
use QuillCRM\Services\Campaign_Rate_Limiter;
use QuillCRM\Settings;
use QuillCRM\Managers\Campaign_Status_Manager;

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
	 * Rate limiter service
	 *
	 * @var Campaign_Rate_Limiter
	 */
	private $rate_limiter;

	/**
	 * Settings
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Start time
	 *
	 * @var float
	 */
	private $start_time;

	/**
	 * Max execution time
	 *
	 * @var int
	 */
	private $max_execution_time;

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
		$this->email_processor    = Email_Processing::instance();
		$this->rate_limiter       = Campaign_Rate_Limiter::instance();
		$this->settings           = Settings::get( 'email', array() );
		$this->max_execution_time = Utils::get_max_execution_time();
		$this->add_hooks();
	}

	/**
	 * Add hooks
	 */
	private function add_hooks() {
		add_action(
			'init',
			function () {
				QuillCRM::instance()->campaigns_tasks->register_callback( 'quillcrm_email_sequences', array( $this, 'process_pending_sequences' ) );
			}
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

			foreach ( $parent_sequence->sequences_mail as $sequence ) {
				$sequence->status = Campaign_Status_Manager::ACTIVE;
				$sequence->save();
			}

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

	/**
	 * Process pending email sequences with rate limiting
	 * Called by cron to check and send sequences that are ready
	 */
	public function process_pending_sequences() {
		// Check daily rate limit first (same as Abstract_Campaign_Processing)
		$max_per_day = $this->settings['max_in_day'] ?? $this->get_default_max_per_day();

		if ( $this->rate_limiter->is_daily_limit_reached( 'email', $max_per_day ) ) {
			$daily_count = $this->rate_limiter->get_daily_count( 'email' );
			$this->rate_limiter->log_daily_limit_reached( 'email', $daily_count, $max_per_day );
			return;
		}

		$this->start_time = microtime( true );

		// Check if memory limit is reached
		if ( Utils::is_memory_limit_reached() ) {
			return;
		}

		try {
			// Get all sequence mails that are ready to be sent
			$ready_sequences = $this->get_ready_sequences();

			foreach ( $ready_sequences as $sequence ) {
				// Check limits before processing each sequence
				if ( $this->should_stop_processing() ) {
					break;
				}

				$this->process_sequence_with_rate_limiting( $sequence );
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
	 * @return \Illuminate\Support\Collection
	 */
	private function get_ready_sequences() {
		// 1. Fetch sequences that are due to execute
		$sequences = Campaign_Model::query()
			->where( 'type', \QuillCRM\Constants\Campaign_Channel::CHANNEL_SEQUENCE_MAIL )
			->where( 'status', Campaign_Status_Manager::ACTIVE )
			->where( 'execute_at', '<=', current_time( 'mysql' ) )
			->get();

		if ( $sequences->isEmpty() ) {
			return collect();
		}

		$ready_sequences = $sequences
			->filter( fn( $sequence) => $this->is_sequence_ready_to_send( $sequence ) )
			->values();

		$ready_sequences = $ready_sequences->sortBy(
			function ( $item ) {
				return $this->get_delay_in_minutes( $item->settings );
			}
		);

		return $ready_sequences;
	}




	/**
	 * Process a single email sequence with rate limiting
	 * Enhanced version based on Abstract_Campaign_Processing patterns
	 *
	 * @param Campaign_Model $sequence
	 */
	private function process_sequence_with_rate_limiting( Campaign_Model $sequence ) {
		try {
			// Get contacts for this sequence
			$contacts = $this->get_sequence_contacts( $sequence );

			if ( $contacts->isEmpty() ) {
				$sequence->status = Campaign_Status_Manager::COMPLETED;
				$sequence->save();
				return;
			}

			// Process contacts in batches with rate limiting
			$this->process_sequence_contacts_in_batches( $sequence, $contacts );
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
	 * Get delay in minutes for sorting purposes
	 *
	 * @param array|string $settings The settings array or JSON string containing delay information
	 * @return int Delay in minutes
	 */
	public function get_delay_in_minutes( $settings ) {
		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true );
		}

		$delay = $settings['delay'] ?? array(
			'value' => 0,
			'unit'  => 'minutes',
		);
		$value = intval( $delay['value'] ?? 0 );
		$unit  = strtolower( $delay['unit'] ?? 'minutes' );

		switch ( $unit ) {
			case 'minutes':
				return $value;
			case 'hours':
				return $value * 60;
			case 'days':
				return $value * 60 * 24;
			default:
				return $value;
		}
	}


	/**
	 * Process sequence contacts in batches with rate limiting
	 *
	 * @param Campaign_Model                 $sequence
	 * @param \Illuminate\Support\Collection $contacts
	 */
	private function process_sequence_contacts_in_batches( Campaign_Model $sequence, $contacts ) {

		$max_per_second   = $this->settings['max_in_second'] ?? $this->get_default_max_per_second();
		$processed_count  = 0;
		$batch_start_time = microtime( true );

		foreach ( $contacts as $contact ) {

			// Check if we should stop processing
			if ( $this->should_stop_processing() ) {
				break;
			}

			// Check daily limit before each send
			$max_per_day = $this->settings['max_in_day'] ?? $this->get_default_max_per_day();
			if ( $this->rate_limiter->is_daily_limit_reached( 'email', $max_per_day ) ) {
				quillcrm_get_logger()->info(
					'Daily email limit reached during sequence processing',
					array(
						'sequence_id' => $sequence->id,
						'processed'   => $processed_count,
						'daily_count' => $this->rate_limiter->get_daily_count( 'email' ),
						'max_per_day' => $max_per_day,
					)
				);
				break;
			}

			// Send the email
			$this->send_sequence_email( $sequence, $contact );
			$processed_count++;

			// Rate limiting: Check if we've reached per-second limit
			if ( $processed_count >= $max_per_second ) {
				$batch_elapsed = microtime( true ) - $batch_start_time;

				// If we processed max_per_second emails in less than 1 second, wait
				if ( $batch_elapsed < 1.0 ) {
					$sleep_time = (int) ( ( 1.0 - $batch_elapsed ) * 1000000 ); // Convert to microseconds
					usleep( $sleep_time );
				}

				// Reset batch counters
				$processed_count  = 0;
				$batch_start_time = microtime( true );
			} else {
				// Small delay between emails to prevent server overload (same as Abstract_Campaign_Processing)
				usleep( 100000 ); // 0.1 second
			}
		}

		quillcrm_get_logger()->info(
			'Email sequence batch processing completed',
			array(
				'sequence_id'     => $sequence->id,
				'contacts_total'  => $contacts->count(),
				'processed_count' => $processed_count,
				'execution_time'  => $this->get_current_execution_time(),
			)
		);
	}


	/**
	 * Get contacts for a sequence efficiently
	 *
	 * @param Campaign_Model $sequence
	 * @return \Illuminate\Support\Collection
	 */
	private function get_sequence_contacts( Campaign_Model $sequence ) {
		// Get parent sequence to find contacts
		$parent_sequence = Campaign_Model::find( $sequence->parent_id );
		if ( ! $parent_sequence ) {
			return collect(); // empty collection
		}

		$settings    = $parent_sequence->settings;
		$contact_ids = $settings['contact_ids'] ?? array();

		// If no contacts defined, return empty collection
		if ( empty( $contact_ids ) ) {
			return collect();
		}

		// Build main contact query excluding already sent contacts
		$contacts = Contact_Model::whereIn( 'id', $contact_ids )
			->whereNotIn(
				'id',
				function ( $sub ) use ( $sequence ) {
					$sub->select( 'contact_id' )
						->from( ( new Tracking_Model )->getTable() )
						->where( 'source_id', $sequence->id )
						->where( 'source_type', Message_Source_Types::CAMPAIGN )
						->where( 'mode', Tracking_Model::MODE_EMAIL );
				}
			)
			->get();

		return $contacts->filter(
			function ( $contact ) use ( $sequence ) {
				return $this->is_contact_ready_for_sequence( $sequence, $contact );
			}
		);
	}


	/**
	 * Send sequence email to a contact with rate limiting integration
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 */
	private function send_sequence_email( Campaign_Model $sequence, Contact_Model $contact ) {
		try {
			// Get template for sequence
			$template_id = $this->email_processor->get_template_for_contact( $sequence, $contact ) ?? null;
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
				'status'      => Tracking_Status::PENDING,
				'hash_key'    => Utils::generate_hash_key(),
			);

			$campaign_message = Tracking_Model::create( $campaign_message_data );

			// Process and send the email
			$this->email_processor->process_campaign_message( $sequence, $contact, $campaign_message );

			// Increment daily count after successful send (same as Abstract_Campaign_Processing)
			$this->rate_limiter->increment_daily_count( 'email' );

			quillcrm_get_logger()->info(
				'Email sequence sent successfully',
				array(
					'sequence_id' => $sequence->id,
					'contact_id'  => $contact->id,
					'message_id'  => $campaign_message->id,
					'daily_count' => $this->rate_limiter->get_daily_count( 'email' ),
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
	 * Check if a specific contact is ready to receive a sequence email
	 *
	 * @param Campaign_Model $sequence
	 * @param Contact_Model  $contact
	 * @return bool
	 */
	private function is_contact_ready_for_sequence( Campaign_Model $sequence, Contact_Model $contact ) {

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

		return true;
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
	 * Check if processing should stop based on limits
	 *
	 * @return bool True if processing should stop
	 */
	private function should_stop_processing() {
		 // Check execution time limit
		if ( $this->get_current_execution_time() >= $this->max_execution_time ) {
			quillcrm_get_logger()->info(
				'Email sequence processing stopped - execution time limit reached',
				array(
					'execution_time' => $this->get_current_execution_time(),
					'max_time'       => $this->max_execution_time,
				)
			);
			return true;
		}

		// Check memory limit
		if ( Utils::is_memory_limit_reached() ) {
			quillcrm_get_logger()->info(
				'Email sequence processing stopped - memory limit reached'
			);
			return true;
		}

		return false;
	}

	/**
	 * Get current execution time
	 *
	 * @return float Execution time in seconds
	 */
	private function get_current_execution_time() {
		 return microtime( true ) - $this->start_time;
	}

	/**
	 * Get default max emails per day
	 *
	 * @return int
	 */
	private function get_default_max_per_day() {
		return 10000; // Same as email campaigns
	}

	/**
	 * Get default max emails per second
	 *
	 * @return int
	 */
	private function get_default_max_per_second() {
		 return 15; // Same as email campaigns
	}
}

// Initialize the manager
Email_Sequences_Manager::instance();
