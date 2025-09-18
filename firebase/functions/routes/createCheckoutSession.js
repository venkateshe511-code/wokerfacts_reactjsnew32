// const express = require("express");
// const Stripe = require("stripe");

// const router = express.Router();

// function getStripe() {
//   const key = process.env.STRIPE_SECRET_KEY;
//   if (!key) {
//     throw new Error("STRIPE_SECRET_KEY is not set");
//   }
//   return new Stripe(key, { apiVersion: "2024-06-20" });
// }

// router.post("/createCheckoutSession", async (req, res) => {
//   try {
//     const { amount, currency, successUrl, cancelUrl, metadata } =
//       req.body || {};
//     if (!amount || !currency) {
//       return res.status(400).json({ error: "Missing amount or currency" });
//     }

//     const stripe = getStripe();
//     const session = await stripe.checkout.sessions.create({
//       mode: "payment",
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency,
//             product_data: { name: "Evaluation Report" },
//             unit_amount: Math.round(Number(amount) * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: successUrl || `${req.headers.origin || ""}/download-report`,
//       cancel_url: cancelUrl || `${req.headers.origin || ""}/dashboard`,
//       metadata: metadata || {},
//     });

//     return res.json({ url: session.url });
//   } catch (err) {
//     console.error("[Firebase] Stripe session error", err);
//     return res.status(500).json({ error: err?.message || "Internal error" });
//   }
// });

// module.exports = router;

const express = require("express");
const Stripe = require("stripe");

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

const AMOUNT_IN_CENTS = 2500; // $25.00
const CURRENCY = "usd";

router.post("/createCheckoutSession", async (req, res) => {
  try {
    const { successUrl, cancelUrl, metadata } = req.body || {};

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: { name: "Evaluation Report" },
            unit_amount: AMOUNT_IN_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin || ""}/download-report`,
      cancel_url: cancelUrl || `${req.headers.origin || ""}/dashboard`,
      metadata: metadata || {},
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe] Checkout session error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
});

module.exports = router;
