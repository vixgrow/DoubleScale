<?php
/**
 * Template Field Mapper
 * Centralized configuration for template field mappings across campaign types
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Models\Template_Model;

/**
 * Template_Field_Mapper class
 * 
 * Provides a single source of truth for template field mappings
 * Used by both Campaign_Model (reading) and Template Processors (writing)
 */
class Template_Field_Mapper
{
    /**
     * Get field configuration for a campaign type
     *
     * @param string $campaign_type Campaign type (email, sms, whatsapp)
     * @return array Field configuration
     */
    public static function get_field_config($campaign_type)
    {
        $configs = array(
            'email' => array(
                'common_fields' => array('template_id', 'name', 'body', 'type'),
                'specific_fields' => array('subject'),
                'settings_fields' => array('from_name', 'from_email', 'reply_to', 'preview_text', 'enable_utm', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'),
            ),
            'sms' => array(
                'common_fields' => array('template_id', 'name', 'body', 'type'),
                'specific_fields' => array(),
                'settings_fields' => array('add_unsubscribe'),
            ),
            'whatsapp' => array(
                'common_fields' => array('template_id', 'name', 'body', 'type'),
                'specific_fields' => array(),
                'settings_fields' => array('add_unsubscribe'),
            ),
        );

        return $configs[$campaign_type] ?? array();
    }

    /**
     * Map template from database to API response format
     * Used by Campaign_Model::get_templates()
     *
     * @param Template_Model $template Template model from database
     * @param string $campaign_type Campaign type
     * @return array Formatted template data for API response
     */
    public static function template_to_array(Template_Model $template, $campaign_type)
    {
        $config = self::get_field_config($campaign_type);
        
        // Start with common fields - all types use 'body' consistently
        $template_data = array(
            'template_id' => $template->id,
            'name' => $template->name,
            'body' => $template->body,
            'type' => $template->type,
        );

        // Add specific fields (like 'subject' for email)
        foreach ($config['specific_fields'] as $field) {
            $template_data[$field] = $template->$field;
        }

        // Add settings object with nested fields
        $settings = array();
        foreach ($config['settings_fields'] as $field) {
            // Set defaults based on field type
            $default = null;
            if ($field === 'add_unsubscribe') {
                $default = true;
            } elseif ($field === 'enable_utm') {
                $default = false;
            } elseif (strpos($field, 'utm_') === 0) {
                $default = '';
            }
            $settings[$field] = $template->get_setting($field, $default);
        }
        $template_data['settings'] = $settings;

        return $template_data;
    }

    /**
     * Map API input data to database format
     * Used by Template Processors
     *
     * @param array $template_data Input data from API
     * @param string $campaign_type Campaign type
     * @return array Processed data ready for database storage
     */
    public static function array_to_template($template_data, $campaign_type)
    {
        $config = self::get_field_config($campaign_type);
        
        // Process name - use subject as fallback for email templates
        $name = $template_data['name'] ?? null;
        if (empty($name) && isset($template_data['subject'])) {
            $name = $template_data['subject'];
        }

        // All campaign types now use 'body' field consistently
        $body = $template_data['body'] ?? '';

        // Process subject (empty for SMS/WhatsApp)
        $subject = '';
        if (in_array('subject', $config['specific_fields'])) {
            $subject = $template_data['subject'] ?? '';
        }

        // Process settings - expect nested settings object
        $settings = array();
        $settings_data = $template_data['settings'] ?? array();

        foreach ($config['settings_fields'] as $field) {
            // Set defaults based on field type
            $default = null;
            if ($field === 'add_unsubscribe') {
                $default = true;
            } elseif ($field === 'enable_utm') {
                $default = false;
            } elseif (strpos($field, 'utm_') === 0) {
                $default = '';
            }
            $settings[$field] = $settings_data[$field] ?? $default;
        }

        return array(
            'name' => $name,
            'subject' => $subject,
            'body' => $body,
            'settings' => $settings,
        );
    }

    /**
     * Get all supported campaign types
     *
     * @return array List of campaign types
     */
    public static function get_supported_types()
    {
        return array('email', 'sms', 'whatsapp');
    }

    /**
     * Check if a field is a settings field for a campaign type
     *
     * @param string $field Field name
     * @param string $campaign_type Campaign type
     * @return bool True if field should be stored in settings
     */
    public static function is_settings_field($field, $campaign_type)
    {
        $config = self::get_field_config($campaign_type);
        return in_array($field, $config['settings_fields']);
    }
}
