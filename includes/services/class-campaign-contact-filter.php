<?php
/**
 * Campaign Contact Filter Service
 * Handles contact filtering for all campaign types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Models\Contact_Model;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Campaign_Contact_Filter class
 */
class Campaign_Contact_Filter {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Campaign_Contact_Filter
	 */
	private static $instance;

	/**
	 * Campaign_Contact_Filter Instance.
	 *
	 * Instantiates or reuses an instance of Campaign_Contact_Filter.
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
	 * Get filtered contacts for campaign
	 *
	 * @param string $type Campaign type ('email', 'sms', 'whatsapp')
	 * @param array  $filters Campaign filters
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function get_filtered_contacts( $type, $filters = array() ) {
		// VALIDATE channel type first
		if ( ! in_array( $type, array( 'email', 'sms', 'whatsapp' ), true ) ) {
			// Return empty query for invalid channel
			return Contact_Model::whereRaw( '1 = 0' );
		}

		// Determine channel-specific status field
		$channel_status_field = $type . '_status';

		// Start query - only check channel-specific status
		// Only 'subscribed' contacts can receive messages
		$query = Contact_Model::where( $channel_status_field, 'subscribed' );

		// Apply type-specific filtering (email/phone availability)
		$query = $this->apply_campaign_type_filter( $query, $type );

		// Apply custom filters if provided
		if ( ! empty( $filters ) ) {
			$contact_filters = new Contact_Filters_Process( $query, $filters );
			$query           = $contact_filters->filter();
		}

		return $query;
	}

	/**
	 * Get contact count for campaign
	 *
	 * @param string $type Campaign type ('email', 'sms', 'whatsapp')
	 * @param array  $filters Campaign filters
	 *
	 * @return int Contact count
	 */
	public function get_contact_count( $type, $filters = array() ) {
		return $this->get_filtered_contacts( $type, $filters )->count();
	}

	/**
	 * Get paginated contacts for processing
	 *
	 * @param string $type Campaign type ('email', 'sms', 'whatsapp')
	 * @param array  $filters Campaign filters
	 * @param int    $offset Starting offset
	 * @param int    $limit Number of contacts to fetch
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function get_contacts_for_processing( $type, $filters = array(), $offset = 0, $limit = 10 ) {
		return $this->get_filtered_contacts( $type, $filters )
					->offset( $offset )
					->limit( $limit )
					->get();
	}

	/**
	 * Apply campaign type filter to query
	 * Filters contacts based on whether they have email or phone
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder instance
	 * @param string                                $type Campaign type ('email', 'sms', 'whatsapp')
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function apply_campaign_type_filter( $query, $type ) {
		// Ensure type is in integer format (handles both string and int input)
		$channel_int = Campaign_Channel::ensure_integer( $type );

		// If invalid channel, return query unchanged
		if ( null === $channel_int ) {
			return $query;
		}

		// Use Campaign_Channel to determine recipient field (DRY principle)
		$recipient_field = Campaign_Channel::get_recipient_field( $channel_int );

		$query->whereNotNull( $recipient_field )
			  ->where( $recipient_field, '!=', '' );

		return $query;
	}

	/**
	 * Skip contact with logging
	 *
	 * @param int    $contact_id Contact ID
	 * @param int    $campaign_id Campaign ID
	 * @param string $type Campaign type
	 * @param string $reason Skip reason
	 *
	 * @return void
	 */
	public function log_skipped_contact( $contact_id, $campaign_id, $type, $reason ) {
		quillcrm_get_logger()->info(
			sprintf( __( 'Contact skipped - %s', 'quillcrm' ), $reason ),
			array(
				'contact_id'  => $contact_id,
				'campaign_id' => $campaign_id,
				'type'        => $type,
			)
		);
	}
}
