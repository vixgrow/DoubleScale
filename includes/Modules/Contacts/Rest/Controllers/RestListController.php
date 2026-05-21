<?php

/**
 * REST Api: List Controller
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 * @subpackage Api
 */

namespace DoubleScale\Modules\Contacts\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestTaxonomyController;
use DoubleScale\Modules\Contacts\Models\ListModel;

/**
 * List Controller class
 */
class RestListController extends RestTaxonomyController {

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->rest_base     = 'lists';
		$this->model_class   = ListModel::class;
		$this->singular_name = 'List';
		$this->plural_name   = 'Lists';
	}
}
