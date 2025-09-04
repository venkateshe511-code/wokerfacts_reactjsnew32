export async function startCheckout(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const { amount, currency, metadata } = params;

  const body = {
    amount,
    currency: String(currency).toLowerCase(),
    metadata: { ...(metadata || {}), source: 'web', mode: (import.meta as any)?.env?.MODE || 'production' },
    successUrl: `${window.location.origin}/dashboard?paid=1`,
    cancelUrl: `${window.location.origin}/dashboard`,
  };

  // Optional: allow using an external checkout endpoint (e.g., Firebase) via env
  const envUrl = (import.meta as any)?.env?.VITE_CHECKOUT_URL as string | undefined;
  const externalUrl = envUrl && envUrl.length ? envUrl : undefined;

  const buildUrl = (base: string) => {
    const u = base.replace(/\/$/, "");
    if (/(createCheckoutSession|create-checkout-session)$/.test(u)) return u;
    return `${u}/createCheckoutSession`;
  };

  const endpoint = externalUrl ? buildUrl(externalUrl) : "/api/stripe/create-checkout-session";

  const attempts: { url: string; status?: number; text?: string }[] = [];

  let res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    attempts.push({ url: endpoint, status: res.status, text: txt });
  }

  // Fallbacks if external URL provided
  if (!res.ok && externalUrl?.length) {
    const alt = endpoint.endsWith("/createCheckoutSession")
      ? endpoint.replace(/\/createCheckoutSession$/, "/create-checkout-session")
      : endpoint.endsWith("/create-checkout-session")
        ? endpoint.replace(/\/create-checkout-session$/, "/createCheckoutSession")
        : undefined;

    if (alt) {
      const tryAlt = await fetch(alt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (tryAlt.ok) {
        res = tryAlt;
      } else {
        const txt = await tryAlt.text().catch(() => "");
        attempts.push({ url: alt, status: tryAlt.status, text: txt });
      }
    }
  }

  // Final fallback to local API even if external set
  if (!res.ok) {
    const localUrl = "/api/stripe/create-checkout-session";
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
  }

  if (!res.ok) {
    console.error("Stripe checkout creation failed", attempts);
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create checkout session (${res.status}) ${text}`);
  }

  const data = (await res.json()) as { url?: string; id?: string };
  const pk = (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

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
