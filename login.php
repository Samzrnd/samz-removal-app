<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $email = $_POST['email'];
    $password = $_POST['password'];

    // 1. Check if email exists in database
    $sql = "SELECT user_id, full_name, password_hash, user_type FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $name, $hash, $type);
        $stmt->fetch();

        // 2. Verify the password
        if (password_verify($password, $hash)) {
            // Success! Start the session
            $_SESSION['user_id'] = $id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_type'] = $type;

            echo "<script>
                    alert('Login Successful! Welcome " . $name . "');
                    window.location.href = 'index.html'; 
                  </script>";
        } else {
            echo "<script>alert('Incorrect Password'); window.history.back();</script>";
        }
    } else {
        echo "<script>alert('Email not found'); window.history.back();</script>";
    }
    $stmt->close();
    $conn->close();
}
?>