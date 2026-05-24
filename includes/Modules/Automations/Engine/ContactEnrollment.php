<?php
/**
 * Enrolls a contact into an automation run (create/find contact + automation_contact row).
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Engine;

use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\Automations\Models\AutomationModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;

defined( 'ABSPATH' ) || exit;

final class ContactEnrollment {

	private AutomationModel $automation;

	/** @var array<string, mixed> */
	private array $args;

	/**
	 * @param array<string, mixed> $args Same shape as {@see ProcessAutomation::$args}.
	 */
	public function __construct( AutomationModel $automation, array $args ) {
		$this->automation = $automation;
		$this->args       = $args;
	}

	/**
	 * @return AutomationContactModel|false
	 */
	public function add_contact() {
		$multiple_runs = $this->automation->get_setting( 'multiple_runs', false );
		$contact       = $this->args['contact'] ?? null;

		if ( ! $contact ) {
			$contact = $this->maybe_create_contact();
		}

		$automation_contact = $this->automation->contacts()->where( 'contact_id', $contact->id )->first();

		if ( $automation_contact && ! $multiple_runs ) {
			return false;
		}

		$data = $this->args['data'] ?? array();
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		if ( isset( $this->args['booking'] ) && $this->args['booking'] instanceof \DoubleScale\Modules\Booking\Models\BookingModel ) {
			$data['booking_id'] = (int) $this->args['booking']->id;
			if ( isset( $this->args['context'] ) && is_array( $this->args['context'] ) ) {
				$data['booking_context'] = $this->args['context'];
			}
		}

		$automation_contact = AutomationContactModel::create(
			array(
				'automation_id' => $this->automation->id,
				'contact_id'    => $contact->id,
				'status'        => 'active',
				'data'          => $data,
			)
		);

		/**
		 * Fires when a contact enters an automation.
		 *
		 * @since 1.0.0
		 *
		 * @param \DoubleScale\Modules\Automations\Models\AutomationModel         $automation         The automation.
		 * @param \DoubleScale\Modules\Automations\Models\AutomationContactModel $automation_contact The automation contact record.
		 */
		do_action( 'doublescale_automation_contact_enter', $this->automation, $automation_contact );

		return $automation_contact;
	}

	public function maybe_create_contact(): ContactModel {
		$contact = ContactModel::where( 'email', $this->args['email'] )->first();

		if ( ! $contact ) {
			$contact = ContactModel::create( $this->args );
		} else {
			$contact->update( $this->args );
		}

		return $contact;
	}
}
