<?php
require "db.php";
$data = json_decode(file_get_contents("php://input"), true);

$email = $conn->real_escape_string($data["email"] ?? "");
$password = $data["password"] ?? "";

$stmt = $conn->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
    exit;
}

$user = $result->fetch_assoc();
if (!password_verify($password, $user["password_hash"])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
    exit;
}

// Simple session token (for production, prefer JWT as in the Node.js version)
echo json_encode([
    "message" => "Login successful",
    "user" => ["id" => $user["user_id"], "name" => $user["full_name"], "role" => $user["role"]]
]);
?>
