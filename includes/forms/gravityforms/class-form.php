<?php
/**
 * Class GravityForms Form
 * This class is responsible for handling the integration of gravityforms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\GravityForms;

use GFAPI;
use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;

/**
 * GravityForms class
 */
class Form extends Abstracts_Form {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'gravityforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'GravityForms';

	/**
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'gform_after_submission', array( $this, 'process' ), 10, 2 );
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
		$form = GFAPI::get_form( $form_id );

		if ( ! $form ) {
			return;
		}

		$fields = array();

		foreach ( $form['fields'] as $field ) {
			$inputs = $field->get_entry_inputs();
			if ( is_array( $inputs ) && 'checkbox' !== $field['type'] ) {
				foreach ( $inputs as $input ) {
					if ( isset( $input['isHidden'] ) && $input['isHidden'] ) {
						continue;
					}
					$fields[ $input['id'] ] = $field->label . ': ' . $input['label'];
				}
			} else {
				$fields[ $field->id ] = $field->label;
			}
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
		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( wp_unslash( $_POST['form_id'] ) ) : null;

		if ( ! $form_id ) {
			wp_send_json_error( array( 'message' => __( 'Form ID is required', 'quillcrm' ) ) );
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
		$options = array();
		$forms   = GFAPI::get_forms();

		if ( ! empty( $forms ) ) {
			foreach ( $forms as $form ) {
				$options[ $form['id'] ] = $form['title'];
			}
		}

		wp_send_json_success( array( 'options' => $options ) );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param object $entry
	 * @param array  $form
	 *
	 * @return void
	 */
	public function process( $entry, $form ) {
		if ( ! $this->is_form_active( $form['id'] ) ) {
			return;
		}
		$data               = $this->get_default_data();
		$data['entry']      = array(
			'fields' => $entry,
		);
		$data['form_id']    = $form['id'];
		$data['form_title'] = $form['title'];
		$data['fields']     = $this->get_fields( $form['id'] );

		$this->process_form( $data );
	}
}

// Register form
if ( quillcrm_is_plugin_active( 'gravityforms/gravityforms.php' ) ) {
	Forms_Manager::instance()->register( new Form() );
}
