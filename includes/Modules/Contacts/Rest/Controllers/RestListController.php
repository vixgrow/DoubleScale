<?php

/**
 * REST Api: List Controller
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 * @subpackage Api
 */

namespace DoubleScale\Modules\Contacts\Rest\Controllers;

use DoubleScale\Core\Rest\Concerns\RegistersLegacyQcV1Routes;
use DoubleScale\Modules\Contacts\Models\ListModel;
use DoubleScale\Core\Abstracts\RestTaxonomyController;

/**
 * List Controller class
 */
class RestListController extends RestTaxonomyController {

	use RegistersLegacyQcV1Routes;

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