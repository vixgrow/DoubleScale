<?php
/**
 * Campaign Rate Limiter Service
 * Handles daily rate limiting for all campaign types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

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
     * Check if daily limit has been reached
     *
     * @param string $type Campaign type ('email', 'sms')
     * @param int    $max_per_day Maximum allowed per day
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
     * @param string $type Campaign type ('email', 'sms')
     *
     * @return int Current daily count
     */
    public function get_daily_count($type)
    {
        return get_option("quillcrm_daily_{$type}_count", 0);
    }

    /**
     * Increment daily count for campaign type
     *
     * @param string $type Campaign type ('email', 'sms')
     *
     * @return void
     */
    public function increment_daily_count($type)
    {
        $current_count = $this->get_daily_count($type);
        update_option("quillcrm_daily_{$type}_count", $current_count + 1);
    }

    /**
     * Reset daily count for campaign type
     *
     * @param string $type Campaign type ('email', 'sms')
     *
     * @return void
     */
    public function reset_daily_count($type)
    {
        update_option("quillcrm_daily_{$type}_count", 0);

        quillcrm_get_logger()->info(
            sprintf(__('Daily %s count reset.', 'quillcrm'), $type),
            array(
                'code' => "daily_{$type}_count_reset",
            )
        );
    }

    /**
     * Log daily limit reached
     *
     * @param string $type Campaign type ('email', 'sms')
     * @param int    $daily_count Current count
     * @param int    $max_per_day Maximum allowed
     *
     * @return void
     */
    public function log_daily_limit_reached($type, $daily_count, $max_per_day)
    {
        quillcrm_get_logger()->info(
            sprintf(__('Daily %s limit reached.', 'quillcrm'), $type),
            array(
                'code' => "daily_{$type}_limit_reached",
                'data' => array(
                    "daily_{$type}_count" => $daily_count,
                    "max_{$type}_per_day" => $max_per_day,
                ),
            )
        );
    }
}
