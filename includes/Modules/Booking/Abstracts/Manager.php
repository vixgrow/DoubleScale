<?php
/**
 * Class Abstracts Manager
 *
 * This class is responsible for handling the abstracts
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Abstracts;

use Exception;

/**
 * Abstracts class
 */
abstract class Manager {
	/**
	 * Registered items
	 *
	 * @var array
	 */
	protected $items = array();

	/**
	 * Options for items
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Register item
	 *
	 * @param object $item
	 * @param string $type
	 * @param string $slug_property
	 * @param array  $option_fields
	 *
	 * @throws \Exception
	 */
	public function register( $item, $type, $slug_property, $option_fields = array() ) {
		if ( ! is_a( $item, $type ) ) {
			throw new \Exception( __( "Invalid $type", 'doublescale' ) );
		}

		$slug = $item->{$slug_property};

		if ( isset( $this->items[ $slug ] ) ) {
			return;
		}

		$this->items[ $slug ] = $item;

		if ( ! empty( $option_fields ) ) {
			foreach ( $option_fields as $key => $property ) {
				$this->options[ $slug ][ $key ] = is_callable( array( $item, $property ) ) ? $item->{$property}() : $item->{$property};
			}
		}
	}

	/**
	 * Get Item
	 *
	 * @param string $slug
	 *
	 * @return object|null
	 */
	public function get_item( $slug ) {
		return $this->items[ $slug ] ?? null;
	}

	/**
	 * Get All Items
	 *
	 * @return array
	 */
	public function get_items() {
		return $this->items;
	}

	/**
	 * Get Options
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}
}
