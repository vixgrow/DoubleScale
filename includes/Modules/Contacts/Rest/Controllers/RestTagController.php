<?php

/**
 * REST Api: Tag Controller
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 * @subpackage Api
 */

namespace DoubleScale\Modules\Contacts\Rest\Controllers;

use DoubleScale\Core\Rest\Concerns\RegistersLegacyQcV1Routes;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Core\Abstracts\RestTaxonomyController;

/**
 * Tag Controller class
 */
class RestTagController extends RestTaxonomyController {

	use RegistersLegacyQcV1Routes;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->rest_base     = 'tags';
		$this->model_class   = TagModel::class;
		$this->singular_name = 'Tag';
		$this->plural_name   = 'Tags';
	}
}