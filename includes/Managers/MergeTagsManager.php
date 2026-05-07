<?php
/**
 * Legacy entry point — delegates to the canonical automations merge-tag service.
 *
 * @package DoubleScale\Managers
 */

namespace DoubleScale\Managers;

defined( 'ABSPATH' ) || exit;

/**
 * @deprecated Prefer {@see \DoubleScale\Modules\Automations\Services\MergeTagsManager}.
 */
final class MergeTagsManager {

	/**
	 * @return \DoubleScale\Modules\Automations\Services\MergeTagsManager
	 */
	public static function instance() {
		return \DoubleScale\Modules\Automations\Services\MergeTagsManager::instance();
	}
}
