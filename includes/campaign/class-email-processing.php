<?php
/**
 * Email Campaign Processing
 * This class is responsible for handling Email campaign processing
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Campaign_Message_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Campaign_Processing;
use QuillCRM\Emails\Emails;
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Link_Trigger_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Email Campaign Processing class
 */
class Email_Processing extends Abstract_Campaign_Processing
{
    /**
     * Campaign type
     *
     * @var string
     */
    protected $campaign_type = 'email';

    /**
     * Add hooks
     *
     * @return void
     */
    public function add_hooks()
    {
        add_action(
            'init',
            function () {
                QuillCRM::instance()->daily_tasks->register_callback('quillcrm_daily3', array($this, 'reset_daily_count'));
                QuillCRM::instance()->campaigns_tasks->register_callback('quillcrm_email_campaigns', array($this, 'process_campaigns'));
                QuillCRM::instance()->campaigns_tasks->register_callback('process_campaign_email', array($this, 'process_campaign_message'));
            }
        );
    }

    /**
     * Get campaign message mode
     *
     * @return int
     */
    protected function get_campaign_mode()
    {
        return Campaign_Message_Model::MODE_EMAIL;
    }

    /**
     * Get recipient field from contact
     *
     * @param Contact_Model $contact
     * @return string|null
     */
    protected function get_recipient(Contact_Model $contact)
    {
        return $contact->email;
    }

