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

/**
 * Campaign_Contact_Filter class
 */
class Campaign_Contact_Filter
{
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
    public static function instance()
    {
        if (!self::$instance) {
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
    public function get_filtered_contacts($type, $filters = array())
    {
        $query = Contact_Model::where('status', 'subscribed');

        // Apply type-specific filtering
        switch ($type) {
            case 'email':
                $query->whereNotNull('email')
                      ->where('email', '!=', '');
                break;
            case 'sms':
            case 'whatsapp':
                $query->whereNotNull('phone')
                      ->where('phone', '!=', '');
                break;
        }

        // Apply custom filters if provided
        if (!empty($filters)) {
            $contact_filters = new Contact_Filters_Process($query, $filters);
            $query = $contact_filters->filter();
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
    public function get_contact_count($type, $filters = array())
    {
        return $this->get_filtered_contacts($type, $filters)->count();
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
    public function get_contacts_for_processing($type, $filters = array(), $offset = 0, $limit = 10)
    {
        return $this->get_filtered_contacts($type, $filters)
                    ->offset($offset)
                    ->limit($limit)
                    ->get();
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
    public function log_skipped_contact($contact_id, $campaign_id, $type, $reason)
    {
        quillcrm_get_logger()->info(
            sprintf(__('Contact skipped - %s', 'quillcrm'), $reason),
            array(
                'contact_id' => $contact_id,
                'campaign_id' => $campaign_id,
                'type' => $type,
            )
        );
    }
}
