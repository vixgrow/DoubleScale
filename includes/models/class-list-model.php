<?php

/**
 * Class List_Model
 * This class is responsible for handling the list model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Abstracts\Taxonomy_Model;

/**
 * List_Model class
 */
class List_Model extends Taxonomy_Model {




	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillcrm_lists';

	/**
	 * Model name
	 *
	 * @var string
	 */
	protected $model_name = 'List';

	/**
	 * Model slug
	 *
	 * @var string
	 */
	protected $model_slug = 'list';


	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required' => 'List name is required',
	);
}
