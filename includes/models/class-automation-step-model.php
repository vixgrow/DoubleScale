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
use QuillCRM\Services\Template_Data_Preparer;
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

		static::saving(
			function ( $step ) {
				$settings = $step->settings;

				$channel_type = self::get_channel_type_from_action( $step->action );

				if ( ! $channel_type ) {
					return;
				}

				// WhatsApp: Use pre-selected template_id instead of auto-generating
				// WhatsApp Business API requires pre-approved templates, so we link rather than create
				if ( $channel_type === 'whatsapp' && isset( $settings['template_id'] ) ) {
					// User selected an existing WhatsApp template - store it as template_ids array
					$settings['template_ids'] = array( (int) $settings['template_id'] );
					$step->settings           = $settings;

					quillcrm_get_logger()->info(
						'Automation step: WhatsApp template linked (no auto-generation)',
						array(
							'step_id'     => $step->id ?? 'new',
							'action'      => $step->action,
							'template_id' => $settings['template_id'],
							'code'        => 'automation_step_whatsapp_template_linked',
						)
					);
					return;
				}

				// Email/SMS: Auto-generate template from body content
				if ( isset( $settings['template_ids'] ) ) {
					self::process_template_update( $step, $channel_type, $settings );
				} else {
					self::process_template_create( $step, $channel_type, $settings );
				}
			}
		);

		static::updating(
			function ( $step ) {
				$settings = $step->settings;

				$channel_type = self::get_channel_type_from_action( $step->action );

				if ( ! $channel_type || ! isset( $settings['template_ids'] ) || empty( $settings['template_ids'] ) ) {
					return;
				}

				self::process_template_update( $step, $channel_type, $settings );
			}
		);
	}


	protected static function process_template_update( $step, $channel_type, &$settings ) {
		// WhatsApp: Check if template_id changed (user selected different template)
		// WhatsApp uses pre-approved Meta templates, so we just link to the new one
		if ( $channel_type === 'whatsapp' && isset( $settings['template_id'] ) ) {
			$old_template_id = reset( $settings['template_ids'] );
			$new_template_id = (int) $settings['template_id'];

			if ( $old_template_id !== $new_template_id ) {
				// User changed template selection - update template_ids
				$settings['template_ids'] = array( $new_template_id );
				$step->settings           = $settings;

				quillcrm_get_logger()->info(
					'Automation step: WhatsApp template changed',
					array(
						'step_id'         => $step->id,
						'old_template_id' => $old_template_id,
						'new_template_id' => $new_template_id,
						'code'            => 'automation_step_whatsapp_template_changed',
					)
				);
			}
			return; // Don't auto-update WhatsApp templates - they're pre-approved by Meta
		}

		$template_id = reset( $settings['template_ids'] );

		if ( Template_Data_Preparer::has_raw_template_fields( $settings, $channel_type ) ) {
			if ( Template_Model::is_used_in_tracking( $template_id ) ) {
				unset( $settings['template_ids'] );
				$step->settings = $settings;

				self::process_template_create( $step, $channel_type, $settings );

				quillcrm_get_logger()->info(
					'Automation step: Template in use, will create new template',
					array(
						'step_id'         => $step->id,
						'old_template_id' => $template_id,
						'code'            => 'automation_step_template_in_use',
					)
				);
			} else {
				$template = Template_Model::find( $template_id );
				if ( $template ) {
					$template_data = Template_Data_Preparer::prepare_from_settings( $settings, $channel_type, 'Automation: ' );
					if ( $template_data ) {
						// Add subject to settings array since setSubjectAttribute stores it there
						if ( ! empty( $template_data['subject'] ) ) {
							$template_data['settings']['subject'] = $template_data['subject'];
						}

						$template->update(
							array(
								'name'     => $template_data['name'],
								'body'     => $template_data['body'],
								'settings' => $template_data['settings'],
							)
						);

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
	}

	protected static function process_template_create( $step, $channel_type, &$settings ) {
		$template_data = Template_Data_Preparer::prepare_from_settings( $settings, $channel_type, 'Automation: ' );

		if ( ! empty( $template_data ) ) {
			$template_factory = Campaign_Template_Factory::instance();
			$template_ids     = $template_factory->process_templates_data(
				array( $template_data ),
				$channel_type,
				'draft'
			);

			if ( ! empty( $template_ids ) ) {
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
}
