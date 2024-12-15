<?php
/**
 * Class Log_Model
 *
 * This class is responsible for handling the Logs model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * Log_Model class
 */
class Log_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_logs';

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
		'timestamp',
		'level',
		'source',
		'message',
		'context',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'timestamp' => 'datetime',
		'context'   => 'array',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 */
	public $timestamps = false;
}
