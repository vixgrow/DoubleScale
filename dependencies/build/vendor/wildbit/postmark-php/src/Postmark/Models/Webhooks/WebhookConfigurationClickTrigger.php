<?php

namespace DoubleScale\Vendor\Postmark\Models\Webhooks;

/**
 * Settings for Click webhooks.
 */
class WebhookConfigurationClickTrigger implements \JsonSerializable
{
    private $enabled;
    /**
     * Create a new WebhookConfigurationClickTrigger.
     *
     * @param boolean $enabled Specifies whether or not webhooks will be triggered by Click events.
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
 * Settings for Click webhooks.
 */
\class_alias('DoubleScale\\Vendor\\Postmark\\Models\\Webhooks\\WebhookConfigurationClickTrigger', 'Postmark\\Models\\Webhooks\\WebhookConfigurationClickTrigger', \false);
