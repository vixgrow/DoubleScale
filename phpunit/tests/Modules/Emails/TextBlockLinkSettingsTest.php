<?php
/**
 * Theme link settings must survive render_from_builder_data (builder test send).
 *
 * @package DoubleScale\Tests\Modules\Emails
 */

namespace DoubleScale\Tests\Modules\Emails;

use DoubleScale\Modules\Emails\EmailRenderer;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group emails
 * @group smoke
 */
final class TextBlockLinkSettingsTest extends TestCase {

	public function test_custom_link_settings_are_inlined_on_text_block_anchors(): void {
		$renderer = new EmailRenderer();
		$html     = $renderer->render_from_builder_data( $this->builder_payload() );

		$this->assertStringContainsString( 'href="https://example.com/test-link"', $html );
		$this->assertStringContainsString( 'color: #ff00aa', $html );
		$this->assertStringContainsString( 'font-family: Georgia, serif', $html );
		$this->assertStringContainsString( 'font-size: 22px', $html );
		$this->assertStringContainsString( 'font-weight: bold', $html );
		$this->assertStringContainsString( 'text-decoration: line-through', $html );
		$this->assertMatchesRegularExpression(
			'/<a\b[^>]*style="[^"]*text-decoration:\s*none/i',
			$html
		);
		$this->assertStringNotContainsString( 'color: #458DC7', $html );
		$this->assertDoesNotMatchRegularExpression( '/<a\b[^>]*style="[^"]*color:\s*#333333/i', $html );
		$this->assertMatchesRegularExpression(
			'/<span[^>]*class="ds-text-link"[^>]*style="[^"]*font-size:\s*22px/i',
			$html
		);
		$this->assertStringContainsString( '<font color="#ff00aa"', $html );
	}

	public function test_missing_link_settings_fall_back_to_theme_defaults(): void {
		$payload = $this->builder_payload();
		unset( $payload['linkSettings'] );

		$renderer = new EmailRenderer();
		$html     = $renderer->render_from_builder_data( $payload );

		$this->assertStringContainsString( 'color: #458DC7', $html );
	}

	/**
	 * @return array<string, mixed>
	 */
	private function builder_payload(): array {
		return array(
			'globalSettings' => array(
				'canvasColor' => '#ffffff',
				'canvasWidth' => 600,
			),
			'linkSettings'   => array(
				'font'          => 'Georgia, serif',
				'size'          => 22,
				'letterSpacing' => '1px',
				'color'         => '#ff00aa',
				'bold'          => true,
				'italic'        => false,
				'underline'     => false,
				'strikethrough' => true,
			),
			'sections'       => array(
				array(
					'id'      => 'section-1',
					'columns' => array(
						array(
							'id'     => 'column-1',
							'width'  => 1,
							'blocks' => array(
								array(
									'id'    => 'block-1',
									'type'  => 'text',
									'props' => array(
										'content'  => '<p><a href="https://example.com/test-link">Hello</a></p>',
										'color'    => '#333333',
										'fontSize' => 16,
									),
								),
							),
						),
					),
				),
			),
		);
	}
}
