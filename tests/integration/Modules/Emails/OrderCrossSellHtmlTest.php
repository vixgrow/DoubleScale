<?php
/**
 * {{order:cross_sell_html}} — rich cross-sell product cards.
 *
 * Renders image, name, description, price and link for each cross-sell product
 * of an order, using real WooCommerce products.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Modules\Automations\MergeTags\Woocommerce\Order\OrderCrossSell;
use DoubleScale\Modules\Automations\MergeTags\Woocommerce\Order\OrderCrossSellHtml;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 * @group woocommerce
 */
final class OrderCrossSellHtmlTest extends IntegrationTestCase {

	public function setUp(): void {
		parent::setUp();

		if ( ! class_exists( 'WooCommerce' ) || ! function_exists( 'wc_get_order' ) ) {
			$this->markTestSkipped( 'WooCommerce is not available in this environment.' );
		}
	}

	/**
	 * @param string $name           Product name.
	 * @param int[]  $cross_sell_ids Cross-sell IDs.
	 * @param string $description    Short description.
	 * @param string $price          Regular price.
	 * @return \WC_Product_Simple
	 */
	private function make_product(
		string $name,
		array $cross_sell_ids = array(),
		string $description = '',
		string $price = '10.00'
	) {
		$product = new \WC_Product_Simple();
		$product->set_name( $name );
		$product->set_regular_price( $price );
		$product->set_status( 'publish' );
		$product->set_catalog_visibility( 'visible' );

		if ( '' !== $description ) {
			$product->set_short_description( $description );
		}

		if ( $cross_sell_ids ) {
			$product->set_cross_sell_ids( $cross_sell_ids );
		}

		$product->save();

		return $product;
	}

	/**
	 * @param \WC_Product[] $products Products.
	 * @return \WC_Order
	 */
	private function make_order( array $products ) {
		$order = wc_create_order();
		foreach ( $products as $product ) {
			$order->add_product( $product, 1 );
		}
		$order->save();

		return $order;
	}

	/**
	 * @param int $order_id Order ID.
	 * @return object
	 */
	private function contact_for_order( int $order_id ) {
		return new class( $order_id ) {
			/** @var int */
			private $order_id;

			public function __construct( int $order_id ) {
				$this->order_id = $order_id;
			}

			/**
			 * @param string $key     Key.
			 * @param mixed  $default Default.
			 * @return mixed
			 */
			public function get_data( $key, $default = null ) {
				return 'order_id' === $key ? $this->order_id : $default;
			}
		};
	}

	/**
	 * @param string $name           Cross-sell product name.
	 * @param string $description    Cross-sell short description.
	 * @return string Rendered HTML.
	 */
	private function render_for_single_cross_sell(
		string $name,
		string $description = '',
		string $price = '24.50'
	): string {
		$cross_sell = $this->make_product( $name, array(), $description, $price );
		$purchased  = $this->make_product( 'MAIN_PRODUCT', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $purchased ) );

