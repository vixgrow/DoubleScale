<?php
/**
 * Unsubscribe Page Handler
 *
 * Renders a styled unsubscribe confirmation page
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM;

defined( 'ABSPATH' ) || exit;

/**
 * Unsubscribe_Page class
 */
class Unsubscribe_Page {

	/**
	 * Instance
	 *
	 * @var Unsubscribe_Page
	 */
	private static $instance;

	/**
	 * Get instance
	 *
	 * @return Unsubscribe_Page
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		add_action( 'template_redirect', array( $this, 'handle_unsubscribe_page' ), 5 );
		add_filter( 'quillcrm_email_unsubscribe_redirect', array( $this, 'get_unsubscribe_url' ) );
		add_filter( 'quillcrm_sms_unsubscribe_redirect', array( $this, 'get_unsubscribe_url' ) );
		add_filter( 'quillcrm_whatsapp_unsubscribe_redirect', array( $this, 'get_unsubscribe_url' ) );
	}

	/**
	 * Get unsubscribe page URL
	 *
	 * @return string
	 */
	public function get_unsubscribe_url() {
		return add_query_arg( 'quillcrm_unsubscribe_success', '1', home_url() );
	}

	/**
	 * Handle unsubscribe page display
	 */
	public function handle_unsubscribe_page() {
		if ( ! isset( $_GET['quillcrm_unsubscribe_success'] ) ) {
			return;
		}

		// Prevent other templates from loading
		status_header( 200 );
		nocache_headers();

		$this->render_unsubscribe_page();
		exit;
	}

	/**
	 * Render unsubscribe page
	 */
	private function render_unsubscribe_page() {
		$site_name = get_bloginfo( 'name' );
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title><?php
				/* translators: %s: site name */
				echo esc_html( sprintf( __( 'Unsubscribed - %s', 'quill-crm' ), $site_name ) );
			?></title>
			<?php wp_head(); ?>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}

				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
				}

				.unsubscribe-container {
					background: white;
					border-radius: 16px;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
					max-width: 500px;
					width: 100%;
					padding: 48px 40px;
					text-align: center;
					animation: slideUp 0.5s ease-out;
				}

				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.success-icon {
					width: 80px;
					height: 80px;
					margin: 0 auto 24px;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					animation: scaleIn 0.5s ease-out 0.2s both;
				}

				@keyframes scaleIn {
					from {
						transform: scale(0);
					}
					to {
						transform: scale(1);
					}
				}

				.success-icon svg {
					width: 40px;
					height: 40px;
					stroke: white;
					stroke-width: 3;
					stroke-linecap: round;
					stroke-linejoin: round;
					fill: none;
				}

				.checkmark {
					stroke-dasharray: 50;
					stroke-dashoffset: 50;
					animation: drawCheck 0.5s ease-out 0.5s forwards;
				}

				@keyframes drawCheck {
					to {
						stroke-dashoffset: 0;
					}
				}

				h1 {
					font-size: 28px;
					font-weight: 700;
					color: #1a202c;
					margin-bottom: 16px;
				}

				.message {
					font-size: 16px;
					color: #4a5568;
					line-height: 1.6;
					margin-bottom: 32px;
				}

				.home-button {
					display: inline-block;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 14px 32px;
					border-radius: 8px;
					text-decoration: none;
					font-weight: 600;
					font-size: 16px;
					transition: transform 0.2s, box-shadow 0.2s;
					box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
				}

				.home-button:hover {
					transform: translateY(-2px);
					box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
					color: white;
				}

				.home-button:active {
					transform: translateY(0);
				}

				.footer-note {
					margin-top: 32px;
					padding-top: 24px;
					border-top: 1px solid #e2e8f0;
					font-size: 14px;
					color: #718096;
				}

				@media (max-width: 480px) {
					.unsubscribe-container {
						padding: 32px 24px;
					}

					h1 {
						font-size: 24px;
					}

					.message {
						font-size: 15px;
					}
				}
			</style>
		</head>

		</html>
		<?php
	}
}

// Initialize
Unsubscribe_Page::instance();
