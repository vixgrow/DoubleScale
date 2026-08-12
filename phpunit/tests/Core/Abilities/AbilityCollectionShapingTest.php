<?php
/**
 * Guards against casting an Eloquent Collection to array when shaping output.
 *
 * `(array) $collection` does NOT iterate the rows — it exposes the object's
 * internal `items` property as a single element, so every row is silently
 * dropped and the ability reports an empty result. This shipped in Phase 1:
 * `list-contact-segments` returned 0 tags on a site with 39, which an agent
 * would state as fact ("you have no tags").
 *
 * The failure is invisible to stub-based tests because it only manifests
 * against a real Collection, so this pins the source instead.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilityCollectionShapingTest extends TestCase {

	/**
	 * Ability source files that shape model output.
	 *
	 * @return array<string, array{0: string}>
	 */
	public function ability_source_provider(): array {
		$roots = array(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities',
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules',
		);

		$files = array();
		foreach ( $roots as $root ) {
			if ( ! is_dir( $root ) ) {
				continue;
			}
			$it = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $root, \FilesystemIterator::SKIP_DOTS ) );
			foreach ( new \RegexIterator( $it, '#/Abilities/.+\.php$#' ) as $file ) {
				$path           = $file->getPathname();
				$files[ $path ] = array( $path );
			}
		}

		// Guarantee at least one case so the suite fails loudly if the glob breaks.
		if ( array() === $files ) {
			$files['no-ability-files-found'] = array( '' );
		}

		return $files;
	}

	/**
	 * @dataProvider ability_source_provider
	 *
	 * @param string $path Ability source file.
	 */
	public function test_no_array_cast_in_foreach( string $path ): void {
		$this->assertNotSame( '', $path, 'No ability source files were discovered.' );

		$source = (string) file_get_contents( $path );

		$this->assertDoesNotMatchRegularExpression(
			'#foreach\s*\(\s*\(array\)#',
			$source,
			basename( $path ) . ' casts a value to array inside foreach. If it is an Eloquent'
				. ' Collection every row is silently dropped — iterate it directly instead.'
		);
	}
}
