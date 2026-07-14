<?php
/**
 * Generate DoubleScale-branded sales template thumbnails (not Propovoice assets).
 * Run: php bin/generate-sales-template-thumbs.php
 */

$out_dir = dirname( __DIR__ ) . '/assets/images/sales-templates';
if ( ! is_dir( $out_dir ) ) {
	mkdir( $out_dir, 0755, true );
}

$W = 360;
$H = 504;

$designs = array(
	1 => array(
		'name'   => 'Classic',
		'accent' => array( 58, 91, 255 ),
		'thead'  => array( 237, 242, 247 ),
		'total'  => array( 45, 55, 72 ),
		'ornament' => 'none',
	),
	2 => array(
		'name'   => 'Ocean',
		'accent' => array( 0, 149, 255 ),
		'thead'  => array( 0, 149, 255 ),
		'total'  => array( 0, 149, 255 ),
		'ornament' => 'corners-quad',
	),
	3 => array(
		'name'   => 'Corner',
		'accent' => array( 76, 111, 255 ),
		'thead'  => array( 160, 174, 192 ),
		'total'  => array( 76, 111, 255 ),
		'ornament' => 'corners-pair',
		'center' => true,
	),
	4 => array(
		'name'   => 'Gold',
		'accent' => array( 198, 169, 107 ),
		'thead'  => array( 198, 169, 107 ),
		'total'  => array( 198, 169, 107 ),
		'ornament' => 'wave',
		'center' => true,
	),
	5 => array(
		'name'   => 'Soft',
		'accent' => array( 197, 212, 227 ),
		'thead'  => array( 197, 212, 227 ),
		'total'  => array( 26, 32, 44 ),
		'ornament' => 'line',
		'total_fill' => false,
	),
	6 => array(
		'name'   => 'Boxed',
		'accent' => array( 26, 32, 44 ),
		'thead'  => array( 237, 242, 247 ),
		'total'  => array( 26, 32, 44 ),
		'ornament' => 'slant',
		'total_fill' => false,
		'boxed' => true,
	),
	7 => array(
		'name'   => 'Bar',
		'accent' => array( 26, 32, 44 ),
		'thead'  => array( 237, 242, 247 ),
		'total'  => array( 26, 32, 44 ),
		'ornament' => 'bar',
		'total_fill' => false,
	),
	8 => array(
		'name'   => 'Tab',
		'accent' => array( 237, 242, 247 ),
		'thead'  => array( 237, 242, 247 ),
		'total'  => array( 237, 242, 247 ),
		'ornament' => 'sidebar',
		'total_fill' => true,
		'total_dark' => true,
	),
);

function rgb( $im, $c ) {
	return imagecolorallocate( $im, $c[0], $c[1], $c[2] );
}

function fill_rect( $im, $x, $y, $w, $h, $c ) {
	imagefilledrectangle( $im, $x, $y, $x + $w, $y + $h, $c );
}

function draw_corner( $im, $x, $y, $size, $color, $flip_x = false, $flip_y = false ) {
	$points = array();
	$coords = array(
		array( 0, 0 ),
		array( $size, 0 ),
		array( (int) ( $size * 0.55 ), (int) ( $size * 0.35 ) ),
		array( (int) ( $size * 0.35 ), (int) ( $size * 0.75 ) ),
		array( 0, $size ),
	);
	foreach ( $coords as $p ) {
		$px = $flip_x ? $size - $p[0] : $p[0];
		$py = $flip_y ? $size - $p[1] : $p[1];
		$points[] = $x + $px;
		$points[] = $y + $py;
	}
	imagefilledpolygon( $im, $points, 5, $color );
}

function draw_wave_band( $im, $y, $h, $color, $W ) {
	imagefilledrectangle( $im, 0, $y, $W, $y + $h, $color );
	// Soft scallop edge.
	$white = imagecolorallocate( $im, 255, 255, 255 );
	for ( $i = 0; $i < 6; $i++ ) {
		$cx = (int) ( ( $i + 0.5 ) * ( $W / 6 ) );
		imagefilledellipse( $im, $cx, $y + $h, 90, 36, $white );
	}
}

