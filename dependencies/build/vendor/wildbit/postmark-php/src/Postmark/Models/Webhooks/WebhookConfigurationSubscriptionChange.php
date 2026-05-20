<?php

namespace DoubleScale\Vendor\Postmark\Models\Webhooks;

/**
 * Settings for SubscriptionChange webhooks.
 */
class WebhookConfigurationSubscriptionChange implements \JsonSerializable
{
    private $enabled;
    /**
     * Create a new WebhookConfigurationSubscriptionChangeTrigger.
     *
     * @param boolean $enabled Specifies whether or not webhooks will be triggered by SubscriptionChange events.
     */
    public function __construct($enabled = \false)
    {
        $this->enabled = $enabled;
    }
    public function jsonSerialize()
    {
        $retval = array("Enabled" => $this->enabled);
        return $retval;
    }
    public function getEnabled()
    {
        return $this->enabled;
    }
}
/**
 * Settings for SubscriptionChange webhooks.
 */
\class_alias('DoubleScale\\Vendor\\Postmark\\Models\\Webhooks\\WebhookConfigurationSubscriptionChange', 'Postmark\\Models\\Webhooks\\WebhookConfigurationSubscriptionChange', \false);
