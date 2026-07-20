<?php
/**
 * Generate DoubleScale sales template thumbnails matching the 8 web designs.
 * Run: php bin/generate-sales-template-thumbs.php
 */

$out_dir = dirname( __DIR__ ) . '/assets/images/sales-templates';
if ( ! is_dir( $out_dir ) ) {
	mkdir( $out_dir, 0755, true );
}

$W = 360;
$H = 504;

/**
 * Design definitions mirror designs.scss / document-pdf.php.
 * variant: classic|divider|banner|sidebar|clean|wave|centered|gold
 */
$designs = array(
	1 => array(
		'variant' => 'classic',
		'accent'  => array( 45, 55, 72 ),
		'thead'   => array( 242, 245, 250 ),
		'thead_light' => true,
		'total_fill' => false,
	),
	2 => array(
		'variant' => 'divider',
		'accent'  => array( 45, 55, 72 ),
		'thead'   => array( 242, 245, 250 ),
		'thead_light' => true,
		'total_fill' => false,
	),
	3 => array(
		'variant' => 'banner',
		'accent'  => array( 26, 32, 44 ),
		'thead'   => array( 242, 245, 250 ),
		'thead_light' => true,
		'total_fill' => false,
	),
	4 => array(
		'variant' => 'sidebar',
		'accent'  => array( 26, 32, 44 ),
		'thead'   => array( 242, 245, 250 ),
		'thead_light' => true,
		'total_fill' => false,
	),
	5 => array(
		'variant' => 'clean',
		'accent'  => array( 47, 139, 253 ),
		'thead'   => array( 242, 246, 252 ),
		'thead_light' => true,
		'total'   => array( 45, 55, 72 ),
		'total_fill' => true,
	),
	6 => array(
		'variant' => 'wave',
		'accent'  => array( 47, 139, 253 ),
		'thead'   => array( 47, 139, 253 ),
		'total'   => array( 47, 139, 253 ),
		'total_fill' => true,
	),
	7 => array(
		'variant' => 'centered',
		'accent'  => array( 91, 83, 224 ),
		'thead'   => array( 91, 83, 224 ),
		'total'   => array( 91, 83, 224 ),
		'total_fill' => true,
	),
	8 => array(
		'variant' => 'gold',
		'accent'  => array( 198, 169, 107 ),
		'thead'   => array( 198, 169, 107 ),
		'total'   => array( 198, 169, 107 ),
		'total_fill' => true,
	),
);

function rgb( $im, $c ) {
	return imagecolorallocate( $im, $c[0], $c[1], $c[2] );
}

function fill_rect( $im, $x, $y, $w, $h, $c ) {
	imagefilledrectangle( $im, $x, $y, $x + $w, $y + $h, $c );
}

function draw_wave( $im, $y, $flip, $color, $W ) {
	$pts = array();
	if ( $flip ) {
		$pts = array( 0, $y + 24, 0, $y + 8 );
		for ( $x = 0; $x <= $W; $x += 20 ) {
			$pts[] = $x;
			$pts[] = $y + 8 + (int) ( 8 * sin( $x / 40 ) );
		}
		$pts[] = $W;
		$pts[] = $y + 24;
	} else {
		$pts = array( 0, $y, 0, $y + 16 );
		for ( $x = 0; $x <= $W; $x += 20 ) {
			$pts[] = $x;
			$pts[] = $y + 16 + (int) ( 8 * sin( $x / 40 ) );
		}
		$pts[] = $W;
		$pts[] = $y;
	}
	imagefilledpolygon( $im, $pts, (int) ( count( $pts ) / 2 ), $color );
}

function draw_gold_corner( $im, $cx, $cy, $r, $color ) {
	imagefilledarc( $im, $cx, $cy, $r * 2, $r * 2, 0, 360, $color, IMG_ARC_PIE );
}

