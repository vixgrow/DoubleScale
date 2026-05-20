<?php

/**
 * This helper builds the Cc object for a /mail/send API call
 */
namespace DoubleScale\Vendor\SendGrid\Mail;

/**
 * This class is used to construct a Cc object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
class Cc extends EmailAddress implements \JsonSerializable
{
}
/**
 * This class is used to construct a Cc object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Mail\\Cc', 'SendGrid\\Mail\\Cc', \false);
