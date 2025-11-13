export async function startCheckout(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const { amount, currency, metadata } = params;

  const body = {
    // amount,
    // currency: String(currency).toLowerCase(),
    metadata: {
      ...(metadata || {}),
      source: "web",
      mode: (import.meta as any)?.env?.MODE || "production",
    },
    successUrl: `${window.location.origin}/dashboard?paid=1`,
    cancelUrl: `${window.location.origin}/dashboard`,
  };

  // Optional: allow using an external checkout endpoint (e.g., Firebase) via env
  const envUrl = (import.meta as any)?.env?.VITE_CHECKOUT_URL as
    | string
    | undefined;
  const externalUrl = envUrl && envUrl.length ? envUrl : undefined;

  const buildUrl = (base: string) => {
    const u = base.replace(/\/$/, "");
    if (/(createCheckoutSession|create-checkout-session)$/.test(u)) return u;
    return `${u}/createCheckoutSession`;
  };

  // Candidate endpoints (prefer env, then known Firebase/Cloud Run bases)
  const candidates: string[] = [];
  if (externalUrl) candidates.push(buildUrl(externalUrl));
  candidates.push(
    buildUrl(
      "https://us-central1-workerfacts-43760.cloudfunctions.net/createCheckoutSessionApi",
    ),
    buildUrl("https://createcheckoutsessionapi-tn63kvymra-uc.a.run.app"),
  );

  const attempts: { url: string; status?: number; text?: string }[] = [];
  let res: Response | null = null;

  // Try each external candidate first
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        res = r;
        break;
      }
      const txt = await r.text().catch(() => "");
      attempts.push({ url, status: r.status, text: txt });
    } catch (e) {
      attempts.push({ url, text: String(e) });
    }
  }

  // Final fallback to local API only when no external succeeded and no env is present
  if (!res && !externalUrl) {
    const localUrl = "/api/stripe/create-checkout-session";
    try {
      const localRes = await fetch(localUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (localRes.ok) {
        res = localRes;
      } else {
        const txt = await localRes.text().catch(() => "");
        attempts.push({ url: localUrl, status: localRes.status, text: txt });
      }
    } catch (e) {
      attempts.push({ url: localUrl, text: String(e) });
    }
  }

  if (!res) {
    console.error(
      "Stripe checkout creation failed",
      attempts.map((a) => `${a.url} -> ${a.status || ""}`),
      attempts,
    );
    throw new Error(
      `Failed to create checkout session (no successful endpoint)`,
    );
  }

  
  const data = (await res.json()) as { url?: string; id?: string };
  const pk = "pk_live_51SNEa6Jm0n6uZx7IFpVNEewxlyKSCD2z9FTLpKoKCWevjH7JPU6ppUcsZIzIkLXhaRjpB80V3KPhY8emzlPb7p0k00LzoGvZmK";

  // Prefer Stripe.js redirect when pk and session id are available
  if (pk && data?.id) {
    try {
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(pk);
      if (stripe) {
        const result = await stripe.redirectToCheckout({ sessionId: data.id });
        if (result.error) {
          console.error(result.error.message);
        } else {
          return;
        }
      }
    } catch (e) {
      console.warn("Stripe.js redirect failed, falling back", e);
    }
  }

  if (!data.url) {
    throw new Error("No checkout URL returned");
  }

  try {
    if (window.top && window.top !== window) {
      window.top.location.assign(data.url);
    } else {
      window.location.assign(data.url);
    }
  } catch {
    const w = window.open(data.url, "_blank", "noopener,noreferrer");
    if (!w) {
      window.location.href = data.url;
    }
  }
}
