<?php
/**
 * {{order:cross_sell}} against real WooCommerce orders.
 *
 * Complements OrderCrossSellTagTest (which only covers the guards): this builds
 * actual products and orders through the WooCommerce APIs and asserts what the
 * merge tag renders.
 *
 * Two bugs are covered here:
 *  - the fatal that aborted the email (missing order, deleted product);
 *  - the silent-empty bug, where the tag read `$order->get_items('cross_sell')`.
 *    WooCommerce has no such line-item type, so it always returned nothing;
 *    cross-sells hang off each purchased product instead.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Modules\Automations\MergeTags\Woocommerce\Order\OrderCrossSell;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 * @group woocommerce
 */
final class OrderCrossSellRealOrderTest extends IntegrationTestCase {

	public function setUp(): void {
		parent::setUp();

		if ( ! class_exists( 'WooCommerce' ) || ! function_exists( 'wc_get_order' ) ) {
			$this->markTestSkipped( 'WooCommerce is not available in this environment.' );
		}
	}

	/**
	 * Create a published simple product.
	 *
	 * @param string $name          Product name.
	 * @param int[]  $cross_sell_ids Cross-sell product IDs.
	 * @return \WC_Product_Simple
	 */
	private function make_product( string $name, array $cross_sell_ids = array() ) {
		$product = new \WC_Product_Simple();
		$product->set_name( $name );
		$product->set_regular_price( '10.00' );
		$product->set_status( 'publish' );
		$product->set_catalog_visibility( 'visible' );

		if ( $cross_sell_ids ) {
			$product->set_cross_sell_ids( $cross_sell_ids );
		}

		$product->save();

		return $product;
	}

	/**
	 * Create an order containing the given products.
	 *
	 * @param \WC_Product[] $products Products to add.
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
	 * Contact double exposing the order id the tag reads.
	 *
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
	 * The headline case: a purchased product that defines a cross-sell must
	 * render that cross-sell's name. This failed (rendered '') before the fix.
	 */
	public function test_renders_cross_sell_product_name(): void {
		$cross_sell = $this->make_product( 'CROSS_SELL_WIDGET' );
		$purchased  = $this->make_product( 'MAIN_PRODUCT', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $purchased ) );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( 'CROSS_SELL_WIDGET', $value );
	}

	public function test_renders_multiple_cross_sells_comma_separated(): void {
		$first     = $this->make_product( 'CS_ONE' );
		$second    = $this->make_product( 'CS_TWO' );
		$purchased = $this->make_product(
			'MAIN',
			array( $first->get_id(), $second->get_id() )
		);
		$order     = $this->make_order( array( $purchased ) );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertStringContainsString( 'CS_ONE', $value );
		$this->assertStringContainsString( 'CS_TWO', $value );
		$this->assertStringContainsString( ', ', $value );
	}

	/**
	 * Recommending something already in the order is noise.
	 */
	public function test_excludes_cross_sells_already_purchased(): void {
		$also_bought = $this->make_product( 'ALREADY_BOUGHT' );
		$purchased   = $this->make_product( 'MAIN', array( $also_bought->get_id() ) );
		$order       = $this->make_order( array( $purchased, $also_bought ) );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( '', $value );
	}

	/**
	 * Two ordered products pointing at the same cross-sell list it once.
	 */
	public function test_deduplicates_cross_sells_across_line_items(): void {
		$cross_sell = $this->make_product( 'SHARED_CS' );
		$first      = $this->make_product( 'MAIN_A', array( $cross_sell->get_id() ) );
		$second     = $this->make_product( 'MAIN_B', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $first, $second ) );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( 'SHARED_CS', $value );
	}

	public function test_returns_empty_when_no_cross_sells_configured(): void {
		$purchased = $this->make_product( 'LONELY_PRODUCT' );
		$order     = $this->make_order( array( $purchased ) );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( '', $value );
	}

	/**
	 * A cross-sell deleted after the order was placed must be skipped, not
	 * fataled on — this is the crash Fadhl hit.
	 */
	public function test_skips_deleted_cross_sell_product(): void {
		$cross_sell = $this->make_product( 'DOOMED_CS' );
		$survivor   = $this->make_product( 'LIVE_CS' );
		$purchased  = $this->make_product(
			'MAIN',
			array( $cross_sell->get_id(), $survivor->get_id() )
		);
		$order      = $this->make_order( array( $purchased ) );

		wp_delete_post( $cross_sell->get_id(), true );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( 'LIVE_CS', $value );
	}

	/**
	 * A purchased product deleted after the order — the other crash shape,
	 * where $item->get_product() returns null.
	 */
	public function test_skips_deleted_purchased_product(): void {
		$cross_sell = $this->make_product( 'CS_FROM_LIVE' );
		$deleted    = $this->make_product( 'WILL_BE_DELETED' );
		$live       = $this->make_product( 'LIVE_MAIN', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $deleted, $live ) );

		wp_delete_post( $deleted->get_id(), true );

		$value = ( new OrderCrossSell() )->get_value(
			$this->contact_for_order( $order->get_id() )
		);

		$this->assertSame( 'CS_FROM_LIVE', $value );
	}

	/**
	 * End to end: the tag resolves inside real content without aborting.
	 */
	public function test_tag_resolves_within_email_content(): void {
		$cross_sell = $this->make_product( 'INLINE_CS' );
		$purchased  = $this->make_product( 'MAIN', array( $cross_sell->get_id() ) );
		$order      = $this->make_order( array( $purchased ) );

		$tag  = new OrderCrossSell();
		$html = 'You may also like: ' . $tag->get_value(
			$this->contact_for_order( $order->get_id() )
		) . '!';

		$this->assertSame( 'You may also like: INLINE_CS!', $html );
	}
}
