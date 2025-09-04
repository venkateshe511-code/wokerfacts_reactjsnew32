const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const generateDocxRoute = require("./routes/generateClaimantReport");
const createCheckoutSessionRoute = require("./routes/createCheckoutSession");

const app = express();

// Body size limits
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Global CORS (this handles preflight automatically)
app.use(cors(corsOptions));

// Routes
app.use("/", generateDocxRoute);
app.use("/", createCheckoutSessionRoute);

// ✅ Export cloud functions (aliases to same Express app)
exports.generateClaimantReportApi = functions.https.onRequest(app);
exports.createCheckoutSessionApi = functions.https.onRequest(app);
