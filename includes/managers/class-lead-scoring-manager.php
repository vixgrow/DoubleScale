<?php


/**
 * Class Lead_Scoring_Manager
 *
 * This class is responsible for handling the Lead Scoring Manager
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use QuillCRM\Models\Lead_Scoring_Rule_Model;
use QuillCRM\Models\Lead_Scoring_Rule_Level_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Automations\Conditions\Process as Process_Conditions;

class Lead_Scoring_Manager {


	/**
	 * Get the lead score points for a contact
	 *
	 * @param int|\QuillCRM\Models\Contact_Model $contact Contact ID or Contact Model.
	 *
	 * @since 1.0.0
	 *
	 * @return int The lead score points
	 */
	public static function get_lead_score_points( $contact ) {
		// Get contact model if ID is provided
		if ( is_numeric( $contact ) ) {
			$contact = Contact_Model::find( $contact );
		}

		if ( ! $contact || ! $contact->exists ) {
			return 0;
		}

		// Get all active rules
		$rules = Lead_Scoring_Rule_Model::get_active_rules();

		$score = 0;

		foreach ( $rules as $rule ) {
			// Get the settings (filters/conditions) for this rule
			$filters = $rule->settings ?? array();

			if ( empty( $filters ) ) {
				continue;
			}

			// Create an automation contact to check against rules
			$automation_contact             = new Automation_Contact_Model();
			$automation_contact->contact_id = $contact->id;

			// Check if the contact matches the given filters using the condition processor
			$processor = new Process_Conditions( $automation_contact, $filters );
			$matches   = $processor->Check();

			// Contact matches the given filters
			if ( $matches ) {
				// Add or subtract points
				if ( $rule->is_adding_points() ) {
					$score += $rule->points;
				} else {
					$score -= $rule->points;
				}
			}
		}

		// Score can't be less than 0
		if ( $score < 0 ) {
			$score = 0;
		}

		return $score;
	}

	/**
	 * Get the lead score and level for a contact
	 *
	 * @param int|\QuillCRM\Models\Contact_Model $contact Contact ID or Contact Model.
	 *
	 * @since 1.0.0
	 *
	 * @return array|false Array with 'points' and 'level', or false if no level exists
	 */
	public static function get_lead_score( $contact ) {
		// Score cache
		static $cache;

		if ( empty( $cache ) ) {
			$cache = array();
		}

		// Get contact model if ID is provided
		if ( is_numeric( $contact ) ) {
			$contact = Contact_Model::find( $contact );
		}

		if ( ! $contact || ! $contact->exists ) {
			return false;
		}

		// Check if we have a cached result
		if ( isset( $cache[ $contact->id ] ) ) {
			return $cache[ $contact->id ];
		}

		// Calculate current points
		$points = self::get_lead_score_points( $contact );

		// Get stored values
		$cur_points   = quillcrm_get_contact_meta( $contact->id, 'lead_score_points', true );
		$cur_level_id = quillcrm_get_contact_meta( $contact->id, 'lead_score_level_id', true );
		$cur_level    = $cur_level_id ? Lead_Scoring_Rule_Level_Model::find( $cur_level_id ) : null;

		// If the points didn't change and we have a valid level
		if ( $cur_level && $cur_level->exists && $points == $cur_points ) {
			$return                = array(
				'points' => $points,
				'level'  => $cur_level,
			);
			$cache[ $contact->id ] = $return;

			return $return;
		}

		// Get the level for the current score
		// The level will be the first level less than or equal to the contact's score
		$new_level = Lead_Scoring_Rule_Level_Model::get_level_for_score( $points );

		if ( ! $new_level ) {
			// No level found - clear meta
			quillcrm_delete_contact_meta( $contact->id, 'lead_score_level_slug' );
			quillcrm_delete_contact_meta( $contact->id, 'lead_score_level_id' );

			return false;
		}

		// Always update the points
		quillcrm_update_contact_meta( $contact->id, 'lead_score_points', $points );

		// Check if level changed
		if ( ! $cur_level || ! $cur_level->exists || $new_level->id !== $cur_level->id ) {
			// Update level meta
			quillcrm_update_contact_meta( $contact->id, 'lead_score_level_slug', $new_level->slug );
			quillcrm_update_contact_meta( $contact->id, 'lead_score_level_id', $new_level->id );
		}

		$return = array(
			'points' => $points,
			'level'  => $new_level,
		);

		$cache[ $contact->id ] = $return;

		return $return;
	}
}
