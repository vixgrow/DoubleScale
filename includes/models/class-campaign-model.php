<?php
/**
 * Class Campaign_Model
 * This class is responsible for handling the campaign model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use QuillCRM\Models\Campaign_Email_Model;

/**
 * Campaign_Model class
 */
class Campaign_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_campaigns';

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
		'name',
		'description',
		'status',
		'settings',
		'parent_id',
		'count',
		'execute_at',
		'created_at',
		'updated_at',
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
	 * Get the campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function emails() {
		return $this->hasMany( Campaign_Email_Model::class, 'campaign_id', 'id' );
	}

	/**
	 * Boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		// Add settings column to campaign when creating
		self::creating(
			function( $model ) {
				if ( ! isset( $model->settings ) ) {
					$model->settings = wp_json_encode( array() );
				}
			}
		);
	}
}
