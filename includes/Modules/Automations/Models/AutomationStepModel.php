<?php

/**
 * Class AutomationStepModel
 * This class is responsible for handling the Automation Step model
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Models;

defined( 'ABSPATH' ) || exit;

use WPEloquent\Eloquent\Model;
use DoubleScale\Modules\Tracking\Models\TrackingTemplateModel;

/**
 * AutomationStepModel class
 */
class AutomationStepModel extends Model {




	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'doublescale_automation_steps';

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
		return $this->belongsTo( AutomationModel::class, 'automation_id', 'id' );
	}

	/**
	 * Get the contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function contacts() {
		return $this->hasMany( AutomationContactModel::class, 'step_id', 'id' );
	}

	/**
	 * Get the processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( AutomationContactProcessesModel::class, 'step_id', 'id' );
	}

	/**
	 * Get the parent
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function parent() {
		return $this->belongsTo( self::class, 'parent_id', 'id' );
	}

	/**
	 * Get the children
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function children() {
		return $this->hasMany( self::class, 'parent_id', 'id' );
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

				// Verbose diagnostic only (avoid ERROR level — this runs on every step save).
				if ( function_exists( 'doublescale_get_logger' ) ) {
					doublescale_get_logger()->debug(
						'Automation step saving event triggered',
						array(
							'step_id'  => $step->id ?? 'new',
							'action'   => $step->action,
							'settings' => $settings,
							'code'     => 'automation_step_saving_triggered',
						)
					);
				}

				$channel_type = self::get_channel_type_from_action( $step->action );

				if ( ! $channel_type ) {
					return;
				}

				// WhatsApp: Use pre-selected template_id instead of auto-generating
				// WhatsApp Business Api requires pre-approved templates, so we link rather than create
				if ( $channel_type === 'whatsapp' && isset( $settings['template_id'] ) ) {
					// User selected an existing WhatsApp template - store it as template_ids array
					$settings['template_ids'] = array( (int) $settings['template_id'] );
					$step->settings           = $settings;

					doublescale_get_logger()->info(
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

				// Email/Sms: Auto-generate template from body content
				if ( isset( $settings['template_ids'] ) ) {
					self::process_template_update( $step, $channel_type, $settings );
				} else {
					self::process_template_create( $step, $channel_type, $settings );
				}

				// Log final state after template processing
				doublescale_get_logger()->debug(
					'Automation step saving event completed',
					array(
						'step_id'          => $step->id ?? 'new',
						'action'           => $step->action,
						'final_settings'   => $step->settings,
						'has_template_ids' => isset( $step->settings['template_ids'] ),
						'code'             => 'automation_step_saving_completed',
					)
				);
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
		if ( ! class_exists( '\DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer' ) ) {
			return;
		}
		// WhatsApp: Check if template_id changed (user selected different template)
		// WhatsApp uses pre-approved Meta templates, so we just link to the new one
		if ( $channel_type === 'whatsapp' && isset( $settings['template_id'] ) ) {
			$old_template_id = reset( $settings['template_ids'] );
			$new_template_id = (int) $settings['template_id'];

			if ( $old_template_id !== $new_template_id ) {
				// User changed template selection - update template_ids
				$settings['template_ids'] = array( $new_template_id );
				$step->settings           = $settings;

				doublescale_get_logger()->info(
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

		if ( \DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer::has_raw_template_fields( $settings, $channel_type ) ) {
			if ( TrackingTemplateModel::is_used_in_tracking( $template_id ) ) {
				unset( $settings['template_ids'] );
				$step->settings = $settings;

				self::process_template_create( $step, $channel_type, $settings );

				doublescale_get_logger()->info(
					'Automation step: Template in use, will create new template',
					array(
						'step_id'         => $step->id,
						'old_template_id' => $template_id,
						'code'            => 'automation_step_template_in_use',
					)
				);
			} else {
				$template = TrackingTemplateModel::find( $template_id );
				if ( $template ) {
					$template_data = \DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer::prepare_from_settings( $settings, $channel_type, 'Automation: ' );
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

						doublescale_get_logger()->info(
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
		if ( ! class_exists( '\DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer' )
			|| ! class_exists( '\DoubleScale\Modules\Campaigns\Services\CampaignTemplateFactory' ) ) {
			return;
		}
		doublescale_get_logger()->debug(
			'Automation step: Starting template creation',
			array(
				'step_id'      => $step->id ?? 'new',
				'action'       => $step->action,
				'channel_type' => $channel_type,
				'settings'     => $settings,
				'code'         => 'automation_step_template_create_start',
			)
		);

		try {
			$template_data = \DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer::prepare_from_settings( $settings, $channel_type, 'Automation: ' );

			if ( empty( $template_data ) ) {
				doublescale_get_logger()->warning(
					'Automation step: Template data preparation returned empty',
					array(
						'step_id'      => $step->id ?? 'new',
						'action'       => $step->action,
						'channel_type' => $channel_type,
						'settings'     => $settings,
						'code'         => 'automation_step_template_data_empty',
					)
				);
				return;
			}

			doublescale_get_logger()->debug(
				'Automation step: Template data prepared',
				array(
					'step_id'       => $step->id ?? 'new',
					'template_data' => $template_data,
					'code'          => 'automation_step_template_data_prepared',
				)
			);

			$template_factory = \DoubleScale\Modules\Campaigns\Services\CampaignTemplateFactory::instance();
			$template_ids     = $template_factory->process_templates_data(
				array( $template_data ),
				$channel_type,
				'draft'
			);

			if ( empty( $template_ids ) ) {
				doublescale_get_logger()->error(
					'Automation step: Template factory returned empty template_ids',
					array(
						'step_id'       => $step->id ?? 'new',
						'action'        => $step->action,
						'channel_type'  => $channel_type,
						'template_data' => $template_data,
						'code'          => 'automation_step_template_factory_failed',
					)
				);
				return;
			}

			$settings['template_ids'] = $template_ids;
			$step->settings           = $settings;

			doublescale_get_logger()->info(
				'Automation step: Template processed and saved',
				array(
					'step_id'      => $step->id ?? 'new',
					'action'       => $step->action,
					'template_ids' => $template_ids,
					'code'         => 'automation_step_template_processed',
				)
			);
		} catch ( \Exception $e ) {
			doublescale_get_logger()->error(
				'Automation step: Exception during template creation',
				array(
					'step_id' => $step->id ?? 'new',
					'action'  => $step->action,
					'error'   => $e->getMessage(),
					'trace'   => $e->getTraceAsString(),
					'code'    => 'automation_step_template_create_exception',
				)
			);
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
