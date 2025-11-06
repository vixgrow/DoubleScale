<?php
/**
 * Message Source Types Constants
 * Defines the different sources from which messages can originate
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Constants;

/**
 * Message Source Types class
 */
class Message_Source_Types
{
    /**
     * Campaign source - Regular campaigns sent to multiple contacts
     */
    const CAMPAIGN = 1;

    /**
     * Automation source - Messages sent as part of automation sequences
     */
    const AUTOMATION = 2;

    /**
     * Individual source - Individual/manual messages sent from contact page
     */
    const INDIVIDUAL = 3;

    /**
     * Get all source types
     *
     * @return array
     */
    public static function get_all_types()
    {
        return [
            self::CAMPAIGN => __('Campaign', 'quillcrm'),
            self::AUTOMATION => __('Automation', 'quillcrm'),
            self::INDIVIDUAL => __('Individual', 'quillcrm'),
        ];
    }

    /**
     * Get source type label
     *
     * @param int $type Source type constant
     * @return string
     */
    public static function get_type_label($type)
    {
        $types = self::get_all_types();
        return isset($types[$type]) ? $types[$type] : __('Unknown', 'quillcrm');
    }

    /**
     * Check if source type is valid
     *
     * @param int $type Source type to validate
     * @return bool
     */
    public static function is_valid_type($type)
    {
        return array_key_exists($type, self::get_all_types());
    }

    /**
     * Check if source type supports analytics tracking
     *
     * @param int $type Source type
     * @return bool
     */
    public static function supports_analytics($type)
    {
        return in_array($type, [self::CAMPAIGN, self::AUTOMATION, self::INDIVIDUAL]);
    }

    /**
     * Get default source type
     *
     * @return int
     */
    public static function get_default_type()
    {
        return self::CAMPAIGN;
    }
}
