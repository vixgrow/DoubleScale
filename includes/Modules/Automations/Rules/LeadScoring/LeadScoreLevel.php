<?php

/**
 * Class LeadScoreLevel
 *
 * This class is responsible for handling the contact lead score level rule
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Rules\LeadScoring;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Automations\Abstracts\Rule;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\LeadScoring\Models\LeadScoringRuleLevelModel;

/**
 * Lead Score Level class
 */
class LeadScoreLevel extends Rule
{

    /**
     * Name
     *
     * @var string
     *
     * @since 1.0.0
     */
    public $name = 'Level';

    /**
     * Slug
     *
     * @var string
     *
     * @since 1.0.0
     */
    public $slug = 'lead_score_level';

    /**
     * Group
     *
     * @var string
     *
     * @since 1.0.0
     */
    public $group = 'lead_scoring';

    /**
     * Type
     *
     * @var string
     *
     * @since 1.0.0
     */
    public $type = 'select';

    /**
     * Is automation rule
     *
     * @var boolean
     *
     * @since 1.0.0
     */
    public $is_automation = false;

    /**
     * Get options
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function get_options()
    {
        $levels  = LeadScoringRuleLevelModel::orderBy('points', 'asc')->get();
        $options = array();

        foreach ($levels as $level) {
            $options[$level->id] = $level->name . ' (' . $level->points . '+ pts)';
        }

        return $options;
    }


    /**
     * Get operators
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function get_operators()
    {
        return array(
            'is'           => __('Is', 'doublescale'),
            'is_not'       => __('Is not', 'doublescale'),
        );
    }

    /**
     * Get value
     *
     * @since 1.0.0
     *
     * @param AutomationContactModel $automation_contact Contact Model.
     *
     * @return int|null
     */
    public function get_value($automation_contact)
    {
        $contact = $automation_contact->contact;

        if (! $contact) {
            return null;
        }

        // Get lead score data from contact meta
        $lead_score_level_id = \doublescale_get_contact_meta($contact->id, 'lead_score_level_id', true);

        if (! $lead_score_level_id) {
            return null;
        }

        return $lead_score_level_id;
    }

    /**
     * Is met
     *
     * @since 1.0.0
     *
     * @param AutomationContactModel $automation_contact Contact Model.
     * @param array                    $rule Rule.
     *
     * @return bool
     */
    public function is_met(AutomationContactModel $automation_contact, $rule = array())
    {
        $value = $this->get_value($automation_contact);
        $operator = $rule['operator'] ?? 'is';
        $rule_value = $rule['value'] ?? '';

        if (is_array($rule_value) && isset($rule_value['value'])) {
            $rule_value = $rule_value['value'];
        }
        if (is_object($rule_value) && isset($rule_value->value)) {
            $rule_value = $rule_value->value;
        }

        $operator = (string) $operator;
        $map = array(
            'equals' => 'is',
            '=' => 'is',
            'not_equals' => 'is_not',
            '!=' => 'is_not',
        );
        if (isset($map[ $operator ])) {
            $operator = $map[ $operator ];
        }

        switch ($operator) {
            case 'is':
                return (int) $value === (int) $rule_value;
            case 'is_not':
                return (int) $value !== (int) $rule_value;
            default:
                return false;
        }
    }
}

