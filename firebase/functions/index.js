const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const generateDocxRoute = require("./routes/generateClaimantReport");
const createCheckoutSessionRoute = require("./routes/createCheckoutSession");

// Create separate apps
const app1 = express();
const app2 = express();

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app1.use(cors(corsOptions));
app1.use(express.json({ limit: "20mb" }));
app1.use(express.urlencoded({ extended: true, limit: "20mb" }));
app1.use("/", generateDocxRoute);

app2.use(cors(corsOptions));
app2.use(express.json({ limit: "20mb" }));
app2.use(express.urlencoded({ extended: true, limit: "20mb" }));
app2.use("/", createCheckoutSessionRoute);

// Export multiple functions
exports.generateClaimantReportApi = functions.https.onRequest(app1);
exports.createCheckoutSessionApi = functions.https.onRequest(app2);
