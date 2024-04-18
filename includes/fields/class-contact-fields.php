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
				'type'     => Text_Field::class,
				'required' => true,
			),
			'last_name'  => array(
				'name'     => __( 'Last Name', 'quillcrm' ),
				'type'     => Text_Field::class,
				'required' => true,
			),
			'email'      => array(
				'name'     => __( 'Email', 'quillcrm' ),
				'type'     => Email_Field::class,
				'required' => true,
			),
			'address_1'  => array(
				'name' => __( 'Address 1', 'quillcrm' ),
				'type' => Text_Field::class,
			),
			'address_2'  => array(
				'name' => __( 'Address 2', 'quillcrm' ),
				'type' => Text_Field::class,
			),
			'city'       => array(
				'name' => __( 'City', 'quillcrm' ),
				'type' => Text_Field::class,
			),
			'state'      => array(
				'name' => __( 'State', 'quillcrm' ),
				'type' => Text_Field::class,
			),
			'country'    => array(
				'name' => __( 'Country', 'quillcrm' ),
				'type' => Text_Field::class,
			),
			'zip'        => array(
				'name' => __( 'Zip', 'quillcrm' ),
				'type' => Number_Field::class,
			),
		);
	}

	/**
	 * Get Fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return $this->fields;
	}
}