function render_thumb( $cfg, $doc_label, $path ) {
	global $W, $H;
	$im = imagecreatetruecolor( $W, $H );
	$white = imagecolorallocate( $im, 255, 255, 255 );
	$ink = imagecolorallocate( $im, 26, 32, 44 );
	$muted = imagecolorallocate( $im, 113, 128, 150 );
	$soft = imagecolorallocate( $im, 247, 250, 252 );
	$border = imagecolorallocate( $im, 226, 232, 240 );
	imagefill( $im, 0, 0, $white );

	$accent = rgb( $im, $cfg['accent'] );
	$thead = rgb( $im, $cfg['thead'] );
	$total = rgb( $im, $cfg['total'] );
	$orn = $cfg['ornament'];

	if ( 'corners-quad' === $orn ) {
		draw_corner( $im, 0, 0, 70, $accent, false, false );
		draw_corner( $im, $W - 70, 0, 70, $accent, true, false );
		draw_corner( $im, 0, $H - 70, 70, $accent, false, true );
		draw_corner( $im, $W - 70, $H - 70, 70, $accent, true, true );
	} elseif ( 'corners-pair' === $orn ) {
		draw_corner( $im, 0, 0, 64, $accent, false, false );
		draw_corner( $im, $W - 80, $H - 80, 80, $accent, true, true );
	} elseif ( 'wave' === $orn ) {
		draw_wave_band( $im, 0, 28, $accent, $W );
		draw_wave_band( $im, $H - 36, 36, $accent, $W );
	} elseif ( 'bar' === $orn ) {
		fill_rect( $im, 0, 18, $W, 28, $accent );
	} elseif ( 'slant' === $orn ) {
		$points = array( 24, 52, 140, 52, 120, 62, 24, 62 );
		imagefilledpolygon( $im, $points, 4, $accent );
	} elseif ( 'sidebar' === $orn ) {
		fill_rect( $im, 10, 160, 22, 90, $thead );
	} elseif ( 'line' === $orn ) {
		fill_rect( $im, 24, 78, $W - 48, 2, $thead );
	}

	$pad = 28;
	$y = 36;

	if ( ! empty( $cfg['center'] ) ) {
		imagestring( $im, 5, (int) ( $W / 2 - 28 ), $y, $doc_label, $ink );
		$y += 28;
		imagestring( $im, 3, $pad, $y, 'DoubleScale', $accent );
		imagestring( $im, 3, $W - $pad - 70, $y, 'Bill to', $ink );
		$y += 16;
		imagestring( $im, 2, $pad, $y, 'Acme Studio', $muted );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Client Co', $muted );
		$y += 28;
	} elseif ( 'bar' === $orn ) {
		imagestring( $im, 3, $pad, 24, 'DoubleScale', imagecolorallocate( $im, 255, 255, 255 ) );
		imagestring( $im, 4, $W - $pad - 60, 24, $doc_label, imagecolorallocate( $im, 255, 255, 255 ) );
		$y = 60;
		fill_rect( $im, $pad, $y, 120, 48, $soft );
		imagestring( $im, 2, $pad + 8, $y + 8, 'Bill to', $ink );
		imagestring( $im, 2, $pad + 8, $y + 24, 'Client Co', $muted );
		imagestring( $im, 2, $W - $pad - 100, $y + 8, 'No: DS-024', $muted );
		imagestring( $im, 2, $W - $pad - 100, $y + 24, 'Date: Today', $muted );
		$y += 64;
	} elseif ( 'sidebar' === $orn ) {
		imagestring( $im, 4, $pad + 20, $y, 'DoubleScale', $ink );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Company Inc', $muted );
		$y += 28;
		imagestring( $im, 3, $pad + 20, $y, 'Bill to', $ink );
		imagestring( $im, 2, $W - $pad - 90, $y, 'No: DS-024', $muted );
		$y += 24;
	} else {
		imagestring( $im, 4, $pad, $y, 'DoubleScale', $accent );
		imagestring( $im, 5, $W - $pad - 70, $y, $doc_label, $ink );
		$y += 20;
		imagestring( $im, 2, $pad, $y, 'Your Company', $muted );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Bill to', $ink );
		$y += 14;
		imagestring( $im, 2, $pad, $y, 'No: DS-00024', $muted );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Client Co', $muted );
		$y += 28;
	}

	if ( ! empty( $cfg['boxed'] ) ) {
		imagerectangle( $im, $pad, $y, $pad + 140, $y + 44, $border );
		imagerectangle( $im, $W - $pad - 140, $y, $W - $pad, $y + 44, $border );
		imagestring( $im, 2, $pad + 8, $y + 8, 'From', $ink );
		imagestring( $im, 2, $W - $pad - 132, $y + 8, 'Bill to', $ink );
		$y += 56;
	}

	// Table header.
	fill_rect( $im, $pad, $y, $W - 2 * $pad, 22, $thead );
	$thead_fg = ( $cfg['thead'][0] + $cfg['thead'][1] + $cfg['thead'][2] ) > 500
		? $ink
		: imagecolorallocate( $im, 255, 255, 255 );
	imagestring( $im, 2, $pad + 8, $y + 5, 'Item', $thead_fg );
	imagestring( $im, 2, $W - $pad - 70, $y + 5, 'Amount', $thead_fg );
	$y += 22;

	for ( $i = 0; $i < 3; $i++ ) {
		if ( 1 === $i % 2 ) {
			fill_rect( $im, $pad, $y, $W - 2 * $pad, 28, $soft );
		}
		imagestring( $im, 2, $pad + 8, $y + 4, '0' . ( $i + 1 ) . '. Service item', $ink );
		imagestring( $im, 1, $pad + 8, $y + 16, 'Short description', $muted );
		imagestring( $im, 2, $W - $pad - 40, $y + 8, '$' . ( 100 * ( $i + 1 ) ), $ink );
		$y += 28;
	}

	$y += 16;
	imagestring( $im, 2, $pad, $y, 'Note', $ink );
	imagestring( $im, 1, $pad, $y + 14, 'Thanks for your business.', $muted );

	$total_fill = ! isset( $cfg['total_fill'] ) || $cfg['total_fill'];
	$tx = $W - $pad - 120;
	$ty = $y;
	if ( $total_fill ) {
		fill_rect( $im, $tx, $ty, 120, 26, $total );
		$fg = ! empty( $cfg['total_dark'] ) ? $ink : imagecolorallocate( $im, 255, 255, 255 );
		imagestring( $im, 3, $tx + 10, $ty + 6, 'Total  $600', $fg );
	} else {
		imagestring( $im, 2, $tx + 10, $ty, 'Subtotal $500', $muted );
		imagestring( $im, 4, $tx + 10, $ty + 16, 'Total $600', $ink );
	}

	// Footer brand chip so assets are clearly DoubleScale.
	fill_rect( $im, $pad, $H - 22, $W - 2 * $pad, 14, $soft );
	imagestring( $im, 1, $pad + 6, $H - 19, 'DoubleScale template', $muted );

	imagepng( $im, $path );
	imagedestroy( $im );
}

foreach ( $designs as $id => $cfg ) {
	$invoice = "{$out_dir}/invoice-{$id}.png";
	$proposal = "{$out_dir}/proposal-{$id}.png";
	render_thumb( $cfg, 'Invoice', $invoice );
	render_thumb( $cfg, 'Proposal', $proposal );
	echo "Wrote invoice-{$id}.png + proposal-{$id}.png\n";
}

echo "Done.\n";
