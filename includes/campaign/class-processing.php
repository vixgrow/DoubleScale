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
use QuillCRM\Emails\Emails;

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
				QuillCRM::instance()->campaigns_tasks->register_callback( 'process_campaign_email', array( $this, 'process_campaign_email' ) );
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

		try {
			// Get first campaign with status 'processing'
			$campaign = Campaign_Model::where( 'status', 'processing' )->firstOrFail();

			$last_contact_offset = get_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", 0 );
			$campaign_recipients = Contact_Model::where( 'status', 'subscribed' )->count();

			if ( $campaign->count != $campaign_recipients ) {
				$campaign->count = $campaign_recipients;
				$campaign->save();
			}

			if ( $last_contact_offset >= $campaign_recipients ) {
				$campaign->status = 'completed';
				$campaign->save();
				return;
			}

			while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
				// Usleep is used to prevent the server from crashing
				usleep( 1000000 );
				if ( $last_contact_offset >= $campaign_recipients ) {
					$campaign->status = 'completed';
					$campaign->save();
					update_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", 0 );
					break;
				}

				$contacts = Contact_Model::where( 'status', 'subscribed' )
				->offset( $last_contact_offset )
				->limit( 10 )
				->get();

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
		} catch ( \Exception $e ) {
			// error_log( 'Processing::process() ' . $e->getMessage() );
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
			$campaign_email      = Campaign_Email_Model::create( $campaign_email_data );

			// Update last contact offset
			update_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", intval( $last_contact_offset ) + 1 );
			QuillCRM::instance()->campaigns_tasks->enqueue_async( 'process_campaign_email', $campaign, $contact, $campaign_email );

			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Process campaign email
	 *
	 * @param Campaign_Model       $campaign
	 * @param Contact_Model        $contact
	 * @param Campaign_Email_Model $campaign_email
	 *
	 * @return void
	 */
	public function process_campaign_email( Campaign_Model $campaign, Contact_Model $contact, Campaign_Email_Model $campaign_email ) {
		// Check if memory limit is reached
		if ( Utils::is_memory_limit_reached() ) {
			// If memory limit is reached, we will requeue the task
			QuillCRM::instance()->campaigns_tasks->enqueue_async( 'process_campaign_email', $campaign, $contact, $campaign_email );
			return;
		}

		// Build email message with footer
		$message = sprintf(
			'%s%s',
			$this->build_email_message( $campaign_email, $contact ),
			$this->build_email_footer( $campaign_email, $contact )
		);

		// Add click tracking to all links
		$message = $this->add_click_tracking( $message, $campaign_email->hash_key );

		$emails = new Emails();
		$result = $emails->send(
			$contact->email,
			'Welcome to QuillCRM',
			$message,
		);

		error_log( 'Processing::process_campaign_email() ' . $campaign_email->id . ' result: ' . $result );

		$campaign_email->status = 'sent';
		$campaign_email->save();
	}

	/**
	 * Build email message
	 *
	 * @param Campaign_Email_Model $campaign_email
	 * @param Contact_Model        $contact
	 *
	 * @return string
	 */
	protected function build_email_message( Campaign_Email_Model $campaign_email, Contact_Model $contact ) {
		$message = '';

		// Add test message
		$message .= sprintf(
			'<p>%s</p>',
			__( 'Welcome to QuillCRM', 'quillcrm' )
		);

		// Add open email image 1x1
		$message .= sprintf(
			'<img src="%s" width="1" height="1" style="width:1px;height:1px;" />',
			home_url( '?quillcrm=email_open&hash_key=' . $campaign_email->hash_key ),
		);

		return $message;
	}

	/**
	 * Build email footer
	 *
	 * @param Campaign_Email_Model $campaign_email
	 * @param Contact_Model        $contact
	 *
	 * @return string
	 */
	protected function build_email_footer( Campaign_Email_Model $campaign_email, Contact_Model $contact ) {
		$footer = '';

		// Add preview image 1x1
		$footer .= sprintf(
			'<img src="%s" width="1" height="1" style="width:1px;height:1px;" />',
			home_url( '?quillcrm=email_preview&hash_key=' . $campaign_email->hash_key ),
		);

		// Add unsubscribe link
		$footer .= sprintf(
			'<p>%s</p>',
			sprintf(
				'<a href="%s">%s</a>',
				home_url(),
				__( 'Unsubscribe', 'quillcrm' )
			)
		);

		return $footer;
	}

	/**
	 * Add click tracking to all links
	 *
	 * @param string $message
	 * @param string $hash_key
	 *
	 * @return string
	 */
	protected function add_click_tracking( $message, $hash_key ) {
		// Match all links
		preg_match_all( '/<a[^>]+href=([\'"])(?<href>.+?)\1[^>]*>/i', $message, $matches );

		if ( ! isset( $matches['href'] ) ) {
			return $message;
		}

		foreach ( $matches['href'] as $key => $href ) {
			// Add click orginal link to click tracking
			$click_url = add_query_arg(
				array(
					'quillcrm' => 'email_click',
					'hash_key' => $hash_key,
					'orginal'  => urlencode( $href ),
				),
				home_url()
			);

			// Replace orginal link with click tracking link
			$message = str_replace( $href, $click_url, $message );
		}

		return $message;
	}
}