		return ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);
	}

	public function test_renders_product_name(): void {
		$html = $this->render_for_single_cross_sell( 'FANCY_WIDGET' );

		$this->assertStringContainsString( 'FANCY_WIDGET', $html );
	}

	public function test_renders_description(): void {
		$html = $this->render_for_single_cross_sell(
			'WIDGET',
			'A very useful widget indeed.'
		);

		$this->assertStringContainsString( 'A very useful widget indeed.', $html );
	}

	public function test_renders_price(): void {
		$html = $this->render_for_single_cross_sell( 'WIDGET', '', '24.50' );

		$this->assertStringContainsString( '24.50', $html );
	}

	/**
	 * The product image is the main reason this tag exists, so it must render
	 * with a fixed pixel width — Outlook ignores percentage widths on images.
	 */
	public function test_renders_product_image(): void {
		$cross_sell = $this->make_product( 'IMAGED_WIDGET' );

		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'widget.jpg',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Widget image',
			),
			0,
			array( 'post_parent' => 0 )
		);
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'file'   => 'widget.jpg',
				'width'  => 600,
				'height' => 600,
				'sizes'  => array(),
			)
		);

		$cross_sell->set_image_id( $attachment_id );
		$cross_sell->save();

		$purchased = $this->make_product( 'MAIN', array( $cross_sell->get_id() ) );
		$order     = $this->make_order( array( $purchased ) );

		$html = ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertStringContainsString( '<img', $html );
		$this->assertStringContainsString( 'widget.jpg', $html );
		$this->assertStringContainsString( 'width="96"', $html );
		$this->assertStringContainsString( 'alt="IMAGED_WIDGET"', $html );
	}

	/**
	 * A product with no image must still render a valid card, not a broken
	 * <img> with an empty src.
	 */
	public function test_omits_image_cell_when_product_has_no_image(): void {
		$html = $this->render_for_single_cross_sell( 'NO_IMAGE_WIDGET' );

		$this->assertStringContainsString( 'NO_IMAGE_WIDGET', $html );
		$this->assertStringNotContainsString( '<img', $html );
	}

	public function test_renders_product_link(): void {
		$cross_sell = $this->make_product( 'LINKED_WIDGET' );
		$purchased  = $this->make_product( 'MAIN', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $purchased ) );

		$html = ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertStringContainsString(
			get_permalink( $cross_sell->get_id() ),
			$html
		);
	}

	/**
	 * Outlook's Word engine ignores float/flex, so the layout must be tables.
	 */
	public function test_layout_is_table_based_for_email_clients(): void {
		$html = $this->render_for_single_cross_sell( 'WIDGET' );

		$this->assertStringContainsString( '<table', $html );
		$this->assertStringNotContainsString( 'display:flex', $html );
		$this->assertStringNotContainsString( 'float:', $html );
	}

	/**
	 * External stylesheets are stripped by most clients — styling must be inline.
	 */
	public function test_styles_are_inline(): void {
		$html = $this->render_for_single_cross_sell( 'WIDGET' );

		$this->assertStringContainsString( 'style="', $html );
		$this->assertStringNotContainsString( '<style', $html );
		$this->assertStringNotContainsString( '<link', $html );
	}

	public function test_renders_a_card_per_cross_sell_product(): void {
		$first     = $this->make_product( 'CS_ALPHA' );
		$second    = $this->make_product( 'CS_BETA' );
		$purchased = $this->make_product(
			'MAIN',
			array( $first->get_id(), $second->get_id() )
		);
		$order     = $this->make_order( array( $purchased ) );

		$html = ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertStringContainsString( 'CS_ALPHA', $html );
		$this->assertStringContainsString( 'CS_BETA', $html );
	}

	/**
	 * A long cross-sell list must not turn the email into a catalogue.
	 */
	public function test_caps_the_number_of_cards(): void {
		$cross_sell_ids = array();
		for ( $i = 1; $i <= 7; $i++ ) {
			$cross_sell_ids[] = $this->make_product( "CS_NUMBER_{$i}" )->get_id();
		}

		$purchased = $this->make_product( 'MAIN', $cross_sell_ids );
		$order     = $this->make_order( array( $purchased ) );

		$html = ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$rendered = 0;
		for ( $i = 1; $i <= 7; $i++ ) {
			if ( false !== strpos( $html, "CS_NUMBER_{$i}" ) ) {
				++$rendered;
			}
		}

		$this->assertSame( 4, $rendered );
	}

	public function test_returns_empty_when_no_cross_sells(): void {
		$purchased = $this->make_product( 'LONELY' );
		$order     = $this->make_order( array( $purchased ) );

		$html = ( new OrderCrossSellHtml() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( '', $html );
	}

	/**
	 * Same guards as the plain tag — a bad context must not fatal the send.
	 */
	public function test_returns_empty_for_missing_order_context(): void {
		$tag = new OrderCrossSellHtml();

		$this->assertSame( '', $tag->get_value( null ) );
		$this->assertSame( '', $tag->get_value( new \stdClass() ) );
	}

	/**
	 * The plain-text tag must keep its comma-joined output: it is already used
	 * in text emails and subject lines, so it may not start emitting markup.
	 */
	public function test_plain_tag_output_is_unchanged(): void {
		$cross_sell = $this->make_product( 'PLAIN_CS' );
		$purchased  = $this->make_product( 'MAIN', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $purchased ) );

		$plain = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( 'PLAIN_CS', $plain );
		$this->assertStringNotContainsString( '<', $plain );
	}

	/**
	 * Both tags must be discoverable in the builder's merge-tag picker.
	 */
	public function test_both_tags_are_registered_under_the_order_group(): void {
		$manager = \DoubleScale\Core\MergeTags\MergeTagsManager::instance();

		$this->assertNotNull( $manager->get_merge_tag( 'order', 'cross_sell' ) );
		$this->assertNotNull( $manager->get_merge_tag( 'order', 'cross_sell_html' ) );
	}
}
