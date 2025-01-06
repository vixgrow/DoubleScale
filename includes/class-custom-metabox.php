<?php
/**
 * Class Custom_Metabox
 *
 * This class is responsible for handling the custom metabox
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM;

use QuillCRM\Models\Contact_Model;

/**
 * Custom_Metabox class
 */
final class Custom_Metabox {

	/**
	 * Instance
	 *
	 * @var Custom_Metabox
	 */
	private static $instance;

	/**
	 * Get instance
	 *
	 * @return Custom_Metabox
	 */
	public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		add_action( 'edd_view_order_details_sidebar_after', array( $this, 'edd_order_metabox' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ), 99, 2 );
	}

	/**
	 * Add meta boxes
	 *
	 * @param string   $post_type Post type
	 * @param \WP_Post $post Post object
	 *
	 * @return void
	 */
	public function add_meta_boxes( $post_type, $post ) {
		if ( ! in_array( $post_type, array( 'woocommerce_page_wc-orders', 'shop_order' ) ) ) {
			return;
		}

		if ( $post_type == 'woocommerce_page_wc-orders' ) {
			$order_id = $post->get_id();
		} else {
			$order_id = $post->ID;
		}

		$order = wc_get_order( $order_id );
		$email = $order->get_billing_email();

		$contact = Contact_Model::where( 'email', $email )->first();
		if ( ! $contact ) {
			return;
		}

		add_meta_box(
			'quillcrm-contact-metabox',
			__( 'QuillCRM Contact', 'quillcrm' ),
			function() use ( $contact ) {
				$this->generate_contact_metabox_html( $contact->email );
			},
			$post_type,
			'side',
			'default',
			$contact
		);
	}

	/**
	 * EDD Order Metabox
	 *
	 * @param int $payment_id Payment ID
	 */
	public function edd_order_metabox( $payment_id ) {
		$payment = edd_get_payment( $payment_id );
		if ( ! $payment ) {
			return;
		}

		$email = $payment->email;
		if ( ! $email ) {
			return;
		}

		$this->generate_contact_metabox_html( $email );
	}

	/**
	 * Generate contact metabox HTML for a given email.
	 *
	 * @param string $email The email address to fetch the contact details.
	 */
	function generate_contact_metabox_html( $email ) {
		// Fetch the contact based on email
		$contact = Contact_Model::where( 'email', $email )->first();
		if ( ! $contact ) {
			return;
		}

		$total_emails         = $contact->campaign_emails->count();
		$total_opened_emails  = $contact->campaign_emails->where( 'opened', 1 )->count();
		$total_clicked_emails = $contact->campaign_emails->where( 'clicked', 1 )->count();
		$first_name           = $contact->first_name ?? '-';
		$last_name            = $contact->last_name ?? '-';
		$name                 = "{$first_name} {$last_name}";

		// Generate avatar URL using Gravatar or UI Avatars
		$avatar_url = add_query_arg(
			array(
				's' => 128,
				'd' => $name ? 'https://ui-avatars.com/api/' . urlencode( $name ) . '/128' : '',
			),
			'https://www.gravatar.com/avatar/' . md5( strtolower( $contact->email ) )
		);

		$profile_url = admin_url( 'admin.php?page=quillcrm&path=contacts&id=' . $contact->id );

		?>
		<div class="quillcrm-edd-order-metabox postbox">
			<h2 class="hndle"><?php esc_html_e( 'QuillCRM Contact', 'quillcrm' ); ?></h2>
			<div class="inside">
				<a class="quillcrm-avatar" href="<?php echo esc_url( $profile_url ); ?>">
					<img src="<?php echo esc_url( $avatar_url ); ?>" alt="<?php echo esc_attr( $contact->first_name . ' ' . $contact->last_name ); ?>" class="quillcrm-avatar-img">
					<p class="quillcrm-contact-name">
						<?php echo esc_html( $first_name . ' ' . $last_name ); ?>
					</p>
				</a>
				<div class="quillcrm-contact-emails">
					<p>
						<strong><?php esc_html_e( 'Emails:', 'quillcrm' ); ?></strong>
						<?php echo esc_html( $total_emails ); ?>
					</p>
					<p>
						<strong><?php esc_html_e( 'Opened:', 'quillcrm' ); ?></strong>
						<?php echo esc_html( $total_opened_emails ); ?>
					</p>
					<p>
						<strong><?php esc_html_e( 'Clicked:', 'quillcrm' ); ?></strong>
						<?php echo esc_html( $total_clicked_emails ); ?>
					</p>
				</div>
			</div>
		</div>
		<style>
			.quillcrm-edd-order-metabox .inside{
				padding: 20px;
			}
			.quillcrm-avatar {
				display: flex;
				justify-content: center;
				align-items: center;
				margin-bottom: 20px;
				flex-direction: column;
				gap: 10px;
			}
			.quillcrm-avatar:active {
				text-decoration: none;
				outline: none;
				box-shadow: none;
			}
			.quillcrm-avatar img {
				width: 80px;
				height: 80px;
				border: 6px solid #e6ebf0;
				border-radius: 50%;
				vertical-align: middle;
				background-position: center center;
				background-repeat: no-repeat;
				background-size: cover;
			}
			.quillcrm-contact-name {
				font-size: 20px;
				font-weight: bold;
				color: #434b8c;
				margin: 0;
			}
			.quillcrm-contact-emails {
				display: flex;
				justify-content: center;
			}
			.quillcrm-contact-emails p {
				margin: 0;
				border: 1px solid #e6ebf0;
				padding: 5px;
				background-color: #97a2e6;
				color: #434b8c;
			}
		</style>
		<?php
	}
}