    /**
     * Send message
     *
     * @param array $message_data Prepared message data
     * @param Contact_Model $contact Contact model
     * @param Campaign_Message_Model $campaign_message Campaign message record
     * @return array Result array with 'success' boolean and optional data
     */
    protected function send_message($message_data, Contact_Model $contact, Campaign_Message_Model $campaign_message)
    {
        try {
            // Validate recipient email
            if (!filter_var($contact->email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception("Invalid email address: {$contact->email}");
            }

            // Build complete email message with footer
            $complete_message = sprintf(
                '%s%s',
                $this->build_email_message($campaign_message, $contact, $message_data['body']),
                $this->build_email_footer($campaign_message, $contact)
            );

            // Add click tracking to all links (specific to email)
            $complete_message = $this->add_email_click_tracking($complete_message, $campaign_message->hash_key, $contact);

            $emails = new Emails();
            $result = $emails->send(
                $contact->email,
                $message_data['subject'],
                $complete_message
            );

            // Proper result validation - prevent false positives
            if (is_wp_error($result)) {
                throw new \Exception('WP Mail Error: ' . $result->get_error_message());
            } elseif ($result === false || $result === null) {
                throw new \Exception('Email sending failed - wp_mail returned false');
            }

            return array('success' => true, 'message_id' => $result);
            
        } catch (\Exception $e) {
            quillcrm_get_logger()->error(
                __('Email send error.', 'quillcrm'),
                array(
                    'code' => 'email_send_error',
                    'error' => $e->getMessage(),
                    'contact_id' => $contact->id,
                    'campaign_message_id' => $campaign_message->id,
                    'recipient' => $contact->email,
                )
            );
            return array('success' => false, 'error' => $e->getMessage());
        }
    }

    /**
     * Get tracking class
     *
     * @return string
     */
    protected function get_tracking_class()
    {
        return \QuillCRM\Tracking\Email::class;
    }

    /**
     * Handle resending logic - overrides abstract method
     *
     * @return bool True if resending was handled
     */
    protected function handle_resending()
    {
        $resending_campaign = Campaign_Model::where('status', 'resending')->orderBy('updated_at', 'asc')->first();
        if ($resending_campaign) {
            $this->resent_failed($resending_campaign);
            return true;
        }
        return false;
    }

    /**
     * Resent failed emails
     *
     * @param Campaign_Model $campaign
     * @return void
     */
    protected function resent_failed($campaign)
    {
        try {
            $last_email_offset = get_option("quillcrm_campaigns_last_resent_email_offset_{$campaign->id}", 0);
            $count = $campaign->emails()->where('status', 'failed')->count();

            if ($last_email_offset >= $count) {
                $campaign->status = 'completed';
                $campaign->save();
                update_option("quillcrm_campaigns_last_resent_email_offset_{$campaign->id}", 0);
                quillcrm_get_logger()->info(
                    __('Resent failed emails completed.', 'quillcrm'),
                    array(
                        'code' => 'resent_failed',
                        'campaign' => $campaign->id,
                    )
                );
                return;
            }

            while ($this->get_current_execution_time() < $this->max_execution_time && !Utils::is_memory_limit_reached()) {
                usleep(1000000);

                if ($last_email_offset >= $count) {
                    $campaign->status = 'completed';
                    $campaign->save();
                    update_option("quillcrm_campaigns_last_resent_email_offset_{$campaign->id}", 0);
                    break;
                }

                $max_per_second = $this->settings['max_in_second'] ?? 15;
                $emails = $campaign->emails()->where('status', 'failed')
                    ->offset($last_email_offset)
                    ->limit($max_per_second)
                    ->get();

                if (!$emails) {
                    break;
                }

                foreach ($emails as $email) {
                    $email->status = 'scheduled';
                    $email->save();
                    QuillCRM::instance()->campaigns_tasks->enqueue_sync('process_campaign_email', $campaign, $email->contact, $email);
                    $last_email_offset++;
                    update_option("quillcrm_campaigns_last_resent_email_offset_{$campaign->id}", $last_email_offset);
                }
            }
        } catch (\Exception $e) {
            quillcrm_get_logger()->error(
                __('Resent failed emails error.', 'quillcrm'),
                array(
                    'code' => 'resent_failed',
                    'error' => array(
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'data' => $e->getTrace(),
                    ),
                )
            );
        }
    }

    /**
     * Build email message
     *
     * @param Campaign_Message_Model $campaign_email
     * @param Contact_Model $contact
     * @param string $message
     * @return string
     */
    protected function build_email_message(Campaign_Message_Model $campaign_email, Contact_Model $contact, $message = '')
    {
        // Add open email image 1x1
        $message .= sprintf(
            '<img src="%s" width="1" height="1" style="width:1px;height:1px;" />',
            home_url('?quillcrm=email_open&hash_key=' . $campaign_email->hash_key)
        );

        return $message;
    }

    /**
     * Build email footer
     *
     * @param Campaign_Message_Model $campaign_email
     * @param Contact_Model $contact
     * @return string
     */
    protected function build_email_footer(Campaign_Message_Model $campaign_email, Contact_Model $contact)
    {
        $footer = '';

        // Add preview image 1x1
        $footer .= sprintf(
            '<img src="%s" width="1" height="1" style="width:1px;height:1px;" />',
            home_url('?quillcrm=email_preview&hash_key=' . $campaign_email->hash_key)
        );

        $email_footer = $this->settings['email_footer'] ?? $this->default_email_footer();

        // Add unsubscribe link
        $footer .= $email_footer;

        return $footer;
    }

    /**
     * Default email footer
     *
     * @return string
     */
    protected function default_email_footer()
    {
        return "<p>Don't want to stay in the loop? We'll be sad to see you go, but you can click here to <a href='{{contact:unsubscribe_link}}'>unsubscribe</a>.</p>";
    }

    /**
     * Get default email content
     *
     * @return string
     */
    protected function get_default_email_content()
    {
        $default_content = sprintf(
            __('<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>', 'quillcrm')
        );
        
        return apply_filters('quillcrm_default_email_content', $default_content);
    }

    /**
     * Add click tracking to all links (Email-specific)
     *
     * @param string $message Email message
     * @param string $hash_key Campaign email hash key
     * @param Contact_Model $contact Contact model
     * @return string
     */
    protected function add_email_click_tracking($message, $hash_key, Contact_Model $contact)
    {
        // Match all links
        preg_match_all('/<a[^>]+href=([\'"])(?<href>.+?)\1[^>]*>/i', $message, $matches);

        if (!isset($matches['href'])) {
            return $message;
        }

        foreach ($matches['href'] as $key => $href) {
            // Check if link trigger quillcrm-link-trigger.
            if (false !== strpos($href, 'quillcrm-link-trigger')) {
                // Get query string
                $query_string = parse_url($href, PHP_URL_QUERY);
                parse_str($query_string, $query_args);

                // Get link trigger hash
                $hash = $query_args['quillcrm-link-trigger'] ?? '';
                $link_trigger = Link_Trigger_Model::where('hash', $hash)->first();
                if (!$link_trigger) {
                    continue;
                }

                $link_trigger_url = $this->configure_link_trigger_url($link_trigger, $contact, $hash_key);

                // Replace original link with click tracking link
                $to_replace = $matches[0][$key];
                $message = str_replace($to_replace, str_replace($href, $link_trigger_url, $to_replace), $message);
                continue;
            }

            // Add click original link to click tracking
            $click_url = add_query_arg(
                array(
                    'quillcrm' => 'email_click',
                    'hash_key' => $hash_key,
                    'original' => urlencode($href),
                ),
                home_url()
            );

            // Replace original link with click tracking link
            $to_replace = $matches[0][$key];
            $message = str_replace($to_replace, str_replace($href, $click_url, $to_replace), $message);
        }

        return $message;
    }

    /**
     * Configure link trigger url
     *
     * @param Link_Trigger_Model $link_trigger
     * @param Contact_Model $contact
     * @param string $hash_key
     * @return string
     */
    protected function configure_link_trigger_url(Link_Trigger_Model $link_trigger, Contact_Model $contact, $hash_key)
    {
        $auto_login = $link_trigger->get_setting('auto_login', true);
        $contact_email = $contact->email;
        $user = get_user_by('email', $contact_email);
        $args = array(
            'quillcrm-link-trigger' => $link_trigger->hash,
            'track-id' => $hash_key,
        );

        if ($auto_login && $user) {
            $args['auth-id'] = wp_hash_password($contact_email);
        }

        $link_trigger_url = add_query_arg($args, home_url());

        return $link_trigger_url;
    }
}
