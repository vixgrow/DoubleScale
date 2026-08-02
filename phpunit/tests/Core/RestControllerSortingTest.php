<?php
/**
 * Shared list sorting helper.
 *
 * `orderby` reaches the ORDER BY clause, so the allow-list is a security
 * boundary as well as a correctness one.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Abstracts\RestController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

/**
 * Records orderBy() calls instead of touching the database.
 */
class SpyQuery {

	/** @var array<int, array{0:string,1:string}> */
	public $order_by = array();

	/**
	 * @param string $column    Column.
	 * @param string $direction Direction.
	 *
	 * @return self
	 */
	public function orderBy( $column, $direction = 'asc' ) {
		$this->order_by[] = array( $column, $direction );
		return $this;
	}
}

/**
 * Minimal request double exposing get_param().
 */
class SpyRequest {

	/** @var array<string, mixed> */
	private $params;

	/**
	 * @param array<string, mixed> $params Params.
	 */
	public function __construct( array $params = array() ) {
		$this->params = $params;
	}

	/**
	 * @param string $key Param name.
	 *
	 * @return mixed
	 */
	public function get_param( $key ) {
		return $this->params[ $key ] ?? null;
	}
}

/**
 * @group smoke
 */
class RestControllerSortingTest extends TestCase {

	/**
	 * Invoke the protected helper on a concrete controller instance.
	 *
	 * @param SpyQuery   $query   Query spy.
	 * @param SpyRequest $request Request double.
	 * @param string[]   $allowed Allowed columns.
	 *
	 * @return void
	 */
	private function apply( $query, $request, array $allowed = array( 'name', 'status', 'created_at' ) ) {
		$controller = $this->getMockBuilder( RestController::class )
			->disableOriginalConstructor()
			->getMockForAbstractClass();

		$method = new ReflectionMethod( RestController::class, 'apply_sorting' );
		$method->setAccessible( true );
		$method->invoke( $controller, $query, $request, $allowed );
	}

	/**
	 * A whitelisted column and direction are applied as requested.
	 */
	public function test_allowed_column_is_applied(): void {
		$query = new SpyQuery();
		$this->apply( $query, new SpyRequest( array( 'orderby' => 'name', 'order' => 'asc' ) ) );

		$this->assertSame( array( 'name', 'asc' ), $query->order_by[0] );
	}

	/**
	 * A column outside the allow-list never reaches ORDER BY.
	 */
	public function test_unknown_column_falls_back_to_default(): void {
		$query = new SpyQuery();
		$this->apply( $query, new SpyRequest( array( 'orderby' => 'settings', 'order' => 'asc' ) ) );

		$this->assertSame( 'created_at', $query->order_by[0][0] );
	}

	/**
	 * SQL smuggled through orderby is discarded rather than concatenated.
	 */
	public function test_sql_injection_attempt_is_rejected(): void {
		$query = new SpyQuery();
		$this->apply(
			$query,
			new SpyRequest( array( 'orderby' => 'name; DROP TABLE wp_users; --', 'order' => 'asc' ) )
		);

		$this->assertSame( 'created_at', $query->order_by[0][0] );

		foreach ( $query->order_by as $clause ) {
			$this->assertStringNotContainsString( 'DROP', $clause[0] );
		}
	}

	/**
	 * An invalid direction degrades to the default rather than being passed on.
	 */
	public function test_invalid_direction_falls_back(): void {
		$query = new SpyQuery();
		$this->apply( $query, new SpyRequest( array( 'orderby' => 'name', 'order' => 'sideways' ) ) );

		$this->assertSame( array( 'name', 'desc' ), $query->order_by[0] );
	}

	/**
	 * A secondary id sort keeps paging stable when sort values tie.
	 */
	public function test_adds_id_tiebreaker(): void {
		$query = new SpyQuery();
		$this->apply( $query, new SpyRequest( array( 'orderby' => 'status', 'order' => 'asc' ) ) );

		$this->assertCount( 2, $query->order_by );
		$this->assertSame( array( 'id', 'desc' ), $query->order_by[1] );
	}

	/**
	 * Sorting by id already provides a deterministic order.
	 */
	public function test_no_duplicate_tiebreaker_when_sorting_by_id(): void {
		$query = new SpyQuery();
		$this->apply(
			$query,
			new SpyRequest( array( 'orderby' => 'id', 'order' => 'asc' ) ),
			array( 'id', 'name' )
		);

		$this->assertCount( 1, $query->order_by );
	}

	/**
	 * No params at all still yields a deterministic default order.
	 */
	public function test_defaults_when_no_params_given(): void {
		$query = new SpyQuery();
		$this->apply( $query, new SpyRequest() );

		$this->assertSame( array( 'created_at', 'desc' ), $query->order_by[0] );
	}
}
