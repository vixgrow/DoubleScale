<?php

/**
 * Email Campaign Processing
 * This class is responsible for handling Email campaign processing
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Campaign_Processing;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Models\Template_Model;
use QuillCRM\Tracking\Email;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Message_Direction;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Models\Communication_Tracking_Meta_Model;
use QuillCRM\Contact_Filters\Condition_Evaluator;

/**
 * Email Campaign Processing class
 */
class Email_Processing extends Abstract_Campaign_Processing {
	/**
	 * Communication channel
	 *
	 * @var string
	 */
	protected $channel = Campaign_Channel::STR_EMAIL;

	/**
	 * Cached merge tag keys for current template
	 *
	 * @var array|null
	 */
	private $template_merge_tag_keys = null;

	/**
	 * Whether to use bulk sending for this campaign
	 *
	 * @var bool|null
	 */
	private $use_bulk_sending = null;

	/**
	 * Whether to use curl multi sending for this campaign
	 *
	 * @var bool|null
	 */
	private $use_curl_multi_sending = null;

	/**
	 * Add hooks
	 *
	 * @return void
	 */
	public function add_hooks() {
		$this->register_campaign_processing_hooks();
	}

	/**
	 * Check if bulk sending should be used
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return bool True if bulk sending should be used
	 */
	protected function should_use_bulk_sending( Campaign_Model $campaign ) {
		if ( $this->use_bulk_sending !== null ) {
			return $this->use_bulk_sending;
		}

		// Bulk sending requires QuillCRM Pro
		if ( ! class_exists( '\QuillCRM_Pro\Emails\Bulk_Email_Sender' ) ) {
			$this->use_bulk_sending = false;
			return false;
		}

		// Get from_email from campaign template for smart routing
		$from_email = $this->get_campaign_from_email( $campaign );

		// Check if bulk sending is available (QuillSMTP with bulk-capable mailer)
		if ( ! \QuillCRM_Pro\Emails\Bulk_Email_Sender::is_available( $from_email ) ) {
			$this->use_bulk_sending = false;
			return false;
		}

		// Allow filtering whether to use bulk sending
		$this->use_bulk_sending = apply_filters(
			'quillcrm_use_bulk_email_sending',
			true,
			$campaign
		);

		if ( $this->use_bulk_sending ) {
			quillcrm_get_logger()->info(
				__( 'Bulk email sending enabled for campaign', 'quillcrm' ),
				array(
					'code'        => 'bulk_email_enabled',
					'campaign_id' => $campaign->id,
					'mailer'      => \QuillCRM_Pro\Emails\Bulk_Email_Sender::get_active_mailer_slug( $from_email ),
				)
			);
		}

		return $this->use_bulk_sending;
	}

	/**
	 * Check if curl multi sending should be used
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return bool True if curl multi sending should be used
	 */
	protected function should_use_curl_multi_sending( Campaign_Model $campaign ) {
		if ( $this->use_curl_multi_sending !== null ) {
			return $this->use_curl_multi_sending;
		}

		// Curl multi sending requires QuillCRM Pro
		if ( ! class_exists( '\QuillCRM_Pro\Emails\Curl_Multi_Email_Sender' ) ) {
			$this->use_curl_multi_sending = false;
			return false;
		}

		// Get from_email from campaign template for smart routing
		$from_email = $this->get_campaign_from_email( $campaign );

		// Check if curl multi sending is available (QuillSMTP with curl multi-capable mailer like SMTP2GO)
		if ( ! \QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::is_available( $from_email ) ) {
			$this->use_curl_multi_sending = false;
			return false;
		}

		// Allow filtering whether to use curl multi sending
		$this->use_curl_multi_sending = apply_filters(
			'quillcrm_use_curl_multi_email_sending',
			true,
			$campaign
		);

		if ( $this->use_curl_multi_sending ) {
			quillcrm_get_logger()->info(
				__( 'Curl Multi email sending enabled for campaign', 'quillcrm' ),
				array(
					'code'        => 'curl_multi_email_enabled',
					'campaign_id' => $campaign->id,
					'mailer'      => \QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::get_active_mailer_slug( $from_email ),
				)
			);
		}

		return $this->use_curl_multi_sending;
	}

	/**
	 * Get the from_email from campaign template for smart routing
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return string|null From email address or null if not set
	 */
	protected function get_campaign_from_email( Campaign_Model $campaign ) {
		$template_ids = $campaign->get_template_ids();

		if ( empty( $template_ids ) ) {
			return null;
		}

		$template_id = reset( $template_ids );
		$template    = Template_Model::find( $template_id );

		if ( ! $template ) {
			return null;
		}

		$from_email = $template->get_setting( 'from_email' );

		return $from_email ?: null;
	}

	/**
	 * Override do_process_campaign to support bulk sending
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return void
	 */
	protected function do_process_campaign( Campaign_Model $campaign ) {
		// Check if bulk sending should be used (Mailgun, SendGrid, etc.)
		if ( $this->should_use_bulk_sending( $campaign ) ) {
			$this->do_process_campaign_bulk( $campaign );
			return;
		}

		// Check if curl multi sending should be used (SMTP2GO, etc.)
		if ( $this->should_use_curl_multi_sending( $campaign ) ) {
			$this->do_process_campaign_curl_multi( $campaign );
			return;
		}

		// Fall back to parent individual sending (wp_mail)
		parent::do_process_campaign( $campaign );
	}

	/**
	 * Process campaign using bulk sending
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return void
	 */
	protected function do_process_campaign_bulk( Campaign_Model $campaign ) {
		wp_raise_memory_limit( 'admin' );

		// Lock key for refreshing during long operations
		$lock_key      = "quillcrm_{$this->channel}_campaign_lock_{$campaign->id}";
		$lock_duration = apply_filters(
			'quillcrm_campaign_lock_duration',
			300,
			$this->channel,
			$campaign->id
		);

		$offset_key = "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}";
		$filters    = $campaign->get_setting( 'filters', array() );

		// Track campaign start time (only set if not already set - first processing batch)
		$start_time_key      = "quillcrm_{$this->channel}_campaign_start_time_{$campaign->id}";
		$campaign_start_time = get_option( $start_time_key );
		if ( ! $campaign_start_time ) {
			$campaign_start_time = microtime( true );
			update_option( $start_time_key, $campaign_start_time );

			// Log to PHP error log for debugging
			error_log(
				sprintf(
					'[QuillCRM] Bulk %s Campaign started processing. Campaign ID: %d, Name: %s, Start Time: %s',
					ucfirst( $this->channel ),
					$campaign->id,
					$campaign->name,
					gmdate( 'Y-m-d H:i:s', (int) $campaign_start_time )
				)
			);
			quillcrm_get_logger()->info(
				__( 'Bulk email sending enabled for campaign', 'quillcrm' ),
				array(
					'code'        => 'bulk_email_enabled',
					'campaign_id' => $campaign->id,
					'mailer'      => \QuillCRM_Pro\Emails\Bulk_Email_Sender::get_active_mailer_slug(),
				)
			);
		}

		$campaign_recipients_count = $this->contact_filter->get_contact_count( $this->channel, $filters );

		if ( $campaign->count != $campaign_recipients_count ) {
			$campaign->count = $campaign_recipients_count;
			$campaign->save();
		}

		$offset = (int) get_option( $offset_key, 0 );

		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
			return;
		}

		// Get batch size - use bulk mailer's max batch size
		$batch_size = min(
			\QuillCRM_Pro\Emails\Bulk_Email_Sender::get_max_batch_size(),
			apply_filters( 'quillcrm_bulk_campaign_batch_size', 500, $this->channel )
		);

		// Get template for batch preparation
		$template_id = reset( $campaign->get_template_ids() );
		$template    = Template_Model::find( $template_id );

		if ( ! $template ) {
			quillcrm_get_logger()->error(
				__( 'Template not found for bulk email campaign', 'quillcrm' ),
				array(
					'code'        => 'bulk_email_no_template',
					'campaign_id' => $campaign->id,
				)
			);
			$campaign->status = 'failed';
			$campaign->save();
			return;
		}

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			usleep( 1000000 ); // 1 s

			// Refresh lock
			$this->refresh_campaign_lock( $lock_key, $lock_duration );

			// Check if campaign was paused/cancelled
			$fresh_campaign = Campaign_Model::find( $campaign->id );
			if ( ! $fresh_campaign || $fresh_campaign->status !== 'processing' ) {
				update_option( $offset_key, $offset );
				return;
			}

