<?php

namespace DoubleScale\Vendor\SendGrid\Exception;

/**
 * Class InvalidHttpRequest
 *
 * Thrown when invalid payload was constructed, which could not reach SendGrid server.
 */
class InvalidRequest extends \Exception
{
    public function __construct($message = '', $code = 0, ?\Exception $previous = null)
    {
        $message = 'Could not send request to server. ' . 'CURL error ' . $code . ': ' . $message;
        parent::__construct($message, $code, $previous);
    }
}
/**
 * Class InvalidHttpRequest
 *
 * Thrown when invalid payload was constructed, which could not reach SendGrid server.
 */
\class_alias('DoubleScale\\Vendor\\SendGrid\\Exception\\InvalidRequest', 'SendGrid\\Exception\\InvalidRequest', \false);
