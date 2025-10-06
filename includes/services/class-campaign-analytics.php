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
			case 'email':
				return Tracking_Model::emails();
			case 'sms':
				return Tracking_Model::sms();
			case 'whatsapp':
				return Tracking_Model::whatsapp();
			default:
				throw new \InvalidArgumentException( "Unsupported campaign type: {$type}" );
		}
	}

	/**
	 * Get analytics data for campaign type
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
		$data      = array();

		foreach ( $dates['dates'] as $date ) {
			switch ( $date_type ) {
				case 'hour':
					$end_hour      = date( 'Y-m-d H:i:s', strtotime( $date . ' +1 hour' ) );
					$data[ $date ] = $query->whereBetween( 'created_at', array( $date, $end_hour ) )->count();
					break;
				case 'day':
					$start_of_day  = $date . ' 00:00:00';
					$end_of_day    = $date . ' 23:59:59';
					$data[ $date ] = $query->whereBetween( 'created_at', array( $start_of_day, $end_of_day ) )->count();
					break;
				case 'month':
					$start_of_month = date( 'Y-m-01 00:00:00', strtotime( $date ) );
					$end_of_month   = date( 'Y-m-t 23:59:59', strtotime( $date ) );
					$data[ $date ]  = $query->whereBetween( 'created_at', array( $start_of_month, $end_of_month ) )->count();
					break;
				case 'year':
					$start_of_year = date( 'Y-01-01 00:00:00', strtotime( $date ) );
					$end_of_year   = date( 'Y-12-31 23:59:59', strtotime( $date ) );
					$data[ $date ] = $query->whereBetween( 'created_at', array( $start_of_year, $end_of_year ) )->count();
					break;
			}
		}

		$totals = $this->get_total_stats( $type, $start_date, $end_date );

		return array(
			$type  => $data,
			'data' => $dates,
		) + $totals;
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
		$result = $base_query->selectRaw( 'COUNT(*) as total, SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending' )->first();

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
			->selectRaw( 'COUNT(*) as total, SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent, SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending' )
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
		// Build base query with all common filters
		$base_query = $this->get_model_query( $type );

		if ( $campaign_id ) {
			$base_query->where( 'source_id', $campaign_id )
				->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN );
		}

		if ( $start_date && $end_date ) {
			$base_query->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );
		}

		// Optimized: Single query per type with aggregate functions
		if ( $type === 'email' ) {
			$result = $base_query->selectRaw( 'SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as opened, SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked' )->first();

			$stats['opened']  = (int) $result->opened;
			$stats['clicked'] = (int) $result->clicked;

		} elseif ( $type === 'sms' ) {
			$result = $base_query->selectRaw( 'SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked, SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as delivered' )->first();

			$stats['clicked']   = (int) $result->clicked;
			$stats['delivered'] = (int) $result->delivered;
			$stats              = $this->calculate_sms_rates( $stats );

		} elseif ( $type === 'whatsapp' ) {
			$result = $base_query->selectRaw( 'SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked, SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as delivered, SUM(CASE WHEN status = "read" THEN 1 ELSE 0 END) as read_count' )->first();

			$stats['clicked']   = (int) $result->clicked;
			$stats['delivered'] = (int) $result->delivered;
			$stats['read']      = (int) $result->read_count;
			$stats              = $this->calculate_whatsapp_rates( $stats );
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
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        ";

		if ( $type === 'email' ) {
			$select_fields .= ',
                SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked
            ';
		} elseif ( $type === 'sms' ) {
			$select_fields .= ',
                SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked
            ';
		}

		$results = $query->selectRaw( $select_fields )
			->where( 'source_id', $campaign_id )
			->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN )
			->whereNotNull( 'sent_at' )
			->groupBy( 'period' )
			->orderBy( 'period', 'DESC' )
			->limit( $limit )
			->get();

		return $results->toArray();
	}
}
