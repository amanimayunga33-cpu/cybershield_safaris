<?php
require "db.php";
$data = json_decode(file_get_contents("php://input"), true);

$full_name = $conn->real_escape_string($data["full_name"] ?? "");
$email = $conn->real_escape_string($data["email"] ?? "");
$phone = $conn->real_escape_string($data["phone"] ?? "");
$password = $data["password"] ?? "";

if (!$full_name || !$email || !$phone || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "All fields are required"]);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (full_name, email, phone, password_hash) VALUES (?,?,?,?)");
$stmt->bind_param("ssss", $full_name, $email, $phone, $hash);

if ($stmt->execute()) {
    echo json_encode(["message" => "Registered successfully", "user_id" => $stmt->insert_id]);
} else {
    http_response_code(409);
    echo json_encode(["error" => "Email may already be registered", "detail" => $stmt->error]);
}
?>
