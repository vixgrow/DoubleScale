<?php
/**
 * Campaign Rate Limiter Service
 * Handles daily rate limiting for all campaign types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Constants\Campaign_Channel;

/**
 * Campaign_Rate_Limiter class
 */
class Campaign_Rate_Limiter
{
    /**
     * Class Instance.
     *
     * @since 1.0.0
     *
     * @var Campaign_Rate_Limiter
     */
    private static $instance;

    /**
     * Campaign_Rate_Limiter Instance.
     *
     * Instantiates or reuses an instance of Campaign_Rate_Limiter.
     *
     * @since  1.0.0
     * @static
     *
     * @return self - Single instance
     */
    public static function instance()
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Normalize channel type to string
     * Converts integer channel constants to string slugs
     *
     * @since 1.0.0
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     *
     * @return string Normalized channel string ('email', 'sms', 'whatsapp')
     */
    private function normalize_channel_type($type)
    {
        // If already a string, return as-is
        if (is_string($type)) {
            return $type;
        }

        // If integer, convert to string using Campaign_Channel
        if (is_int($type)) {
            $channel_string = Campaign_Channel::to_string($type);
            if ($channel_string) {
                return $channel_string;
            }
        }

        // Fallback: cast to string (for backward compatibility)
        return (string) $type;
    }

    /**
     * Check if daily limit has been reached
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     * @param int        $max_per_day Maximum allowed per day
     *
     * @return bool True if limit reached
     */
    public function is_daily_limit_reached($type, $max_per_day)
    {
        $daily_count = $this->get_daily_count($type);
        return $daily_count >= $max_per_day;
    }

    /**
     * Get current daily count for campaign type
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     *
     * @return int Current daily count
     */
    public function get_daily_count($type)
    {
        $type = $this->normalize_channel_type($type);
        return (int) get_option("quillcrm_daily_{$type}_count", 0);
    }

    /**
     * Increment daily count for campaign type
     * Uses atomic increment to prevent race conditions
     *
     * @since 1.0.0
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     *
     * @return int New count after increment
     */
    public function increment_daily_count($type)
    {
        global $wpdb;

        $type = $this->normalize_channel_type($type);
        $option_name = "quillcrm_daily_{$type}_count";

        // Use database-level atomic increment to prevent race conditions
        // This ensures concurrent requests don't lose increments
        $result = $wpdb->query(
            $wpdb->prepare(
                "INSERT INTO {$wpdb->options} (option_name, option_value, autoload)
                VALUES (%s, 1, 'no')
                ON DUPLICATE KEY UPDATE option_value = option_value + 1",
                $option_name
            )
        );

        if ($result === false) {
            // Fallback to regular update if atomic increment fails
            quillcrm_get_logger()->warning(
                'Atomic increment failed, falling back to regular update',
                array(
                    'code' => 'rate_limiter_atomic_increment_failed',
                    'type' => $type,
                    'error' => $wpdb->last_error,
                )
            );

            $current_count = $this->get_daily_count($type);
            update_option($option_name, $current_count + 1, false);
            return $current_count + 1;
        }

        // Clear WordPress option cache to get fresh value from database
        // The atomic SQL update bypasses WordPress caching, so we need to invalidate it
        wp_cache_delete($option_name, 'options');

        // Get the new value after increment
        return $this->get_daily_count($type);
    }

    /**
     * Reset daily count for campaign type
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     *
     * @return void
     */
    public function reset_daily_count($type)
    {
        $type = $this->normalize_channel_type($type);
        update_option("quillcrm_daily_{$type}_count", 0, false);

        quillcrm_get_logger()->info(
            sprintf(__('Daily %s count reset.', 'quillcrm'), $type),
            array(
                'code' => "daily_{$type}_count_reset",
                'channel' => $type,
            )
        );
    }

    /**
     * Log daily limit reached
     *
     * @param int|string $type Campaign type (integer constant or string slug)
     * @param int        $daily_count Current count
     * @param int        $max_per_day Maximum allowed
     *
     * @return void
     */
    public function log_daily_limit_reached($type, $daily_count, $max_per_day)
    {
        $type = $this->normalize_channel_type($type);

        quillcrm_get_logger()->info(
            sprintf(__('Daily %s limit reached.', 'quillcrm'), $type),
            array(
                'code' => "daily_{$type}_limit_reached",
                'channel' => $type,
                'data' => array(
                    'daily_count' => $daily_count,
                    'max_per_day' => $max_per_day,
                ),
            )
        );
    }
}
