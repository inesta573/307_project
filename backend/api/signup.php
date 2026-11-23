<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "db");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$name = trim($_POST["name"] ?? "");
$email = strtolower(trim($_POST["email"] ?? ""));
$pin = $_POST["pin"] ?? "";

if ($name === "" || $email === "" || $pin === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Name, email, and password are required"]);
    $conn->close();
    exit;
}

if (!preg_match('/^[^\s@]+@mail\.mcgill\.ca$/', $email)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email must be a mail.mcgill.ca address"]);
    $conn->close();
    exit;
}

$check = $conn->prepare("SELECT email FROM members WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$existing = $check->get_result();

if ($existing->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "An account with this email already exists"]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

$insert = $conn->prepare("INSERT INTO members (email, pin, name) VALUES (?, ?, ?)");
$insert->bind_param("sss", $email, $pin, $name);

if (!$insert->execute()) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "An account with this email already exists"]);
    $insert->close();
    $conn->close();
    exit;
}

$insert->close();
$conn->close();

echo json_encode(["success" => true]);
