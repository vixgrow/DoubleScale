<?php

/**
 * Class Event_Handler
 *
 * Hook into common events to recalculate lead score
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Lead_Scoring;

use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Lead_Scoring_Manager;

/**
 * Event_Handler class
 */
class Event_Handler {

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->add_common_event_actions();
	}

	/**
	 * Add common event actions that should trigger lead score recalculation
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function add_common_event_actions() {
		// Email tracking events
		add_action( 'quillcrm_email_opened', array( $this, 'handle_contact' ), 99, 1 );
		add_action( 'quillcrm_email_clicked', array( $this, 'handle_contact' ), 99, 1 );
		// Custom field updates (Pro)
		if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
			add_action( 'quillcrm_contact_custom_field_updated', array( $this, 'handle_contact' ), 99, 1 );
		}
	}

	/**
	 * Remove common event actions
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function remove_common_event_actions() {
		remove_action( 'quillcrm_email_opened', array( $this, 'handle_contact' ), 99 );
		remove_action( 'quillcrm_email_clicked', array( $this, 'handle_contact' ), 99 );

		if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
			remove_action( 'quillcrm_contact_custom_field_updated', array( $this, 'handle_contact' ), 99 );
		}
	}

	/**
	 * Handle contact - recalculate lead score
	 *
	 * @since 1.0.0
	 *
	 * @param int|Contact_Model $contact Contact ID or Contact Model
	 *
	 * @return void
	 */
	public function handle_contact( $contact ) {
		// Get contact model if ID is provided
		if ( is_numeric( $contact ) ) {
			$contact = Contact_Model::find( $contact );
		}

		// Validate contact
		if ( ! $contact || ! $contact instanceof Contact_Model || ! $contact->exists ) {
			return;
		}

		// Recalculate lead score
		Lead_Scoring_Manager::get_lead_score( $contact );
	}

	/**
	 * Disable event handler temporarily (for bulk operations)
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function disable() {
		$this->remove_common_event_actions();
	}

	/**
	 * Re-enable event handler
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function enable() {
		$this->add_common_event_actions();
	}
}
