<?php
/**
 * Class Forminator Form
 * This class is responsible for handling the integration of forminator
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\Forminator;

use Forminator_API;
use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;

/**
 * Forminator class
 */
class Form extends Abstracts_Form {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'forminator';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Forminator';

	/**
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'forminator_custom_form_submit_field_data', array( $this, 'process' ), 10, 2 );
		// Ajax Get Fields
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_fields", array( $this, 'ajax_get_fields' ) );
		// Ajax Get Form Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_form_select_options", array( $this, 'ajax_get_form_select_options' ) );
	}

	/**
	 * Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return void
	 */
	public function get_fields( $form_id ) {
		$form_fields = Forminator_API::get_form_fields( $form_id );
		$fields      = array();

		if ( empty( $form_fields ) ) {
			return $fields;
		}

		$address_fields = array(
			'street_address',
			'city',
			'country',
			'line',
			'state',
			'zip',
		);

		foreach ( $form_fields as $field ) {
			if ( 'group' === $field->type ) {
				continue;
			}
			if ( 'address' === $field->type ) {
				foreach ( $address_fields as $address_field ) {
					$address_field_id   = 'line' === $address_field ? $field->element_id . '_address_line' : $field->element_id . '_' . $address_field;
					$address_field_slug = 'street_address' === $address_field ? $address_field : "address_{$address_field}";
					if ( 'true' === $field->raw[ $address_field_slug ] ) {
						$fields[ $address_field_id ] = $field->raw[ "{$address_field_slug}_label" ];
					}
				}
				continue;
			}

			$fields[ $field->element_id ] = $field->field_label;
		}

		return $fields;
	}

	/**
	 * Ajax Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_fields() {
		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( $_POST['form_id'] ) : '';

		if ( empty( $form_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid form ID', 'quillcrm' ) ) );
		}

		$fields = $this->get_fields( $form_id );

		wp_send_json_success( $fields );
	}

	/**
	 * Ajax Get Form Select Options
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_form_select_options() {
		$forms   = Forminator_API::get_forms();
		$options = array();

		if ( empty( $forms ) ) {
			wp_send_json_error( array( 'message' => __( 'No forms found', 'quillcrm' ) ) );
		}

		foreach ( $forms as $form ) {
			$options[ $form->id ] = $form->name;
		}

		wp_send_json_success( $options );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param array $field_data_array
	 * @param array $form_id
	 *
	 * @return void
	 */
	public function process( $field_data_array, $form_id ) {
		if ( ! $this->is_form_active( $form_id ) ) {
			return $field_data_array;
		}
		try {
			$data               = $this->get_default_data();
			$data['form_id']    = $form_id;
			$data['fields']     = $this->get_fields( $form_id );
			$data['form_title'] = Forminator_API::get_form( $form_id )->name;
			$data['entry']      = array(
				'fields' => $this->prepare_form_fields( $field_data_array ),
			);

			$this->process_form( $data );

			return $field_data_array;
		} catch ( \Exception $e ) {
			return $field_data_array;
		}
	}

	/**
	 * Prepare Form Fields
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields
	 *
	 * @return array
	 */
	public function prepare_form_fields( $fields ) {
		$prepared_fields = array();
		$address_fields  = array(
			'street_address',
			'city',
			'country',
			'address_line',
			'state',
			'zip',
		);

		foreach ( $fields as $field ) {
			if ( ! isset( $field['field_type'] ) ) {
				continue;
			}
			if ( 'address' === $field['field_type'] ) {
				foreach ( $address_fields as $address_field ) {
					if ( isset( $field['value'][ $address_field ] ) ) {
						$address_field_id                     = $field['name'] . '_' . $address_field;
						$prepared_fields[ $address_field_id ] = $field['value'][ $address_field ];
					}
				}
				continue;
			}

			$prepared_fields[ $field['name'] ] = $field['value'];
		}

		return $prepared_fields;
	}

}

if ( quillcrm_is_plugin_active( 'forminator/forminator.php' ) ) {
	Forms_Manager::instance()->register( new Form() );
}
