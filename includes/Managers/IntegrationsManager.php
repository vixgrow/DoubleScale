<?php
/**
 * Backward-compatibility alias.
 *
 * @deprecated 2.0.0 Use \DoubleScale\Modules\Integrations\Services\IntegrationsManager instead.
 * @package    DoubleScale\Pro
 */

namespace DoubleScale\Managers;

defined( 'ABSPATH' ) || exit;

\class_alias( \DoubleScale\Modules\Integrations\Services\IntegrationsManager::class, __NAMESPACE__ . '\IntegrationsManager' );
