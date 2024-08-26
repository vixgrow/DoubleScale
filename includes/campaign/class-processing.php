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
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Link_Trigger_Model;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;

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
			$campaign = Campaign_Model::where( 'status', 'processing' )->orWhere( 'status', 'scheduled' )->where( 'execute_at', '<=', current_time( 'mysql' ) )
			->firstOrFail();

			// $last_contact_offset = get_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", 0 );
			$filters             = $campaign->get_setting( 'filters', array() );
			$last_contact_offset = 0;
			$campaign_recipients = Contact_Model::where( 'status', 'subscribed' );

			if ( ! empty( $filters ) ) {
				$contact_filters     = new Contact_Filters_Process( $campaign_recipients, $filters );
				$campaign_recipients = $contact_filters->filter();
			}

			$campaign_recipients = $campaign_recipients->count();

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

				$contacts = Contact_Model::where( 'status', 'subscribed' );
				if ( ! empty( $filters ) ) {
					$contact_filters = new Contact_Filters_Process( $contacts, $filters );
					$contacts        = $contact_filters->filter();
				}

				$contacts = $contacts->offset( $last_contact_offset )
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
			$template_id         = $this->get_template_id( $campaign );
			$campaign_email_data = array(
				'campaign_id' => $campaign->id,
				'contact_id'  => $contact->id,
				'status'      => 'pending',
				'hash_key'    => Utils::generate_hash_key(),
				'email'       => $contact->email,
				'template_id' => $template_id,
			);
			$campaign_email      = Campaign_Email_Model::create( $campaign_email_data );

			// Update last contact offset
			update_option( "quillcrm_campaigns_last_contact_offset_{$campaign->id}", intval( $last_contact_offset ) + 1 );
			QuillCRM::instance()->campaigns_tasks->enqueue_sync( 'process_campaign_email', $campaign, $contact, $campaign_email );

			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Get template id
	 *
	 * @param Campaign_Model $campaign
	 *
	 * @return int
	 */
	protected function get_template_id( $campaign ) {
		$templates = $campaign->get_setting( 'templates', array() );
		$ab_test   = $campaign->get_setting( 'ab_test', false );

		if ( ! $ab_test ) {
			return $templates[0]['template_id'];
		}

		$last_template          = get_option( "quillcrm_campaigns_last_template_{$campaign->id}", 0 );
		$max_expected_templates = count( $templates );
		$next_template_id       = $last_template + 1;

		if ( $next_template_id >= $max_expected_templates ) {
			$next_template_id = 0;
		}

		update_option( "quillcrm_campaigns_last_template_{$campaign->id}", $next_template_id );

		return $templates[ $next_template_id ]['template_id'];
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

		$template = Template_Model::find( $campaign_email->template_id );
		$subject  = $template->subject;
		$body     = $template->body;

		// Build email message with footer
		$message = sprintf(
			'%s%s',
			$this->build_email_message( $campaign_email, $contact, $body ),
			$this->build_email_footer( $campaign_email, $contact )
		);

		// Add click tracking to all links
		$message = $this->add_click_tracking( $message, $campaign_email->hash_key, $contact );

		$emails = new Emails();
		$result = $emails->send(
			$contact->email,
			$subject,
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
	protected function build_email_message( Campaign_Email_Model $campaign_email, Contact_Model $contact, $message = '' ) {
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
	 * @param string        $message - Email message
	 * @param string        $hash_key - Campaign email hash key\
	 * @param Contact_Model $contact - Contact model
	 *
	 * @return string
	 */
	protected function add_click_tracking( $message, $hash_key, $contact ) {
		// Match all links
		preg_match_all( '/<a[^>]+href=([\'"])(?<href>.+?)\1[^>]*>/i', $message, $matches );

		if ( ! isset( $matches['href'] ) ) {
			return $message;
		}

		foreach ( $matches['href'] as $key => $href ) {

			// Check if link trigger quillcrm-link-trigger.
			if ( false !== strpos( $href, 'quillcrm-link-trigger' ) ) {
				// Get query string
				$query_string = parse_url( $href, PHP_URL_QUERY );
				parse_str( $query_string, $query_args );

				// Get link trigger hash
				$hash         = $query_args['quillcrm-link-trigger'] ?? '';
				$link_trigger = Link_Trigger_Model::where( 'hash', $hash )->first();
				if ( ! $link_trigger ) {
					continue;
				}

				$link_trigger_url = $this->configure_link_trigger_url( $link_trigger, $contact, $hash_key );

				// Replace orginal link with click tracking link
				$to_replace = $matches[0][ $key ];
				$message    = str_replace( $to_replace, str_replace( $href, $link_trigger_url, $to_replace ), $message );
				continue;
			}

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
			$to_replace = $matches[0][ $key ];
			$message    = str_replace( $to_replace, str_replace( $href, $click_url, $to_replace ), $message );
		}

		return $message;
	}

	/**
	 * Configure link trigger url
	 *
	 * @param Link_Trigger_Model $link_trigger
	 * @param Contact_Model      $contact
	 * @param string             $hash_key
	 *
	 * @return string
	 */
	protected function configure_link_trigger_url( Link_Trigger_Model $link_trigger, Contact_Model $contact, $hash_key ) {
		$auto_login    = $link_trigger->get_setting( 'auto_login', true );
		$contact_email = $contact->email;
		$user          = get_user_by( 'email', $contact_email );
		$args          = array(
			'quillcrm-link-trigger' => $link_trigger->hash,
			'track-id'              => $hash_key,
		);

		if ( $auto_login && $user ) {
			$args['auth-id'] = wp_hash_password( $contact_email );
		}

		$link_trigger_url = add_query_arg( $args, home_url() );

		return $link_trigger_url;
	}
}

