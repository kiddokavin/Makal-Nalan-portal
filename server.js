const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { updateExcelDatabase } = require('./utils/excelGenerator');
const { generateWordDocument } = require('./utils/docxGenerator');
const { sendSMSNotification } = require('./utils/notificationHelper');
const { sendOTPEmail } = require('./utils/emailHelper');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TVKitwing2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '26tvkitwing@gmail.com';
const otpCache = {}; // InMemory Cache for OTPs (Key: email, Value: { otp, expires })

// CORS Configuration
const allowedOrigins = process.env.ADMIN_PORTAL_URL ? process.env.ADMIN_PORTAL_URL.split(',') : ['http://localhost:3001', 'http://127.0.0.1:3001'];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // Allow any local server for testing
            if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
                return callback(null, true);
            }
            return callback(new Error('CORS Policy: Origin not allowed.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Paths
const dataDir = path.join(__dirname, 'data');
const docxDir = path.join(dataDir, 'docx');
const dbPath = path.join(dataDir, 'complaints.json');
const excelPath = path.join(dataDir, 'complaints.xlsx');

// Ensure database directories exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(docxDir)) {
    fs.mkdirSync(docxDir, { recursive: true });
}
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

// Database Helpers
function readDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading JSON database:", error);
        return [];
    }
}

function writeDatabase(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing JSON database:", error);
    }
}

// Auth Middlewares
function apiAuthMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

function downloadAuthMiddleware(req, res, next) {
    const token = req.query.token;
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).send('Unauthorized access to download resources.');
    }
}

// Generates a unique TVK grievance ID: TVK-26-XXXX where XXXX is a random 4-digit number
function generateGrievanceId(existingComplaints) {
    const min = 1000;
    const max = 9999;
    
    // Safety check to avoid infinite loops
    let attempts = 0;
    while (attempts < 1000) {
        const rand = Math.floor(Math.random() * (max - min + 1)) + min;
        const potentialId = `TVK-26-${rand}`;
        const alreadyExists = existingComplaints.some(c => c.id === potentialId);
        
        if (!alreadyExists) {
            return potentialId;
        }
        attempts++;
    }
    // Fallback if somehow namespace is full
    return `TVK-26-${Date.now().toString().slice(-4)}`;
}

// Format date nicely
function formatDate() {
    const date = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ==================== API ENDPOINTS ====================

// 1. Submit a complaint
app.post('/api/complaints', async (req, res) => {
    try {
        const { name, contact, email, address, district, department, subject, complaintText } = req.body;
        
        if (!name || !contact || !address || !district || !department || !subject || !complaintText) {
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        const complaints = readDatabase();
        const trackingId = generateGrievanceId(complaints);
        const dateStr = formatDate();

        const newComplaint = {
            id: trackingId,
            date: dateStr,
            name,
            contact,
            email: email || '',
            address,
            district,
            department,
            subject,
            complaintText,
            status: 'Pending'
        };

        // 1. Save to JSON database
        complaints.push(newComplaint);
        writeDatabase(complaints);

        // 2. Generate Word Document (.docx)
        const docxFileName = `complaint_${trackingId}.docx`;
        const docxFilePath = path.join(docxDir, docxFileName);
        await generateWordDocument(newComplaint, docxFilePath);

        // 3. Update Excel Spreadsheet
        updateExcelDatabase(complaints, excelPath);

        res.status(201).json({
            success: true,
            trackingId: trackingId,
            message: 'Grievance submitted successfully.'
        });

    } catch (error) {
        console.error("Error creating complaint:", error);
        res.status(500).json({ error: 'Server error processing grievance registration.' });
    }
});

// 2. Admin Login (Password Login)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        res.json({ success: true, token: ADMIN_PASSWORD });
    } else {
        res.status(400).json({ success: false, error: 'Incorrect Username or Password. Please try again.' });
    }
});

