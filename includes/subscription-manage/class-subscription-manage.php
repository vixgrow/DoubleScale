<?php
/**
 * Class Subscription Manage
 *
 * This class is responsible for handling the Subscription Manage
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Subscription_Manage;

use QuillCRM\Models\Contact_Model;
use QuillCRM\Settings;

/**
 * Subscription Manage
 */
class Subscription_Manage {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Subscription_Manage
	 */
	private static $instance;

	/**
	 * Merge Tags Manager
	 *
	 * @var Merge_Tags_Manager
	 */
	public $merge_tags_manager;

	/**
	 * Subscription_Manage Instance.
	 *
	 * Instantiates or reuses an instance
	 *
	 * @since 1.0.0
	 *
	 * @return Subscription_Manage
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'wp_loaded', array( $this, 'manage' ) );

		// Register scripts.
		add_action( 'wp_enqueue_scripts', array( $this, 'register_scripts' ) );

		// Register AJAX actions.
		add_action( 'wp_ajax_quillcrm_unsubscribe', array( $this, 'unsubscribe_ajax' ) );
		add_action( 'wp_ajax_nopriv_quillcrm_unsubscribe', array( $this, 'unsubscribe_ajax' ) );
	}

	/**
	 * Manage
	 */
	public function manage() {
		$this->subscribe();
		$this->unsubscribe();
	}

	/**
	 * Get head
	 *
	 * @return string
	 */
	public function get_head() {
		ob_start();
		?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
			"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
			<meta http-equiv="Imagetoolbar" content="No"/>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php esc_html_e( 'Request Unsubscribe', 'quillcrm' ); ?></title>
			<meta name="robots" content="noindex">
			<?php
				wp_enqueue_style( 'quillcrm-public' );
				wp_head();
			?>
		</head>
		<body class="quillcrm-body">
		<?php
		return ob_get_clean();
	}

