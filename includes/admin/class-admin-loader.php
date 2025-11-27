<?php
/**
 * Admin: Class Admin Loader
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 * @subpackage admin
 */

namespace QuillCRM\Admin;

defined( 'ABSPATH' ) || exit;

use QuillCRM\Core;

/**
 * Admin Loader Class.
 *
 * @since 1.0.0
 */
class Admin_Loader {

	/**
	 * Class Instance.
	 *
	 * @var Admin_Loader
	 *
	 * @since 1.0.0
	 */
	private static $instance;

	/**
	 * Admin Instance.
	 *
	 * Instantiates or reuses an instance of Admin_Loader.
	 *
	 * @since 1.0.0
	 * @static
	 *
	 * @see Admin_Loader()
	 *
	 * @return self - Single instance
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Returns true if we are on a JS powered admin page.
	 */
	public static function is_admin_page() : bool {
		$current_screen = get_current_screen();
		if ( false === strpos( $current_screen->id, 'quillcrm' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Constructor.
	 * Since this is a singleton class, it is better to have its constructor as a private.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		// Enqueue admin scripts.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_inline_scripts' ), 14 );

		// Remove notices.
		add_action( 'admin_notices', array( $this, 'remove_notices' ), 1 );
		add_action( 'admin_notices', array( __CLASS__, 'inject_before_notices' ), -9999 );
		add_action( 'admin_notices', array( __CLASS__, 'inject_after_notices' ), PHP_INT_MAX );

		// Remove admin footer text.
		add_filter( 'admin_footer_text', '__return_empty_string' );
		// Remove admin footer version.
		add_filter( 'update_footer', '__return_empty_string', 11 );
		add_filter( 'admin_body_class', array( __CLASS__, 'add_admin_body_class' ), PHP_INT_MAX );

	}

		/**
	 * Add admin body class.
	 *
	 * @since 1.0.0
	 *
	 * @param string $classes Body classes.
	 */
	public static function add_admin_body_class( $classes ) {
		if ( self::is_admin_page() ) {
			$classes .= ' js is-fullscreen-mode';
		}

		return $classes;
	}

	/**
	 * Runs before admin notices action and hides them.
	 *
	 * @since 1.0.0
	 */
	public static function inject_before_notices() {
		if ( ! self::is_admin_page() ) {
			return;
		}

		// Wrap the notices in a hidden div to prevent flickering before
		// they are moved elsewhere in the page by WordPress Core.
		echo '<div class="quillcrm-layout__notice-list-hide" style="display: none;" id="wp__notice-list">';

		if ( self::is_admin_page() ) {
			// Capture all notices and hide them. WordPress Core looks for
			// `.wp-header-end` and appends notices after it if found.
			// https://github.com/WordPress/WordPress/blob/f6a37e7d39e2534d05b9e542045174498edfe536/wp-admin/js/common.js#L737 .
			echo '<div class="wp-header-end" id="quillcrm-layout__notice-catcher"></div>';
		}
	}

	/**
	 * Runs after admin notices and closes div.
	 *
	 * @since 1.0.0
	 */
	public static function inject_after_notices() {
		if ( ! self::is_admin_page() ) {
				return;
		}
		// Close the hidden div used to prevent notices from flickering before
		// they are inserted elsewhere in the page.
		echo '</div>';
	}

	/**
	 * Remove Notices.
	 *
	 * @since 1.0.0
	 */
	public function remove_notices() {

		if ( ! self::is_admin_page() ) {
			return;
		}

		// Hello Dolly.
		if ( function_exists( 'hello_dolly' ) ) {
			remove_action( 'admin_notices', 'hello_dolly' );
		}
	}


	/**
	 * Add inline scripts.
	 *
	 * @since 1.0.0
	 */
	public function add_inline_scripts() {
		Core::set_admin_config();
	}

	/**
	 * Enqueue Scripts.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_scripts() {
		global $submenu;
		$user = wp_get_current_user();

		$asset_file   = QUILLCRM_PLUGIN_DIR . 'build/client/index.asset.php';
		$asset        = file_exists( $asset_file ) ? require $asset_file : null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : QUILLCRM_VERSION;
		$config_file  = QUILLCRM_PLUGIN_DIR . 'build/config/index.asset.php';
		$config       = file_exists( $config_file ) ? require $config_file : null;
		$config_deps  = isset( $config['dependencies'] ) ? $config['dependencies'] : array();
		$config_ver   = isset( $config['version'] ) ? $config['version'] : QUILLCRM_VERSION;

		// Register scripts.
		wp_register_script(
			'qcrm-config',
			QUILLCRM_PLUGIN_URL . 'build/config/index.js',
			$config_deps,
			$config_ver,
			true
		);

		wp_register_script(
			'qcrm-admin',
			QUILLCRM_PLUGIN_URL . 'build/client/index.js',
			array_merge( $dependencies, array( 'qcrm-config' ) ),
			$version,
			true
		);

		// Register styles.
		wp_register_style(
			'qcrm-admin',
			QUILLCRM_PLUGIN_URL . 'build/client/index.css',
			array(),
			$version
		);

		wp_register_style(
			'qcrm-admin-extra',
			QUILLCRM_PLUGIN_URL . 'build/client/style-index.css',
			array(),
			$version
		);

		// RTL styles.
		wp_style_add_data( 'qcrm-admin', 'rtl', 'replace' );
		wp_style_add_data( 'qcrm-admin-extra', 'rtl', 'replace' );

		// Enqueue WordPress media library for admin pages that need it
		if ( self::is_admin_page() ) {
			wp_enqueue_media();
		}
	}

	/**
	 * Page Wrapper.
	 *
	 * @since 1.0.0
	 */
	public static function page_wrapper() {
		// Important to check for authentication.
		wp_auth_check_load();

		do_action( 'qcrm_admin_enqueue_scripts' );

		// Add Pro client as dependency if Pro plugin is active and registered its script
		// This ensures Pro's filters are registered before our registerAdminPage calls
		if ( defined( 'QUILLCRM_PRO_VERSION' ) && wp_script_is( 'quillcrm-pro-client', 'registered' ) ) {
			// Get current qcrm-admin dependencies and add Pro script
			global $wp_scripts;
			if ( isset( $wp_scripts->registered['qcrm-admin'] ) ) {
				$wp_scripts->registered['qcrm-admin']->deps[] = 'quillcrm-pro-client';
			}
		}

		// Enqueue scripts.
		wp_enqueue_script( 'qcrm-config' );
		wp_enqueue_script( 'qcrm-admin' );
		wp_enqueue_style( 'qcrm-admin' );
		wp_enqueue_style( 'qcrm-admin-extra' );
		wp_add_inline_style(
			'qcrm-admin',
			'.s0 { fill: url(#g1) } 
			.s1 { fill: url(#g2) } 
			.s2 { fill: #246193 } 
			.s3 { fill: #1e93cf } 
			.s4 { fill: url(#g3) } 
			.s5 { fill: url(#g4) } 
			.s6 { fill: url(#g5) } 
			.s7 { fill: url(#g6) } 
			.s8 { fill: url(#g7) } 
			.s9 { opacity: .3;fill: #373435 } 
			.s10 { fill: none } 
			.s11 { fill: url(#g8) }'
		);
		wp_enqueue_script( 'jquery' );
		
		// Ensure media library is available for the page
		wp_enqueue_media();

		?>
<style>


    .quillcrm-wrap {
      width: 100%;
      height: 100%;
    }

    #qcrm-admin-root__loader-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
      position: relative;
      overflow: hidden;
    }

    /* Main logo container */
    .logo-wrapper {
      position: relative;
      z-index: 10;
      animation: pulse-glow 2.5s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% {
        filter: drop-shadow(0 0 8px rgba(79, 158, 249, 0.3));
        transform: scale(1);
      }
      50% {
        filter: drop-shadow(0 0 25px rgba(79, 158, 249, 0.6));
        transform: scale(1.02);
      }
    }

    /* Sparkle stars */
    .sparkle {
      position: absolute;
      width: 12px;
      height: 12px;
      animation: sparkle 2s ease-in-out infinite;
    }

    .sparkle::before,
    .sparkle::after {
      content: '';
      position: absolute;
      background: linear-gradient(135deg, #4F9EF9, #274C77);
      border-radius: 2px;
    }

    .sparkle::before {
      width: 100%;
      height: 3px;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }

    .sparkle::after {
      width: 3px;
      height: 100%;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
    }

    @keyframes sparkle {
      0%, 100% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
      }
      50% {
        transform: scale(1) rotate(45deg);
        opacity: 1;
      }
    }

    .sparkle:nth-child(1) { top: calc(50% - 80px); left: calc(50% - 10px); animation-delay: 0s; }
    .sparkle:nth-child(2) { top: calc(50% - 60px); left: calc(50% + 80px); animation-delay: 0.25s; }
    .sparkle:nth-child(3) { top: calc(50% + 10px); left: calc(50% + 100px); animation-delay: 0.5s; }
    .sparkle:nth-child(4) { top: calc(50% + 60px); left: calc(50% + 70px); animation-delay: 0.75s; }
    .sparkle:nth-child(5) { top: calc(50% + 70px); left: calc(50% - 20px); animation-delay: 1s; }
    .sparkle:nth-child(6) { top: calc(50% + 50px); left: calc(50% - 100px); animation-delay: 1.25s; }
    .sparkle:nth-child(7) { top: calc(50% - 10px); left: calc(50% - 120px); animation-delay: 1.5s; }
    .sparkle:nth-child(8) { top: calc(50% - 70px); left: calc(50% - 80px); animation-delay: 1.75s; }

    /* Orbiting dots */
    .orbit-container {
      position: absolute;
      width: 0;
      height: 0;
      top: 50%;
      left: 50%;
      animation: orbit 3.5s linear infinite;
    }

    .orbit-container-2 {
      animation: orbit 4.5s linear infinite reverse;
    }

    .orbit-dot {
      position: absolute;
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, #4F9EF9, #274C77);
      border-radius: 50%;
      top: -90px;
      left: -4px;
      box-shadow: 0 0 12px rgba(79, 158, 249, 0.8);
    }

    .orbit-dot-2 {
      width: 5px;
      height: 5px;
      top: -70px;
      left: -2.5px;
      box-shadow: 0 0 8px rgba(39, 76, 119, 0.8);
    }

    @keyframes orbit {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Floating particles */
    .particle {
      position: absolute;
      border-radius: 50%;
      background: rgba(79, 158, 249, 0.7);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0;
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% {
        transform: translateY(-100px) scale(0.5);
        opacity: 0;
      }
    }

    .particle:nth-child(1) { width: 4px; height: 4px; left: calc(50% - 60px); top: calc(50% + 30px); animation-delay: 0s; }
    .particle:nth-child(2) { width: 6px; height: 6px; left: calc(50% - 30px); top: calc(50% + 40px); animation-delay: 0.4s; }
    .particle:nth-child(3) { width: 3px; height: 3px; left: calc(50% + 10px); top: calc(50% + 35px); animation-delay: 0.8s; }
    .particle:nth-child(4) { width: 5px; height: 5px; left: calc(50% + 50px); top: calc(50% + 25px); animation-delay: 1.2s; }
    .particle:nth-child(5) { width: 4px; height: 4px; left: calc(50% + 80px); top: calc(50% + 45px); animation-delay: 1.6s; }
    .particle:nth-child(6) { width: 5px; height: 5px; left: calc(50% - 80px); top: calc(50% + 20px); animation-delay: 2s; }

    /* Magic dust sweeping */
    .dust {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #4F9EF9;
      border-radius: 50%;
      top: 50%;
      left: calc(50% - 100px);
      box-shadow: 0 0 8px rgba(79, 158, 249, 0.9);
      animation: sweep 2.5s ease-in-out infinite;
    }

    @keyframes sweep {
      0% {
        transform: translateX(0) translateY(0);
        opacity: 0;
      }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% {
        transform: translateX(200px) translateY(-30px);
        opacity: 0;
      }
    }

    .dust:nth-child(1) { animation-delay: 0s; }
    .dust:nth-child(2) { animation-delay: 0.5s; top: calc(50% + 15px); }
    .dust:nth-child(3) { animation-delay: 1s; top: calc(50% - 15px); }

    /* Ambient glow */
    .ambient-glow {
      position: absolute;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(79, 158, 249, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: ambient 3s ease-in-out infinite;
    }

    @keyframes ambient {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    }

    /* Loading text */
    .loading-text {
      position: absolute;
      bottom: calc(50% - 60px);
      left: 50%;
      transform: translateX(-50%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #274C77;
      letter-spacing: 3px;
      opacity: 0.7;
      animation: text-pulse 2s ease-in-out infinite;
    }

    @keyframes text-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="quillcrm-wrap">
    <div id="qcrm-admin-root">
      <div id="qcrm-admin-root__loader-container">
        
        <!-- Ambient background glow -->
        <div class="ambient-glow"></div>
        
        <!-- Sparkle stars around the logo -->
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        <div class="sparkle"></div>
        
        <!-- Floating particles -->
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        
        <!-- Magic dust trail -->
        <div class="dust"></div>
        <div class="dust"></div>
        <div class="dust"></div>
        
        <!-- Orbiting dots -->
        <div class="orbit-container">
          <div class="orbit-dot"></div>
        </div>
        <div class="orbit-container orbit-container-2">
          <div class="orbit-dot orbit-dot-2"></div>
        </div>
        
        <!-- Logo with glow -->
        <div class="logo-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="169" height="40" viewBox="0 0 129 40" fill="none">
            <path d="M30.6934 12.3059L34.7387 12.3058C34.7708 16.058 34.6274 19.8262 34.8017 23.5733C34.9112 25.9261 36.8279 26.3488 38.8246 25.9844C40.0547 25.76 40.737 25.0356 41.3624 24.0322C41.6027 20.7343 41.4621 15.7272 41.4636 12.3052L45.4554 12.3084C45.4542 14.2314 45.4643 16.1546 45.4855 18.0775C45.5703 21.7184 45.4858 25.4425 45.5306 29.1093C44.3543 29.0825 43.1777 29.0723 42.0012 29.08C41.9999 28.2711 41.9405 27.5182 41.8835 26.7121C41.6789 26.9587 41.4702 27.202 41.2572 27.4415C40.1207 28.7182 38.5151 29.48 36.8068 29.5526C35.9033 29.5857 34.6835 29.3106 33.82 29.0418C30.0916 27.8762 30.6473 22.5966 30.6585 19.5184L30.6934 12.3059Z" fill="#274C77"/>
            <path d="M95.8933 11.6901C99.0971 11.678 106.446 10.8021 107.664 14.8449C108.608 17.9789 107.228 20.5393 104.078 21.5255C105.577 23.6374 107.19 26.1171 108.568 28.3015L108.869 28.7627C108.526 29.2913 107.12 29.0174 106.532 28.9588L106.318 28.7334C104.849 26.663 103.375 24.031 101.933 21.8433C100.656 21.8244 99.3086 21.8243 98.0386 21.7796C98.0768 24.0125 98.1545 26.712 98.0487 28.9168C97.343 29.0404 96.5965 29.0111 95.8755 29.0149C95.9672 23.339 95.8729 17.3955 95.8933 11.6901Z" fill="#274C77"/>
            <path d="M98.0322 13.5769C100.369 13.5774 105.183 12.9421 105.607 16.019C105.785 17.3146 105.609 18.1396 104.799 19.1495C103.134 20.4044 100.189 20.0192 98.0972 19.965C98.0564 17.8359 98.0348 15.7064 98.0322 13.5769Z" fill="#E4E6F1"/>
            <path d="M125.392 11.5659C126.374 11.5826 127.376 11.6122 128.356 11.581L128.355 22.7173C128.357 24.4834 128.434 26.9174 128.343 28.6083L128.304 28.8415C127.78 29.1714 126.811 29.1765 126.314 28.7497L126.281 28.2504C126.309 24.1142 126.51 17.9924 126.272 13.9648C125.175 17.0909 123.96 19.7874 122.611 22.8137C122.145 23.8613 121.264 25.5902 120.92 26.5648C120.255 26.5681 119.57 26.5806 118.908 26.5732C118.427 24.8978 117.095 22.2388 116.326 20.5959C115.303 18.4125 114.43 16.2308 113.461 14.0511C113.606 19.0306 113.671 24.0122 113.654 28.9943L111.576 28.9867L111.546 11.671L114.505 11.6546C115.58 14.4562 116.776 17.0583 117.992 19.7896C118.568 21.085 119.58 23.1976 119.979 24.5055C121.841 20.3669 123.691 15.7742 125.392 11.5659Z" fill="url(#paint0_linear_33594_25778)"/>
            <path d="M57.5337 5.4126L61.4695 5.42317L61.4922 29.057L57.5401 29.071L57.5337 5.4126Z" fill="#274C77"/>
            <path d="M65.5419 5.42627L69.4655 5.42958L69.4999 29.0707C68.2387 29.1089 66.8069 29.0757 65.5317 29.0732C65.6655 21.3042 65.547 13.2279 65.5419 5.42627Z" fill="#274C77"/>
            <path d="M87.1714 11.3388C88.7688 11.111 91.0924 11.5701 92.6096 12.0715L92.4032 14.0103C89.3293 13.0371 84.9765 12.5619 83.1064 15.8415C81.4249 18.79 81.6249 24.8859 85.0172 26.6329C86.9688 27.6378 89.579 27.3466 91.593 26.7399L92.5548 26.4067L93.0975 28.3945C91.9485 28.7346 90.8949 29.0836 89.7293 29.2314C84.5039 29.8938 80.4835 27.5499 79.9153 22.0727C79.616 19.1942 79.7599 16.5649 81.5969 14.1532C83.0096 12.2985 84.9561 11.6201 87.1714 11.3388Z" fill="url(#paint1_linear_33594_25778)"/>
            <path d="M49.4487 12.3237L53.4645 12.3314L53.477 29.1001L49.4966 29.0543C49.3947 23.5254 49.5165 17.8827 49.4487 12.3237Z" fill="#274C77"/>
            <path d="M20.0712 6.96015C20.3818 5.2492 20.649 3.84346 22.1758 2.78639C23.5446 1.83888 28.8932 -0.520354 30.4288 0.103593C30.843 0.893149 30.1149 3.30436 29.8723 4.15913C28.8002 7.93748 27.8094 7.48079 25.2604 9.46894C26.3529 9.16181 27.3478 8.67034 28.3794 8.19952C27.9322 9.3799 27.3182 11.0463 26.6293 12.0705C25.5832 15.3795 22.2915 17.7543 19.7036 19.6619C21.4093 19.2432 21.9191 19.0244 23.486 18.1972C21.8062 22.6683 20.1795 24.2845 16.521 27.0469C17.5615 26.8718 18.0588 26.7503 19.069 26.4357C17.519 28.7447 14.5016 30.8084 12.1526 32.2364C11.7178 33.5702 10.433 39.1778 9.98406 39.8925L9.79973 39.8161C9.66432 39.346 10.0214 37.3116 10.1381 36.7383C12.4702 25.2723 16.8309 15.4661 23.9489 6.26028L23.6861 5.98589C22.721 6.97162 22.0093 7.77187 21.1684 8.86882C20.9737 9.1227 19.754 10.6854 19.6472 10.7763C19.5176 10.2236 20.4465 9.47417 20.8658 8.76678L20.7476 8.48996C20.393 8.3799 20.1856 8.29569 19.8513 8.15276C19.412 7.41697 19.7911 6.00869 19.3991 4.94907L19.6006 4.81888C19.7858 5.16053 19.8053 6.42232 19.8797 6.95557L20.0712 6.96015Z" fill="#458DC7"/>
            <path d="M20.0713 6.96015C20.3819 5.2492 20.6491 3.84346 22.1759 2.78639C23.5447 1.83888 28.8934 -0.520354 30.4289 0.103593C30.8432 0.893149 30.115 3.30436 29.8725 4.15913C28.8004 7.93748 27.8096 7.48079 25.2605 9.46894C26.353 9.16181 27.3479 8.67034 28.3795 8.19952C27.9324 9.3799 27.3183 11.0463 26.6294 12.0705C26.5955 11.0626 27.6893 9.96614 27.8121 8.87238C27.4908 8.58678 26.2875 9.82117 25.3835 9.62257L25.2614 9.42104C25.3543 8.99582 25.3959 9.00168 25.6975 8.6999C26.6164 8.49811 28.0949 7.2134 28.7115 6.51225L28.831 6.37442C26.8661 3.95952 26.7319 4.52831 25.2494 1.46691C22.7886 2.51315 21.1419 3.18971 20.5335 5.95506C20.4318 6.41735 20.3826 6.66627 20.0713 6.96015Z" fill="#458DC7"/>
            <path d="M25.9153 3.73535C25.4065 4.65892 24.6733 5.49306 23.9488 6.26007L23.686 5.98567C24.4138 5.22057 25.1571 4.47038 25.9153 3.73535Z" fill="white"/>
            <path d="M11.609 4.21103C13.1768 3.96352 16.0576 4.30087 17.6276 4.51679C16.1495 5.9252 15.5263 6.53766 14.3241 8.23588C6.07539 8.18097 4.32991 12.6278 5.14316 20.4084C5.33029 22.1984 6.15794 23.5259 7.23921 24.9352C7.26533 26.8033 7.488 27.8211 8.08354 29.5638C8.22048 29.8479 8.20953 29.8593 8.29373 30.1689L8.10966 30.3026C6.97029 30.2733 4.9038 28.9842 4.05029 28.2593C1.62431 26.1398 0.426352 23.0289 0.119345 19.8992C-0.702438 11.522 2.67615 4.99295 11.609 4.21103Z" fill="url(#paint2_linear_33594_25778)"/>
            <path d="M19.399 4.94922C19.791 6.00884 19.4119 7.41712 19.8512 8.15291C20.1855 8.29584 20.3929 8.38005 20.7475 8.49011L20.8657 8.76693C20.4464 9.47431 19.5175 10.2237 19.6472 10.7765C18.6254 12.4358 17.358 14.0669 16.3916 15.8031C13.7619 20.5274 11.696 25.742 10.347 30.9639C8.67813 27.0663 8.61186 25.9751 8.7632 21.8687C9.25276 22.9947 9.68537 23.8574 10.2501 24.9351C9.0953 20.4023 10.1612 17.2355 12.5154 13.1958C12.8026 14.4279 12.8977 15.416 13.2516 16.7538C13.3408 16.0742 13.4428 14.7376 13.4536 14.0179C13.5087 10.3653 16.7024 7.2296 19.399 4.94922Z" fill="#274C77"/>
            <path d="M27.4144 13.5435C27.7239 13.8519 27.8093 14.5947 27.8796 15.0265C28.886 21.2045 26.4398 27.946 20.3942 30.5128C18.8866 31.1523 17.71 31.3561 16.1101 31.6096L15.8521 31.4861C16.0151 31.1676 17.6481 30.1332 18.1849 29.5944C19.1123 28.6619 19.5151 28.3319 20.2634 27.2828C20.9451 26.8007 20.589 25.5809 20.7857 25.3818C23.2694 22.8684 24.5262 20.3274 25.3705 16.9097C25.419 16.7135 27.089 14.1533 27.4144 13.5435Z" fill="#274C77"/>
            <path d="M50.3661 5.45176C51.839 5.27966 53.1926 5.34743 53.8535 6.90271C54.3335 8.03214 53.6235 9.08832 52.5794 9.52717C49.0227 10.1667 47.7552 7.03813 50.3661 5.45176Z" fill="#274C77"/>
            <defs>
              <linearGradient id="paint0_linear_33594_25778" x1="110.198" y1="25.2559" x2="129.604" y2="14.8369" gradientUnits="userSpaceOnUse">
                <stop stop-color="#274C77"/>
                <stop offset="1" stop-color="#4F9EF9"/>
              </linearGradient>
              <linearGradient id="paint1_linear_33594_25778" x1="79.9918" y1="21.5917" x2="93.4656" y2="19.3871" gradientUnits="userSpaceOnUse">
                <stop stop-color="#274C77"/>
                <stop offset="1" stop-color="#4F9EF9"/>
              </linearGradient>
              <linearGradient id="paint2_linear_33594_25778" x1="-1.41068" y1="24.5863" x2="21.5158" y2="15.9668" gradientUnits="userSpaceOnUse">
                <stop stop-color="#274C77"/>
                <stop offset="1" stop-color="#4F9EF9"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <!-- Loading text -->
        <div class="loading-text">LOADING</div>
        
      </div>
    </div>
  </div>
		<?php
	}
}