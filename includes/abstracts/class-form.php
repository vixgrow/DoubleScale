<?php
/**
 * Class Form
 * This class is responsible for handling the integration of forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */


namespace QuillCRM\Abstracts;

use Exception;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Form_Model;
use QuillCRM\Fields\Contact_Fields;
use QuillCRM\Models\Automation_Model;
use QuillCRM\QuillCRM;

/**
 * Form class
 */
abstract class Form {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Description
	 *
	 * @var string
	 */
	public $description;

	/**
	 * Form Data
	 *
	 * @var Form_Model
	 */
	protected $form_data = array();

	/**
	 * Entry
	 *
	 * @var array
	 */
	protected $submission = array();

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	abstract public function load_hooks();

	/**
	 * Get forms
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_forms() {
		return $this->forms;
	}

	/**
	 * Get form
	 *
	 * @since 1.0.0
	 *
	 * @param string $id
	 * @return array
	 */
	public function get_form( $id ) {
		return isset( $this->forms[ $id ] ) ? $this->forms[ $id ] : null;
	}

	/**
	 * Get form fields
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return void
	 */
	abstract public function get_fields( $form_id );

	/**
	 * Process form
	 *
	 * @since 1.0.0
	 *
	 * @param array $data
	 *
	 * @return void
	 */
	public function process_form( $data ) {
		try {
			$this->submission = $data;
			$form_id          = $this->submission['form_id'];
			$contact_data     = $this->get_contact_data();

			// Add source to contact data
			$contact_data['source'] = $this->slug;

			$make_as_subscriber = $this->form_data->data['make_as_subscriber'] ?? false;
			if ( ! $make_as_subscriber ) {
				$contact_data['status'] = 'unsubscribed';
			}

			$contact = Contact_Model::createOrUpdate( $contact_data );
			error_log( 'Contact created: ' . $contact->id );
		} catch ( Exception $e ) {
			error_log( 'Error form creating contact: ' . $e->getMessage() );
		}
	}

	/**
	 * Get contact fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_contact_data() {
		$mapped_fields = $this->form_data->data['mapped_fields'] ?? array();

		if ( empty( $mapped_fields ) ) {
			throw new Exception( 'No mapped fields found' );
		}

		$contact_data = $this->get_contact_fields( $mapped_fields );

		return $contact_data;
	}

	/**
	 * Get contact fields for form
	 *
	 * @since 1.0.0
	 *
	 * @param $mapped_fields array Mapped fields
	 *
	 * @return array
	 */
	public function get_contact_fields( $mapped_fields ) {
		$entry          = $this->submission['entry'];
		$fields         = $this->submission['fields'] ?? array();
		$contact_fields = Contact_Fields::instance()->get_fields();

		$contact_data = array();
		foreach ( $mapped_fields as $key => $value ) {
			if ( ! isset( $contact_fields[ $key ] ) || ! isset( $entry['fields'][ $value ] ) || ! isset( $fields[ $value ] ) ) {
				continue;
			}

			if ( ! class_exists( $contact_fields[ $key ]['type'] ) ) {
				throw new Exception( 'Invalid field type' );
			}
			/** @var \QuillCRM\Abstracts\Field_Type $field_type */
			$field_type = new $contact_fields[ $key ]['type']( $contact_fields[ $key ] );
			$value      = $field_type->sanitize_field( $entry['fields'][ $value ] );
			if ( 'country' === $key ) {
				$value = quillcrm_get_country_code( $value );
			}
			$field_type->validate_value( $value );
			if ( $field_type->is_valid ) {
				$contact_data[ $key ] = $value;
			}
		}

		return $contact_data;
	}

	/**
	 * Get default form data
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_data() {
		return array();
	}

	/**
	 * Check if form is active
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return bool
	 */
	public function is_form_active( $form_id ) {
		try {
			$form            = Form_Model::get_form_by_form_id( $form_id, $this->slug, 'active' );
			$this->form_data = $form;
			return true;
		} catch ( Exception $e ) {
			error_log( 'Error getting form data: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Process automations
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Arguments
	 *
	 * @return void
	 */
	public function process_automations( $args ) {
		try {
			$this->submission = $args;
			$automations      = Automation_Model::get_automations_by_trigger( $this->slug );

			foreach ( $automations as $automation ) {
				if ( ! $this->is_processable( $automation, $args ) ) {
					continue;
				}

				$contact = $this->maybe_create_contact( $automation );
				if ( ! $contact ) {
					continue;
				}

				$data = array(
					'contact' => $contact,
					'data'    => $args,
				);

				QuillCRM::instance()->automations_tasks->enqueue_sync( 'process_automations', $automation, $data );
			}
		} catch ( Exception $e ) {
			// Log error
		}
	}

	/**
	 * Maybe create contact
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation Model
	 *
	 * @return Contact_Model
	 */
	public function maybe_create_contact( Automation_Model $automation ) {
		try {
			$mapped_fields          = $automation->get_setting( 'mapped_fields', array() );
			$contact_data           = $this->get_contact_fields( $mapped_fields );
			$contact_data['source'] = $this->slug;
			$make_as_subscriber     = $automation->get_setting( 'make_as_subscriber' ) ?? false;
			if ( ! $make_as_subscriber ) {
				$contact_data['status'] = 'unsubscribed';
			}
			$contact = Contact_Model::createOrUpdate( $contact_data );

			return $contact;
		} catch ( Exception $e ) {
			error_log( 'Error creating contact: ' . $e->getMessage() );
			return null;
		}
	}

	/**
	 * Check if trigger should be processed
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation Model
	 * @param array            $args Arguments
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		$form_id            = $args['form_id'];
		$automation_form_id = $automation->get_setting( 'form_id' );

		return $form_id === $automation_form_id;
	}

	/**
	 * Get form options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_form_options() {
		$options = array(
			'form_id' => array(
				'label'       => __( 'Form ID', 'quillcrm' ),
				'type'        => 'ajax_select',
				'ajax_action' => "quillcrm_{$this->slug}_get_form_select_options",
			),
		);

		return $options;
	}

	/**
	 * Is Enabled
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return true;
	}
}
