const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const generateDocxRoute = require("./routes/generateClaimantReport");
const createCheckoutSessionRoute = require("./routes/createCheckoutSession");
const stripeWebhookRoute = require("./routes/stripeWebhook");

// Create separate apps
const app1 = express();
const app2 = express();
const app3 = express();
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app1.use(cors(corsOptions));
app1.use(express.json({ limit: "300mb" }));
app1.use(express.urlencoded({ extended: true, limit: "300mb" }));
app1.use("/", generateDocxRoute);

app2.use(cors(corsOptions));
app2.use(express.json({ limit: "20mb" }));
app2.use(express.urlencoded({ extended: true, limit: "20mb" }));
app2.use("/", createCheckoutSessionRoute);

// Webhook app must NOT use express.json() before the route; stripe requires raw body
app3.use(cors(corsOptions));
app3.use("/", stripeWebhookRoute);

// Export multiple functions
exports.generateClaimantReportApi = functions.https.onRequest(app1);
exports.createCheckoutSessionApi = functions.https.onRequest(app2);
exports.stripeWebhookApi = functions.https.onRequest(app3);
