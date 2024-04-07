<?php
/**
 * Campaign class processing
 * This class is responsible for handling the Campaign class processing
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;

/**
 * Campaign class processing
 */
class Processing {

	/**
	 * Start time
	 *
	 * @var int
	 */
	protected $start_time;

	/**
	 * Max execution time
	 *
	 * @var int
	 */
	protected $max_execution_time;

	/**
	 * Current execution time
	 *
	 * @var int
	 */
	protected $current_execution_time;

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Processing
	 */
	private static $instance;

	/**
	 * Processing Instance.
	 *
	 * Instantiates or reuses an instance of Processing.
	 *
	 * @since  1.0.0
	 * @static
	 *
	 * @return self - Single instance
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		// Get the max execution time
		$this->max_execution_time = Utils::get_max_execution_time();

		add_action( 'quillcrm_loaded', array( $this, 'add_hooks' ) );
	}

	/**
	 * Add hooks
	 *
	 * @return void
	 */
	public function add_hooks() {
		add_action(
			'init',
			function() {
				QuillCRM::instance()->campaigns_tasks->register_callback( 'quillcrm_campaigns', array( $this, 'process' ) );
			}
		);
	}


	/**
	 * Get current execution time
	 *
	 * @return int
	 */
	public function get_current_execution_time() {
		return microtime( true ) - $this->start_time;
	}

	/**
	 * Process
	 *
	 * @return void
	 */
	public function process() {
		$this->start_time = microtime( true );

		// Check if memory limit is reached
		if ( Utils::is_memory_limit_reached() ) {
			return;
		}

		// Get first campaign with status 'processing'
		$campaign = Campaign_Model::where( 'status', 'processing' )->firstOrFail();

		if ( ! $campaign ) {
			return;
		}

		error_log( 'Processing::campaign() ' . $campaign->id );
		error_log( 'Max Execution Time: ' . $this->max_execution_time );
		error_log( 'Current Execution Time: ' . $this->get_current_execution_time() );

		$last_contact_offset = get_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", 0 );
		$campaign_recipients = $campaign->count;

		if ( $last_contact_offset >= $campaign_recipients ) {
			$campaign->status = 'completed';
			$campaign->save();
			return;
		}

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );
			error_log( 'Processing::campaign(222) ' . $campaign->id );
			if ( $last_contact_offset >= $campaign_recipients ) {
				break;
			}

			$contacts = Contact_Model::where( 'status', 'subscribed' )->skip( $last_contact_offset )->take( 10 )->get();

			if ( ! $contacts ) {
				break;
			}

			foreach ( $contacts as $contact ) {
				$result = $this->add_campaign_email( $campaign, $contact, $last_contact_offset );
				if ( $result ) {
					$last_contact_offset++;
				}
			}
		}
	}

	/**
	 * Add campaign email
	 *
	 * @param Campaign_Model $campaign
	 * @param Contact_Model  $contact
	 * @param int            $last_contact_offset
	 *
	 * @return void
	 */
	protected function add_campaign_email( Campaign_Model $campaign, Contact_Model $contact, $last_contact_offset ) {
		try {
			$campaign_email_data = array(
				'campaign_id' => $campaign->id,
				'contact_id'  => $contact->id,
				'status'      => 'pending',
				'hash_key'    => Utils::generate_hash_key(),
				'email'       => $contact->email,
				'template_id' => 1,
			);
			error_log( 'Campaign_Email_Model::create( $campaign_email_data )' );
			Campaign_Email_Model::create( $campaign_email_data );

			update_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", $last_contact_offset );

			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}

}

