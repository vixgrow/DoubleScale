<?php

namespace DoubleScale\Vendor\Postmark\Models;

/**
 * The exception thrown when the Postmark Client recieves an error from the API.
 */
class PostmarkException extends \Exception
{
    var $message;
    var $httpStatusCode;
    var $postmarkApiErrorCode;
}
/**
 * The exception thrown when the Postmark Client recieves an error from the API.
 */
\class_alias('DoubleScale\\Vendor\\Postmark\\Models\\PostmarkException', 'Postmark\\Models\\PostmarkException', \false);
