<?php

namespace DoubleScale\Vendor\Postmark\Models\Webhooks;

/**
 * Model describing Basic HTTP Authentication.
 */
class HttpAuth implements \JsonSerializable
{
    private $username;
    private $password;
    /**
     * Create a new HttpAuth.
     *
     * @param string $username Username to use.
     * @param string $password Password to use.
     */
    public function __construct($username = null, $password = null)
    {
        $this->username = $username;
        $this->password = $password;
    }
    public function jsonSerialize()
    {
        $retval = array("Username" => $this->username, "Password" => $this->password);
        return $retval;
    }
    public function getUsername()
    {
        return $this->username;
    }
    public function getPassword()
    {
        return $this->password;
    }
}
/**
 * Model describing Basic HTTP Authentication.
 */
\class_alias('DoubleScale\\Vendor\\Postmark\\Models\\Webhooks\\HttpAuth', 'Postmark\\Models\\Webhooks\\HttpAuth', \false);
