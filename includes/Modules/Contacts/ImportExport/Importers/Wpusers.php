<?php
/**
 * Wpusers Importer
 *
 * This class is responsible for handling the Wpusers importer
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\ImportExport\Importers;

use DoubleScale\Modules\Contacts\Abstracts\Importer;
use DoubleScale\Core\Models\UserModel;

/**
 * Wpusers Importer class
 */
class Wpusers extends Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'WordPress Users';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'wpusers';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = false;

	/**
	 * Run importer
	 */
	public function run() {
		$total = UserModel::count();

		$mapping = array(
			'email' => 'user_email',
		);

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function( $offset ) {
				return UserModel::offset( $offset )->limit( 20 )->get();
			},
			$mapping
		);

		return $result;
	}
}
