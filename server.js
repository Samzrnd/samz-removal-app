const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // Needed for image uploads

const app = express();
app.use(cors());
const port = 3000;

// 1. SETUP MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files from the same directory (where uk.html is)
app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. DATABASE CONNECTION (Your Real cPanel Details)
const db = mysql.createPool({
    host: '49.12.134.146', 
    user: 'samzrndc_samz_user',      
    password: 'Samz2025', 
    database: 'samzrndc_samz_db',    
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
app.get('/', (req, res) => {
    // ⚠️ Loading YOUR Main File
    res.sendFile(path.join(__dirname, 'uk.html')); 
});

// 4. SIGN UP ROUTE
app.post('/signup', async (req, res) => {
    const { full_name, email, phone, password, user_type } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const type = user_type || 'shipper'; 
        const sql = "INSERT INTO users (full_name, email, phone, password_hash, user_type) VALUES (?, ?, ?, ?, ?)";
        
        db.query(sql, [full_name, email, phone, hashedPassword, type], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'Account created successfully!' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 5. LOGIN ROUTE
app.post('/login', (req, res) => {
    const { mobile, password } = req.body;
    const sql = "SELECT * FROM users WHERE phone = ?";

    db.query(sql, [mobile], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (results.length === 0) return res.status(401).json({ success: false, message: "User not found" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            res.json({ success: true, user: user });
        } else {
            res.status(401).
