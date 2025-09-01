const functions = require("firebase-functions");
const express = require("express");
const generateDocxRoute = require("./routes/generateClaimantReport");

const app = express();
app.use(express.json());

// ✅ Optional: Enable global CORS (or just use it per route as you did)
const cors = require("cors");
app.use(cors({ origin: true }));

// Route registration
app.use("/", generateDocxRoute);

// Firebase Function export
exports.generateClaimantReportApi = functions.https.onRequest(app);