			// Check completion
			if ( $offset >= $campaign_recipients_count ) {
				$this->complete_campaign( $campaign, $campaign_recipients_count );
				return;
			}

			// Fetch batch of contacts
			$contacts = $this->contact_filter->get_contacts_for_processing(
				$this->channel,
				$filters,
				$offset,
				$batch_size
			);

			if ( $contacts->isEmpty() ) {
				break;
			}

			// Send batch
			$result = $this->send_email_batch( $campaign, $template, $contacts );

			// Update offset based on contacts processed
			$offset += $contacts->count();
			update_option( $offset_key, $offset );

			// If batch failed critically, stop processing
			if ( isset( $result['fatal'] ) && $result['fatal'] ) {
				return;
			}
		}

		// Check if more work remains
		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
		} else {
			$this->queue_continuation( $campaign->id );
		}
	}

	/**
	 * Process campaign using curl multi sending
	 *
	 * This method uses cURL Multi to send emails in parallel for mailers
	 * that don't support native bulk API (e.g., SMTP2GO).
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign Campaign model
	 *
	 * @return void
	 */
	protected function do_process_campaign_curl_multi( Campaign_Model $campaign ) {
		wp_raise_memory_limit( 'admin' );

		// Lock key for refreshing during long operations
		$lock_key      = "quillcrm_{$this->channel}_campaign_lock_{$campaign->id}";
		$lock_duration = apply_filters(
			'quillcrm_campaign_lock_duration',
			300,
			$this->channel,
			$campaign->id
		);

		$offset_key = "quillcrm_{$this->channel}_campaigns_last_contact_offset_{$campaign->id}";
		$filters    = $campaign->get_setting( 'filters', array() );

		// Track campaign start time (only set if not already set - first processing batch)
		$start_time_key      = "quillcrm_{$this->channel}_campaign_start_time_{$campaign->id}";
		$campaign_start_time = get_option( $start_time_key );
		if ( ! $campaign_start_time ) {
			$campaign_start_time = microtime( true );
			update_option( $start_time_key, $campaign_start_time );

			// Log to PHP error log for debugging
			error_log(
				sprintf(
					'[QuillCRM] Curl Multi %s Campaign started processing. Campaign ID: %d, Name: %s, Start Time: %s',
					ucfirst( $this->channel ),
					$campaign->id,
					$campaign->name,
					gmdate( 'Y-m-d H:i:s', (int) $campaign_start_time )
				)
			);
			quillcrm_get_logger()->info(
				__( 'Curl Multi email sending enabled for campaign', 'quillcrm' ),
				array(
					'code'        => 'curl_multi_email_enabled',
					'campaign_id' => $campaign->id,
					'mailer'      => \QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::get_active_mailer_slug(),
				)
			);
		}

		$campaign_recipients_count = $this->contact_filter->get_contact_count( $this->channel, $filters );

		if ( $campaign->count != $campaign_recipients_count ) {
			$campaign->count = $campaign_recipients_count;
			$campaign->save();
		}

		$offset = (int) get_option( $offset_key, 0 );

		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
			return;
		}

		// Get batch size - use curl multi mailer's max batch size
		$batch_size = min(
			\QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::get_max_batch_size(),
			apply_filters( 'quillcrm_curl_multi_campaign_batch_size', 100, $this->channel )
		);

		// Get template for batch preparation
		$template_id = reset( $campaign->get_template_ids() );
		$template    = Template_Model::find( $template_id );

		if ( ! $template ) {
			quillcrm_get_logger()->error(
				__( 'Template not found for curl multi email campaign', 'quillcrm' ),
				array(
					'code'        => 'curl_multi_email_no_template',
					'campaign_id' => $campaign->id,
				)
			);
			$campaign->status = 'failed';
			$campaign->save();
			return;
		}

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			usleep( 100000 ); // 0.1 second delay

			// Refresh lock
			$this->refresh_campaign_lock( $lock_key, $lock_duration );

			// Check if campaign was paused/cancelled
			$fresh_campaign = Campaign_Model::find( $campaign->id );
			if ( ! $fresh_campaign || $fresh_campaign->status !== 'processing' ) {
				update_option( $offset_key, $offset );
				return;
			}

			// Check completion
			if ( $offset >= $campaign_recipients_count ) {
				$this->complete_campaign( $campaign, $campaign_recipients_count );
				return;
			}

			// Fetch batch of contacts
			$contacts = $this->contact_filter->get_contacts_for_processing(
				$this->channel,
				$filters,
				$offset,
				$batch_size
			);

			if ( $contacts->isEmpty() ) {
				break;
			}

			// Send batch using curl multi
			$result = $this->send_email_batch_curl_multi( $campaign, $template, $contacts );

			// Update offset based on contacts processed
			$offset += $contacts->count();
			update_option( $offset_key, $offset );

			// If batch failed critically, stop processing
			if ( isset( $result['fatal'] ) && $result['fatal'] ) {
				return;
			}
		}

		// Check if more work remains
		if ( $offset >= $campaign_recipients_count ) {
			$this->complete_campaign( $campaign, $campaign_recipients_count );
		} else {
			$this->queue_continuation( $campaign->id );
		}
	}

	/**
	 * Send a batch of emails via cURL Multi
	 *
	 * This method reuses the same logic as send_email_batch but uses
	 * Curl_Multi_Email_Sender instead of Bulk_Email_Sender.
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign Campaign model
	 * @param Template_Model                           $template Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts Collection of contacts
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_curl_multi( Campaign_Model $campaign, Template_Model $template, $contacts ) {
		$skipped_contacts = array();
		$subject          = $template->subject ?? '';
		$body             = $template->body ?? $this->get_default_campaign_content();
		$content          = $subject . ' ' . $body;

		// Extract merge tags from content
		$merge_tag_keys = Merge_Tags_Manager::instance()->extract_merge_tag_keys( $content );

		// Check if template has conditional sections
		$has_conditional_sections = $this->template_has_conditional_sections( $body );

		if ( $has_conditional_sections ) {
			// Use conditional sections aware processing
			return $this->send_email_batch_curl_multi_with_conditional_sections(
				$campaign,
				$template,
				$contacts,
				$subject,
				$body,
				$merge_tag_keys,
				$skipped_contacts
			);
		}

		// No conditional sections - use standard curl multi processing
		return $this->send_email_batch_curl_multi_standard(
			$campaign,
			$template,
			$contacts,
			$subject,
			$body,
			$merge_tag_keys,
			$skipped_contacts
		);
	}

	/**
	 * Send standard batch via cURL Multi without conditional sections
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign        Campaign model
	 * @param Template_Model                           $template        Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts        Collection of contacts
	 * @param string                                   $subject         Email subject
	 * @param string                                   $body            Template body
	 * @param array                                    $merge_tag_keys  Merge tag keys
	 * @param array                                    &$skipped_contacts Skipped contacts array (by reference)
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_curl_multi_standard(
		Campaign_Model $campaign,
		Template_Model $template,
		$contacts,
		$subject,
		$body,
		$merge_tag_keys,
		&$skipped_contacts
	) {
		$tracking_records    = array();
		$recipients          = array();
		$recipient_variables = array();

		// Create tracking records and prepare recipient data
		foreach ( $contacts as $contact ) {
			$email = $this->get_recipient( $contact );

			// Skip contacts without valid email
			if ( empty( $email ) || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
				$skipped_contacts[] = $contact->id;
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					'invalid or missing email'
				);
				continue;
			}

			// Create tracking record
			$tracking = Communication_Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => $this->get_message_mode(),
					'direction'   => Message_Direction::OUTBOUND,
					'source_type' => Message_Source_Types::CAMPAIGN,
					'source_id'   => $campaign->id,
					'recipient'   => $email,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			$tracking_records[ $email ] = $tracking;
			$recipients[]               = $email;
			Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$tracking->id,
				$merge_tag_keys,
				$contact
			);

			// Get recipient variables with tracking pixel URL
			$variables = Merge_Tags_Manager::instance()->get_merge_tag_values_for_keys_slug_only( $merge_tag_keys, $contact );

			// Add tracking pixel URL for this contact
			$variables['tracking_pixel'] = home_url( '?quillcrm=email_open&hash_key=' . $tracking->hash_key );

			// Add unsubscribe URL
			$variables['unsubscribe_url'] = add_query_arg(
				array(
					'quillcrm' => 'email_unsubscribe',
					'hash_key' => $tracking->hash_key,
				),
				home_url()
			);

			$recipient_variables[ $email ] = $variables;
		}

		// If no valid recipients, return early
		if ( empty( $recipients ) ) {
			quillcrm_get_logger()->info(
				__( 'No valid recipients in curl multi batch', 'quillcrm' ),
				array(
					'code'          => 'curl_multi_email_no_recipients',
					'campaign_id'   => $campaign->id,
					'skipped_count' => count( $skipped_contacts ),
				)
			);
			return array(
				'success' => true,
				'skipped' => count( $skipped_contacts ),
			);
		}

		// Render builder content if needed
		$body = $this->render_builder_content_for_bulk( $body );

		// Get footer content (with merge tags - will be processed per contact)
		$footer = $this->get_curl_multi_footer_content();

		// Inject footer into body
		if ( strpos( $body, '</body>' ) !== false ) {
			$body = str_replace( '</body>', $footer . '</body>', $body );
		} else {
			$body .= $footer;
		}

		// Add tracking pixel placeholder (will be replaced per contact)
		$tracking_pixel = '<img src="{{tracking:tracking_pixel}}" width="1" height="1" style="width:1px;height:1px;" alt="" />';
		if ( strpos( $body, '</body>' ) !== false ) {
			$body = str_replace( '</body>', $tracking_pixel . '</body>', $body );
		} else {
			$body .= $tracking_pixel;
		}

		// Prepare batch data
		$batch_data = array(
			'subject'             => $subject,
			'html'                => $body,
			'from_email'          => $template->get_setting( 'from_email' ) ?: get_option( 'admin_email' ),
			'from_name'           => $template->get_setting( 'from_name' ) ?: get_bloginfo( 'name' ),
			'reply_to'            => $template->get_setting( 'reply_to' ) ?: '',
			'recipients'          => $recipients,
			'recipient_variables' => $recipient_variables,
			'campaign_id'         => $campaign->id,
			'tags'                => array( 'quillcrm', 'campaign-' . $campaign->id ),
		);

		// Send via cURL Multi
		$result = \QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::send_batch( $batch_data );

		// Update tracking records based on result
		if ( is_wp_error( $result ) ) {
			// Mark all as failed
			foreach ( $tracking_records as $email => $tracking ) {
				$tracking->status = Tracking_Status::FAILED;
				$tracking->save();
			}

			quillcrm_get_logger()->error(
				__( 'Curl Multi email batch failed', 'quillcrm' ),
				array(
					'code'            => 'curl_multi_email_batch_failed',
					'campaign_id'     => $campaign->id,
					'error'           => $result->get_error_message(),
					'recipient_count' => count( $recipients ),
				)
			);

			return array(
				'success' => false,
				'error'   => $result->get_error_message(),
				'fatal'   => false,
			);
		}

		// Process individual results
		$sent_count  = $result['sent_count'] ?? 0;
		$failed      = $result['failed'] ?? array();
		$message_ids = $result['message_ids'] ?? array();

		foreach ( $tracking_records as $email => $tracking ) {
			if ( isset( $failed[ $email ] ) ) {
				$tracking->status = Tracking_Status::FAILED;
			} else {
				$tracking->status      = Tracking_Status::SENT;
				$tracking->sent_at     = current_time( 'mysql' );
				$tracking->external_id = $message_ids[ $email ] ?? '';
			}
			$tracking->save();
		}

		quillcrm_get_logger()->info(
			__( 'Curl Multi email batch completed', 'quillcrm' ),
			array(
				'code'          => 'curl_multi_email_batch_success',
				'campaign_id'   => $campaign->id,
				'sent_count'    => $sent_count,
				'failed_count'  => count( $failed ),
				'skipped_count' => count( $skipped_contacts ),
			)
		);

		return array(
			'success'    => empty( $failed ),
			'sent_count' => $sent_count,
			'skipped'    => count( $skipped_contacts ),
			'failed'     => $failed,
		);
	}

	/**
	 * Send batch with conditional sections support via cURL Multi
	 *
	 * Groups contacts by template hash and sends separate batches for each group.
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign        Campaign model
	 * @param Template_Model                           $template        Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts        Collection of contacts
	 * @param string                                   $subject         Email subject
	 * @param string                                   $body            Template body (JSON)
	 * @param array                                    $merge_tag_keys  Merge tag keys
	 * @param array                                    &$skipped_contacts Skipped contacts array (by reference)
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_curl_multi_with_conditional_sections(
		Campaign_Model $campaign,
		Template_Model $template,
		$contacts,
		$subject,
		$body,
		$merge_tag_keys,
		&$skipped_contacts
	) {
		// Pre-load relationships for all contacts to optimize condition evaluation
		$this->preload_relationships_for_conditions( $contacts, $body );

		// Group contacts by their template hash
		$contact_groups = array(); // hash => array of contact data

		foreach ( $contacts as $contact ) {
			$email = $this->get_recipient( $contact );

			// Skip contacts without valid email
			if ( empty( $email ) || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
				$skipped_contacts[] = $contact->id;
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					'invalid or missing email'
				);
				continue;
			}

			// Compute template hash for this contact
			$hash_result = $this->compute_template_hash_for_contact( $body, $contact );
			$hash        = $hash_result['hash'];
			$section_ids = $hash_result['section_ids'];

			if ( ! isset( $contact_groups[ $hash ] ) ) {
				$contact_groups[ $hash ] = array(
					'section_ids' => $section_ids,
					'contacts'    => array(),
				);
			}

			$contact_groups[ $hash ]['contacts'][] = array(
				'contact' => $contact,
				'email'   => $email,
			);
		}

		if ( empty( $contact_groups ) ) {
			return array(
				'success' => true,
				'skipped' => count( $skipped_contacts ),
			);
		}

		// Log grouping info
		quillcrm_get_logger()->info(
			__( 'Contacts grouped by conditional sections for curl multi', 'quillcrm' ),
			array(
				'code'        => 'curl_multi_email_conditional_groups',
				'campaign_id' => $campaign->id,
				'group_count' => count( $contact_groups ),
			)
		);

		// Send batch for each group
		$total_sent      = 0;
		$total_failed    = 0;
		$last_error      = null;
		$all_message_ids = array();

		foreach ( $contact_groups as $hash => $group ) {
			$result = $this->send_email_batch_curl_multi_for_group(
				$campaign,
				$template,
				$group['contacts'],
				$group['section_ids'],
				$subject,
				$body,
				$merge_tag_keys
			);

			if ( isset( $result['sent_count'] ) ) {
				$total_sent += $result['sent_count'];
			}
			if ( ! empty( $result['failed'] ) ) {
				$total_failed += count( $result['failed'] );
				$last_error    = is_array( $result['failed'] ) ? reset( $result['failed'] ) : 'Unknown error';
			}
			if ( ! empty( $result['message_ids'] ) ) {
				$all_message_ids = array_merge( $all_message_ids, $result['message_ids'] );
			}
		}

		return array(
			'success'     => $total_failed === 0,
			'message_ids' => $all_message_ids,
			'sent_count'  => $total_sent,
			'skipped'     => count( $skipped_contacts ),
			'error'       => $last_error,
			'fatal'       => false,
		);
	}

	/**
	 * Send cURL Multi batch for a group of contacts with the same template hash
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign        Campaign model
	 * @param Template_Model $template        Template model
	 * @param array          $contact_data    Array of contact data (contact, email)
	 * @param array          $section_ids     Array of section IDs that should render
	 * @param string         $subject         Email subject
	 * @param string         $body            Template body (JSON)
	 * @param array          $merge_tag_keys  Merge tag keys
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_curl_multi_for_group(
		Campaign_Model $campaign,
		Template_Model $template,
		$contact_data,
		$section_ids,
		$subject,
		$body,
		$merge_tag_keys
	) {
		$tracking_records    = array();
		$recipients          = array();
		$recipient_variables = array();

		// Create tracking records for all contacts in this group
		foreach ( $contact_data as $data ) {
			$contact = $data['contact'];
			$email   = $data['email'];

			// Create tracking record
			$tracking = Communication_Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => $this->get_message_mode(),
					'direction'   => Message_Direction::OUTBOUND,
					'source_type' => Message_Source_Types::CAMPAIGN,
					'source_id'   => $campaign->id,
					'recipient'   => $email,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			$tracking_records[ $email ] = $tracking;
			$recipients[]               = $email;

			// Capture merge tags for this contact
			Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$tracking->id,
				$merge_tag_keys,
				$contact
			);

			// Store conditional section IDs for this tracking record
			if ( ! empty( $section_ids ) ) {
				Communication_Tracking_Meta_Model::create(
					array(
						'communication_tracking_id' => $tracking->id,
						'meta_key'                  => 'conditional_sections',
						'meta_value'                => $section_ids,
					)
				);
			}

			// Get recipient variables with tracking info
			$variables = Merge_Tags_Manager::instance()->get_merge_tag_values_for_keys_slug_only( $merge_tag_keys, $contact );

			// Add tracking pixel URL for this contact
			$variables['tracking_pixel'] = home_url( '?quillcrm=email_open&hash_key=' . $tracking->hash_key );

			// Add unsubscribe URL
			$variables['unsubscribe_url'] = add_query_arg(
				array(
					'quillcrm' => 'email_unsubscribe',
					'hash_key' => $tracking->hash_key,
				),
				home_url()
			);

			$recipient_variables[ $email ] = $variables;
		}

		// Render body with specific section IDs
		$rendered_body = $this->render_builder_content_for_bulk_with_sections( $body, $section_ids );

		// Get footer content
		$footer = $this->get_curl_multi_footer_content();

		// Inject footer into body
		if ( strpos( $rendered_body, '</body>' ) !== false ) {
			$rendered_body = str_replace( '</body>', $footer . '</body>', $rendered_body );
		} else {
			$rendered_body .= $footer;
		}

		// Add tracking pixel placeholder
		$tracking_pixel = '<img src="{{tracking:tracking_pixel}}" width="1" height="1" style="width:1px;height:1px;" alt="" />';
		if ( strpos( $rendered_body, '</body>' ) !== false ) {
			$rendered_body = str_replace( '</body>', $tracking_pixel . '</body>', $rendered_body );
		} else {
			$rendered_body .= $tracking_pixel;
		}

		// Prepare batch data
		$batch_data = array(
			'subject'             => $subject,
			'html'                => $rendered_body,
			'from_email'          => $template->get_setting( 'from_email' ) ?: get_option( 'admin_email' ),
			'from_name'           => $template->get_setting( 'from_name' ) ?: get_bloginfo( 'name' ),
			'reply_to'            => $template->get_setting( 'reply_to' ) ?: '',
			'recipients'          => $recipients,
			'recipient_variables' => $recipient_variables,
			'campaign_id'         => $campaign->id,
			'tags'                => array( 'quillcrm', 'campaign-' . $campaign->id ),
		);

		// Send via cURL Multi
		$result = \QuillCRM_Pro\Emails\Curl_Multi_Email_Sender::send_batch( $batch_data );

		// Update tracking records based on result
		if ( is_wp_error( $result ) ) {
			foreach ( $tracking_records as $email => $tracking ) {
				$tracking->status = Tracking_Status::FAILED;
				$tracking->save();
			}

			return array(
				'success' => false,
				'error'   => $result->get_error_message(),
			);
		}

		// Process individual results
		$failed      = $result['failed'] ?? array();
		$message_ids = $result['message_ids'] ?? array();

		foreach ( $tracking_records as $email => $tracking ) {
			if ( isset( $failed[ $email ] ) ) {
				$tracking->status = Tracking_Status::FAILED;
			} else {
				$tracking->status      = Tracking_Status::SENT;
				$tracking->sent_at     = current_time( 'mysql' );
				$tracking->external_id = $message_ids[ $email ] ?? '';
			}
			$tracking->save();
		}

		return array(
			'success'     => empty( $failed ),
			'message_ids' => $message_ids,
			'sent_count'  => $result['sent_count'] ?? 0,
			'failed'      => $failed,
		);
	}

	/**
	 * Get footer content for cURL Multi emails
	 *
	 * Unlike bulk email which converts merge tags to mailer format,
	 * cURL Multi keeps QuillCRM merge tags as they will be processed per contact.
	 *
	 * @since 1.0.0
	 *
	 * @return string Footer HTML with merge tag placeholders
	 */
	protected function get_curl_multi_footer_content() {
		// Get footer from settings
		if ( ! empty( $this->settings['email_footer'] ) ) {
			$footer = $this->settings['email_footer'];
		} else {
			$global_settings = \QuillCRM\Settings::get( 'email', array() );
			if ( ! empty( $global_settings['email_footer'] ) ) {
				$footer = $global_settings['email_footer'];
			} else {
				$footer = Email_Tracking_Helper::get_default_footer();
			}
		}

		// Keep merge tags as-is for curl multi (they will be processed per contact)
		return $footer;
	}

	/**
	 * Send a batch of emails via bulk API
	 *
	 * This method supports conditional sections by:
	 * 1. Evaluating which conditional sections apply to each contact
	 * 2. Creating a hash based on the rendered section IDs
	 * 3. Grouping contacts with the same hash (same email body)
	 * 4. Sending one bulk email per group for efficiency
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign Campaign model
	 * @param Template_Model                           $template Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts Collection of contacts
	 *
	 * @return array Result array
	 */
	protected function send_email_batch( Campaign_Model $campaign, Template_Model $template, $contacts ) {
		$skipped_contacts = array();
		$subject          = $template->subject ?? '';
		$body             = $template->body ?? $this->get_default_campaign_content();
		$content          = $subject . ' ' . $body;

		// Extract merge tags from content
		$merge_tag_keys = Merge_Tags_Manager::instance()->extract_merge_tag_keys( $content );

		// Check if template has conditional sections
		$has_conditional_sections = $this->template_has_conditional_sections( $body );

		if ( $has_conditional_sections ) {
			// Use conditional sections aware processing
			return $this->send_email_batch_with_conditional_sections(
				$campaign,
				$template,
				$contacts,
				$subject,
				$body,
				$merge_tag_keys,
				$skipped_contacts
			);
		}

		// No conditional sections - use standard bulk processing
		return $this->send_email_batch_standard(
			$campaign,
			$template,
			$contacts,
			$subject,
			$body,
			$merge_tag_keys,
			$skipped_contacts
		);
	}

	/**
	 * Check if template body contains conditional sections
	 *
	 * @since 1.0.0
	 *
	 * @param string $body Template body (JSON or HTML)
	 *
	 * @return bool True if template has conditional sections
	 */
	protected function template_has_conditional_sections( $body ) {
		$decoded = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return false;
		}

		if ( ! isset( $decoded['type'] ) || $decoded['type'] !== 'builder' || ! isset( $decoded['value'] ) ) {
			return false;
		}

		$builder_data = $decoded['value'];

		if ( ! isset( $builder_data['sections'] ) || ! is_array( $builder_data['sections'] ) ) {
			return false;
		}

		// Check if any section has conditions
		foreach ( $builder_data['sections'] as $section ) {
			if ( ! empty( $section['conditions'] ) && is_array( $section['conditions'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Compute template hash for a contact based on which conditional sections will render
	 *
	 * Uses the shared Condition_Evaluator for in-memory condition evaluation.
	 *
	 * @since 1.0.0
	 *
	 * @param string        $body    Template body (JSON)
	 * @param Contact_Model $contact Contact model
	 *
	 * @return array Array with 'hash' (string) and 'section_ids' (array of rendered section IDs)
	 */
	protected function compute_template_hash_for_contact( $body, Contact_Model $contact ) {
		$decoded = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! isset( $decoded['value']['sections'] ) ) {
			return array(
				'hash'        => 'default',
				'section_ids' => array(),
			);
		}

		$sections             = $decoded['value']['sections'];
		$rendered_section_ids = array();

		// Check Pro availability
		$is_pro_active = quillcrm_is_plugin_active( QUILLCRM_PRO_PLUGIN_PATH );

		// Get condition evaluator instance
		$evaluator = Condition_Evaluator::instance();

		foreach ( $sections as $section ) {
			$section_id     = $section['id'] ?? null;
			$has_conditions = ! empty( $section['conditions'] ) && is_array( $section['conditions'] );

			if ( ! $has_conditions ) {
				// No conditions - section always renders
				if ( $section_id ) {
					$rendered_section_ids[] = $section_id;
				}
				continue;
			}

			// Has conditions - evaluate if should render
			if ( ! $is_pro_active ) {
				// Pro not active - render all sections
				if ( $section_id ) {
					$rendered_section_ids[] = $section_id;
				}
				continue;
			}

			// Use shared Condition_Evaluator for in-memory evaluation
			$matches = $evaluator->evaluate( $section['conditions'], $contact );

			if ( $matches && $section_id ) {
				$rendered_section_ids[] = $section_id;
			}
		}

		// Create hash from rendered section IDs
		sort( $rendered_section_ids );
		$hash = md5( implode( '|', $rendered_section_ids ) );

		return array(
			'hash'        => $hash,
			'section_ids' => $rendered_section_ids,
		);
	}

	/**
	 * Send batch with conditional sections support
	 *
	 * Groups contacts by template hash and sends separate bulk emails for each group.
	 * Pre-loads relationships for all contacts to avoid N+1 queries.
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign        Campaign model
	 * @param Template_Model                           $template        Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts        Collection of contacts
	 * @param string                                   $subject         Email subject
	 * @param string                                   $body            Template body (JSON)
	 * @param array                                    $merge_tag_keys  Merge tag keys
	 * @param array                                    &$skipped_contacts Skipped contacts array (by reference)
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_with_conditional_sections(
		Campaign_Model $campaign,
		Template_Model $template,
		$contacts,
		$subject,
		$body,
		$merge_tag_keys,
		&$skipped_contacts
	) {
		// Pre-load relationships for all contacts to optimize condition evaluation
		$this->preload_relationships_for_conditions( $contacts, $body );

		// Group contacts by their template hash
		$contact_groups = array(); // hash => array of contact data

		foreach ( $contacts as $contact ) {
			$email = $this->get_recipient( $contact );

			// Skip contacts without valid email
			if ( empty( $email ) || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
				$skipped_contacts[] = $contact->id;
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					'invalid or missing email'
				);
				continue;
			}

			// Compute template hash for this contact
			$hash_result = $this->compute_template_hash_for_contact( $body, $contact );
			$hash        = $hash_result['hash'];
			$section_ids = $hash_result['section_ids'];

			if ( ! isset( $contact_groups[ $hash ] ) ) {
				$contact_groups[ $hash ] = array(
					'section_ids' => $section_ids,
					'contacts'    => array(),
				);
			}

			$contact_groups[ $hash ]['contacts'][] = array(
				'contact' => $contact,
				'email'   => $email,
			);
		}

		if ( empty( $contact_groups ) ) {
			quillcrm_get_logger()->info(
				__( 'No valid recipients in batch (conditional sections)', 'quillcrm' ),
				array(
					'code'          => 'bulk_email_no_recipients_conditional',
					'campaign_id'   => $campaign->id,
					'skipped_count' => count( $skipped_contacts ),
				)
			);
			return array(
				'success' => true,
				'skipped' => count( $skipped_contacts ),
			);
		}

		// Log grouping info
		quillcrm_get_logger()->info(
			__( 'Contacts grouped by conditional sections', 'quillcrm' ),
			array(
				'code'        => 'bulk_email_conditional_groups',
				'campaign_id' => $campaign->id,
				'group_count' => count( $contact_groups ),
				'group_sizes' => array_map(
					function ( $group ) {
						return count( $group['contacts'] );
					},
					$contact_groups
				),
			)
		);

		// Send bulk email for each group
		$total_sent      = 0;
		$total_failed    = 0;
		$last_error      = null;
		$all_message_ids = array();

		foreach ( $contact_groups as $hash => $group ) {
			$result = $this->send_email_batch_for_group(
				$campaign,
				$template,
				$group['contacts'],
				$group['section_ids'],
				$subject,
				$body,
				$merge_tag_keys
			);

			if ( $result['success'] ) {
				$total_sent += $result['sent_count'] ?? 0;
				if ( ! empty( $result['message_id'] ) ) {
					$all_message_ids[] = $result['message_id'];
				}
			} else {
				$total_failed += count( $group['contacts'] );
				$last_error    = $result['error'] ?? 'Unknown error';
			}
		}

		quillcrm_get_logger()->info(
			__( 'Bulk email with conditional sections completed', 'quillcrm' ),
			array(
				'code'          => 'bulk_email_conditional_complete',
				'campaign_id'   => $campaign->id,
				'groups_sent'   => count( $contact_groups ),
				'total_sent'    => $total_sent,
				'total_failed'  => $total_failed,
				'skipped_count' => count( $skipped_contacts ),
			)
		);

		return array(
			'success'     => $total_failed === 0,
			'message_ids' => $all_message_ids,
			'sent_count'  => $total_sent,
			'skipped'     => count( $skipped_contacts ),
			'error'       => $last_error,
			'fatal'       => false,
		);
	}

	/**
	 * Send bulk email for a group of contacts with the same template hash
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model $campaign        Campaign model
	 * @param Template_Model $template        Template model
	 * @param array          $contact_data    Array of contact data (contact, email)
	 * @param array          $section_ids     Array of section IDs that should render
	 * @param string         $subject         Email subject
	 * @param string         $body            Template body (JSON)
	 * @param array          $merge_tag_keys  Merge tag keys
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_for_group(
		Campaign_Model $campaign,
		Template_Model $template,
		$contact_data,
		$section_ids,
		$subject,
		$body,
		$merge_tag_keys
	) {
		$tracking_records    = array();
		$recipients          = array();
		$recipient_variables = array();

		// Create tracking records for all contacts in this group
		foreach ( $contact_data as $data ) {
			$contact = $data['contact'];
			$email   = $data['email'];

			// Create tracking record
			$tracking = Communication_Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => $this->get_message_mode(),
					'direction'   => Message_Direction::OUTBOUND,
					'source_type' => Message_Source_Types::CAMPAIGN,
					'source_id'   => $campaign->id,
					'recipient'   => $email,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			$tracking_records[ $email ] = $tracking;
			$recipients[]               = $email;

			// Capture merge tags for this contact
			Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$tracking->id,
				$merge_tag_keys,
				$contact
			);

			// Store conditional section IDs for this tracking record
			if ( ! empty( $section_ids ) ) {
				Communication_Tracking_Meta_Model::create(
					array(
						'communication_tracking_id' => $tracking->id,
						'meta_key'                  => 'conditional_sections',
						'meta_value'                => $section_ids,
					)
				);
			}

			// Get recipient variables for this contact
			$recipient_variables[ $email ] = Merge_Tags_Manager::instance()->get_merge_tag_values_for_keys_slug_only( $merge_tag_keys, $contact );
		}

		// Render body with specific section IDs
		$rendered_body = $this->render_builder_content_for_bulk_with_sections( $body, $section_ids );

		// Get footer content
		$footer = $this->get_bulk_footer_content();

		// Inject footer into body
		if ( strpos( $rendered_body, '</body>' ) !== false ) {
			$rendered_body = str_replace( '</body>', $footer . '</body>', $rendered_body );
		} else {
			$rendered_body .= $footer;
		}

		// Convert QuillCRM merge tags to mailer-specific recipient variables
		$converted_subject = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( $subject );
		$converted_body    = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( $rendered_body );

		// Add tracking pixel
		$tracking_pixel_tag = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( '{{tracking:tracking_pixel}}' );
		$tracking_pixel     = '<img src="' . $tracking_pixel_tag . '" width="1" height="1" style="width:1px;height:1px;" alt="" />';
		if ( strpos( $converted_body, '</body>' ) !== false ) {
			$converted_body = str_replace( '</body>', $tracking_pixel . '</body>', $converted_body );
		} else {
			$converted_body .= $tracking_pixel;
		}

		// Prepare batch data
		$batch_data = array(
			'subject'             => $converted_subject,
			'html'                => $converted_body,
			'from_email'          => $template->get_setting( 'from_email' ) ?: get_option( 'admin_email' ),
			'from_name'           => $template->get_setting( 'from_name' ) ?: get_bloginfo( 'name' ),
			'reply_to'            => $template->get_setting( 'reply_to' ) ?: '',
			'recipients'          => $recipients,
			'recipient_variables' => $recipient_variables,
			'campaign_id'         => $campaign->id,
			'tags'                => array( 'quillcrm', 'campaign-' . $campaign->id ),
		);

		// Send via bulk API
		$result = \QuillCRM_Pro\Emails\Bulk_Email_Sender::send_batch( $batch_data );

		// Update tracking records based on result
		if ( is_wp_error( $result ) ) {
			foreach ( $tracking_records as $email => $tracking ) {
				$tracking->status = Tracking_Status::FAILED;
				$tracking->save();
			}

			quillcrm_get_logger()->error(
				__( 'Bulk email group batch failed', 'quillcrm' ),
				array(
					'code'            => 'bulk_email_group_failed',
					'campaign_id'     => $campaign->id,
					'error'           => $result->get_error_message(),
					'recipient_count' => count( $recipients ),
					'section_ids'     => $section_ids,
				)
			);

			return array(
				'success' => false,
				'error'   => $result->get_error_message(),
			);
		}

		// Success - mark all tracking records as sent
		$message_id = $result['message_id'] ?? '';
		foreach ( $tracking_records as $email => $tracking ) {
			$tracking->status      = Tracking_Status::SENT;
			$tracking->sent_at     = current_time( 'mysql' );
			$tracking->external_id = $message_id;
			$tracking->save();
		}

		return array(
			'success'    => true,
			'message_id' => $message_id,
			'sent_count' => count( $recipients ),
		);
	}

	/**
	 * Send standard batch without conditional sections
	 *
	 * @since 1.0.0
	 *
	 * @param Campaign_Model                           $campaign        Campaign model
	 * @param Template_Model                           $template        Template model
	 * @param \Illuminate\Database\Eloquent\Collection $contacts        Collection of contacts
	 * @param string                                   $subject         Email subject
	 * @param string                                   $body            Template body
	 * @param array                                    $merge_tag_keys  Merge tag keys
	 * @param array                                    &$skipped_contacts Skipped contacts array (by reference)
	 *
	 * @return array Result array
	 */
	protected function send_email_batch_standard(
		Campaign_Model $campaign,
		Template_Model $template,
		$contacts,
		$subject,
		$body,
		$merge_tag_keys,
		&$skipped_contacts
	) {
		$tracking_records    = array();
		$recipients          = array();
		$recipient_variables = array();

		// Create tracking records and prepare recipient data
		foreach ( $contacts as $contact ) {
			$email = $this->get_recipient( $contact );

			// Skip contacts without valid email
			if ( empty( $email ) || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
				$skipped_contacts[] = $contact->id;
				$this->contact_filter->log_skipped_contact(
					$contact->id,
					$campaign->id,
					$this->channel,
					'invalid or missing email'
				);
				continue;
			}

			// Create tracking record
			$tracking = Communication_Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => $this->get_message_mode(),
					'direction'   => Message_Direction::OUTBOUND,
					'source_type' => Message_Source_Types::CAMPAIGN,
					'source_id'   => $campaign->id,
					'recipient'   => $email,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			$tracking_records[ $email ] = $tracking;
			$recipients[]               = $email;
			Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$tracking->id,
				$merge_tag_keys,
				$contact
			);
			$recipient_variables[ $email ] = Merge_Tags_Manager::instance()->get_merge_tag_values_for_keys_slug_only( $merge_tag_keys, $contact );
		}

		// If no valid recipients, return early
		if ( empty( $recipients ) ) {
			quillcrm_get_logger()->info(
				__( 'No valid recipients in batch', 'quillcrm' ),
				array(
					'code'          => 'bulk_email_no_recipients',
					'campaign_id'   => $campaign->id,
					'skipped_count' => count( $skipped_contacts ),
				)
			);
			return array(
				'success' => true,
				'skipped' => count( $skipped_contacts ),
			);
		}

		// Render builder content if needed (without personalization - that's handled by recipient variables)
		$body = $this->render_builder_content_for_bulk( $body ); // to return html without change format

		// Get footer content
		$footer = $this->get_bulk_footer_content(); // to return html with convert merge tags format to mailer format

		// Inject footer into body (for builder emails)
		if ( strpos( $body, '</body>' ) !== false ) {
			$body = str_replace( '</body>', $footer . '</body>', $body );
		} else {
			$body .= $footer;
		}

		// Convert QuillCRM merge tags to mailer-specific recipient variables
		$subject = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( $subject );
		$body    = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( $body );

		// Add tracking pixel using recipient variable (mailer-specific format)
		$tracking_pixel_tag = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( '{{tracking:tracking_pixel}}' );
		$tracking_pixel     = '<img src="' . $tracking_pixel_tag . '" width="1" height="1" style="width:1px;height:1px;" alt="" />';
		if ( strpos( $body, '</body>' ) !== false ) {
			$body = str_replace( '</body>', $tracking_pixel . '</body>', $body );
		} else {
			$body .= $tracking_pixel;
		}

		// Prepare batch data
		$batch_data = array(
			'subject'             => $subject,
			'html'                => $body,
			'from_email'          => $template->get_setting( 'from_email' ) ?: get_option( 'admin_email' ),
			'from_name'           => $template->get_setting( 'from_name' ) ?: get_bloginfo( 'name' ),
			'reply_to'            => $template->get_setting( 'reply_to' ) ?: '',
			'recipients'          => $recipients,
			'recipient_variables' => $recipient_variables,
			'campaign_id'         => $campaign->id,
			'tags'                => array( 'quillcrm', 'campaign-' . $campaign->id ),
		);

		// Send via bulk API
		$result = \QuillCRM_Pro\Emails\Bulk_Email_Sender::send_batch( $batch_data );

		// Update tracking records based on result
		if ( is_wp_error( $result ) ) {
			// Mark all as failed
			foreach ( $tracking_records as $email => $tracking ) {
				$tracking->status = Tracking_Status::FAILED;
				$tracking->save();
			}

			quillcrm_get_logger()->error(
				__( 'Bulk email batch failed', 'quillcrm' ),
				array(
					'code'            => 'bulk_email_batch_failed',
					'campaign_id'     => $campaign->id,
					'error'           => $result->get_error_message(),
					'recipient_count' => count( $recipients ),
				)
			);

			return array(
				'success' => false,
				'error'   => $result->get_error_message(),
				'fatal'   => false,
			);
		}

		// Success - mark all tracking records as sent
		$message_id = $result['message_id'] ?? '';
		foreach ( $tracking_records as $email => $tracking ) {
			$tracking->status      = Tracking_Status::SENT;
			$tracking->sent_at     = current_time( 'mysql' );
			$tracking->external_id = $message_id;
			$tracking->save();
		}

		quillcrm_get_logger()->info(
			__( 'Bulk email batch sent successfully', 'quillcrm' ),
			array(
				'code'          => 'bulk_email_batch_success',
				'campaign_id'   => $campaign->id,
				'message_id'    => $message_id,
				'sent_count'    => count( $recipients ),
				'skipped_count' => count( $skipped_contacts ),
			)
		);

		return array(
			'success'    => true,
			'message_id' => $message_id,
			'sent_count' => count( $recipients ),
			'skipped'    => count( $skipped_contacts ),
		);
	}

	/**
	 * Render builder content for bulk sending (without personalization)
	 *
	 * @since 1.0.0
	 *
	 * @param string $content Content to render
	 *
	 * @return string Rendered HTML
	 */
	protected function render_builder_content_for_bulk( $content ) {
		// Try to decode as JSON
		$decoded = json_decode( $content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return $content; // Not JSON, return as-is
		}

		// Check if it's builder format
		if ( ! isset( $decoded['type'] ) || $decoded['type'] !== 'builder' || ! isset( $decoded['value'] ) ) {
			return $content; // Not builder format
		}

		// Render without contact context (merge tags will be handled by Mailgun)
		if ( class_exists( '\QuillCRM\Emails\Email_Renderer' ) ) {
			$renderer     = new \QuillCRM\Emails\Email_Renderer();
			$builder_data = $decoded['value'];

			// Render with null contact - merge tags stay as placeholders
			$html = $renderer->render_from_builder_data( $builder_data, null, '', '' );

			return $html;
		}

		return $content;
	}

	/**
	 * Render builder content for bulk sending with specific section IDs
	 *
	 * This method renders only the sections whose IDs are in the provided array.
	 * Used for conditional sections where different contacts see different sections.
	 *
	 * @since 1.0.0
	 *
	 * @param string $content     Content to render (JSON)
	 * @param array  $section_ids Array of section IDs that should be rendered
	 *
	 * @return string Rendered HTML
	 */
	protected function render_builder_content_for_bulk_with_sections( $content, $section_ids ) {
		// Try to decode as JSON
		$decoded = json_decode( $content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return $content; // Not JSON, return as-is
		}

		// Check if it's builder format
		if ( ! isset( $decoded['type'] ) || $decoded['type'] !== 'builder' || ! isset( $decoded['value'] ) ) {
			return $content; // Not builder format
		}

		$builder_data = $decoded['value'];

		// Filter sections based on provided section IDs
		if ( isset( $builder_data['sections'] ) && is_array( $builder_data['sections'] ) ) {
			$filtered_sections = array();

			foreach ( $builder_data['sections'] as $section ) {
				$section_id     = $section['id'] ?? null;
				$has_conditions = ! empty( $section['conditions'] ) && is_array( $section['conditions'] );

				if ( ! $has_conditions ) {
					// No conditions - always include
					$filtered_sections[] = $section;
				} elseif ( $section_id && in_array( $section_id, $section_ids, true ) ) {
					// Has conditions and is in the render list - include
					// Remove conditions from section to prevent re-evaluation during render
					unset( $section['conditions'] );
					$filtered_sections[] = $section;
				}
				// If has conditions but not in section_ids, skip (don't include)
			}

			$builder_data['sections'] = $filtered_sections;
		}

		// Render without contact context (merge tags will be handled by Mailgun)
		if ( class_exists( '\QuillCRM\Emails\Email_Renderer' ) ) {
			$renderer = new \QuillCRM\Emails\Email_Renderer();

			// Render with null contact - merge tags stay as placeholders
			$html = $renderer->render_from_builder_data( $builder_data, null, '', '' );

			return $html;
		}

		return $content;
	}

	/**
	 * Get footer content for bulk emails
	 *
	 * @since 1.0.0
	 *
	 * @return string Footer HTML with recipient variable placeholders
	 */
	protected function get_bulk_footer_content() {
		// Get footer from settings
		if ( ! empty( $this->settings['email_footer'] ) ) {
			$footer = $this->settings['email_footer'];
		} else {
			$global_settings = \QuillCRM\Settings::get( 'email', array() );
			if ( ! empty( $global_settings['email_footer'] ) ) {
				$footer = $global_settings['email_footer'];
			} else {
				$footer = Email_Tracking_Helper::get_default_footer();
			}
		}

		// Convert merge tags to mailer-specific format
		$footer = \QuillCRM_Pro\Emails\Bulk_Email_Sender::convert_merge_tags_to_recipient_variables( $footer );

		return $footer;
	}

	/**
	 * Pre-load relationships needed for condition evaluation
	 *
	 * Analyzes template conditions to determine which relationships need to be loaded,
	 * then loads them all at once to avoid N+1 queries.
	 *
	 * @since 1.0.0
	 *
	 * @param \Illuminate\Database\Eloquent\Collection $contacts Contacts collection
	 * @param string                                   $body     Template body (JSON)
	 *
	 * @return void
	 */
	protected function preload_relationships_for_conditions( $contacts, $body ) {
		$decoded = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! isset( $decoded['value']['sections'] ) ) {
			return;
		}

		// Collect all conditions from all sections
		$all_conditions = array();
		foreach ( $decoded['value']['sections'] as $section ) {
			if ( ! empty( $section['conditions'] ) && is_array( $section['conditions'] ) ) {
				$all_conditions = array_merge( $all_conditions, $section['conditions'] );
			}
		}

		if ( empty( $all_conditions ) ) {
			return;
		}

		// Use the Condition_Evaluator to preload needed relationships
		Condition_Evaluator::instance()->preload_relationships( $contacts, $all_conditions );
	}

	/**
	 * Get campaign message mode
	 *
	 * @return int
	 */
	protected function get_message_mode() {
		 return Communication_Tracking_Model::MODE_EMAIL;
	}

	/**
	 * Get channel context for merge tags
	 *
	 * @return string
	 */
	public function get_channel_context() {
		 return 'email';
	}

	/**
	 * Get recipient field from contact
	 *
	 * @param Contact_Model $contact
	 * @return string|null
	 */
	protected function get_recipient( Contact_Model $contact ) {
		return $contact->email;
	}

	/**
	 * Prepare message content - Override to inject footer during builder rendering
	 *
	 * This method follows the same flow as the parent but adds builder email support:
	 * 1. Prepare footer (with merge tags) before rendering
	 * 2. Render builder content with footer injection
	 * 3. Process all merge tags (body + footer)
	 * 4. Add click tracking and unsubscribe links
	 *
	 * @param Template_Model                                          $template Template model
	 * @param Contact_Model|\QuillCRM\Models\Automation_Contact_Model $contact_or_automation_contact Contact or Automation Contact model
	 * @param Communication_Tracking_Model                            $campaign_message Campaign tracking record
	 * @return array Message data array with subject, body, recipient, hash_key
	 */
	protected function prepare_message_content( Template_Model $template, $contact_or_automation_contact, Communication_Tracking_Model $campaign_message ) {
		$subject         = $template->subject ?? '';
		$message         = $template->body ?? $this->get_default_campaign_content();
		$add_unsubscribe = $template->get_setting( 'add_unsubscribe', true );

		// Extract actual contact for operations that need Contact_Model
		$contact = $contact_or_automation_contact instanceof \QuillCRM\Models\Automation_Contact_Model
			? $contact_or_automation_contact->contact
			: $contact_or_automation_contact;

		// STEP 1: Extract merge tag keys if not already cached
		if ( is_null( $this->template_merge_tag_keys ) ) {
			$combined_content              = $subject . ' ' . $message;
			$this->template_merge_tag_keys = Merge_Tags_Manager::instance()->extract_merge_tag_keys( $combined_content );
		}

		// STEP 2: Capture merge tag values for this contact using pre-extracted keys
		if ( ! empty( $this->template_merge_tag_keys ) ) {
			Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$campaign_message->id,
				$this->template_merge_tag_keys,
				$contact_or_automation_contact
			);
		}

		// Prepare footer HTML before rendering (for builder emails only)
		// Footer contains merge tags that will be processed after rendering
		$footer_html = $this->prepare_footer_html( $message, $contact, $campaign_message );

		// Check if the message is in builder JSON format and render it to HTML
		// Pass footer_html so it gets injected before </body> tag
		// Use the original contact model for merge tags
		// IMPORTANT: Use render_builder_content_with_tracking() to capture conditional section IDs
		$renderer = null;
		$message  = $this->render_builder_content_with_tracking( $message, $contact_or_automation_contact, $campaign_message->id, $renderer, $footer_html );

		// Set channel context for merge tags
		add_filter( 'quillcrm_current_channel_context', array( $this, 'get_channel_context' ), 10 );

		// Process merge tags in both body and footer (if footer was injected)
		// Use the original contact model to support automation merge tags
		$processed_message = Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact_or_automation_contact );
		$processed_subject = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact_or_automation_contact );

		// Remove filter to prevent pollution
		remove_filter( 'quillcrm_current_channel_context', array( $this, 'get_channel_context' ), 10 );

		// Add click tracking to URLs in the message (if tracking class supports it)
		$tracking_class = $this->get_tracking_class();
		if ( method_exists( $tracking_class, 'add_click_tracking' ) ) {
			$tracked_message = $tracking_class::add_click_tracking( $processed_message, $campaign_message->hash_key );
		} else {
			$tracked_message = $processed_message;
		}

		// Add unsubscribe link if enabled (if tracking class supports it)
		if ( $add_unsubscribe && method_exists( $tracking_class, 'add_unsubscribe_link' ) ) {
			$tracked_message = $tracking_class::add_unsubscribe_link( $tracked_message, $campaign_message->hash_key );
		}

		return array(
			'subject'   => $processed_subject,
			'body'      => $tracked_message,
			'recipient' => $campaign_message->recipient,
			'hash_key'  => $campaign_message->hash_key,
		);
	}

	/**
	 * Prepare footer HTML for injection into builder emails
	 *
	 * IMPORTANT: This method is called BEFORE merge tags are processed in the body.
	 * We prepare the footer with merge tags here, but they will be processed later
	 * in prepare_message_content() along with the body content.
	 *
	 * @param string                       $message Original message content (JSON for builder, HTML for legacy)
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return string Footer HTML with tracking pixel (or empty if not builder email)
	 */
	private function prepare_footer_html( $message, Contact_Model $contact, Communication_Tracking_Model $campaign_message ) {
		// Check if message is builder format (JSON)
		$decoded          = json_decode( $message, true );
		$is_builder_email = ( json_last_error() === JSON_ERROR_NONE && isset( $decoded['type'] ) && $decoded['type'] === 'builder' );

		// Only prepare footer for builder emails
		// Non-builder emails use the old add_footer_and_tracking() method in send_message()
		if ( ! $is_builder_email ) {
			quillcrm_get_logger()->debug(
				'Skipping footer preparation - not a builder email',
				array(
					'source'   => 'email-campaign-processing',
					'is_json'  => ( json_last_error() === JSON_ERROR_NONE ),
					'has_type' => isset( $decoded['type'] ),
				)
			);
			return '';
		}

		// Get footer content (respecting settings hierarchy)
		if ( ! empty( $this->settings['email_footer'] ) ) {
			$email_footer  = $this->settings['email_footer'];
			$footer_source = 'campaign_settings';
		} else {
			$global_settings = \QuillCRM\Settings::get( 'email', array() );
			// Check if global setting has non-empty footer.
			if ( ! empty( $global_settings['email_footer'] ) ) {
				$email_footer  = $global_settings['email_footer'];
				$footer_source = 'global_settings';
			} else {
				// Use default footer if campaign and global settings are both empty.
				$email_footer  = Email_Tracking_Helper::get_default_footer();
				$footer_source = 'default';
			}
		}

		// Add tracking pixel to footer
		$tracking_pixel = sprintf(
			'<img src="%s" width="1" height="1" style="width:1px;height:1px;" alt="" />',
			home_url( '?quillcrm=email_open&hash_key=' . $campaign_message->hash_key )
		);

		$footer_html = $email_footer . $tracking_pixel;

		// Log footer preparation for debugging
		quillcrm_get_logger()->debug(
			'Prepared footer for builder email',
			array(
				'source'                    => 'email-campaign-processing',
				'footer_source'             => $footer_source,
				'footer_length'             => strlen( $footer_html ),
				'email_footer_length'       => strlen( $email_footer ),
				'has_unsubscribe_merge_tag' => ( strpos( $email_footer, '{{contact:unsubscribe_link}}' ) !== false ),
				'campaign_settings_empty'   => empty( $this->settings['email_footer'] ),
				'global_settings_empty'     => empty( $global_settings['email_footer'] ),
				'email_footer_preview'      => substr( $email_footer, 0, 100 ),
			)
		);

		// Return footer with tracking pixel
		// NOTE: Merge tags in footer will be processed in prepare_message_content()
		// after the builder content is rendered, ensuring consistent processing
		return $footer_html;
	}

	/**
	 * Send message
	 *
	 * @param array                        $message_data Prepared message data
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_message( $message_data, Contact_Model $contact, Communication_Tracking_Model $campaign_message ) {
		$template = null;
		$emails   = null;

		try {
			// Validate recipient email
			if ( ! filter_var( $contact->email, FILTER_VALIDATE_EMAIL ) ) {
				throw new \Exception( "Invalid email address: {$contact->email}" );
			}

			// Get template to access from_email settings early for debugging
			$template = $campaign_message->template;

			// Check if this is a builder email (complete HTML document)
			$is_builder_email = ( strpos( $message_data['body'], '<!DOCTYPE html' ) !== false || strpos( $message_data['body'], '<html' ) !== false );

			// For non-builder emails, add footer and tracking using the old method
			// Builder emails already have footer and tracking pixel injected during render
			if ( ! $is_builder_email ) {
				quillcrm_get_logger()->debug(
					'Using legacy footer method for non-builder email',
					array(
						'source'      => 'email-campaign-processing',
						'contact_id'  => $contact->id,
						'body_length' => strlen( $message_data['body'] ),
					)
				);

				// Build complete email message with footer and tracking (using shared helper)
				$complete_message = Email_Tracking_Helper::add_footer_and_tracking(
					$message_data['body'],
					$campaign_message,
					$contact,
					$this->settings
				);
			} else {
				quillcrm_get_logger()->debug(
					'Builder email detected - footer should already be injected',
					array(
						'source'             => 'email-campaign-processing',
						'contact_id'         => $contact->id,
						'body_length'        => strlen( $message_data['body'] ),
						'has_email_footer'   => ( strpos( $message_data['body'], '<!-- Email Footer -->' ) !== false ),
						'has_tracking_pixel' => ( strpos( $message_data['body'], 'quillcrm=email_open' ) !== false ),
					)
				);

				// Builder email - footer and tracking already injected
				$complete_message = $message_data['body'];
			}

			// Add click tracking to all links (using shared helper with UTM support)
			$complete_message = Email_Tracking_Helper::add_click_tracking(
				$complete_message,
				$campaign_message->hash_key,
				$contact,
				$template
			);

			$emails = new Emails();
			// Set from_email, from_name, and reply_to from template if available
			if ( $template && $template->get_setting( 'from_email' ) ) {
				$emails->from_address = $template->get_setting( 'from_email' );
			}
			if ( $template && $template->get_setting( 'from_name' ) ) {
				$emails->from_name = $template->get_setting( 'from_name' );
			}
			if ( $template && $template->get_setting( 'reply_to' ) ) {
				$emails->reply_to = $template->get_setting( 'reply_to' );
			}

			// Set unsubscribe URL for List-Unsubscribe header (RFC 8058 compliance)
			$emails->unsubscribe_url = add_query_arg(
				array(
					'quill-crm' => 'email_unsubscribe',
					'hash_key' => $campaign_message->hash_key,
				),
				home_url()
			);

			$result = $emails->send(
				$contact->email,
				$message_data['subject'],
				$complete_message
			);

			// Proper result validation - prevent false positives
			if ( is_wp_error( $result ) ) {
				throw new \Exception( 'WP Mail Error: ' . $result->get_error_message() );
			} elseif ( $result === false || $result === null ) {
				throw new \Exception( 'Email sending failed - wp_mail returned false' );
			}

			return array(
				'success'    => true,
				'message_id' => $result,
			);
		} catch ( \Exception $e ) {
			// Enhanced error logging with debugging information
			$debug_info = array(
				'code'                => 'email_send_error',
				'error'               => $e->getMessage(),
				'contact_id'          => $contact->id,
				'campaign_message_id' => $campaign_message->id,
				'recipient'           => $contact->email,
				'template_id'         => $campaign_message->template_id,
				'from_address'        => $emails->from_address ?? 'not set',
				'from_name'           => $emails->from_name ?? 'not set',
				'admin_email'         => get_option( 'admin_email' ),
				'quillsmtp_active'    => class_exists( 'QuillSMTP\\QuillSMTP' ),
				'wp_mail_available'   => function_exists( 'wp_mail' ),
				'template_settings'   => $template ? json_encode( $template->settings ) : 'no template',
			);

			quillcrm_get_logger()->error(
				__( 'Email send error with debug info.', 'quill-crm' ),
				$debug_info
			);


			return array(
				'success' => false,
				'error'   => $e->getMessage(),
				'debug'   => $debug_info,
			);
		}
	}

	/**
	 * Get tracking class
	 *
	 * @return string
	 */
	protected function get_tracking_class() {
		return Email::class;
	}

	/**
	 * Get default campaign content
	 *
	 * @return string
	 */
	protected function get_default_campaign_content() {
		if ( method_exists( $this, 'get_default_email_content' ) ) {
			return $this->get_default_email_content();
		}

		$greeting        = sprintf(
			/* translators: %1$s: first name merge tag, %2$s: last name merge tag */
			__( 'Hi %1$s %2$s,', 'quill-crm' ),
			'{{contact:first_name}}',
			'{{contact:last_name}}'
		);
		$thank_you       = __( 'Thank you for subscribing to our updates.', 'quill-crm' );
		$unsubscribe_txt = __( 'Unsubscribe', 'quill-crm' );

		return '<p>' . esc_html( $greeting ) . '</p><p>' . esc_html( $thank_you ) . '</p><p><a href="{{contact:unsubscribe_link}}">' . esc_html( $unsubscribe_txt ) . '</a></p>';
	}

	/**
	 * Get default email content
	 *
	 * @return string
	 */
	protected function get_default_email_content() {
		$greeting        = sprintf(
			/* translators: %1$s: first name merge tag, %2$s: last name merge tag */
			__( 'Hi %1$s %2$s,', 'quill-crm' ),
			'{{contact:first_name}}',
			'{{contact:last_name}}'
		);
		$thank_you       = __( 'Thank you for subscribing to our updates.', 'quill-crm' );
		$unsubscribe_msg = __( "Don't want to stay in the loop? We'll be sad to see you go, but you can click here to", 'quill-crm' );
		$unsubscribe_txt = __( 'unsubscribe', 'quill-crm' );

		$default_content = '<div><p>' . esc_html( $greeting ) . '</p><p>' . esc_html( $thank_you ) . '</p><p>' . esc_html( $unsubscribe_msg ) . ' <a href="{{contact:unsubscribe_link}}" target="_blank">' . esc_html( $unsubscribe_txt ) . '</a>.</p></div>';

		return apply_filters( 'quillcrm_default_email_content', $default_content );
	}
}
