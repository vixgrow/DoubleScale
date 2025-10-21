<?php

/**
 * Class Automation_Step_Model
 * This class is responsible for handling the Automation Step model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Services\Campaign_Template_Factory;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Automation_Step_Model class
 */
class Automation_Step_Model extends Model {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_automation_steps';

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'automation_id',
		'parent_id',
		'action',
		'type',
		'condition',
		'status',
		'settings',
		'order',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'settings'      => 'array',
		'parent_id'     => 'integer',
		'order'         => 'integer',
		'automation_id' => 'integer',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

	/**
	 * Get the automation
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( Automation_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Get the contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function contacts() {
		return $this->hasMany( Automation_Contact_Model::class, 'step_id', 'id' );
	}

	/**
	 * Get the processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( Automation_Contact_Processes_Model::class, 'step_id', 'id' );
	}

	/**
	 * Get the parent
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function parent() {
		return $this->belongsTo( Automation_Step_Model::class, 'parent_id', 'id' );
	}

	/**
	 * Get the children
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function children() {
		return $this->hasMany( Automation_Step_Model::class, 'parent_id', 'id' );
	}

	/**
	 * Get setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default.
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = null ) {
		return $this->settings[ $key ] ?? $default;
	}

	/**
	 * Get attribute
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default.
	 *
	 * @return mixed
	 */
	public function get_attribute( $key, $default = null ) {
		return $this->settings[ $key ] ?? $default;
	}

	/**
	 * Boot
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		 parent::boot();

		// If step type is conditiion, delete all children.
		static::deleting(
			function ( $step ) {
				if ( 'condition' === $step->type ) {
					$step->children()->delete();
				}
			}
		);

		// If step type is action, and action not found, make status as draft.
		static::creating(
			function ( $step ) {
				if ( isset( $step->parent_id ) && 0 !== $step->parent_id ) {
					$condition = $step->condition;
					$last_step = $step->where( 'automation_id', $step->automation_id )->where( 'condition', $condition )->where( 'parent_id', $step->parent_id )->where( 'status', '!=', 'deleted' )->where( 'order', '<', $step->order )->orderBy( 'order', 'asc' )->first();
					if ( $last_step && 'end_automation' === $last_step->type ) {
						throw new \Exception( 'You can not add any step after end automation' );
					}
				} else {
					$last_step = $step->where( 'automation_id', $step->automation_id )->where( 'parent_id', 0 )->where( 'status', '!=', 'deleted' )->where( 'order', '<', $step->order )->orderBy( 'order', 'desc' )->first();
					if ( $last_step && 'end_automation' === $last_step->type ) {
						throw new \Exception( 'You can not add any step after end automation 2' );
					}
				}
			}
		);

		// Process template data when saving step
		static::saving(
			function ( $step ) {
				$settings = $step->settings;

				// Determine channel type from step action
				$channel_type = self::get_channel_type_from_action( $step->action );

				// Skip if not a message action or template_ids already exist
				if ( ! $channel_type || isset( $settings['template_ids'] ) ) {
					return;
				}

				// Prepare template data from settings fields
				$template_data = self::prepare_template_data_from_settings( $settings, $channel_type );

				if ( ! empty( $template_data ) ) {
					// Use Campaign_Template_Factory to process template data
					$template_factory = Campaign_Template_Factory::instance();
					$template_ids     = $template_factory->process_templates_data(
						array( $template_data ),
						$channel_type,
						'draft'
					);

					if ( ! empty( $template_ids ) ) {
						// Store template IDs
						$settings['template_ids'] = $template_ids;
						$step->settings           = $settings;

						quillcrm_get_logger()->info(
							'Automation step: Template processed and saved',
							array(
								'step_id'      => $step->id ?? 'new',
								'action'       => $step->action,
								'template_ids' => $template_ids,
								'code'         => 'automation_step_template_processed',
							)
						);
					}
				}
			}
		);

		// Handle template updates when updating step
		static::updating(
			function ( $step ) {
				$settings = $step->settings;

				// If template content changed, check if we need to create a new template
				if ( isset( $settings['template_ids'] ) && ! empty( $settings['template_ids'] ) ) {
					$template_id = reset( $settings['template_ids'] );

					// Check if this template has been used in tracking
					if ( self::is_template_used_in_tracking( $template_id ) ) {
						// Template has been used - create new template instead of updating
						// Remove template_ids so the saving event will create a new one
						unset( $settings['template_ids'] );

						quillcrm_get_logger()->info(
							'Automation step: Template in use, creating new template',
							array(
								'step_id'         => $step->id,
								'old_template_id' => $template_id,
								'code'            => 'automation_step_template_in_use',
							)
						);
					} else {
						// Template not used yet - safe to update in-place
						if ( isset( $settings['subject'] ) || isset( $settings['body'] ) ) {
							$template = Template_Model::find( $template_id );
							if ( $template ) {
								$update_data = array();

								if ( isset( $settings['subject'] ) ) {
									$update_data['subject'] = $settings['subject'];
									$update_data['name']    = 'Automation: ' . $settings['subject'];
								}

								if ( isset( $settings['body'] ) ) {
									$update_data['body'] = $settings['body'];
								}

								// Update template settings if applicable
								if ( isset( $settings['from_name'] ) || isset( $settings['from_email'] ) || isset( $settings['reply_to'] ) ) {
									$template_settings = $template->settings ?? array();

									if ( isset( $settings['from_name'] ) ) {
										$template_settings['from_name'] = $settings['from_name'];
									}
									if ( isset( $settings['from_email'] ) ) {
										$template_settings['from_email'] = $settings['from_email'];
									}
									if ( isset( $settings['reply_to'] ) ) {
										$template_settings['reply_to'] = $settings['reply_to'];
									}

									$update_data['settings'] = $template_settings;
								}

								if ( ! empty( $update_data ) ) {
									$template->update( $update_data );

									quillcrm_get_logger()->info(
										'Automation step: Template updated in-place',
										array(
											'step_id'     => $step->id,
											'template_id' => $template_id,
											'code'        => 'automation_step_template_updated',
										)
									);
								}
							}
						}
					}

					$step->settings = $settings;
				}
			}
		);
	}

	/**
	 * Get channel type from action slug
	 *
	 * @param string $action Action slug (e.g., 'send_email', 'send_sms')
	 * @return string|null Channel type ('email', 'sms', 'whatsapp') or null
	 */
	private static function get_channel_type_from_action( $action ) {
		$action_channel_map = array(
			'send_email'    => 'email',
			'send_sms'      => 'sms',
			'send_whatsapp' => 'whatsapp',
		);

		return $action_channel_map[ $action ] ?? null;
	}

