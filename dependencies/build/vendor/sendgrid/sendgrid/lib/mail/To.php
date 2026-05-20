<?php

/**
 * This helper builds the To object for a /mail/send API call
 */
namespace DoubleScale\Vendor\SendGrid\Mail;

/**
 * This class is used to construct a To object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
class To extends EmailAddress implements \JsonSerializable
{
}
/**
 * This class is used to construct a To object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Mail\\To', 'SendGrid\\Mail\\To', \false);
