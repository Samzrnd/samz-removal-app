const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// 1. SETUP MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve your HTML/CSS files from the same folder
app.use(express.static(path.join(__dirname, 'public'))); 

// 2. DATABASE CONNECTION
// UPDATE THESE WITH YOUR REAL CPANEL DETAILS
const db = mysql.createPool({
    host: 'localhost',       
    user: 'samz_user',       // Your cPanel Database Username
    password: 'YourPassword',// Your cPanel Database Password
    database: 'samz_db',     // Your cPanel Database Name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.code);
    } else {
        console.log('Connected to Database!');
        connection.release();
    }
});

// 3. HOME PAGE ROUTE
// This makes sure your index.html loads when people visit the site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. SIGN UP ROUTE (Replaces signup.php)
app.post('/signup', async (req, res) => {
    const { full_name, email, phone, password, user_type } = req.body;

    try {
        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        const type = user_type || 'shipper'; // Default to shipper

        const sql = "INSERT INTO users (full_name, email, phone, password_hash, user_type) VALUES (?, ?, ?, ?, ?)";
        
        db.query(sql, [full_name, email, phone, hashedPassword, type], (err, result) => {
            if (err) {
                console.error(err);
                return res.send(`<script>alert('Error: ${err.message}'); window.history.back();</script>`);
            }
            res.send(`<script>alert('Account created successfully!'); window.location.href='/';</script>`);
        });

    } catch (error) {
        console.error(error);
        res.send("Server Error");
    }
});

// 5. START SERVER
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});