	/**
	 * Check if template is used in tracking records
	 *
	 * @param int $template_id Template ID
	 * @return bool True if template is used in any tracking record
	 */
	private static function is_template_used_in_tracking( $template_id ) {
		return Tracking_Model::where( 'template_id', $template_id )->exists();
	}

	/**
	 * Prepare template data from settings fields
	 * Converts step settings into template data format expected by Campaign_Template_Factory
	 *
	 * @param array  $settings Step settings
	 * @param string $channel_type Channel type ('email', 'sms', 'whatsapp')
	 * @return array|null Template data array or null if required fields missing
	 */
	private static function prepare_template_data_from_settings( $settings, $channel_type ) {
		// Email requires subject and body
		if ( $channel_type === 'email' ) {
			if ( empty( $settings['subject'] ) || empty( $settings['body'] ) ) {
				return null;
			}

			return array(
				'name'     => 'Automation: ' . $settings['subject'],
				'subject'  => $settings['subject'],
				'body'     => $settings['body'],
				'settings' => array(
					'from_name'       => $settings['from_name'] ?? get_bloginfo( 'name' ),
					'from_email'      => $settings['from_email'] ?? get_option( 'admin_email' ),
					'reply_to'        => $settings['reply_to'] ?? '',
					'add_unsubscribe' => true,
					'enable_utm'      => false,
				),
			);
		}

		// SMS and WhatsApp only require body
		if ( $channel_type === 'sms' || $channel_type === 'whatsapp' ) {
			if ( empty( $settings['body'] ) ) {
				return null;
			}

			$channel_label = ucfirst( $channel_type );
			return array(
				'name'     => "Automation: {$channel_label} - " . mb_substr( $settings['body'], 0, 30 ),
				'subject'  => '', // SMS/WhatsApp don't have subject
				'body'     => $settings['body'],
				'settings' => array(),
			);
		}

		return null;
	}
}
