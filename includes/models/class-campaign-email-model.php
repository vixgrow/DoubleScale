<?php
/**
 * Campaign Email Model
 * This class is responsible for handling the campaign email model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Template_Model;

/**
 * Campaign_Email_Model class
 */
class Campaign_Email_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_campaign_emails';

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
		'campaign_id',
		'contact_id',
		'template_id',
		'hash_key',
		'email',
		'opened',
		'clicked',
		'status',
		'sent_at',
		'opened_at',
		'clicked_at',
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
	 * Campaign
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function campaign() {
		return $this->belongsTo( Campaign_Model::class, 'campaign_id' );
	}

	/**
	 * Contact
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'contact_id' );
	}

	/**
	 * Template
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function template() {
		return $this->belongsTo( Template_Model::class, 'template_id' );
	}

	/**
	 * Get by hash key
	 *
	 * @param string $hash_key Hash key.
	 *
	 * @since 1.0.0
	 *
	 * @return object
	 */
	public static function get_by_hash_key( $hash_key ) {
		return self::where( 'hash_key', $hash_key )->firstOrFail();
	}
}
