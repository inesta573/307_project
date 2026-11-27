<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");

require __DIR__ . "/db.php";

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$columns = [
    "program" => "varchar(255) NOT NULL DEFAULT ''",
    "study_year" => "varchar(32) NOT NULL DEFAULT ''",
    "faculty" => "varchar(128) NOT NULL DEFAULT ''",
    "pronouns" => "varchar(64) NOT NULL DEFAULT ''",
    "bio" => "varchar(2000) NOT NULL DEFAULT ''",
    "interests" => "varchar(1000) NOT NULL DEFAULT ''",
    "avatar" => "mediumtext NULL",
];

foreach ($columns as $name => $definition) {
    if (!$conn->query("ALTER TABLE members ADD COLUMN IF NOT EXISTS `$name` $definition")) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Could not prepare the profile fields"]);
        $conn->close();
        exit;
    }
}

$ticket = $_POST["ticket"] ?? "";

if ($ticket === "") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    $conn->close();
    exit;
}

$years = ["", "U0", "U1", "U2", "U3", "U4", "Masters", "PhD"];
$faculties = [
    "",
    "Arts",
    "Science",
    "Engineering",
    "Management",
    "Law",
    "Medicine and Health Sciences",
    "Education",
    "Agricultural and Environmental Sciences",
    "Music",
    "Dental Medicine",
];

function profile_row(array $row): array
{
    $interests = json_decode($row["interests"] ?? "[]", true);
    if (!is_array($interests)) {
        $interests = [];
    }

    return [
        "email" => $row["email"],
        "name" => $row["name"],
        "program" => $row["program"],
        "studyYear" => $row["study_year"],
        "faculty" => $row["faculty"],
        "pronouns" => $row["pronouns"],
        "bio" => $row["bio"],
        "interests" => array_values($interests),
        "avatar" => $row["avatar"] ?? "",
    ];
}

$select = $conn->prepare(
    "SELECT m.email, m.name, m.program, m.study_year, m.faculty, m.pronouns, m.bio, m.interests, m.avatar
     FROM tickets t
     JOIN members m ON m.email = t.member_email
     WHERE t.ticket = ?"
);
$select->bind_param("s", $ticket);
$select->execute();
$existing = $select->get_result()->fetch_assoc();
$select->close();

if (!$existing) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    $conn->close();
    exit;
}

$action = $_POST["action"] ?? "get";

if ($action !== "save") {
    echo json_encode(["success" => true, "profile" => profile_row($existing)]);
    $conn->close();
    exit;
}

$program = trim($_POST["program"] ?? "");
$studyYear = trim($_POST["studyYear"] ?? "");
$faculty = trim($_POST["faculty"] ?? "");
$pronouns = trim($_POST["pronouns"] ?? "");
$bio = trim($_POST["bio"] ?? "");
$avatar = $_POST["avatar"] ?? "";
$decoded = json_decode($_POST["interests"] ?? "[]", true);

if (!in_array($studyYear, $years, true) || !in_array($faculty, $faculties, true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Choose a year and faculty from the list"]);
    $conn->close();
    exit;
}

if ($avatar !== "" && !preg_match('#^data:image/jpeg;base64,[A-Za-z0-9+/=]+$#', $avatar)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "The profile picture must be an image"]);
    $conn->close();
    exit;
}

if (strlen($avatar) > 300000) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "That picture is too large"]);
    $conn->close();
    exit;
}

if (strlen($program) > 80 || strlen($pronouns) > 40 || strlen($bio) > 500) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "One of the fields is too long"]);
    $conn->close();
    exit;
}

$interests = [];
if (is_array($decoded)) {
    foreach ($decoded as $item) {
        $item = trim((string) $item);
        if ($item !== "" && strlen($item) <= 40 && count($interests) < 12) {
            $interests[] = $item;
        }
    }
}
$interestsJson = json_encode($interests);

$update = $conn->prepare(
    "UPDATE members m
     JOIN tickets t ON t.member_email = m.email
     SET m.program = ?, m.study_year = ?, m.faculty = ?, m.pronouns = ?, m.bio = ?, m.interests = ?, m.avatar = ?
     WHERE t.ticket = ?"
);
$update->bind_param("ssssssss", $program, $studyYear, $faculty, $pronouns, $bio, $interestsJson, $avatar, $ticket);

if (!$update->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Could not save your profile"]);
    $update->close();
    $conn->close();
    exit;
}

$update->close();
$conn->close();

echo json_encode([
    "success" => true,
    "profile" => [
        "email" => $existing["email"],
        "name" => $existing["name"],
        "program" => $program,
        "studyYear" => $studyYear,
        "faculty" => $faculty,
        "pronouns" => $pronouns,
        "bio" => $bio,
        "interests" => $interests,
        "avatar" => $avatar,
    ],
]);
