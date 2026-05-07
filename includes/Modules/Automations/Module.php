<?php
/**
 * Automations module bootstrap.
 *
 * Owns: automation models, triggers, actions, goals, rules, conditions, REST,
 * WooCommerce abandoned-cart capture/recovery hooks, abandoned-cart REST,
 * and automation processing. CRM vendor integrations are provided by the Pro add-on.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'automations';
	}

	public function label(): string {
		return __( 'Automations', 'doublescale' );
	}

	public function description(): string {
		return __( 'Visual workflow builder with triggers, actions, goals, and conditional rules.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts', 'activities' );
	}

	public function register( Container $container ): void {
		$container->singleton(
			AbandonedCart\AbandonedCart::class,
			static fn() => AbandonedCart\AbandonedCart::instance()
		);

		$container->singleton(
			Services\TriggersManager::class,
			static fn() => Services\TriggersManager::instance()
		);

		$container->singleton(
			Services\ActionsManager::class,
			static fn() => Services\ActionsManager::instance()
		);

		$container->singleton(
			Services\GoalsManager::class,
			static fn() => Services\GoalsManager::instance()
		);

		$container->singleton(
			Services\RulesManager::class,
			static fn() => Services\RulesManager::instance()
		);
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestAutomationController::class,
			Rest\Controllers\RestAutomationStepController::class,
			Rest\Controllers\RestAutomationContactController::class,
			Rest\Controllers\RestAbandonedCartController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		$legacy_controllers = $this->restControllers();
		add_action(
			'rest_api_init',
			static function () use ( $legacy_controllers ) {
				foreach ( $legacy_controllers as $class ) {
					if ( ! is_string( $class ) || ! is_subclass_of( $class, RestController::class, true ) ) {
						continue;
					}
					if ( ! method_exists( $class, 'register_routes_legacy' ) ) {
						continue;
					}
					( new $class() )->register_routes_legacy();
				}
			},
			11
		);

		add_filter( 'doublescale_merge_tag_groups', array( $this, 'register_merge_tag_groups' ) );

		$container->get( AbandonedCart\AbandonedCart::class );
		$container->get( Services\TriggersManager::class );
		$container->get( Services\ActionsManager::class );
		Loader::instance();
		\DoubleScale\Managers\MergeTagsManager::instance();

		add_filter( 'doublescale_triggers', array( $this, 'register_triggers' ) );
		add_filter( 'doublescale_actions', array( $this, 'register_actions' ) );
		add_filter( 'doublescale_goals', array( $this, 'register_goals' ) );

		$this->loadManifestOrGlobs(
			array(
				'includes/Modules/Automations/Triggers/*.php',
				'includes/Modules/Automations/Triggers/Woocommerce/*/*.php',
				'includes/Modules/Automations/Triggers/Learndash/*.php',
				'includes/Modules/Automations/Triggers/Edd/*.php',
				'includes/Modules/Automations/Triggers/Tutorlms/*.php',
				'includes/Modules/Automations/Triggers/Lifterlms/*.php',
				'includes/Modules/Automations/Triggers/Learnpress/*.php',
				'includes/Modules/Automations/Triggers/Memberpress/*.php',
				'includes/Modules/Automations/Triggers/Pmpro/*.php',
				'includes/Modules/Automations/Triggers/Surecart/*/*.php',
				'includes/Modules/Automations/Triggers/Prestoplayer/*.php',
				'includes/Modules/Automations/Actions/*.php',
				'includes/Modules/Automations/Actions/Delays/*.php',
				'includes/Modules/Automations/Actions/Woocommerce/*.php',
				'includes/Modules/Automations/Actions/Wordpress/*.php',
				'includes/Modules/Automations/Actions/Crm/Slack/*.php',
				'includes/Modules/Automations/Actions/Learndash/*.php',
				'includes/Modules/Automations/Actions/Webhooks/*.php',
				'includes/Modules/Automations/Actions/Tutorlms/*.php',
				'includes/Modules/Automations/Actions/Lifterlms/*.php',
				'includes/Modules/Automations/Actions/Learnpress/*.php',
				'includes/Modules/Automations/Actions/Memberpress/*.php',
				'includes/Modules/Automations/Actions/Pmpro/*.php',
				'includes/Modules/Automations/Actions/Prestoplayer/*.php',
				'includes/Modules/Automations/Goals/*.php',
				'includes/Modules/Automations/Goals/Surecart/*.php',
				'includes/Modules/Automations/Goals/Woocommerce/*.php',
				'includes/Modules/Automations/Rules/*/*.php',
			),
			'automations'
		);

		$this->loadMergeTags();
	}

	/**
	 * Eagerly load automation-scoped merge-tag classes (WooCommerce, EDD,
	 * LMS integrations, post context, etc.).
	 */
	private function loadMergeTags(): void {
		$this->loadModuleMergeTagFiles();
	}

	public function register_triggers( $triggers ) {
		$triggers['contact_subscribed']                       = new Triggers\ContactSubscribed();
		$triggers['contact_unsubscribed']                     = new Triggers\ContactUnsubscribed();
		$triggers['user_login']                              = new Triggers\UserLogin();
		$triggers['user_register']                           = new Triggers\UserRegister();
		$triggers['user_role_update']                        = new Triggers\UserRoleUpdate();
		$triggers['lists_applied']                            = new Triggers\ListsApplied();
		$triggers['lists_removed']                            = new Triggers\ListsRemoved();
		$triggers['tags_applied']                             = new Triggers\TagsApplied();
		$triggers['tags_removed']                             = new Triggers\TagsRemoved();
		$triggers['webhook_received']                         = new Triggers\WebhookReceived();
		$triggers['wp_customer_before_card_expiry']           = new Triggers\Woocommerce\Subscription\CustomerBeforeCardExpiry();
		$triggers['wp_subscription_before_end']               = new Triggers\Woocommerce\Subscription\SubscriptionBeforeEnd();
		$triggers['wp_subscription_before_renewal']           = new Triggers\Woocommerce\Subscription\SubscriptionBeforeRenewal();
		$triggers['wp_subscription_created']                  = new Triggers\Woocommerce\Subscription\SubscriptionCreated();
		$triggers['wp_subscription_note_added']               = new Triggers\Woocommerce\Subscription\SubscriptionNoteAdded();
		$triggers['wp_subscription_renewal_payment_complete'] = new Triggers\Woocommerce\Subscription\SubscriptionRenewalPaymentComplete();
		$triggers['wp_subscription_renewal_payment_failed']   = new Triggers\Woocommerce\Subscription\SubscriptionRenewalPaymentFailed();
		$triggers['wp_subscription_status_changed']           = new Triggers\Woocommerce\Subscription\SubscriptionStatusChanged();
		$triggers['wp_subscription_trial_end']                = new Triggers\Woocommerce\Subscription\SubscriptionTrialEnd();
		$triggers['wp_membership_created']                    = new Triggers\Woocommerce\Membership\MembershipCreated();
		$triggers['wp_membership_status_changed']             = new Triggers\Woocommerce\Membership\MembershipStatusChanged();
		$triggers['wp_wishlist_item_on_sale']                 = new Triggers\Woocommerce\Wishlist\WishlistItemOnSale();
		$triggers['wp_wishlist_reminder']                     = new Triggers\Woocommerce\Wishlist\WishlistReminder();
		$triggers['wp_user_adds_product_to_wishlist']         = new Triggers\Woocommerce\Wishlist\UserAddsProductToWishlist();
		$triggers['wc_abandoned_cart_created']                = new Triggers\Woocommerce\Cart\AbandonedCartCreated();
		$triggers['wc_cart_recovered']                        = new Triggers\Woocommerce\Cart\CartRecovered();
		$triggers['wc_order_created']                         = new Triggers\Woocommerce\Order\OrderCreated();
		$triggers['wc_order_created_per_product']             = new Triggers\Woocommerce\Order\OrderCreatedPerProduct();
		$triggers['wc_order_completed']                       = new Triggers\Woocommerce\Order\OrderCompleted();
		$triggers['wc_order_status_changed']                  = new Triggers\Woocommerce\Order\OrderStatusChanged();
		$triggers['wc_order_refunded']                        = new Triggers\Woocommerce\Order\OrderRefunded();
		$triggers['wc_order_status_pending']                  = new Triggers\Woocommerce\Order\OrderStatusPending();
		$triggers['wc_order_note_added']                      = new Triggers\Woocommerce\Order\OrderNoteAdded();
		$triggers['wc_order_item_stock_reduced']              = new Triggers\Woocommerce\Order\OrderItemStockReduced();
		$triggers['wc_review_received']                       = new Triggers\Woocommerce\Review\ReviewReceived();
		$triggers['learndash_course_completed']               = new Triggers\Learndash\CourseCompleted();
		$triggers['learndash_lesson_completed']               = new Triggers\Learndash\LessonCompleted();
		$triggers['learndash_topic_completed']                = new Triggers\Learndash\TopicCompleted();
		$triggers['learndash_user_added_to_group']            = new Triggers\Learndash\UserAddedToGroup();
		$triggers['learndash_user_enrolled_in_course']        = new Triggers\Learndash\UserEnrolledInCourse();
		$triggers['learndash_user_left_course']               = new Triggers\Learndash\UserLeftCourse();
		$triggers['edd_new_order_success']                    = new Triggers\Edd\NewOrderSuccess();
		$triggers['tutorlms_course_enrolled']                 = new Triggers\Tutorlms\CourseEnrolled();
		$triggers['tutorlms_course_completed']                = new Triggers\Tutorlms\CourseCompleted();
		$triggers['tutorlms_lesson_completed']                = new Triggers\Tutorlms\LessonCompleted();
		$triggers['lifterlms_course_enrolled']                = new Triggers\Lifterlms\CourseEnrolled();
		$triggers['lifterlms_course_completed']               = new Triggers\Lifterlms\CourseCompleted();
		$triggers['lifterlms_lesson_completed']               = new Triggers\Lifterlms\LessonCompleted();
		$triggers['lifterlms_membership_enrolled']            = new Triggers\Lifterlms\MembershipEnrolled();
		$triggers['learnpress_course_enrolled']               = new Triggers\Learnpress\CourseEnrolled();
		$triggers['learnpress_course_completed']              = new Triggers\Learnpress\CourseCompleted();
		$triggers['learnpress_lesson_completed']              = new Triggers\Learnpress\LessonCompleted();
		$triggers['memberpress_membership_enrolled']          = new Triggers\Memberpress\MembershipEnrolled();
		$triggers['memberpress_membership_level_expiry']      = new Triggers\Memberpress\MembershipLevelExpiry();
		$triggers['memberpress_subscription_created']         = new Triggers\Memberpress\SubscriptionCreated();
		$triggers['memberpress_subscription_paused']          = new Triggers\Memberpress\SubscriptionPaused();
		$triggers['memberpress_subscription_resumed']         = new Triggers\Memberpress\SubscriptionResumed();
		$triggers['memberpress_subscription_cancelled']       = new Triggers\Memberpress\SubscriptionCancelled();
		$triggers['memberpress_transaction_completed']        = new Triggers\Memberpress\TransactionCompleted();
		$triggers['memberpress_transaction_refunded']         = new Triggers\Memberpress\TransactionRefunded();
		$triggers['memberpress_transaction_failed']           = new Triggers\Memberpress\TransactionFailed();
		$triggers['pmpro_checkout_completed']                 = new Triggers\Pmpro\CheckoutCompleted();
		$triggers['pmpro_membership_level_changed']           = new Triggers\Pmpro\MembershipLevelChanged();
		$triggers['pmpro_membership_cancelled']               = new Triggers\Pmpro\MembershipCancelled();
		$triggers['pmpro_membership_expired']                 = new Triggers\Pmpro\MembershipExpired();
		$triggers['pmpro_membership_expiring_soon']           = new Triggers\Pmpro\MembershipExpiringSoon();
		$triggers['pmpro_order_added']                        = new Triggers\Pmpro\OrderAdded();
		$triggers['pmpro_order_updated']                      = new Triggers\Pmpro\OrderUpdated();

		if ( defined( 'SURECART_PLUGIN_FILE' ) ) {
			$triggers['surecart_order_success']  = new Triggers\Surecart\Order\OrderSuccess();
			$triggers['surecart_order_refunded'] = new Triggers\Surecart\Order\OrderRefunded();
		}

		if ( defined( 'PRESTO_PLAYER_PLUGIN_FILE' ) ) {
			$triggers['prestoplayer_video_completed'] = new Triggers\Prestoplayer\VideoCompleted();
			$triggers['prestoplayer_video_watched']   = new Triggers\Prestoplayer\VideoWatched();
		}

		return $triggers;
	}

	public function register_actions( $actions ) {
		$actions['learndash_add_user_to_course']      = new Actions\Learndash\AddUserToCourse();
		$actions['learndash_add_user_to_group']       = new Actions\Learndash\AddUserToGroup();
		$actions['learndash_remove_user_from_course'] = new Actions\Learndash\RemoveUserFromCourse();
		$actions['learndash_remove_user_from_group']  = new Actions\Learndash\RemoveUserFromGroup();
		$actions['add_order_note']                    = new Actions\Woocommerce\AddOrderNote();
		$actions['change_order_status']               = new Actions\Woocommerce\ChangeOrderStatus();
		$actions['create_coupon']                     = new Actions\Woocommerce\CreateCoupon();
		$actions['create_user']                       = new Actions\Wordpress\CreateUser();
		$actions['remove_user_role']                  = new Actions\Wordpress\RemoveUserRole();
		$actions['update_user_role']                  = new Actions\Wordpress\UpdateUserRole();
		$actions['update_user_meta']                  = new Actions\Wordpress\UpdateUserMeta();
		$actions['delay-until-datetime']              = new Actions\Delays\DelayUntilDatetime();
		$actions['http_request_webhook']              = new Actions\Webhooks\HttpRequestWebhook();
		$actions['zapier_webhook']                    = new Actions\Webhooks\ZapierWebhook();
		$actions['slack_send_to_channel']             = new Actions\Crm\Slack\SendToChannel();
		$actions['tutorlms_add_user_to_course']       = new Actions\Tutorlms\AddUserToCourse();
		$actions['tutorlms_remove_user_from_course']  = new Actions\Tutorlms\RemoveUserFromCourse();
		$actions['lifterlms_add_user_to_course']          = new Actions\Lifterlms\AddUserToCourse();
		$actions['lifterlms_remove_user_from_course']     = new Actions\Lifterlms\RemoveUserFromCourse();
		$actions['lifterlms_add_user_to_membership']      = new Actions\Lifterlms\AddUserToMembership();
		$actions['lifterlms_remove_user_from_membership'] = new Actions\Lifterlms\RemoveUserFromMembership();
		$actions['learnpress_add_user_to_course']         = new Actions\Learnpress\AddUserToCourse();
		$actions['learnpress_remove_user_from_course']    = new Actions\Learnpress\RemoveUserFromCourse();
		$actions['memberpress_add_user_to_membership']      = new Actions\Memberpress\AddUserToMembership();
		$actions['memberpress_remove_user_from_membership'] = new Actions\Memberpress\RemoveUserFromMembership();
		$actions['pmpro_add_user_to_membership_level']      = new Actions\Pmpro\AddUserToMembershipLevel();
		$actions['pmpro_remove_user_from_membership_level'] = new Actions\Pmpro\RemoveUserFromMembershipLevel();
		return $actions;
	}

	public function register_goals( $goals ) {
		$goals['used_dynamic_coupon']     = new Goals\UsedDynamicCoupon();
		$goals['wc_cart_recovered_goal']  = new Goals\Woocommerce\CartRecovered();
		$goals['surecart_order_received'] = new Goals\Surecart\OrderReceived();
		return $goals;
	}

	public function register_merge_tag_groups( $groups ) {
		$groups['messaging'] = array(
			'name'      => __( 'Messaging', 'doublescale' ),
			'mergeTags' => array(),
			'triggers'  => array(),
		);

		$acf_disabled = ! doublescale_is_plugin_active( 'advanced-custom-fields/acf.php' )
			&& ! doublescale_is_plugin_active( 'advanced-custom-fields-pro/acf.php' );

		$groups['acf_user'] = array(
			'name'        => __( 'ACF User Fields', 'doublescale' ),
			'mergeTags'   => array(),
			'is_disabled' => $acf_disabled,
		);

		return $groups;
	}
}
