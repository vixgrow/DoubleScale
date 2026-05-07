<?php
/**
 * Backward-compatibility alias.
 *
 * @deprecated 2.0.0 Use \DoubleScale\Core\AddonsManager instead.
 * @package    DoubleScale\Pro
 */

namespace DoubleScale\Managers;

defined( 'ABSPATH' ) || exit;

\class_alias( \DoubleScale\Core\AddonsManager::class, __NAMESPACE__ . '\AddonsManager' );
