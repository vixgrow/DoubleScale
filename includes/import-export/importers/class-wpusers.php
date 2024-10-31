<?php
/**
 * WPUsers Importer
 *
 * This class is responsible for handling the WPUsers importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;
use QuillCRM\Models\User_Model;

/**
 * WPUsers Importer class
 */
class WPUsers extends Importer {

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
		$total = User_Model::count();

		$mapping = array(
			'email' => 'user_email',
		);

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function( $offset ) {
				return User_Model::offset( $offset )->limit( 20 )->get();
			},
			$mapping
		);

		return $result;
	}
}