	/**
	 * Get footer
	 *
	 * @return string
	 */
	public function get_footer() {
		ob_start();
		wp_enqueue_script( 'quillcrm-public' );
		wp_footer();
		?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

	/**
	 * Subscribe
	 */
	public function subscribe() {
		if ( ! isset( $_GET['quillcrm-subscribe'] ) || $_GET['quillcrm-subscribe'] !== '1' || ! isset( $_GET['id'] ) ) {
			return;
		}

		$id      = sanitize_text_field( $_GET['id'] );
		$contact = Contact_Model::get_by_hash_id( $id );
		if ( ! $contact ) {
			return;
		}

		$contact->email_status = 'subscribed';
		$contact->save();

		\QuillCRM\Models\Activity_Model::create(
			array(
				'contact_id'    => $contact->id,
				'activity_type' => 'note',
				'data'          => array(
					'title' => __( 'Subscribed', 'quillcrm' ),
					'type'  => 'system',
					'note'  => __( 'Contact subscribed to the email list.', 'quillcrm' ),
				),
				'user_id'       => null,
			)
		);

		$double_optin       = Settings::get( 'double_optin', array() );
		$after_confirmation = $double_optin['after_confirmation'] ?? 'message';
		if ( 'message' === $after_confirmation ) {
			echo $this->get_subscribe_message();
			exit;
		}

		$redirect_url = $double_optin['confirmation_redirect'] ?? home_url();
		wp_redirect( $redirect_url );
	}

	/**
	 * Get Subscribe Message
	 *
	 * @return string
	 */
	public function get_subscribe_message() {
		$double_optin = Settings::get( 'double_optin', array() );
		$message      = $double_optin['confirmation_message'] ?? '';

		ob_start();
		echo $this->get_head();
		?>
		<div class="quillcrm-subscribe-message-container">
			<div class="quillcrm-subscribe-message">
				<?php echo ! empty( $message ) ? $message : $this->get_default_message(); ?>
			</div>
		</div>
		<?php
		echo $this->get_footer();
		return ob_get_clean();
	}

	/**
	 * Default message
	 *
	 * @return string
	 */
	public function get_default_message() {
		ob_start();
		?>
		<h2><?php _e( 'Subscription Confirmed', 'quillcrm' ); ?></h2>
		<p><?php _e( 'You have successfully subscribed to our mailing list.', 'quillcrm' ); ?></p>
		<div>
			<p><?php _e( 'Thank you for subscribing!', 'quillcrm' ); ?></p>
			<a href="<?php echo home_url(); ?>"><?php _e( 'Go to Home', 'quillcrm' ); ?></a>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Unsubscribe AJAX
	 */
	public function unsubscribe_ajax() {
		check_ajax_referer( 'quillcrm-unsubscribe', 'nonce' );

		$id      = sanitize_text_field( $_POST['id'] ?? '' );
		$channel = sanitize_text_field( $_POST['channel'] ?? 'email' );
		$reason  = sanitize_text_field( $_POST['reason'] ?? 'other' );

		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid ID', 'quillcrm' ) ) );
		}

		try {
			$contact = Contact_Model::get_by_hash_id( $id );
			if ( ! $contact ) {
				wp_send_json_error( array( 'message' => __( 'Invalid ID', 'quillcrm' ) ) );
			}

			// Try to find the most recent tracking record for source context
			$source_type = null;
			$source_id   = null;
			$mode        = null;
			
			// Map channel to mode
			$mode_map = array(
				'email'    => 1,
				'sms'      => 2,
				'whatsapp' => 3,
			);
			$mode = $mode_map[ $channel ] ?? null;
			
			if ( $mode ) {
				$recent_tracking = \QuillCRM\Models\Communication_Tracking_Model::where( 'contact_id', $contact->id )
					->where( 'mode', $mode )
					->orderBy( 'created_at', 'desc' )
					->first();
				
				if ( $recent_tracking && $recent_tracking->source_type && $recent_tracking->source_id ) {
					$source_type = $recent_tracking->source_type; // 1=Campaign, 2=Automation
					$source_id   = $recent_tracking->source_id;
				}
			}

			// Unsubscribe using mode
			$contact->unsubscribe_from_mode( $mode, $reason, $source_type, $source_id );

			// Return success HTML page
			ob_start();
			$this->render_styled_unsubscribe_page( false );
			$html = ob_get_clean();
			
			wp_send_json_success(
				array(
					'html' => $html,
				)
			);
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Unsubscribe
	 */
	public function unsubscribe() {
		if ( ! isset( $_GET['quillcrm-unsubscribe'] ) || $_GET['quillcrm-unsubscribe'] !== '1' || ! isset( $_GET['id'] ) ) {
			return;
		}

		$id      = sanitize_text_field( $_GET['id'] );
		$channel = isset( $_GET['channel'] ) ? sanitize_text_field( $_GET['channel'] ) : 'email';

		$contact = Contact_Model::get_by_hash_id( $id );
		if ( ! $contact ) {
			return;
		}

		// Check if already unsubscribed from this channel
		if ( ! $contact->is_subscribed_to_channel( $channel ) ) {
			// Already unsubscribed - show styled page
			$this->render_styled_unsubscribe_page( true );
			exit;
		}

		// Not yet unsubscribed - show confirmation form
		echo $this->get_unsubscribe_form( $contact, $channel );
		exit;
	}

	/**
	 * Get Unsubscribe Message
	 *
	 * @param string $channel Channel.
	 * @return string
	 */
	public function get_unsubscribe_message( $channel = 'email' ) {
		$channel_label = \QuillCRM\Models\Contact_Model::get_channel_label( $channel );

		ob_start();
		echo $this->get_head();
		?>
		<div class="quillcrm-unsubscribe-message-container">
			<div class="quillcrm-unsubscribe-message">
				<p><?php echo sprintf( esc_html__( 'You have already unsubscribed from %s.', 'quillcrm' ), $channel_label ); ?></p>
				<a href="<?php echo home_url(); ?>"><?php _e( 'Go to Home', 'quillcrm' ); ?></a>
			</div>
		</div>
		<?php
		echo $this->get_footer();
		return ob_get_clean();
	}

	/**
	 * Get Unsubscribe Form - Styled version
	 *
	 * @param Contact_Model $contact Contact.
	 * @param string        $channel Channel (email, sms, whatsapp).
	 *
	 * @return string
	 */
	public function get_unsubscribe_form( $contact, $channel = 'email' ) {
		$channel_label = \QuillCRM\Models\Contact_Model::get_channel_label( $channel );
		$site_name     = get_bloginfo( 'name' );

		ob_start();
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title><?php echo esc_html( sprintf( __( 'Unsubscribe - %s', 'quillcrm' ), $site_name ) ); ?></title>
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

				.icon-wrapper {
					width: 80px;
					height: 80px;
					margin: 0 auto 24px;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.icon-wrapper svg {
					width: 40px;
					height: 40px;
					fill: white;
				}

				h3 {
					font-size: 28px;
					font-weight: 700;
					color: #1a202c;
					margin-bottom: 16px;
					text-align: center;
				}

				.intro-text {
					font-size: 16px;
					color: #4a5568;
					line-height: 1.6;
					margin-bottom: 32px;
					text-align: center;
				}

				.quillcrm-form-item {
					margin-bottom: 24px;
				}

				.quillcrm-form-item label {
					display: block;
					font-weight: 600;
					color: #2d3748;
					margin-bottom: 8px;
					font-size: 14px;
				}

				.quillcrm-form-item input[type="text"] {
					width: 100%;
					padding: 12px 16px;
					border: 2px solid #e2e8f0;
					border-radius: 8px;
					font-size: 16px;
					background: #f7fafc;
					color: #718096;
				}

				.quillcrm-form-radio-group {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.quillcrm-form-radio-group label {
					display: flex;
					align-items: center;
					padding: 12px 16px;
					border: 2px solid #e2e8f0;
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.2s;
					font-weight: normal;
				}

				.quillcrm-form-radio-group label:hover {
					border-color: #667eea;
					background: #f7fafc;
				}

				.quillcrm-form-radio-group input[type="radio"] {
					margin-right: 12px;
					width: 18px;
					height: 18px;
					cursor: pointer;
				}

				.quillcrm-form-radio-group label:has(input:checked) {
					border-color: #667eea;
					background: #eef2ff;
				}

				button[type="submit"] {
					width: 100%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 14px 32px;
					border: none;
					border-radius: 8px;
					font-weight: 600;
					font-size: 16px;
					cursor: pointer;
					transition: transform 0.2s, box-shadow 0.2s;
					box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
				}

				button[type="submit"]:hover {
					transform: translateY(-2px);
					box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
				}

				button[type="submit]:active {
					transform: translateY(0);
				}

				button[type="submit"]:disabled {
					opacity: 0.6;
					cursor: not-allowed;
					transform: none;
				}

				.error-message {
					background: #fee;
					color: #c33;
					padding: 12px 16px;
					border-radius: 8px;
					margin-bottom: 16px;
					display: none;
					font-size: 14px;
				}

				.error-message.show {
					display: block;
				}

				@media (max-width: 480px) {
					.unsubscribe-container {
						padding: 32px 24px;
					}

					h3 {
						font-size: 24px;
					}

					.intro-text {
						font-size: 15px;
					}
				}
			</style>
		</head>
		<body>
			<div class="unsubscribe-container">
				<div class="icon-wrapper">
					<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
						<line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</div>

				<h3><?php echo sprintf( esc_html__( 'Unsubscribe from %s', 'quillcrm' ), $channel_label ); ?></h3>
				
				<p class="intro-text">
					<?php esc_html_e( 'We\'re sorry to see you go. Please let us know why you\'re unsubscribing.', 'quillcrm' ); ?>
				</p>

				<div class="error-message" id="error-message"></div>

				<form id="quillcrm-unsubscribe-form">
					<input type="hidden" name="id" value="<?php echo esc_attr( $contact->hash_id ); ?>">
					<input type="hidden" name="channel" value="<?php echo esc_attr( $channel ); ?>">
					<input type="hidden" name="nonce" value="<?php echo wp_create_nonce( 'quillcrm-unsubscribe' ); ?>">
					<input type="hidden" name="action" value="quillcrm_unsubscribe">
					
					<div class="quillcrm-form-item">
						<label for="contact_info">
							<?php echo 'email' === $channel ? __( 'Email', 'quillcrm' ) : __( 'Phone', 'quillcrm' ); ?>
						</label>
						<input
							type="text"
							name="contact_info"
							value="<?php echo esc_attr( $this->hide_contact_info( $contact, $channel ) ); ?>"
							disabled
						>
					</div>
					
					<div class="quillcrm-form-item">
						<label for="reason"><?php _e( 'Reason for unsubscribing', 'quillcrm' ); ?></label>
						<div class="quillcrm-form-radio-group">
							<label>
								<input type="radio" name="reason" value="spam">
								<?php echo sprintf( __( 'I consider these %s to be spam', 'quillcrm' ), $channel_label ); ?>
							</label>
							<label>
								<input type="radio" name="reason" value="not-interested">
								<?php echo sprintf( __( 'I am no longer interested in these %s', 'quillcrm' ), $channel_label ); ?>
							</label>
							<label>
								<input type="radio" name="reason" value="other" checked>
								<?php _e( 'Other', 'quillcrm' ); ?>
							</label>
						</div>
					</div>
					
					<button type="submit"><?php _e( 'Confirm Unsubscribe', 'quillcrm' ); ?></button>
				</form>
			</div>

			<script>
				document.getElementById('quillcrm-unsubscribe-form').addEventListener('submit', function(e) {
					e.preventDefault();
					
					const button = this.querySelector('button[type="submit"]');
					const errorDiv = document.getElementById('error-message');
					const formData = new FormData(this);
					
					button.disabled = true;
					button.textContent = '<?php esc_html_e( 'Processing...', 'quillcrm' ); ?>';
					errorDiv.classList.remove('show');
					
					fetch('<?php echo admin_url( 'admin-ajax.php' ); ?>', {
						method: 'POST',
						body: formData
					})
					.then(response => response.json())
					.then(data => {
						if (data.success && data.data.html) {
							// Replace entire page with success HTML
							document.open();
							document.write(data.data.html);
							document.close();
						} else if (data.success) {
							// Fallback: show message and reload
							alert(data.data.message);
							window.location.reload();
						} else {
							errorDiv.textContent = data.data?.message || '<?php esc_html_e( 'An error occurred. Please try again.', 'quillcrm' ); ?>';
							errorDiv.classList.add('show');
							button.disabled = false;
							button.textContent = '<?php esc_html_e( 'Confirm Unsubscribe', 'quillcrm' ); ?>';
						}
					})
					.catch(error => {
						console.error('Unsubscribe error:', error);
						errorDiv.textContent = '<?php esc_html_e( 'An error occurred. Please try again.', 'quillcrm' ); ?>';
						errorDiv.classList.add('show');
						button.disabled = false;
						button.textContent = '<?php esc_html_e( 'Confirm Unsubscribe', 'quillcrm' ); ?>';
					});
				});
			</script>
			<?php wp_footer(); ?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

	/**
	 * Hide contact info (email or phone)
	 *
	 * @param Contact_Model $contact Contact.
	 * @param string        $channel Channel.
	 *
	 * @return string
	 */
	public function hide_contact_info( $contact, $channel ) {
		if ( 'email' === $channel ) {
			return $this->hide_contact_email( $contact->email );
		} else {
			// Hide phone number
			$phone = $contact->phone ?? '';
			if ( strlen( $phone ) > 6 ) {
				return substr( $phone, 0, 3 ) . str_repeat( '*', strlen( $phone ) - 6 ) . substr( $phone, -3 );
			}
			return $phone;
		}
	}

	/**
	 * Hide contact email
	 *
	 * @param string $email Email.
	 *
	 * @return string
	 */
	public function hide_contact_email( $email ) {
		$parts = explode( '@', $email );
		$first = substr( $parts[0], 0, 2 );
		$last  = substr( $parts[0], -2 );
		$hide  = str_repeat( '*', strlen( $parts[0] ) - 4 );
		return $first . $hide . $last . '@' . $parts[1];
	}

	/**
	 * Register Scripts
	 */
	public function register_scripts() {
		wp_register_script( 'quillcrm-public', QUILLCRM_PLUGIN_URL . 'assets/js/public.js', array( 'jquery' ), '1.0.0', true );
		wp_localize_script(
			'quillcrm-public',
			'quillcrm_public_config',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			)
		);
		wp_register_style( 'quillcrm-public', QUILLCRM_PLUGIN_URL . 'assets/css/public.css', array(), '1.0.0' );
	}

	/**
	 * Render styled unsubscribe success page
	 *
	 * @param bool $already_unsubscribed Whether user was already unsubscribed.
	 */
	private function render_styled_unsubscribe_page( $already_unsubscribed = false ) {
		$site_name = get_bloginfo( 'name' );
		$title     = $already_unsubscribed ? __( 'Already Unsubscribed', 'quillcrm' ) : __( 'You\'re Unsubscribed', 'quillcrm' );
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title><?php echo esc_html( sprintf( __( 'Unsubscribed - %s', 'quillcrm' ), $site_name ) ); ?></title>
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
		<body>
			<div class="unsubscribe-container">
				<div class="success-icon">
					<svg viewBox="0 0 52 52">
						<polyline class="checkmark" points="14 27 22 35 38 17"/>
					</svg>
				</div>
				
				<h1><?php echo esc_html( $title ); ?></h1>
				
				<p class="message">
					<?php
					if ( $already_unsubscribed ) {
						esc_html_e( 'You have already unsubscribed from our mailing list.', 'quillcrm' );
					} else {
						esc_html_e( 'You have been successfully unsubscribed from our mailing list. We\'re sorry to see you go, but we respect your decision.', 'quillcrm' );
					}
					?>
				</p>

				<?php if ( ! $already_unsubscribed ) : ?>
				<p class="message">
					<?php esc_html_e( 'You will no longer receive emails from us.', 'quillcrm' ); ?>
				</p>
				<?php endif; ?>

				<a href="<?php echo esc_url( home_url() ); ?>" class="home-button">
					<?php esc_html_e( 'Back to Home', 'quillcrm' ); ?>
				</a>

				<div class="footer-note">
					<?php esc_html_e( 'Changed your mind? You can resubscribe anytime by contacting us.', 'quillcrm' ); ?>
				</div>
			</div>
		</body>
		</html>
		<?php
	}
}
