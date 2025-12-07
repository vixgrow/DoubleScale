<?php

/**
 * Class Tag_Model
 * This class is responsible for handling the tag model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Abstracts\Taxonomy_Model;

/**
 * Tag_Model class
 */
class Tag_Model extends Taxonomy_Model {


	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillcrm_tags';

	/**
	 * Model name
	 *
	 * @var string
	 */
	protected $model_name = 'Tag';

	/**
	 * Model slug
	 *
	 * @var string
	 */
	protected $model_slug = 'tag';

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required' => 'Tag name is required',
	);
}
