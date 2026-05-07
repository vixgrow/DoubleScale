<?php
/**
 * Class Subscription Manage
 *
 * This class is responsible for handling the Subscription Manage
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\SubscriptionManage;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Core\Settings\Settings;

/**
 * Subscription Manage
 */
class SubscriptionManage {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var SubscriptionManage
	 */
	private static $instance;

	/**
	 * Merge Tags Manager
	 *
	 * @var MergeTagsManager
	 */
	public $merge_tags_manager;

	/**
	 * SubscriptionManage Instance.
	 *
	 * Instantiates or reuses an instance
	 *
	 * @since 1.0.0
	 *
	 * @return SubscriptionManage
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
		add_action( 'wp_ajax_doublescale_unsubscribe', array( $this, 'unsubscribe_ajax' ) );
		add_action( 'wp_ajax_nopriv_doublescale_unsubscribe', array( $this, 'unsubscribe_ajax' ) );
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
			<title><?php esc_html_e( 'Request Unsubscribe', 'doublescale'); ?></title>
			<meta name="robots" content="noindex">
			<?php
				wp_enqueue_style( 'doublescale-public' );
				wp_head();
			?>
		</head>
		<body class="doublescale-body">
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
		wp_enqueue_script( 'doublescale-public' );
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public subscription link, nonce not applicable
		if ( ! isset( $_GET['doublescale-subscribe'] ) || $_GET['doublescale-subscribe'] !== '1' || ! isset( $_GET['id'] ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public subscription link, nonce not applicable
		$id      = sanitize_text_field( wp_unslash( $_GET['id'] ) );
		$contact = ContactModel::get_by_hash_id( $id );
		if ( ! $contact ) {
			return;
		}

		$contact->email_status = 'subscribed';
		$contact->save();

		\DoubleScale\Modules\Activities\Models\ActivityModel::create(
			array(
				'contact_id'    => $contact->id,
				'activity_type' => 'note',
				'data'          => array(
					'title' => __( 'Subscribed', 'doublescale'),
					'type'  => 'system',
					'note'  => __( 'Contact subscribed to the email list.', 'doublescale'),
				),
				'user_id'       => null,
			)
		);

		$double_optin       = Settings::get( 'double_optin', array() );
		$after_confirmation = $double_optin['after_confirmation'] ?? 'message';
		if ( 'message' === $after_confirmation ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML from get_subscribe_message() is escaped internally.
			echo $this->get_subscribe_message();
			exit;
		}

		$redirect_url = $double_optin['confirmation_redirect'] ?? home_url();
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect URL is from admin settings, may be external
		wp_redirect( esc_url_raw( $redirect_url ) );
		exit;
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
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML from get_head() is escaped internally.
		echo $this->get_head();
		?>
		<div class="doublescale-subscribe-message-container">
			<div class="doublescale-subscribe-message">
				<?php
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Either wp_kses_post() filtered message or get_default_message() which is escaped internally.
					echo ! empty( $message ) ? wp_kses_post( $message ) : $this->get_default_message();
				?>
			</div>
		</div>
		<?php
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML from get_footer() is escaped internally.
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
		<h2><?php esc_html_e( 'Subscription Confirmed', 'doublescale'); ?></h2>
		<p><?php esc_html_e( 'You have successfully subscribed to our mailing list.', 'doublescale'); ?></p>
		<div>
			<p><?php esc_html_e( 'Thank you for subscribing!', 'doublescale'); ?></p>
			<a href="<?php echo esc_url( home_url() ); ?>"><?php esc_html_e( 'Go to Home', 'doublescale'); ?></a>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Unsubscribe AJAX
	 */
	public function unsubscribe_ajax() {
		check_ajax_referer( 'doublescale-unsubscribe', 'nonce' );

		$id      = isset( $_POST['id'] ) ? sanitize_text_field( wp_unslash( $_POST['id'] ) ) : '';
		$channel = isset( $_POST['channel'] ) ? sanitize_text_field( wp_unslash( $_POST['channel'] ) ) : 'email';
		$reason  = isset( $_POST['reason'] ) ? sanitize_text_field( wp_unslash( $_POST['reason'] ) ) : 'other';

		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid ID', 'doublescale') ) );
		}

