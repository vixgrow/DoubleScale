<?php
/**
 * Backward-compatibility alias.
 *
 * @deprecated 2.0.0 Use \DoubleScale\Core\CustomFields\CustomFieldsManager instead.
 * @package    DoubleScale\Pro
 */

namespace DoubleScale\Managers;

defined( 'ABSPATH' ) || exit;

\class_alias( \DoubleScale\Core\CustomFields\CustomFieldsManager::class, __NAMESPACE__ . '\CustomFieldsManager' );
