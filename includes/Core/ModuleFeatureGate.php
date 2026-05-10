<?php
/**
 * Module / feature gate helpers (DoubleScale free — canonical definitions).
 * Pro extends via {@see 'doublescale_module_slug_to_class_map'} and related filters.
 *
 * @package DoubleScale
 */

defined( 'ABSPATH' ) || exit;

/**
 * Discovered Module class map (free modules). Pro merges via filter.
 *
 * @return array<string, class-string<\DoubleScale\Core\ModuleInterface>>
 */
function doublescale_module_slug_to_class_map(): array {
	if ( isset( $GLOBALS['doublescale_module_slug_to_class_map_cache'] ) && is_array( $GLOBALS['doublescale_module_slug_to_class_map_cache'] ) ) {
		return $GLOBALS['doublescale_module_slug_to_class_map_cache'];
	}

	$base = array();

	if ( defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
		$root = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/';
		foreach ( (array) glob( $root . '*', GLOB_ONLYDIR ) as $dir ) {
			$basename = basename( $dir );
			$class    = 'DoubleScale\\Modules\\' . $basename . '\\Module';
			if ( ! class_exists( $class ) ) {
				continue;
			}
			$module = new $class();
			if ( ! $module instanceof \DoubleScale\Core\ModuleInterface ) {
				continue;
			}
			$base[ $module->slug() ] = $class;
		}
	}

	$GLOBALS['doublescale_module_slug_to_class_map_cache'] = apply_filters( 'doublescale_module_slug_to_class_map', $base );

	return $GLOBALS['doublescale_module_slug_to_class_map_cache'];
}

/**
 * Whether a discovered module is enabled ({@see ModuleInterface::is_enabled()}).
 * Unknown slugs return true so third-party groups are not stripped by mistake.
 *
 * @param string $slug Module slug.
 */
function doublescale_is_module_enabled( string $slug ): bool {
	if ( ! isset( $GLOBALS['doublescale_module_enabled_cache'] ) || ! is_array( $GLOBALS['doublescale_module_enabled_cache'] ) ) {
		$GLOBALS['doublescale_module_enabled_cache'] = array();
	}
	$cache = &$GLOBALS['doublescale_module_enabled_cache'];

	if ( array_key_exists( $slug, $cache ) ) {
		return $cache[ $slug ];
	}

	$classes = doublescale_module_slug_to_class_map();
	if ( ! isset( $classes[ $slug ] ) ) {
		return $cache[ $slug ] = true;
	}

	$module = new $classes[ $slug ]();

	return $cache[ $slug ] = $module->is_enabled();
}

if ( ! function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
	/**
	 * Clears the request-level cache used by {@see doublescale_is_module_enabled()}.
	 */
	function doublescale_flush_module_enabled_cache(): void {
		if ( isset( $GLOBALS['doublescale_module_enabled_cache'] ) ) {
			$GLOBALS['doublescale_module_enabled_cache'] = array();
		}
		unset( $GLOBALS['doublescale_module_slug_to_class_map_cache'] );
	}
}

/**
 * @return array<string, array<string, string>>
 */
function doublescale_feature_group_module_slug_map(): array {
	$map = array(
		'contact_filters'  => array(),
		'automation_rules' => array(),
		'merge_tags'       => array(),
	);

	return apply_filters( 'doublescale_feature_group_module_slug_map', $map );
}

/**
 * @param string $group_key Group key.
 * @param string $context   contact_filters | automation_rules | merge_tags.
 */
function doublescale_feature_group_owned_module( string $group_key, string $context ): ?string {
	$maps = doublescale_feature_group_module_slug_map();
	$slug = $maps[ $context ][ $group_key ] ?? null;

	return apply_filters( 'doublescale_feature_group_owned_module', $slug, $group_key, $context );
}

/**
 * @param array<string, array<string, mixed>> $groups
 * @return array<string, array<string, mixed>>
 */
function doublescale_filter_contact_filters_groups_for_modules( array $groups ): array {
	foreach ( array_keys( $groups ) as $key ) {
		$owner = doublescale_feature_group_owned_module( $key, 'contact_filters' );
		if ( null !== $owner && ! doublescale_is_module_enabled( $owner ) ) {
			unset( $groups[ $key ] );
			continue;
		}
		$filters = $groups[ $key ]['filters'] ?? array();
		if ( ! is_array( $filters ) || array() === $filters ) {
			unset( $groups[ $key ] );
		}
	}

	return apply_filters( 'doublescale_contact_filters_groups_for_modules', $groups );
}

/**
 * @param array<string, array<string, mixed>> $groups
 * @return array<string, array<string, mixed>>
 */
function doublescale_filter_automation_rules_groups_for_modules( array $groups ): array {
	foreach ( array_keys( $groups ) as $key ) {
		$owner = doublescale_feature_group_owned_module( $key, 'automation_rules' );
		if ( null !== $owner && ! doublescale_is_module_enabled( $owner ) ) {
			unset( $groups[ $key ] );
			continue;
		}
		$rules = $groups[ $key ]['rules'] ?? array();
		if ( ! is_array( $rules ) || array() === $rules ) {
			unset( $groups[ $key ] );
		}
	}

	return apply_filters( 'doublescale_automation_rules_groups_for_modules', $groups );
}

/**
 * @param array<string, array<string, mixed>> $groups
 * @return array<string, array<string, mixed>>
 */
function doublescale_filter_merge_tag_groups_for_modules( array $groups ): array {
	foreach ( array_keys( $groups ) as $key ) {
		$owner = doublescale_feature_group_owned_module( $key, 'merge_tags' );
		if ( null !== $owner && ! doublescale_is_module_enabled( $owner ) ) {
			unset( $groups[ $key ] );
		}
	}

	$groups = apply_filters( 'doublescale_merge_tag_groups_module_filtered', $groups );

	return $groups;
}
