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
			$contact_fields   = $this->get_contact_data();
			$contact_data     = $contact_fields['fields'];
			$custom_fields    = $contact_fields['custom_fields'];
			$lists            = $this->form_data->data['lists'] ?? array();
			$tags             = $this->form_data->data['tags'] ?? array();
			$update_existing  = $this->form_data->data['update_existing_contact'] ?? false;

			// Add source to contact data
			$contact_data['source'] = $this->slug;

			$make_as_subscriber = $this->form_data->data['mark_as_subscribed'] ?? false;
			if ( ! $make_as_subscriber ) {
				$contact_data['status'] = 'unsubscribed';
			}

			if ( ! $update_existing ) {
				$contact = Contact_Model::get_by_email( $contact_data['email'] ?? '' );
				if ( $contact ) {
					return;
				}
			}

			$contact = Contact_Model::createOrUpdate( $contact_data );

			if ( ! empty( $lists ) ) {
				$contact->lists()->syncWithoutDetaching( $lists );
			}

			if ( ! empty( $tags ) ) {
				$contact->tags()->syncWithoutDetaching( $tags );
			}

			if ( ! empty( $custom_fields ) ) {
				$custom_fields_values = array();
				foreach ( $custom_fields as $key => $value ) {
					$custom_fields_values[ $key ] = array(
						'value' => $value,
					);
				}

				$contact->custom_fields()->sync( $custom_fields_values );
			}

			quillcrm_get_logger()->info(
				__( 'Contact created successfully', 'quillcrm' ),
				array(
					'id'     => $contact->id,
					'email'  => $contact->email,
					'source' => $this->slug,
				)
			);
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Error creating contact', 'quillcrm' ),
				array(
					'code'  => 'error_creating_contact',
					'data'  => $data,
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
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

		$contact_data  = array();
		$custom_fields = array();
		foreach ( $mapped_fields as $form_field => $contact_field ) {
			if ( ! isset( $contact_fields[ $contact_field ] ) || ! isset( $entry['fields'][ $form_field ] ) || ! isset( $fields[ $form_field ] ) ) {
				continue;
			}

			if ( ! class_exists( $contact_fields[ $contact_field ]['type'] ) ) {
				throw new Exception( 'Invalid field type' );
			}
			/** @var \QuillCRM\Abstracts\Field_Type $field_type */
			$field_type = new $contact_fields[ $contact_field ]['type']( $contact_fields[ $contact_field ] );
			$form_field = $field_type->sanitize_field( $entry['fields'][ $form_field ] );
			if ( 'country' === $contact_field ) {
				$form_field = quillcrm_get_country_code( $form_field );
			}
			$field_type->validate_value( $form_field );
			if ( $field_type->is_valid ) {
				if ( $contact_fields[ $contact_field ]['is_custom'] ?? false ) {
					$custom_fields[ $contact_field ] = $form_field;
				} else {
					$contact_data[ $contact_field ] = $form_field;
				}
			}
		}

		return array(
			'fields'        => $contact_data,
			'custom_fields' => $custom_fields,
		);
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
			$form            = Form_Model::get_form_by_form_id( $this->get_form_id( $form_id ), $this->slug, 'active' );
			$this->form_data = $form;
			return true;
		} catch ( Exception $e ) {
			return false;
		}
	}

	/**
	 * Get form id
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return string
	 */
	public function get_form_id( $form_id ) {
		if ( strpos( $form_id, ':' ) !== false ) {
			$form_id = explode( ':', $form_id );
			$form_id = $form_id[1];
		}

		return $form_id;
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
			quillcrm_get_logger()->error(
				__( 'Error processing automations', 'quillcrm' ),
				array(
					'code'  => 'error_processing_automations',
					'data'  => $args,
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
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
			$contact_fields         = $this->get_contact_fields( $mapped_fields );
			$custom_fields          = $contact_fields['custom_fields'];
			$contact_data           = $contact_fields['fields'];
			$contact_data['source'] = $this->slug;
			$make_as_subscriber     = $automation->get_setting( 'mark_as_subscribed', false );
			$update_blank_fields    = $automation->get_setting( 'update_blank_fields', false );
			$update_existing        = $automation->get_setting( 'update_existing_contact', false );
			$lists                  = $automation->get_setting( 'lists', array() );
			$tags                   = $automation->get_setting( 'tags', array() );

			if ( ! $make_as_subscriber ) {
				$contact_data['status'] = 'unsubscribed';
			} else {
				$contact_data['status'] = 'subscribed';
			}

			if ( ! $update_blank_fields ) {
				$contact_data = array_filter( $contact_data );
			}

			if ( ! $update_existing ) {
				$contact = Contact_Model::get_by_email( $contact_data['email'] ?? '' );
				if ( $contact ) {
					return $contact;
				}
			}

			$contact = Contact_Model::createOrUpdate( $contact_data );

			if ( ! empty( $lists ) ) {
				$contact->lists()->syncWithoutDetaching( $lists );
			}

			if ( ! empty( $tags ) ) {
				$contact->tags()->syncWithoutDetaching( $tags );
			}

			if ( ! empty( $custom_fields ) ) {
				$custom_fields_values = array();
				foreach ( $custom_fields as $key => $value ) {
					$custom_fields_values[ $key ] = array(
						'value' => $value,
					);
				}

				$contact->custom_fields()->syncWithoutDetaching( $custom_fields_values );
			}

			return $contact;
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Error creating contact', 'quillcrm' ),
				array(
					'code'  => 'error_creating_contact',
					'data'  => $contact_data,
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
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
		$form_id            = $this->get_form_id( $args['form_id'] );
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
	 * Get form fields settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_form_fields_settings() {
		$settings = array(
			'action' => "quillcrm_{$this->slug}_get_fields",
			'fields' => array(
				'form_id',
			),
		);

		return $settings;
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
