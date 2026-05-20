<?php

namespace DoubleScale\Vendor;

use DoubleScale\Vendor\SendGrid\EventWebhook\EventWebhook;
use DoubleScale\Vendor\SendGrid\EventWebhook\EventWebhookHeader;
function isValidSignature($request)
{
    $publicKey = 'base64-encoded public key';
    $eventWebhook = new EventWebhook();
    $ecPublicKey = $eventWebhook->convertPublicKeyToECDSA($publicKey);
    return $eventWebhook->verifySignature($ecPublicKey, $request->getContent(), $request->header(EventWebhookHeader::SIGNATURE), $request->header(EventWebhookHeader::TIMESTAMP));
}