function render_thumb( $cfg, $doc_label, $path ) {
	global $W, $H;
	$im = imagecreatetruecolor( $W, $H );
	$white = imagecolorallocate( $im, 255, 255, 255 );
	$ink = imagecolorallocate( $im, 26, 32, 44 );
	$muted = imagecolorallocate( $im, 138, 148, 166 );
	$soft = imagecolorallocate( $im, 247, 249, 252 );
	$line = imagecolorallocate( $im, 237, 240, 245 );
	imagefill( $im, 0, 0, $white );

	$accent = rgb( $im, $cfg['accent'] );
	$thead = rgb( $im, $cfg['thead'] );
	$total = isset( $cfg['total'] ) ? rgb( $im, $cfg['total'] ) : $accent;
	$variant = $cfg['variant'];
	$pad = 28;
	$y = 34;

	// Ornaments.
	if ( 'wave' === $variant ) {
		draw_wave( $im, 0, false, $accent, $W );
		draw_wave( $im, $H - 24, true, $accent, $W );
		$y = 50;
	} elseif ( 'gold' === $variant ) {
		draw_gold_corner( $im, 4, 4, 46, $accent );
		draw_gold_corner( $im, $W - 4, $H - 4, 46, $accent );
		$y = 44;
	} elseif ( 'centered' === $variant ) {
		$pts = array( $W, $H - 90, $W, $H, $W - 90, $H );
		imagefilledpolygon( $im, $pts, 3, $accent );
	} elseif ( 'sidebar' === $variant ) {
		fill_rect( $im, 0, 0, 18, $H, $accent );
		$pad = 34;
	} elseif ( 'banner' === $variant ) {
		fill_rect( $im, 0, 0, $W, 56, $ink );
	}

	$center = in_array( $variant, array( 'centered', 'gold' ), true );

	if ( 'banner' === $variant ) {
		imagestring( $im, 4, $pad, 20, 'Nurency', $white );
		imagestring( $im, 5, $W - $pad - 70, 18, $doc_label, $white );
		$y = 74;
		imagestring( $im, 3, $pad, $y, 'Bill to', $ink );
		imagestring( $im, 2, $W - $pad - 90, $y, 'No: DS-0024', $muted );
		$y += 16;
		imagestring( $im, 2, $pad, $y, 'Client Name', $muted );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Date: Today', $muted );
		$y += 30;
	} elseif ( $center ) {
		$col = ( 'gold' === $variant ) ? $ink : $accent;
		imagestring( $im, 5, (int) ( $W / 2 - 32 ), $y, $doc_label, $ink );
		$y += 30;
		imagestring( $im, 4, $pad, $y, 'Nurency', $col );
		imagestring( $im, 3, $W - $pad - 80, $y, 'Bill to', $ink );
		$y += 18;
		imagestring( $im, 2, $pad, $y, 'Design agency', $muted );
		imagestring( $im, 2, $W - $pad - 90, $y, 'Client Name', $muted );
		$y += 30;
	} elseif ( 'sidebar' === $variant ) {
		// Vertical label on the tab.
		imagestringup( $im, 3, 2, (int) ( $H / 2 + 34 ), $doc_label, $white );
		imagestring( $im, 4, $pad, $y, 'Nurency', $ink );
		imagestring( $im, 2, $W - $pad - 110, $y, 'Company Inc.', $muted );
		$y += 30;
		imagestring( $im, 3, $pad, $y, 'Bill to', $ink );
		imagestring( $im, 2, $W - $pad - 90, $y, 'No: DS-0024', $muted );
		$y += 26;
	} else {
		$col = ( 'clean' === $variant ) ? $accent : $ink;
		imagestring( $im, 4, $pad, $y, 'Nurency', $col );
		imagestring( $im, 5, $W - $pad - 70, $y - 2, $doc_label, $ink );
		$y += 22;
		imagestring( $im, 2, $pad, $y, 'Design agency', $muted );
		imagestring( $im, 2, $W - $pad - 100, $y, 'No: DS-00024', $muted );
		$y += 26;

		if ( 'divider' === $variant ) {
			fill_rect( $im, $pad, $y, $W - 2 * $pad, 4, $ink );
			$y += 16;
		}

		// From / Bill to row for classic + divider.
		$boxed = ( 'divider' === $variant );
		if ( $boxed ) {
			fill_rect( $im, $pad, $y, 140, 46, $soft );
			fill_rect( $im, $W - $pad - 140, $y, 140, 46, $soft );
		}
		imagestring( $im, 2, $pad + ( $boxed ? 8 : 0 ), $y + ( $boxed ? 8 : 0 ), 'From', $ink );
		imagestring( $im, 2, $pad + ( $boxed ? 8 : 0 ), $y + ( $boxed ? 24 : 14 ), 'Nurency Digital', $muted );
		imagestring( $im, 2, $W - $pad - ( $boxed ? 132 : 90 ), $y + ( $boxed ? 8 : 0 ), 'Bill to', $ink );
		imagestring( $im, 2, $W - $pad - ( $boxed ? 132 : 90 ), $y + ( $boxed ? 24 : 14 ), 'Client Name', $muted );
		$y += $boxed ? 58 : 34;
	}

	// Table header.
	fill_rect( $im, $pad, $y, $W - 2 * $pad, 24, $thead );
	$thead_fg = ! empty( $cfg['thead_light'] ) ? $muted : $white;
	imagestring( $im, 2, $pad + 8, $y + 6, 'Item Description', $thead_fg );
	imagestring( $im, 2, $W - $pad - 60, $y + 6, 'Amount', $thead_fg );
	$y += 24;

	for ( $i = 0; $i < 3; $i++ ) {
		imagestring( $im, 2, $pad + 8, $y + 5, '0' . ( $i + 1 ) . '. Saas Landing design', $ink );
		imagestring( $im, 1, $pad + 8, $y + 18, 'Designed a landing page', $muted );
		imagestring( $im, 2, $W - $pad - 34, $y + 10, '$' . ( 100 * ( $i + 1 ) ), $ink );
		fill_rect( $im, $pad, $y + 30, $W - 2 * $pad, 1, $line );
		$y += 32;
	}

	$y += 18;
	imagestring( $im, 2, $pad, $y, 'Note', $ink );
	imagestring( $im, 1, $pad, $y + 14, 'Thanks for your business.', $muted );

	// Totals.
	$tx = $W - $pad - 130;
	imagestring( $im, 2, $tx, $y, 'Subtotal', $muted );
	imagestring( $im, 2, $tx + 90, $y, '$500', $ink );
	$ty = $y + 18;
	if ( ! empty( $cfg['total_fill'] ) ) {
		fill_rect( $im, $tx, $ty, 130, 26, $total );
		imagestring( $im, 3, $tx + 10, $ty + 6, 'Total   $600', $white );
	} else {
		fill_rect( $im, $tx, $ty, 130, 2, $ink );
		imagestring( $im, 4, $tx + 10, $ty + 8, 'Total   $600', $ink );
	}

	// Signature line for signature-based designs.
	if ( in_array( $variant, array( 'clean', 'wave', 'centered', 'gold' ), true ) ) {
		$sy = $H - 60;
		fill_rect( $im, $W - $pad - 110, $sy, 100, 1, $muted );
	}

	imagepng( $im, $path );
	imagedestroy( $im );
}

foreach ( $designs as $id => $cfg ) {
	render_thumb( $cfg, 'Invoice', "{$out_dir}/invoice-{$id}.png" );
	render_thumb( $cfg, 'Proposal', "{$out_dir}/proposal-{$id}.png" );
	echo "Wrote invoice-{$id}.png + proposal-{$id}.png\n";
}

echo "Done.\n";
