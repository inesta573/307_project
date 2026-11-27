<?php

header("Content-Type: application/json");

require_once __DIR__ . "/db.php";

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

$sql = "SELECT *
        FROM events
        WHERE start_time >= NOW()
        ORDER BY start_time ASC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not retrieve events"
    ]);
    exit;
}

// database results into an array
$events = [];

while ($row = $result->fetch_assoc()) {
    $events[] = $row;
}

// Return events as JSON
echo json_encode([
    "success" => true,
    "events" => $events
]);

$conn->close();

?>
