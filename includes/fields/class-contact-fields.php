<?php

/**
 * Class Contact_Fields
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields;

use QuillCRM\Fields\Types\Text_Field;
use QuillCRM\Fields\Types\Boolean_Field;
use QuillCRM\Fields\Types\Email_Field;
use QuillCRM\Fields\Types\Number_Field;
use QuillCRM\Fields\Types\URL_Field;
use QuillCRM\Fields\Types\Phone_Field;
use QuillCRM\Fields\Types\Date_Field;
use QuillCRM\Fields\Types\Textarea_Field;
use QuillCRM\Fields\Types\Select_Field;
use QuillCRM\Fields\Types\Multiselect_Field;
use QuillCRM\Fields\Types\Checkbox_Field;
use QuillCRM\Models\Custom_Field_Model;

/**
 * Contact_Fields class
 */
class Contact_Fields {



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
		'text'        => Text_Field::class,
		'boolean'     => Boolean_Field::class,
		'email'       => Email_Field::class,
		'number'      => Number_Field::class,
		'url'         => URL_Field::class,
		'phone'       => Phone_Field::class,
		'date'        => Date_Field::class,
		'textarea'    => Textarea_Field::class,
		'select'      => Select_Field::class,
		'multiselect' => Multiselect_Field::class,
		'checkbox'    => Checkbox_Field::class,
	);

	/**
	 * Instance
	 *
	 * @var Contact_Fields
	 */
	protected static $instance = null;

	/**
	 * Get Instance
	 *
	 * @since 1.0.0
	 *
	 * @return Contact_Fields
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
				'name'     => __( 'First Name', 'quillcrm' ),
				'type'     => $this->types['text'],
				'required' => true,
			),
			'last_name'  => array(
				'name'     => __( 'Last Name', 'quillcrm' ),
				'type'     => $this->types['text'],
				'required' => true,
			),
			'email'      => array(
				'name'     => __( 'Email', 'quillcrm' ),
				'type'     => $this->types['email'],
				'required' => true,
			),
			'address_1'  => array(
				'name' => __( 'Address 1', 'quillcrm' ),
				'type' => $this->types['text'],
			),
			'address_2'  => array(
				'name' => __( 'Address 2', 'quillcrm' ),
				'type' => $this->types['text'],
			),
			'city'       => array(
				'name' => __( 'City', 'quillcrm' ),
				'type' => $this->types['text'],
			),
			'state'      => array(
				'name' => __( 'State', 'quillcrm' ),
				'type' => $this->types['text'],
			),
			'country'    => array(
				'name' => __( 'Country', 'quillcrm' ),
				'type' => $this->types['text'],
			),
			'zip'        => array(
				'name' => __( 'Zip', 'quillcrm' ),
				'type' => $this->types['number'],
			),
			'phone'      => array(
				'name' => __( 'Phone', 'quillcrm' ),
				'type' => $this->types['text'],
			),
		);

		$custom_fields = Custom_Field_Model::all();

		foreach ( $custom_fields as $custom_field ) {
			$this->fields[ $custom_field->id ] = array(
				'name'      => $custom_field->name,
				'type'      => $this->types[ $custom_field->type ],
				'is_custom' => true,
			);
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
	 * @param Contact_Model $contact Contact Model.
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
