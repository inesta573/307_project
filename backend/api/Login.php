
<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");


require __DIR__ . "/db.php";
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$email = $_POST["email"] ?? "";
$pin = $_POST["pin"] ?? "";

//check member credentials
$stmt = $conn->prepare(
    "SELECT name FROM members WHERE email = ? AND pin = ?"
);

$stmt->bind_param("ss", $email, $pin);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {

    $row = $result->fetch_assoc();
    $name = $row["name"];

    //generate a random ticket
    $ticket = bin2hex(random_bytes(32));

    //store ticket in database
    $insert = $conn->prepare(
        "INSERT INTO tickets (ticket, member_email) VALUES (?, ?)"
    );

    $insert->bind_param("ss", $ticket, $email);
    $insert->execute();
    $insert->close();

    echo json_encode([
        "success" => true,
        "ticket" => $ticket,
        "name" => $name
    ]);

} else {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid ID or PIN"
    ]);
}

$stmt->close();
$conn->close();

?>
