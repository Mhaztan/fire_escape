const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const db = require("./firebase.js")

// Load environment variables
dotenv.config();

// const db = admin.database();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Parse JSON request bodies

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";


// Route: Get Emergency Contacts
app.get('/api/contacts', async (req, res) => {
    const contactsRef = db.ref("emergency_contacts");
    try {
        const snapshot = await contactsRef.once("value");
        const contacts = snapshot.val();
        res.json(contacts ? Object.values(contacts) : []);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route: Submit Emergency Contact
app.post('/api/submit-contact', async (req, res) => {
    const { name, number, location, type } = req.body;
    const newContactRef = db.ref("emergency_contacts").push();

    try {
        await newContactRef.set({ name, number, location, type, verified: false });
        res.json({ message: "Contact submitted for review" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route: Approve Emergency Contact
app.post('/api/verify-contact/:id', async (req, res) => {
    const { id } = req.params;
    const contactRef = db.ref(`emergency_contacts/${id}`);

    try {
        await contactRef.update({ verified: true });
        res.json({ message: "Contact approved" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route: Delete Emergency Contact
app.delete('/api/delete-contact/:id', async (req, res) => {
    const { id } = req.params;
    const contactRef = db.ref(`emergency_contacts/${id}`);

    try {
        await contactRef.remove();
        res.json({ message: "Contact deleted" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route: Admin Login
app.post('/api/admin-login', async (req, res) => {
    const { username, password } = req.body;
    const adminsRef = db.ref("admins");

    try {
        const snapshot = await adminsRef.orderByChild("username").equalTo(username).once("value");
        const adminData = snapshot.val();

        if (!adminData) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const adminId = Object.keys(adminData)[0];
        const adminRecord = adminData[adminId];
        const passwordMatch = await bcrypt.compare(password, adminRecord.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: adminId, username: adminRecord.username }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route: Report an Incident
app.post('/api/report-incident', async (req, res) => {
    const { name, location, description } = req.body;
    const reportRef = db.ref("reports").push();

    try {
        await reportRef.set({ name, location, description });
        res.json({ message: "Incident report submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Fetch all incident reports
app.get("/api/report-incident", async (req, res) => {
    const reportsRef = db.ref("reports");

    try {
        const snapshot = await reportsRef.once("value");
        const reports = snapshot.val();
        res.json(reports ? Object.values(reports) : []);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/api/track-analytics', (req, res) => {
    const { event, page, button, timestamp } = req.body;

    // Store this in Firebase Firestore or any database
    console.log(`Received Event: ${event}, Page: ${page}, Button: ${button}, Timestamp: ${timestamp}`);

    res.json({ success: true, message: "Analytics event recorded." });
});
       
// Start Server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
