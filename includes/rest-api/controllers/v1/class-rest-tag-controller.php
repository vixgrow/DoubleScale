<?php

/**
 * REST API: Tag Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Models\Tag_Model;
use QuillCRM\Abstracts\REST_Taxonomy_Controller;

/**
 * Tag Controller class
 */
class REST_Tag_Controller extends REST_Taxonomy_Controller {

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->rest_base     = 'tags';
		$this->model_class   = Tag_Model::class;
		$this->singular_name = 'Tag';
		$this->plural_name   = 'Tags';
	}
}