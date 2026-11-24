<?php

$envFile = dirname(__DIR__, 2) . "/.env";

if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === "" || str_starts_with($line, "#")) {
            continue;
        }

        [$name, $value] = array_map("trim", explode("=", $line, 2));
        $value = trim($value, "\"'");
        putenv("$name=$value");
        $_ENV[$name] = $value;
    }
}

$conn = new mysqli(
    "127.0.0.1",
    "cs307-user",
    getenv("DB_PASSWORD") ?: "",
    "comp-307-db",
    3307
);
