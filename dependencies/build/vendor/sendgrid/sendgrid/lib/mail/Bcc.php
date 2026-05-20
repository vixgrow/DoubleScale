<?php

/**
 * This helper builds the Bcc object for a /mail/send API call
 */
namespace DoubleScale\Vendor\SendGrid\Mail;

/**
 * This class is used to construct a Bcc object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
class Bcc extends EmailAddress implements \JsonSerializable
{
}
/**
 * This class is used to construct a Bcc object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Mail\\Bcc', 'SendGrid\\Mail\\Bcc', \false);
