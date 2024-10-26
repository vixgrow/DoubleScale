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

		$contact->status = 'subscribed';
		$contact->save();

		$contact->notes()->create(
			array(
				'title' => __( 'Subscribed', 'quillcrm' ),
				'type'  => 'system',
				'note'  => __( 'Contact subscribed to the email list.', 'quillcrm' ),
			)
		);

		$double_optin       = Settings::get( 'double_optin', array() );
		$after_confirmation = $double_optin['after_confirmation'] ?? 'message';
		if ( 'message' === $after_confirmation ) {
			echo $this->get_subscribe_message();
			exit;
		}

		$redirect_url = $double_optin['redirect_url'] ?? home_url();
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

		$id = sanitize_text_field( $_POST['id'] );
		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid ID', 'quillcrm' ) ) );
		}

		try {
			$contact = Contact_Model::get_by_hash_id( $id );
			if ( ! $contact ) {
				wp_send_json_error( array( 'message' => __( 'Invalid ID', 'quillcrm' ) ) );
			}

			$reason          = sanitize_text_field( $_POST['reason'] ) ?? 'other';
			$contact->status = 'unsubscribed';
			$contact->save();
			$contact->notes()->create(
				array(
					'title' => __( 'Unsubscribed', 'quillcrm' ),
					'type'  => 'system',
					'note'  => sprintf( __( 'Contact unsubscribed from the email list. Reason: %s', 'quillcrm' ), $reason ),
				)
			);

			wp_send_json_success( array( 'message' => __( 'You are successfully unsubscribed from the email list.', 'quillcrm' ) ) );
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
		$contact = Contact_Model::get_by_hash_id( $id );
		if ( ! $contact ) {
			return;
		}

		if ( 'unsubscribed' === $contact->status ) {
			echo $this->get_unsubscribe_message();
			exit;
		}

		echo $this->get_unsubscribe_form( $contact );
		exit;
	}

	/**
	 * Get Unsubscribe Message
	 */
	public function get_unsubscribe_message() {
		ob_start();
		echo $this->get_head();
		?>
		<div class="quillcrm-unsubscribe-message-container">
			<div class="quillcrm-unsubscribe-message">
				<p><?php _e( 'You have already unsubscribed.', 'quillcrm' ); ?></p>
				<a href="<?php echo home_url(); ?>"><?php _e( 'Go to Home', 'quillcrm' ); ?></a>
			</div>
		</div>
		<?php
		echo $this->get_footer();
		return ob_get_clean();
	}

	/**
	 * Get Unsubscribe Form
	 *
	 * @param Contact_Model $contact Contact ID.
	 *
	 * @return string
	 */
	public function get_unsubscribe_form( $contact ) {
		ob_start();
		echo $this->get_head();
		?>
		<div class="quillcrm-unsubscribe-form-container">
			<div class="quillcrm-unsubscribe-form-wrapper">
				<h3><?php _e( 'Unsubscribe', 'quillcrm' ); ?></h3>
				<form id="quillcrm-unsubscribe-form">
					<input type="hidden" name="id" value="<?php echo esc_attr( $contact->hash_id ); ?>">
					<input type="hidden" name="nonce" value="<?php echo wp_create_nonce( 'quillcrm-unsubscribe' ); ?>">
					<input type="hidden" name="action" value="quillcrm_unsubscribe">
					<div class="quillcrm-form-item">
						<label for="email"><?php _e( 'Email', 'quillcrm' ); ?></label>
						<input type="email" name="email" value="<?php echo esc_attr( $this->hide_contact_email( $contact->email ) ); ?>" disabled>
					</div>
					<div class="quillcrm-form-item">
						<label for="name"><?php _e( 'Reason', 'quillcrm' ); ?></label>
						<div class="quillcrm-form-radio-group">
							<label>
								<input type="radio" name="reason" value="spam">
								<?php _e( 'I consider these emails to be spam.', 'quillcrm' ); ?>
							</label>
							<label>
								<input type="radio" name="reason" value="not-interested">
								<?php _e( 'I am no longer interested in these emails.', 'quillcrm' ); ?>
							</label>
							<label>
								<input type="radio" name="reason" value="other">
								<?php _e( 'Other', 'quillcrm' ); ?>
							</label>
						</div>
					</div>
					<button type="submit"><?php _e( 'Unsubscribe', 'quillcrm' ); ?></button>
				</form>
			</div>
		</div>
		<?php
		echo $this->get_footer();
		return ob_get_clean();
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
}
