require("dotenv").config();
const admin = require("firebase-admin");

// Check if FIREBASE_CREDENTIALS is loaded
if (!process.env.FIREBASE_CREDENTIALS) {
    console.error("FIREBASE_CREDENTIALS is missing!");
    process.exit(1); // Stop execution if missing
}

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
module.exports = db;

console.log("Firebase Admin Initialized Successfully!");