		try {
			$contact = ContactModel::get_by_hash_id( $id );
			if ( ! $contact ) {
				wp_send_json_error( array( 'message' => __( 'Invalid ID', 'doublescale') ) );
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
			$mode     = $mode_map[ $channel ] ?? null;

			if ( $mode ) {
				$recent_tracking = \DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel::where( 'contact_id', $contact->id )
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public unsubscribe link, nonce not applicable
		if ( ! isset( $_GET['doublescale-unsubscribe'] ) || $_GET['doublescale-unsubscribe'] !== '1' || ! isset( $_GET['id'] ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public unsubscribe link, nonce not applicable
		$id = sanitize_text_field( wp_unslash( $_GET['id'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public unsubscribe link, nonce not applicable
		$channel = isset( $_GET['channel'] ) ? sanitize_text_field( wp_unslash( $_GET['channel'] ) ) : 'email';

		$contact = ContactModel::get_by_hash_id( $id );
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
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML from get_unsubscribe_form() is escaped internally.
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
		$channel_label = ContactModel::get_channel_label( $channel );

		ob_start();
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in get_head() method
		echo $this->get_head();
		?>
		<div class="doublescale-unsubscribe-message-container">
			<div class="doublescale-unsubscribe-message">
				<p>
				<?php
					/* translators: %s: channel name (email, Sms, WhatsApp) */
					echo sprintf( esc_html__( 'You have already unsubscribed from %s.', 'doublescale'), esc_html( $channel_label ) );
				?>
				</p>
				<a href="<?php echo esc_url( home_url() ); ?>"><?php esc_html_e( 'Go to Home', 'doublescale'); ?></a>
			</div>
		</div>
		<?php
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in get_footer() method
		echo $this->get_footer();
		return ob_get_clean();
	}

	/**
	 * Get Unsubscribe Form - Styled version
	 *
	 * @param ContactModel $contact Contact.
	 * @param string        $channel Channel (email, sms, whatsapp).
	 *
	 * @return string
	 */
	public function get_unsubscribe_form( $contact, $channel = 'email' ) {
		$channel_label = ContactModel::get_channel_label( $channel );
		$site_name     = get_bloginfo( 'name' );

		ob_start();
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title>
			<?php
				/* translators: %s: site name */
				echo esc_html( sprintf( __( 'Unsubscribe - %s', 'doublescale'), $site_name ) );
			?>
			</title>
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

				.doublescale-form-item {
					margin-bottom: 24px;
				}

				.doublescale-form-item label {
					display: block;
					font-weight: 600;
					color: #2d3748;
					margin-bottom: 8px;
					font-size: 14px;
				}

				.doublescale-form-item input[type="text"] {
					width: 100%;
					padding: 12px 16px;
					border: 2px solid #e2e8f0;
					border-radius: 8px;
					font-size: 16px;
					background: #f7fafc;
					color: #718096;
				}

				.doublescale-form-radio-group {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.doublescale-form-radio-group label {
					display: flex;
					align-items: center;
					padding: 12px 16px;
					border: 2px solid #e2e8f0;
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.2s;
					font-weight: normal;
				}

				.doublescale-form-radio-group label:hover {
					border-color: #667eea;
					background: #f7fafc;
				}

				.doublescale-form-radio-group input[type="radio"] {
					margin-right: 12px;
					width: 18px;
					height: 18px;
					cursor: pointer;
				}

				.doublescale-form-radio-group label:has(input:checked) {
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

				button[type="submit"]:active {
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

				<h3>
				<?php
					/* translators: %s: channel name (email, Sms, WhatsApp) */
					echo sprintf( esc_html__( 'Unsubscribe from %s', 'doublescale'), esc_html( $channel_label ) );
				?>
				</h3>
				
				<p class="intro-text">
					<?php esc_html_e( 'We\'re sorry to see you go. Please let us know why you\'re unsubscribing.', 'doublescale'); ?>
				</p>

				<div class="error-message" id="error-message"></div>

				<form id="doublescale-unsubscribe-form">
					<input type="hidden" name="id" value="<?php echo esc_attr( $contact->hash_id ); ?>">
					<input type="hidden" name="channel" value="<?php echo esc_attr( $channel ); ?>">
					<input type="hidden" name="nonce" value="<?php echo esc_attr( wp_create_nonce( 'doublescale-unsubscribe' ) ); ?>">
					<input type="hidden" name="action" value="doublescale_unsubscribe">
					
					<div class="doublescale-form-item">
						<label for="contact_info">
							<?php echo 'email' === $channel ? esc_html__( 'Email', 'doublescale') : esc_html__( 'Phone', 'doublescale'); ?>
						</label>
						<input
							type="text"
							name="contact_info"
							value="<?php echo esc_attr( $this->hide_contact_info( $contact, $channel ) ); ?>"
							disabled
						>
					</div>
					
					<div class="doublescale-form-item">
						<label for="reason"><?php esc_html_e( 'Reason for unsubscribing', 'doublescale'); ?></label>
						<div class="doublescale-form-radio-group">
							<label>
								<input type="radio" name="reason" value="spam">
								<?php
									/* translators: %s: channel name (emails, messages, etc.) */
									echo esc_html( sprintf( __( 'I consider these %s to be spam', 'doublescale'), $channel_label ) );
								?>
							</label>
							<label>
								<input type="radio" name="reason" value="not-interested">
								<?php
									/* translators: %s: channel name (emails, messages, etc.) */
									echo esc_html( sprintf( __( 'I am no longer interested in these %s', 'doublescale'), $channel_label ) );
								?>
							</label>
							<label>
								<input type="radio" name="reason" value="other" checked>
								<?php esc_html_e( 'Other', 'doublescale'); ?>
							</label>
						</div>
					</div>
					
					<button type="submit"><?php esc_html_e( 'Confirm Unsubscribe', 'doublescale'); ?></button>
				</form>
			</div>

			<script>
				document.getElementById('doublescale-unsubscribe-form').addEventListener('submit', function(e) {
					e.preventDefault();
					
					const button = this.querySelector('button[type="submit"]');
					const errorDiv = document.getElementById('error-message');
					const formData = new FormData(this);
					
					button.disabled = true;
					button.textContent = '<?php esc_html_e( 'Processing...', 'doublescale'); ?>';
					errorDiv.classList.remove('show');
					
					fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
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
							errorDiv.textContent = data.data?.message || '<?php esc_html_e( 'An error occurred. Please try again.', 'doublescale'); ?>';
							errorDiv.classList.add('show');
							button.disabled = false;
							button.textContent = '<?php esc_html_e( 'Confirm Unsubscribe', 'doublescale'); ?>';
						}
					})
					.catch(error => {
						console.error('Unsubscribe error:', error);
						errorDiv.textContent = '<?php esc_html_e( 'An error occurred. Please try again.', 'doublescale'); ?>';
						errorDiv.classList.add('show');
						button.disabled = false;
						button.textContent = '<?php esc_html_e( 'Confirm Unsubscribe', 'doublescale'); ?>';
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
	 * @param ContactModel $contact Contact.
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
		wp_register_script( 'doublescale-public', DOUBLESCALE_PLUGIN_URL . 'assets/js/public.js', array( 'jquery' ), '1.0.0', true );
		wp_localize_script(
			'doublescale-public',
			'doublescale_public_config',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			)
		);
		wp_register_style( 'doublescale-public', DOUBLESCALE_PLUGIN_URL . 'assets/css/public.css', array(), '1.0.0' );
	}

	/**
	 * Render styled unsubscribe success page
	 *
	 * @param bool $already_unsubscribed Whether user was already unsubscribed.
	 */
	private function render_styled_unsubscribe_page( $already_unsubscribed = false ) {
		$site_name = get_bloginfo( 'name' );
		$title     = $already_unsubscribed ? __( 'Already Unsubscribed', 'doublescale') : __( 'You\'re Unsubscribed', 'doublescale');
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title>
			<?php
				/* translators: %s: site name */
				echo esc_html( sprintf( __( 'Unsubscribed - %s', 'doublescale'), $site_name ) );
			?>
			</title>
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
						esc_html_e( 'You have already unsubscribed from our mailing list.', 'doublescale');
					} else {
						esc_html_e( 'You have been successfully unsubscribed from our mailing list. We\'re sorry to see you go, but we respect your decision.', 'doublescale');
					}
					?>
				</p>

				<?php if ( ! $already_unsubscribed ) : ?>
				<p class="message">
					<?php esc_html_e( 'You will no longer receive emails from us.', 'doublescale'); ?>
				</p>
				<?php endif; ?>

				<a href="<?php echo esc_url( home_url() ); ?>" class="home-button">
					<?php esc_html_e( 'Back to Home', 'doublescale'); ?>
				</a>

				<div class="footer-note">
					<?php esc_html_e( 'Changed your mind? You can resubscribe anytime by contacting us.', 'doublescale'); ?>
				</div>
			</div>
		</body>
		</html>
		<?php
	}
}
