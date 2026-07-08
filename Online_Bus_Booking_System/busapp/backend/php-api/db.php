<?php
// Amani Bus Booking System — PHP API (alternative stack for shared/cPanel hosting)
// Edit these to match your hosting provider's MySQL credentials.
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "";
$DB_NAME = "amani_bus_booking";

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
?>
