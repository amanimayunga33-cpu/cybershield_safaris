<?php
// Sends SMS via Africa's Talking HTTP API. Get free sandbox credentials at
// https://africastalking.com. If credentials are not set, the SMS is only logged
// (safe default so the booking flow still works during local testing).

function sendSMS($phone, $message) {
    $username = getenv("AT_USERNAME") ?: "sandbox";
    $apiKey = getenv("AT_API_KEY") ?: "";

    if (!$apiKey) {
        error_log("[SMS SIMULATED] To: $phone | Message: $message");
        return ["success" => true, "simulated" => true];
    }

    $url = $username === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        "username" => $username,
        "to" => $phone,
        "message" => $message
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apiKey: $apiKey",
        "Content-Type: application/x-www-form-urlencoded",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    return ["success" => true, "result" => json_decode($response, true)];
}
?>
