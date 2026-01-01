<?php
// Prevents CORS errors when accessing from the frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$servername = "localhost";
$username = "samz_user";     // REPLACE with your cPanel Database Username
$password = "YourPassword";  // REPLACE with your cPanel Database Password
$dbname = "samz_db";         // REPLACE with your cPanel Database Name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection and return JSON error if it fails
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}
?>