const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
const port = 3000;

// 1. SETUP MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files from the root directory
app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. DATABASE CONNECTION
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
    // ⚠️ Ensure 'uk.html' is uploaded to GITHUB
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
            res.status(401).json({ success: false, message: "Incorrect password" });
        }
    });
});

// 6. UPDATE PROFILE ROUTE
app.post('/update-profile', (req, res) => {
    const { fullName, email, mobile, address, postcode } = req.body;
    const sql = "UPDATE users SET full_name = ?, email = ?, address = ?, postcode = ? WHERE phone = ?";
    
    db.query(sql, [fullName, email, address, postcode, mobile], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Profile Updated" });
    });
});

// 7. BOOK A TRIP ROUTE
app.post('/book-trip', (req, res) => {
    const { mobile, pickup, dropoff, truck, date, time } = req.body;
    const sql = "INSERT INTO bookings (user_mobile, pickup_loc, dropoff_loc, truck_type, booking_date, booking_time, status) VALUES (?, ?, ?, ?, ?, ?, 'Processing')";
    
    db.query(sql, [mobile, pickup, dropoff, truck, date, time], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// 8. GET BOOKINGS ROUTE
app.post('/my-bookings', (req, res) => {
    const { mobile } = req.body;
    const sql = "SELECT * FROM bookings WHERE user_mobile = ? ORDER BY id DESC";
    
    db.query(sql, [mobile], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, bookings: results });
    });
});

// 9. IMAGE UPLOAD SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// 10. UPLOAD AVATAR ROUTE
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    
    const mobile = req.body.mobile;
    const imagePath = `uploads/${req.file.filename}`;
    const sql = "UPDATE users SET profile_pic = ? WHERE phone = ?";
    
    db.query(sql, [imagePath, mobile], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, imagePath: imagePath });
    });
});

// START SERVER
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
