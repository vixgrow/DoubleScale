<?php
/**
 * Class Custom_Fields Manager
 * This class is responsible for handling the custom_fields
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Field_Type as Custom_Field;

/**
 * Custom_Fields class
 */
final class Custom_Fields_Manager {

	/**
	 * Registed custom_fields
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $custom_fields = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Custom_Fields_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Custom_Fields_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register Custom_Field
	 *
	 * @since 1.0.0
	 *
	 * @param Custom_Field $custom_field
	 * @return void
	 */
	public function register( Custom_Field $custom_field ) {
		if ( ! $custom_field instanceof Custom_Field ) {
			throw new Exception( __( 'Invalid custom_field', 'quillcrm' ) );
		}

		if ( isset( $this->custom_fields[ $custom_field->slug ] ) ) {
			throw new Exception( sprintf( __( 'Custom_Field %s already registered', 'quillcrm' ), $custom_field->name ) );
		}

		$this->custom_fields[ $custom_field->slug ] = $custom_field;
		$this->options[ $custom_field->slug ]       = array(
			'name' => $custom_field->name,
		);
	}

	/**
	 * Get Custom_Field
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Custom_Field
	 */
	public function get_custom_field( $slug ) {
		if ( isset( $this->custom_fields[ $slug ] ) ) {
			return $this->custom_fields[ $slug ];
		}

		throw new Exception( sprintf( __( 'Custom_Field %s not found', 'quillcrm' ), $slug ) );
	}

	/**
	 * Get Custom_Fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_custom_fields() {
		return $this->custom_fields;
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
