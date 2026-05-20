<?php

/**
 * This helper builds the From object for a /mail/send API call
 */
namespace DoubleScale\Vendor\SendGrid\Mail;

/**
 * This class is used to construct a From object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
class From extends EmailAddress implements \JsonSerializable
{
}
/**
 * This class is used to construct a From object for the /mail/send API call
 *
 * @package SendGrid\Mail
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Mail\\From', 'SendGrid\\Mail\\From', \false);
