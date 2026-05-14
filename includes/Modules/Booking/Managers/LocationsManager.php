<?php

/**
 * Class Locations Manager
 * This class is responsible for handling the locations manager
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Managers;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\Abstracts\Manager;
use DoubleScale\Modules\Booking\Abstracts\Location;
use DoubleScale\Modules\Booking\Traits\Singleton;

/**
 * Locations Manager class
 */
class LocationsManager extends \DoubleScale\Modules\Booking\Abstracts\Manager {


	use \DoubleScale\Modules\Booking\Traits\Singleton;

	/**
	 * Register Location
	 *
	 * @since 1.0.0
	 *
	 * @param Location $location
	 * @throws \Exception
	 */
	public function register_location( Location $location ) {
		$this->register(
			$location,
			Location::class,
			'slug',
			array(
				'title'           => 'title',
				'is_integration'  => 'is_integration',
				'fields'          => 'get_admin_fields',
				'frontend_fields' => 'get_fields',
			)
		);
	}

	/**
	 * Get Location
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Location|null
	 */
	public function get_location( $slug ) {
		return $this->get_item( $slug );
	}

	/**
	 * Get Locations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_locations() {
		return $this->get_items();
	}

	public function get_location_label( $location ) {

		if ( ! $location ) {
			return null;
		}

		$location_fields = $location['fields'] ?? array();

		if ( empty( $location_fields ) ) {
			return $this->get_location( $location['type'] )->title;
		}

		if ( isset( $location_fields['display_on_booking'] ) && $location_fields['display_on_booking'] ) {
			switch ( $location['type'] ) {
				case 'online':
					return $location_fields['meeting_url'];
				case 'person_address':
					return $location_fields['location'];
				case 'person_phone':
					return $location_fields['phone'];
				case 'custom':
					return $location_fields['description'];
			}
		} else {
			if ( $location['type'] === 'custom' ) {
				return $location_fields['location'];
			}
			return $this->get_location( $location['type'] )->title;
		}
	}
}
