const express = require("express");
const Stripe = require("stripe");
let functions;
try {
  functions = require("firebase-functions");
} catch (_) {
  functions = null;
}

const router = express.Router();

function getStripe() {
  let key = process.env.STRIPE_SECRET_KEY;
  if (!key && functions && typeof functions.config === "function") {
    try {
      const cfg = functions.config();
      key = cfg?.stripe?.secret || key;
    } catch (_) {}
  }
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

async function handler(req, res) {
  try {
    const { amount, currency, successUrl, cancelUrl, metadata } = req.body || {};
    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Evaluation Report" },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin || ""}/dashboard?paid=1`,
      cancel_url: cancelUrl || `${req.headers.origin || ""}/dashboard`,
      metadata: metadata || {},
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("[Firebase] Stripe session error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}

router.options("/", (_, res) => res.sendStatus(204));
router.options("/createCheckoutSession", (_, res) => res.sendStatus(204));
router.options("/create-checkout-session", (_, res) => res.sendStatus(204));
router.post("/", handler);
router.post("/createCheckoutSession", handler);
router.post("/create-checkout-session", handler);

module.exports = router;
