<?php
// api/discord-login.php
require_once 'db.php';

$authorizeUrl = 'https://discord.com/api/oauth2/authorize?' . http_build_query([
    'client_id' => DISCORD_CLIENT_ID,
    'redirect_uri' => DISCORD_REDIRECT_URI,
    'response_type' => 'code',
    'scope' => 'identify email'
]);

header('Location: ' . $authorizeUrl);
exit();
