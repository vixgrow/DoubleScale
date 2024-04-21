<?php
/**
 * Class Formidable Form
 * This class is responsible for handling the integration of formidable forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\Formidable;

use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;

/**
 * Formidable class
 */
class Form extends Abstracts_Form {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'formidable';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Formidable';

	/**
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'frm_after_create_entry', array( $this, 'process' ), 10, 2 );
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
		$form = \FrmField::get_all_for_form( $form_id );
		if ( ! $form ) {
			return;
		}

		$fields = array();
		foreach ( $form as $field ) {
			if ( 'submit' === $field->type ) {
				continue;
			}

			$fields[ $field->id ] = $field->name;
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
			wp_send_json_error( __( 'Invalid form id', 'quillcrm' ) );
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
		$forms   = \FrmForm::getAll();
		$options = array();

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
	 * @param int $entry_id
	 * @param int $form_id
	 *
	 * @return void
	 */
	public function process( $entry_id, $form_id ) {
		if ( ! $this->is_form_active( $form_id ) ) {
			return;
		}
		$entry = \FrmEntry::getOne( $entry_id, true );
		if ( ! isset( $entry->metas ) ) {
			return;
		}

		$data               = $this->get_default_data();
		$data['form_id']    = $form_id;
		$data['form_title'] = \FrmForm::getOne( $form_id )->name;
		$data['fields']     = $this->get_fields( $form_id );
		$data['entry']      = array(
			'fields' => array(),
		);

		foreach ( $entry->metas as $field_id => $value ) {
			$data['entry']['fields'][ $field_id ] = $value;
		}

		$this->process_form( $data );
	}

}

if ( quillcrm_is_plugin_active( 'formidable/formidable.php' ) ) {
	Forms_Manager::instance()->register( new Form() );
}
