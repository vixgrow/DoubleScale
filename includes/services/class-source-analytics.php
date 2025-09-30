<?php
/**
 * Source Analytics Service
 * Provides analytics and reporting based on message source types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Models\Tracking_Model;
use QuillCRM\Constants\Message_Source_Types;

/**
 * Source Analytics class
 */
class Source_Analytics
{
    /**
     * Class Instance.
     *
     * @since 1.0.0
     *
     * @var Source_Analytics
     */
    private static $instance;

    /**
     * Source Analytics Instance.
     *
     * @since  1.0.0
     *
     * @return Source_Analytics
     */
    public static function instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Get analytics by source type
     *
     * @param int $source_type Source type constant
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @return array
     */
    public function get_analytics_by_source_type($source_type, $start_date = null, $end_date = null)
    {
        $query = Tracking_Model::bySourceType($source_type);

        if ($start_date) {
            $query->where('created_at', '>=', $start_date);
        }

        if ($end_date) {
            $query->where('created_at', '<=', $end_date);
        }

        $total_sent = $query->where('status', 'sent')->count();
        $total_opened = $query->where('opened', 1)->count();
        $total_clicked = $query->where('clicked', 1)->count();

        $open_rate = $total_sent > 0 ? round(($total_opened / $total_sent) * 100, 2) : 0;
        $click_rate = $total_sent > 0 ? round(($total_clicked / $total_sent) * 100, 2) : 0;

        return [
            'source_type' => $source_type,
            'source_label' => Message_Source_Types::get_type_label($source_type),
            'total_sent' => $total_sent,
            'total_opened' => $total_opened,
            'total_clicked' => $total_clicked,
            'open_rate' => $open_rate,
            'click_rate' => $click_rate,
        ];
    }

    /**
     * Get campaign analytics by source
     *
     * @param int $source_type Source type constant
     * @param int $source_id Source ID
     * @return array
     */
    public function get_campaign_analytics_by_source($source_type, $source_id)
    {
        $messages = Tracking_Model::bySource($source_type, $source_id)->get();

        $analytics = [
            'source_type' => $source_type,
            'source_id' => $source_id,
            'source_label' => Message_Source_Types::get_type_label($source_type),
            'total_messages' => $messages->count(),
            'by_mode' => [],
            'by_status' => [],
            'engagement' => [
                'opened' => 0,
                'clicked' => 0,
                'open_rate' => 0,
                'click_rate' => 0,
            ],
        ];

        $sent_count = 0;
        $opened_count = 0;
        $clicked_count = 0;

        foreach ($messages as $message) {
            // Count by mode
            $mode_label = $message->get_mode_label();
            if (!isset($analytics['by_mode'][$mode_label])) {
                $analytics['by_mode'][$mode_label] = 0;
            }
            $analytics['by_mode'][$mode_label]++;

            // Count by status
            if (!isset($analytics['by_status'][$message->status])) {
                $analytics['by_status'][$message->status] = 0;
            }
            $analytics['by_status'][$message->status]++;

            // Count engagement
            if ($message->status === 'sent') {
                $sent_count++;
                if ($message->opened) {
                    $opened_count++;
                }
                if ($message->clicked) {
                    $clicked_count++;
                }
            }
        }

        $analytics['engagement']['opened'] = $opened_count;
        $analytics['engagement']['clicked'] = $clicked_count;
        $analytics['engagement']['open_rate'] = $sent_count > 0 ? round(($opened_count / $sent_count) * 100, 2) : 0;
        $analytics['engagement']['click_rate'] = $sent_count > 0 ? round(($clicked_count / $sent_count) * 100, 2) : 0;

        return $analytics;
    }

    /**
     * Get overview analytics for all source types
     *
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @return array
     */
    public function get_overview_analytics($start_date = null, $end_date = null)
    {
        $overview = [];
        $source_types = Message_Source_Types::get_all_types();

        foreach ($source_types as $type => $label) {
            $overview[$type] = $this->get_analytics_by_source_type($type, $start_date, $end_date);
        }

        return $overview;
    }

    /**
     * Get top performing sources
     *
     * @param string $metric Metric to sort by ('open_rate', 'click_rate', 'total_sent')
     * @param int $limit Number of results to return
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @return array
     */
    public function get_top_performing_sources($metric = 'open_rate', $limit = 10, $start_date = null, $end_date = null)
    {
        global $wpdb;

        $date_condition = '';
        if ($start_date && $end_date) {
            $date_condition = $wpdb->prepare(" AND created_at BETWEEN %s AND %s", $start_date, $end_date);
        }

        $sql = "
            SELECT 
                source_type,
                source_id,
                COUNT(*) as total_sent,
                SUM(opened) as total_opened,
                SUM(clicked) as total_clicked,
                ROUND((SUM(opened) / COUNT(*)) * 100, 2) as open_rate,
                ROUND((SUM(clicked) / COUNT(*)) * 100, 2) as click_rate
            FROM {$wpdb->prefix}quillcrm_campaign_messages 
            WHERE status = 'sent' {$date_condition}
            GROUP BY source_type, source_id
            ORDER BY {$metric} DESC
            LIMIT %d
        ";

        $results = $wpdb->get_results($wpdb->prepare($sql, $limit));

        foreach ($results as &$result) {
            $result->source_label = Message_Source_Types::get_type_label($result->source_type);
        }

        return $results;
    }

    /**
     * Compare performance between source types
     *
     * @param array $source_types Array of source type constants to compare
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @return array
     */
    public function compare_source_types($source_types, $start_date = null, $end_date = null)
    {
        $comparison = [];

        foreach ($source_types as $source_type) {
            $comparison[] = $this->get_analytics_by_source_type($source_type, $start_date, $end_date);
        }

        // Sort by open rate descending
        usort($comparison, function($a, $b) {
            return $b['open_rate'] <=> $a['open_rate'];
        });

        return $comparison;
    }
}
