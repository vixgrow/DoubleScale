<?php

/**
 * This helper builds the ReplyTo object for a /mail/send API call
 */
namespace DoubleScale\Vendor\SendGrid\Mail;

/**
 * This class is used to construct a ReplyTo object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
class ReplyTo extends EmailAddress implements \JsonSerializable
{
}
/**
 * This class is used to construct a ReplyTo object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Mail\\ReplyTo', 'SendGrid\\Mail\\ReplyTo', \false);
