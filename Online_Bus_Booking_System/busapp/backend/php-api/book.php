<?php
require "db.php";
require "sms.php";
$data = json_decode(file_get_contents("php://input"), true);

$user_id = intval($data["user_id"] ?? 0);
$trip_id = intval($data["trip_id"] ?? 0);
$seat_id = intval($data["seat_id"] ?? 0);
$phone = $conn->real_escape_string($data["phone"] ?? "");
$payment_method = $conn->real_escape_string($data["payment_method"] ?? "mpesa");

$conn->begin_transaction();
try {
    $seatCheck = $conn->query("SELECT status FROM seats WHERE seat_id=$seat_id FOR UPDATE");
    $seat = $seatCheck->fetch_assoc();
    if (!$seat || $seat["status"] === "booked") {
        throw new Exception("Seat already booked");
    }

    $tripRes = $conn->query(
        "SELECT t.base_fare, r.from_location, r.to_location FROM trips t
         JOIN routes r ON t.route_id=r.route_id WHERE t.trip_id=$trip_id"
    );
    $trip = $tripRes->fetch_assoc();
    if (!$trip) throw new Exception("Trip not found");

    $ticketCode = "ABK-" . strtoupper(substr(md5(uniqid()), 0, 6));

    $stmt = $conn->prepare(
        "INSERT INTO bookings (user_id, trip_id, seat_id, total_fare, payment_status, ticket_code) VALUES (?,?,?,?, 'paid', ?)"
    );
    $stmt->bind_param("iiids", $user_id, $trip_id, $seat_id, $trip["base_fare"], $ticketCode);
    $stmt->execute();
    $bookingId = $stmt->insert_id;

    $conn->query("UPDATE seats SET status='booked' WHERE seat_id=$seat_id");
    $conn->query("UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id=$trip_id");

    $txnRef = "TXN-" . time();
    $conn->query(
        "INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_ref)
         VALUES ($bookingId, {$trip['base_fare']}, '$payment_method', 'success', '$txnRef')"
    );

    $message = "Amani Bus: Ticket $ticketCode confirmed. {$trip['from_location']} -> {$trip['to_location']}. Paid TZS {$trip['base_fare']}. Safe journey!";
    $smsResult = sendSMS($phone, $message);

    $conn->commit();
    echo json_encode(["message" => "Booking confirmed", "ticket_code" => $ticketCode, "sms" => $smsResult]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
