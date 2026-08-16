<?php
/**
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\I18n\JedJsonCompiler;
use DoubleScale\I18n\LocoJsonSync;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class JedJsonCompilerTest extends TestCase {

	/** @var string */
	private $dir;

	protected function setUp(): void {
		parent::setUp();
		$this->dir = sys_get_temp_dir() . '/ds-jed-' . uniqid( '', true );
		$this->assertTrue( mkdir( $this->dir, 0777, true ) );
	}

	protected function tearDown(): void {
		foreach ( glob( $this->dir . '/*' ) ?: array() as $file ) {
			unlink( $file );
		}
		if ( is_dir( $this->dir ) ) {
			rmdir( $this->dir );
		}
		parent::tearDown();
	}

	public function test_compile_writes_hashed_json_with_translation(): void {
		$po = $this->dir . '/doublescale-pt_BR.po';
		file_put_contents(
			$po,
			"msgid \"\"\nmsgstr \"\"\n\"Language: pt_BR\\n\"\n\n"
			. "msgid \"Connect PayPal\"\nmsgstr \"Conectar PayPal\"\n"
		);

		$count = JedJsonCompiler::compile(
			'pt_BR',
			$this->dir,
			array( 'build/client/index.js' ),
			array( $po )
		);

		$this->assertSame( 1, $count );
		$json_file = $this->dir . '/doublescale-pt_BR-' . md5( 'build/client/index.js' ) . '.json';
		$this->assertFileExists( $json_file );
		$data = json_decode( (string) file_get_contents( $json_file ), true );
		$this->assertSame( array( 'Conectar PayPal' ), $data['locale_data']['messages']['Connect PayPal'] );
	}

	public function test_later_po_wins_on_conflict(): void {
		$free = $this->dir . '/free.po';
		$pro  = $this->dir . '/pro.po';
		file_put_contents( $free, "msgid \"Connect PayPal\"\nmsgstr \"Free PayPal\"\n" );
		file_put_contents( $pro, "msgid \"Connect PayPal\"\nmsgstr \"Pro PayPal\"\n" );

		JedJsonCompiler::compile(
			'pt_BR',
			$this->dir,
			array( 'build/client/index.js' ),
			array( $free, $pro )
		);

		$json_file = $this->dir . '/doublescale-pt_BR-' . md5( 'build/client/index.js' ) . '.json';
		$data      = json_decode( (string) file_get_contents( $json_file ), true );
		$this->assertSame( array( 'Pro PayPal' ), $data['locale_data']['messages']['Connect PayPal'] );
	}

	public function test_loco_sync_matches_author_po_only(): void {
		$po = $this->dir . '/doublescale-pt_BR.po';
		file_put_contents( $po, '' );

		$this->assertSame( 'pt_BR', LocoJsonSync::locale_for_written_file( $po, array( $this->dir ) ) );
		$this->assertNull( LocoJsonSync::locale_for_written_file( $this->dir . '/doublescale-pt_BR.mo', array( $this->dir ) ) );
		$this->assertNull( LocoJsonSync::locale_for_written_file( $this->dir . '/other-pt_BR.po', array( $this->dir ) ) );
		$this->assertNull( LocoJsonSync::locale_for_written_file( $po, array( $this->dir . '/elsewhere' ) ) );
	}
}
