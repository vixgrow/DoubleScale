<?php
/**
 * Proposal comment model.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Models;

defined( 'ABSPATH' ) || exit;

use WPEloquent\Eloquent\Model;

/**
 * ProposalCommentModel class.
 */
class ProposalCommentModel extends Model {

	/**
	 * @var string
	 */
	protected $table = 'doublescale_sales_proposal_comments';

	/**
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * @var string[]
	 */
	protected $fillable = array(
		'proposal_id',
		'author_name',
		'content',
		'is_customer',
	);

	/**
	 * @var array<string, string>
	 */
	protected $casts = array(
		'is_customer' => 'boolean',
	);

	/**
	 * @var bool
	 */
	public $timestamps = false;

	const CREATED_AT = 'created_at';
}
