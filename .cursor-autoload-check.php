<?php
fwrite( STDERR, "step1\n" );
require __DIR__ . '/vendor/autoload.php';
fwrite( STDERR, "step2\n" );

$classes = array(
	'DoubleScale\\Fields\\ContactFields',
	'DoubleScale\\Fields\\Types\\TextField',
);
foreach ( $classes as $c ) {
	fwrite( STDERR, "loading $c\n" );
	$ok = class_exists( $c );
	fwrite( STDOUT, $c . ': ' . ( $ok ? 'OK' : 'MISSING' ) . "\n" );
}