// 2b. Request Admin Login OTP
app.post('/api/admin/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (email !== ADMIN_EMAIL) {
            return res.status(400).json({ error: 'Access denied: Unauthorized email address.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        otpCache[email] = { otp, expires };

        try {
            await sendOTPEmail(email, otp);
            res.json({ success: true, message: 'OTP has been sent to your email.' });
        } catch (emailError) {
            // Fallback console log for local testing if SMTP credentials are not set
            console.log("\n============================================================");
            console.log("[ADMIN OTP BYPASS LOG - NO ACTIVE SMTP CONFIGURATION]");
            console.log(`To Admin Email: ${email}`);
            console.log(`Generated OTP: ${otp}`);
            console.log("============================================================\n");

            res.json({ 
                success: true, 
                bypass: true, 
                message: 'SMTP credentials missing. OTP has been printed to the server console log for local testing.' 
            });
        }
    } catch (error) {
        console.error("OTP Request Error:", error);
        res.status(500).json({ error: 'Server error requesting access OTP.' });
    }
});

// 2c. Verify OTP and Login
app.post('/api/admin/login-otp', (req, res) => {
    const { email, otp } = req.body;

    if (email !== ADMIN_EMAIL) {
        return res.status(400).json({ error: 'Access denied: Unauthorized email address.' });
    }

    const cached = otpCache[email];

    if (!cached) {
        return res.status(400).json({ error: 'No OTP requested for this email.' });
    }

    if (Date.now() > cached.expires) {
        delete otpCache[email];
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (cached.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP passcode. Please try again.' });
    }

    // OTP Verified successfully - clean cache and return session token
    delete otpCache[email];
    res.json({ success: true, token: ADMIN_PASSWORD });
});

// 3. Fetch complaints list (Admin only)
app.get('/api/admin/complaints', apiAuthMiddleware, (req, res) => {
    const complaints = readDatabase();
    res.json({ success: true, complaints });
});

// 4. Update complaint status (Admin only)
app.post('/api/admin/complaints/:id/status', apiAuthMiddleware, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
    }

    const complaints = readDatabase();
    const index = complaints.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Grievance not found.' });
    }

    complaints[index].status = status;
    writeDatabase(complaints);

    // Sync state to Excel database
    updateExcelDatabase(complaints, excelPath);

    // Send SMS notification to complainant in background
    sendSMSNotification(complaints[index], status).catch(err => {
        console.error("Failed to send SMS notification:", err);
    });

    res.json({ success: true, message: `Status updated to ${status}.` });
});

// 5. Download Excel database (Admin only - verified via query param)
app.get('/api/admin/download/excel', downloadAuthMiddleware, (req, res) => {
    if (fs.existsSync(excelPath)) {
        res.download(excelPath, 'Makkal_Nalan_Complaints_Database.xlsx');
    } else {
        // If file doesn't exist, regenerate it from JSON database
        const complaints = readDatabase();
        updateExcelDatabase(complaints, excelPath);
        if (fs.existsSync(excelPath)) {
            res.download(excelPath, 'Makkal_Nalan_Complaints_Database.xlsx');
        } else {
            res.status(404).send('Excel database is empty or not yet generated.');
        }
    }
});

// 6. Download Word document (Admin only - verified via query param)
app.get('/api/admin/download/docx/:id', downloadAuthMiddleware, (req, res) => {
    const { id } = req.params;
    const docxFilePath = path.join(docxDir, `complaint_${id}.docx`);

    if (fs.existsSync(docxFilePath)) {
        res.download(docxFilePath, `Makkal_Nalan_Complaint_${id}.docx`);
    } else {
        // Fallback: If docx was deleted but exists in JSON, regenerate it on the fly
        const complaints = readDatabase();
        const complaint = complaints.find(c => c.id === id);
        
        if (complaint) {
            generateWordDocument(complaint, docxFilePath)
                .then(() => {
                    res.download(docxFilePath, `Makkal_Nalan_Complaint_${id}.docx`);
                })
                .catch(err => {
                    console.error("Error generating docx on demand:", err);
                    res.status(500).send('Failed to generate document.');
                });
        } else {
            res.status(404).send('Complaint Word document not found.');
        }
    }
});

// Serves the User Portal landing page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`TVK Grievance Redressal Server is running on port ${PORT}`);
});
