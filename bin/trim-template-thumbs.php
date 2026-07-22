<?php
/**
 * Trim excess white margins from sales template thumbnail PNGs.
 * Run: php bin/trim-template-thumbs.php
 */

$dir = dirname( __DIR__ ) . '/assets/images/sales-templates';
$files = glob( $dir . '/*.png' );
if ( ! $files ) {
	fwrite( STDERR, "No PNG files found in {$dir}\n" );
	exit( 1 );
}

/**
 * Row is considered content when enough pixels in the center band are non-white.
 */
function ds_row_has_content( GdImage $im, int $y, int $w, int $fuzz = 252 ): bool {
	$margin = (int) round( $w * 0.08 );
	$start  = $margin;
	$end    = $w - $margin;
	$span   = max( 1, $end - $start );
	$hits   = 0;

	for ( $x = $start; $x < $end; $x++ ) {
		$c = imagecolorat( $im, $x, $y );
		$r = ( $c >> 16 ) & 0xFF;
		$g = ( $c >> 8 ) & 0xFF;
		$b = $c & 0xFF;
		if ( $r < $fuzz || $g < $fuzz || $b < $fuzz ) {
			++$hits;
		}
	}

	return $hits >= (int) ceil( $span * 0.02 );
}

/**
 * @return array{0:int,1:int,2:int,3:int}
 */
function ds_content_bbox( GdImage $im ): array {
	$w     = imagesx( $im );
	$h     = imagesy( $im );
	$min_x = $w;
	$max_x = 0;
	$min_y = $h;
	$max_y = 0;

	for ( $y = 0; $y < $h; $y++ ) {
		if ( ! ds_row_has_content( $im, $y, $w ) ) {
			continue;
		}
		if ( $y < $min_y ) {
			$min_y = $y;
		}
		if ( $y > $max_y ) {
			$max_y = $y;
		}
		for ( $x = 0; $x < $w; $x++ ) {
			$c = imagecolorat( $im, $x, $y );
			$r = ( $c >> 16 ) & 0xFF;
			$g = ( $c >> 8 ) & 0xFF;
			$b = $c & 0xFF;
			if ( $r >= 252 && $g >= 252 && $b >= 252 ) {
				continue;
			}
			if ( $x < $min_x ) {
				$min_x = $x;
			}
			if ( $x > $max_x ) {
				$max_x = $x;
			}
		}
	}

	if ( $max_y < $min_y ) {
		return array( 0, 0, $w - 1, $h - 1 );
	}

	return array( $min_x, $min_y, $max_x, $max_y );
}

foreach ( $files as $path ) {
	$src = @imagecreatefrompng( $path );
	if ( ! $src ) {
		fwrite( STDERR, "Skip (unreadable): {$path}\n" );
		continue;
	}

	$w  = imagesx( $src );
	$h  = imagesy( $src );
	$im = imagecreatetruecolor( $w, $h );
	imagealphablending( $im, false );
	imagesavealpha( $im, true );
	$transparent = imagecolorallocatealpha( $im, 255, 255, 255, 127 );
	imagefilledrectangle( $im, 0, 0, $w, $h, $transparent );
	imagecopy( $im, $src, 0, 0, 0, 0, $w, $h );
	imagedestroy( $src );

	list( $min_x, $min_y, $max_x, $max_y ) = ds_content_bbox( $im );
	$pad = 6;
	$min_x = max( 0, $min_x - $pad );
	$min_y = max( 0, $min_y - $pad );
	$max_x = min( $w - 1, $max_x + $pad );
	$max_y = min( $h - 1, $max_y + $pad );

	$crop_w = $max_x - $min_x + 1;
	$crop_h = $max_y - $min_y + 1;
	$cropped = imagecrop( $im, array(
		'x'      => $min_x,
		'y'      => $min_y,
		'width'  => $crop_w,
		'height' => $crop_h,
	) );
	imagedestroy( $im );

	if ( ! $cropped ) {
		fwrite( STDERR, "Crop failed: {$path}\n" );
		continue;
	}

	imagealphablending( $cropped, false );
	imagesavealpha( $cropped, true );
	$out = imagecreatetruecolor( $crop_w, $crop_h );
	$white = imagecolorallocate( $out, 255, 255, 255 );
	imagefilledrectangle( $out, 0, 0, $crop_w, $crop_h, $white );
	imagecopy( $out, $cropped, 0, 0, 0, 0, $crop_w, $crop_h );
	imagedestroy( $cropped );
	imagepng( $out, $path );
	imagedestroy( $out );

	echo basename( $path ) . " -> {$crop_w}x{$crop_h}\n";
}

echo "Done.\n";
