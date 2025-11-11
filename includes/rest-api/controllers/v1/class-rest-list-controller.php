<?php

/**
 * REST API: List Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Models\List_Model;
use QuillCRM\Abstracts\REST_Taxonomy_Controller;

/**
 * List Controller class
 */
class REST_List_Controller extends REST_Taxonomy_Controller {

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->rest_base     = 'lists';
		$this->model_class   = List_Model::class;
		$this->singular_name = 'List';
		$this->plural_name   = 'Lists';
	}
}