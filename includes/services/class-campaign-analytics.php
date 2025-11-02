<?php
/**
 * Campaign Analytics Service
 * Handles analytics for all campaign types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Utils;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Campaign_Analytics class
 */
class Campaign_Analytics {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Campaign_Analytics
	 */
	private static $instance;

	/**
	 * Campaign_Analytics Instance.
	 *
	 * Instantiates or reuses an instance of Campaign_Analytics.
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
	 * Get model query for campaign type
	 *
	 * @param string $type Campaign type ('email', 'sms', 'whatsapp')
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_model_query( $type ) {
		switch ( $type ) {
			case Campaign_Channel::CHANNEL_EMAIL:
			case Campaign_Channel::CHANNEL_EMAIL_SEQUENCE:
			case Campaign_Channel::CHANNEL_SEQUENCE_MAIL:
				return Tracking_Model::emails();
			case Campaign_Channel::CHANNEL_SMS:
				return Tracking_Model::sms();
			case Campaign_Channel::CHANNEL_WHATSAPP:
				return Tracking_Model::whatsapp();
			default:
				throw new \InvalidArgumentException( "Unsupported campaign type: {$type}" );
		}
	}

	/**
	 * Get analytics data for campaign type
	 * Optimized to use single GROUP BY query instead of N+1 queries
	 *
	 * @param string $type Campaign type ('email', 'sms')
	 * @param string $interval Analytics interval
	 * @param string $start_date Start date
	 * @param string $end_date End date
	 *
	 * @return array Analytics data
	 */
	public function get_analytics( $type, $interval = 'last_30_days', $start_date = '', $end_date = '' ) {
		$query = $this->get_model_query( $type );

		if ( 'custom' !== $interval ) {
			$start_date = Utils::get_start_date( $interval, $start_date );
			$end_date   = Utils::get_end_date( $interval, $end_date );
		}

		$dates     = Utils::get_dates_between_dates( $start_date, $end_date );
		$date_type = $dates['type'] ?? 'hour';

		// Determine the MySQL date format based on interval type
		$date_formats = array(
			'hour'  => '%Y-%m-%d %H:00:00',
			'day'   => '%Y-%m-%d',
			'month' => '%Y-%m',
			'year'  => '%Y',
		);

		$format = $date_formats[ $date_type ] ?? $date_formats['day'];

		// Optimized: Single GROUP BY query instead of N queries
		$results = $query
			->selectRaw( "DATE_FORMAT(created_at, '{$format}') as period, COUNT(*) as count" )
			->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) )
			->groupBy( 'period' )
			->orderBy( 'period', 'ASC' )
			->get();

		// Convert results to associative array with date as key
		$data = array();
		foreach ( $results as $result ) {
			$data[ $result->period ] = (int) $result->count;
		}

		// Fill in missing dates with zero counts
		foreach ( $dates['dates'] as $date ) {
			$period_key = $this->format_date_for_period( $date, $date_type );
			if ( ! isset( $data[ $period_key ] ) ) {
				$data[ $period_key ] = 0;
			}
		}

		// Sort by date to ensure proper order
		ksort( $data );

		$totals = $this->get_total_stats( $type, $start_date, $end_date );

		return array(
			$type  => $data,
			'data' => $dates,
		) + $totals;
	}

	/**
	 * Format date string to match the period format used in GROUP BY query
	 *
	 * @param string $date Date string
	 * @param string $period_type Period type ('hour', 'day', 'month', 'year')
	 *
	 * @return string Formatted date string
	 */
	protected function format_date_for_period( $date, $period_type ) {
		$timestamp = strtotime( $date );

		switch ( $period_type ) {
			case 'hour':
				return date( 'Y-m-d H:00:00', $timestamp );
			case 'day':
				return date( 'Y-m-d', $timestamp );
			case 'month':
				return date( 'Y-m', $timestamp );
			case 'year':
				return date( 'Y', $timestamp );
			default:
				return date( 'Y-m-d', $timestamp );
		}
	}

	/**
	 * Get total statistics for campaign type
	 * Optimized to use single query instead of multiple clones
	 *
	 * @param string $type Campaign type ('email', 'sms')
	 * @param string $start_date Start date for filtering (optional)
	 * @param string $end_date End date for filtering (optional)
	 *
	 * @return array Total statistics
	 */
	public function get_total_stats( $type, $start_date = null, $end_date = null ) {
		// Create base query with optional date filtering
		$base_query = $this->get_model_query( $type );
		if ( $start_date && $end_date ) {
			$base_query->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );
		}

		// Optimized: Single query with aggregate functions instead of multiple clones
		$result = $base_query->selectRaw( 'COUNT(*) as total, SUM(CASE WHEN status = ' . Tracking_Status::SENT . ' THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status = ' . Tracking_Status::FAILED . ' THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = ' . Tracking_Status::PENDING . ' THEN 1 ELSE 0 END) as pending' )->first();

		$stats = array(
			'total'   => (int) $result->total,
			'sent'    => (int) $result->sent,
			'failed'  => (int) $result->failed,
			'pending' => (int) $result->pending,
		);

		return $this->add_type_specific_stats( $stats, $type, null, $start_date, $end_date );
	}

	/**
	 * Get campaign-specific statistics
	 * Optimized to use single query instead of multiple separate queries
	 *
	 * @param string $type Campaign type ('email', 'sms')
	 * @param int    $campaign_id Campaign ID (maps to source_id in tracking)
	 *
	 * @return array Campaign statistics
	 */
	public function get_campaign_stats( $type, $campaign_id ) {
		$query = $this->get_model_query( $type );

		// Optimized: Single query with aggregate functions
		$result = $query->where( 'source_id', $campaign_id )
			->where( 'source_type', Message_Source_Types::CAMPAIGN )
			->selectRaw( 'COUNT(*) as total, SUM(CASE WHEN status = ' . Tracking_Status::SENT . ' THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status = ' . Tracking_Status::FAILED . ' THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = ' . Tracking_Status::PENDING . ' THEN 1 ELSE 0 END) as pending' )
			->first();

		$stats = array(
			'total'   => (int) $result->total,
			'sent'    => (int) $result->sent,
			'failed'  => (int) $result->failed,
			'pending' => (int) $result->pending,
		);

		return $this->add_type_specific_stats( $stats, $type, $campaign_id );
	}

	/**
	 * Add type-specific statistics to base stats
	 *
	 * @param array  $stats Base statistics
	 * @param string $type Campaign type ('email', 'sms')
	 * @param int    $campaign_id Optional campaign ID for filtering (maps to source_id in tracking)
	 * @param string $start_date Optional start date for filtering
	 * @param string $end_date Optional end date for filtering
	 *
	 * @return array Enhanced statistics with type-specific data
	 */
	protected function add_type_specific_stats( $stats, $type, $campaign_id = null, $start_date = null, $end_date = null ) {
		global $wpdb;

		// Get table names for JOIN
		$contacts_table = $wpdb->prefix . 'quillcrm_contacts';
		$tracking_table = $wpdb->prefix . 'quillcrm_tracking';

		// Build base query with all common filters
		$base_query = $this->get_model_query( $type );

		if ( $campaign_id ) {
			$base_query->where( $tracking_table . '.source_id', $campaign_id )
				->where( $tracking_table . '.source_type', Message_Source_Types::CAMPAIGN );
		}

		if ( $start_date && $end_date ) {
			$base_query->whereBetween( $tracking_table . '.created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );
		}

		// Optimized: Single query per type with aggregate functions, including unsubscribe tracking
		if ( $type === Campaign_Channel::CHANNEL_EMAIL || $type === Campaign_Channel::CHANNEL_EMAIL_SEQUENCE || $type === Campaign_Channel::CHANNEL_SEQUENCE_MAIL ) {
			$result = $base_query
				->leftJoin( $contacts_table . ' as contacts', $tracking_table . '.contact_id', '=', 'contacts.id' )
				->selectRaw(
					"
					SUM(CASE WHEN {$tracking_table}.opened = 1 THEN 1 ELSE 0 END) as opened,
					SUM(CASE WHEN {$tracking_table}.clicked = 1 THEN 1 ELSE 0 END) as clicked,
					SUM(CASE WHEN contacts.status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed
				"
				)
				->first();

			$stats['opened']       = (int) $result->opened;
			$stats['clicked']      = (int) $result->clicked;
			$stats['unsubscribed'] = (int) $result->unsubscribed;

		} elseif ( $type === Campaign_Channel::CHANNEL_SMS ) {
			$result = $base_query
				->leftJoin( $contacts_table . ' as contacts', $tracking_table . '.contact_id', '=', 'contacts.id' )
				->selectRaw(
					"
					SUM(CASE WHEN {$tracking_table}.clicked = 1 THEN 1 ELSE 0 END) as clicked,
					SUM(CASE WHEN {$tracking_table}.status = " . Tracking_Status::DELIVERED . ' THEN 1 ELSE 0 END) as delivered,
					SUM(CASE WHEN contacts.status = \'unsubscribed\' THEN 1 ELSE 0 END) as unsubscribed
				'
				)
				->first();

			$stats['clicked']      = (int) $result->clicked;
			$stats['delivered']    = (int) $result->delivered;
			$stats['unsubscribed'] = (int) $result->unsubscribed;
			$stats                 = $this->calculate_sms_rates( $stats );

		} elseif ( $type === Campaign_Channel::CHANNEL_WHATSAPP ) {
			$result = $base_query
				->leftJoin( $contacts_table . ' as contacts', $tracking_table . '.contact_id', '=', 'contacts.id' )
				->selectRaw(
					"
					SUM(CASE WHEN {$tracking_table}.clicked = 1 THEN 1 ELSE 0 END) as clicked,
					SUM(CASE WHEN {$tracking_table}.status = " . Tracking_Status::DELIVERED . ' THEN 1 ELSE 0 END) as delivered,
					SUM(CASE WHEN ' . $tracking_table . '.status = ' . Tracking_Status::READ . ' THEN 1 ELSE 0 END) as read,
					SUM(CASE WHEN contacts.status = \'unsubscribed\' THEN 1 ELSE 0 END) as unsubscribed
				'
				)
				->first();

			$stats['clicked']      = (int) $result->clicked;
			$stats['delivered']    = (int) $result->delivered;
			$stats['read']         = (int) $result->read;
			$stats['unsubscribed'] = (int) $result->unsubscribed;
			$stats                 = $this->calculate_whatsapp_rates( $stats );
		}

		return $stats;
	}

	/**
	 * Calculate SMS-specific rates
	 *
	 * @param array $stats Base statistics
	 *
	 * @return array Statistics with calculated rates
	 */
	protected function calculate_sms_rates( $stats ) {
		// Calculate delivery rate (delivered / sent)
		$stats['delivery_rate'] = $stats['sent'] > 0
			? round( ( $stats['delivered'] / $stats['sent'] ) * 100, 2 )
			: 0;

		// Calculate click rate (clicked / sent)
		$stats['click_rate'] = $stats['sent'] > 0
			? round( ( $stats['clicked'] / $stats['sent'] ) * 100, 2 )
			: 0;

		return $stats;
	}

	/**
	 * Calculate WhatsApp-specific rates
	 *
	 * @param array $stats Base statistics
	 *
	 * @return array Statistics with calculated rates
	 */
	protected function calculate_whatsapp_rates( $stats ) {
		// Calculate delivery rate (delivered / sent)
		$stats['delivery_rate'] = $stats['sent'] > 0
			? round( ( $stats['delivered'] / $stats['sent'] ) * 100, 2 )
			: 0;

		// Calculate read rate (read / delivered)
		$stats['read_rate'] = $stats['delivered'] > 0
			? round( ( $stats['read'] / $stats['delivered'] ) * 100, 2 )
			: 0;

		// Calculate click rate (clicked / sent)
		$stats['click_rate'] = $stats['sent'] > 0
			? round( ( $stats['clicked'] / $stats['sent'] ) * 100, 2 )
			: 0;

		return $stats;
	}

	/**
	 * Get time-series analytics for campaign
	 *
	 * @param int    $campaign_id Campaign ID (maps to source_id in tracking)
	 * @param string $type Campaign type ('email', 'sms')
	 * @param string $period Time period ('hour', 'day', 'week', 'month')
	 * @param int    $limit Number of periods to return
	 *
	 * @return array Time-series analytics data
	 */
	public function get_campaign_time_series( $campaign_id, $type, $period = 'day', $limit = 30 ) {
		$query = $this->get_model_query( $type );

		$date_formats = array(
			'hour'  => '%Y-%m-%d %H:00:00',
			'day'   => '%Y-%m-%d',
			'week'  => '%Y-%u',
			'month' => '%Y-%m',
		);

		$format = $date_formats[ $period ] ?? $date_formats['day'];

		$select_fields = "
            DATE_FORMAT(sent_at, '{$format}') as period,
            COUNT(*) as total_sent,
            SUM(CASE WHEN status = " . Tracking_Status::SENT . ' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = ' . Tracking_Status::FAILED . ' THEN 1 ELSE 0 END) as failed
        ';

		if ( $type === Campaign_Channel::CHANNEL_EMAIL ) {
			$select_fields .= ',
                SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked
            ';
		} elseif ( $type === Campaign_Channel::CHANNEL_SMS ) {
			$select_fields .= ',
                SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked
            ';
		}

		$results = $query->selectRaw( $select_fields )
			->where( 'source_id', $campaign_id )
			->where( 'source_type', Message_Source_Types::CAMPAIGN )
			->whereNotNull( 'sent_at' )
			->groupBy( 'period' )
			->orderBy( 'period', 'DESC' )
			->limit( $limit )
			->get();

		return $results->toArray();
	}
}
