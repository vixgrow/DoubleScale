<?php

/**
 * Class ContactFields
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro\Pro
 */

namespace DoubleScale\Fields;

use DoubleScale\Fields\Types\RadioField;
use DoubleScale\Fields\Types\TextField;
use DoubleScale\Fields\Types\Boolean_Field;
use DoubleScale\Fields\Types\EmailField;
use DoubleScale\Fields\Types\NumberField;
use DoubleScale\Fields\Types\UrlField;
use DoubleScale\Fields\Types\PhoneField;
use DoubleScale\Fields\Types\DateField;
use DoubleScale\Fields\Types\TextareaField;
use DoubleScale\Fields\Types\SelectField;
use DoubleScale\Fields\Types\MultiselectField;
use DoubleScale\Fields\Types\CheckboxField;
use DoubleScale\Core\CustomFields\Models\CustomFieldModel;

/**
 * ContactFields class
 */
class ContactFields {

	/**
	 * Fields
	 *
	 * @var array
	 */
	protected $fields = array();

	/**
	 * Types
	 *
	 * @var array
	 */
	protected $types = array(
		'text'        => TextField::class,
		'boolean'     => Boolean_Field::class,
		'email'       => EmailField::class,
		'number'      => NumberField::class,
		'url'         => UrlField::class,
		'phone'       => PhoneField::class,
		'date'        => DateField::class,
		'textarea'    => TextareaField::class,
		'select'      => SelectField::class,
		'multiselect' => MultiselectField::class,
		'checkbox'    => CheckboxField::class,
		'radio'       => RadioField::class,
	);

	/**
	 * Instance
	 *
	 * @var ContactFields
	 */
	protected static $instance = null;

	/**
	 * Get Instance
	 *
	 * @since 1.0.0
	 *
	 * @return ContactFields
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->setup_fields();
	}



	/**
	 * Setup Fields
	 *
	 * @return void
	 */
	private function setup_fields() {
		$this->fields = array(
			'first_name' => array(
				'name'     => __( 'First Name', 'doublescale'),
				'type'     => $this->types['text'],
				'required' => true,
			),
			'last_name'  => array(
				'name'     => __( 'Last Name', 'doublescale'),
				'type'     => $this->types['text'],
				'required' => true,
			),
			'email'      => array(
				'name'     => __( 'Email', 'doublescale'),
				'type'     => $this->types['email'],
				'required' => true,
			),
			'address_1'  => array(
				'name' => __( 'Address 1', 'doublescale'),
				'type' => $this->types['text'],
			),
			'address_2'  => array(
				'name' => __( 'Address 2', 'doublescale'),
				'type' => $this->types['text'],
			),
			'city'       => array(
				'name' => __( 'City', 'doublescale'),
				'type' => $this->types['text'],
			),
			'state'      => array(
				'name' => __( 'State', 'doublescale'),
				'type' => $this->types['text'],
			),
			'country'    => array(
				'name' => __( 'Country', 'doublescale'),
				'type' => $this->types['text'],
			),
			'zip'        => array(
				'name' => __( 'Zip', 'doublescale'),
				'type' => $this->types['number'],
			),
			'phone'      => array(
				'name' => __( 'Phone', 'doublescale'),
				'type' => $this->types['text'],
			),
		);

		if ( class_exists( CustomFieldModel::class ) ) {
			$custom_fields = CustomFieldModel::all();

			foreach ( $custom_fields as $custom_field ) {
				$this->fields[ $custom_field->id ] = array(
					'name'      => $custom_field->name,
					'type'      => $this->types[ $custom_field->type ],
					'is_custom' => true,
				);
			}
		}
	}

	/**
	 * Get Fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return $this->fields;
	}

	/**
	 * Get field value
	 *
	 * @param string        $field Field.
	 * @param ContactModel $contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_field_value( $field, $contact ) {
		if ( ! isset( $this->fields[ $field ] ) ) {
			return null;
		}

		if ( ! isset( $this->fields[ $field ]['is_custom'] ) ) {
			return $contact->{$field};
		}

		return $contact->get_custom_field( $field );
	}
}
