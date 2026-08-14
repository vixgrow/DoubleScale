<?php
/**
 * Pagination clamping and content shaping.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityResult;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilityResultTest extends TestCase {

	public function test_limit_uses_default_when_absent_or_invalid(): void {
		$this->assertSame( 20, AbilityResult::limit( array() ) );
		$this->assertSame( 20, AbilityResult::limit( array( 'limit' => 0 ) ) );
		$this->assertSame( 20, AbilityResult::limit( array( 'limit' => -5 ) ) );
	}

	/**
	 * Schema `maximum` is advisory — WP validates it, but the ability may also
	 * be called in-process where nothing does. The clamp is the real bound.
	 */
	public function test_limit_is_clamped_to_the_ceiling(): void {
		$this->assertSame( 100, AbilityResult::limit( array( 'limit' => 5000 ) ) );
		$this->assertSame( 50, AbilityResult::limit( array( 'limit' => 5000 ), 25, 50 ) );
	}

	public function test_offset_is_never_negative(): void {
		$this->assertSame( 0, AbilityResult::offset( array() ) );
		$this->assertSame( 0, AbilityResult::offset( array( 'offset' => -10 ) ) );
		$this->assertSame( 40, AbilityResult::offset( array( 'offset' => 40 ) ) );
	}

	/**
	 * Without has_more an agent cannot tell a capped page from a complete
	 * result, and will report a partial count as the final answer.
	 */
	public function test_collection_reports_has_more(): void {
		$page = AbilityResult::collection( array( 'a', 'b' ), 10, 2, 0 );
		$this->assertTrue( $page['has_more'] );
		$this->assertSame( 10, $page['total'] );

		$last = AbilityResult::collection( array( 'i', 'j' ), 10, 2, 8 );
		$this->assertFalse( $last['has_more'] );
	}

	public function test_collection_merges_extra_keys(): void {
		$page = AbilityResult::collection( array(), 0, 20, 0, array( 'scope' => 'own' ) );
		$this->assertSame( 'own', $page['scope'] );
	}

	public function test_plain_text_leaves_ordinary_prose_untouched(): void {
		$this->assertSame( 'Plain sentence, no markup.', AbilityResult::plain_text( 'Plain sentence, no markup.' ) );
		$this->assertSame( '', AbilityResult::plain_text( '' ) );
	}

	public function test_plain_text_strips_markup_and_decodes_entities(): void {
		$this->assertSame( 'Hello world', AbilityResult::plain_text( '<p>Hello <b>world</b></p>' ) );
		$this->assertSame( 'Cost is 5 & up', AbilityResult::plain_text( 'Cost is 5 &amp; up' ) );
	}

	/**
	 * wp_strip_all_tags() removes the <style> tag but keeps the CSS text
	 * inside it. On tickets harvested from marketing email that noise filled
	 * the truncation budget, so a body that was almost entirely markup came
	 * back flagged as complete.
	 */
	public function test_plain_text_removes_style_blocks_with_their_contents(): void {
		$html = '<style>body { color: red; font-size: 12px; }</style>Real content';
		$this->assertSame( 'Real content', AbilityResult::plain_text( $html ) );
	}

	public function test_plain_text_removes_bare_and_nested_css_rules(): void {
		$css = "@import 'https://cdn.example.com/trace.css';\n"
			. "body,\nhtml { margin: 0 !important; }\n"
			. "@media (min-width: 600px) { .pc { display: block !important; } }\n"
			. 'Actual message body';

		$this->assertSame( 'Actual message body', AbilityResult::plain_text( $css ) );
	}

	public function test_plain_text_collapses_invisible_padding(): void {
		$padded = "Short line\u{200B}\u{200B}\u{00A0}\u{00AD}\n\n\n\nNext line";
		$this->assertSame( "Short line\nNext line", AbilityResult::plain_text( $padded ) );
	}

	public function test_truncate_flags_only_when_over_the_budget(): void {
		$short = AbilityResult::truncate( 'brief', 100 );
		$this->assertFalse( $short['truncated'] );
		$this->assertSame( 'brief', $short['text'] );

		$long = AbilityResult::truncate( str_repeat( 'x', 500 ), 100 );
		$this->assertTrue( $long['truncated'] );
		$this->assertSame( 100, mb_strlen( $long['text'] ) );
	}

	public function test_error_helpers_carry_http_status(): void {
		$forbidden = AbilityResult::forbidden( 'nope' );
		$this->assertSame( 'doublescale_forbidden', $forbidden->get_error_code() );
		$this->assertSame( 403, $forbidden->get_error_data()['status'] );

		$missing = AbilityResult::not_found( 'gone' );
		$this->assertSame( 'doublescale_not_found', $missing->get_error_code() );
		$this->assertSame( 404, $missing->get_error_data()['status'] );
	}
}
