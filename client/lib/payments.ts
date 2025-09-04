export async function startCheckout(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const { amount, currency, metadata } = params;

  const body = {
    amount,
    currency,
    metadata: metadata || {},
    successUrl: `${window.location.origin}/dashboard?paid=1`,
    cancelUrl: `${window.location.origin}/dashboard`,
  };

  // Optional: allow using an external checkout endpoint (e.g., Firebase) via env
  const envUrl = (import.meta as any)?.env?.VITE_CHECKOUT_URL as string | undefined;
  const DEFAULT_FIREBASE_URL = "https://createcheckoutsessionapi-e355r2gb5q-uc.a.run.app";
  const externalUrl = envUrl && envUrl.length ? envUrl : DEFAULT_FIREBASE_URL;

  const buildUrl = (base: string) => {
    const u = base.replace(/\/$/, "");
    if (/createCheckoutSession|create-checkout-session$/.test(u)) return u;
    return `${u}/createCheckoutSession`;
  };

  const baseEndpoint = externalUrl.replace(/\/$/, "");

  let res = await fetch(baseEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Fallbacks if external URL provided
  if (!res.ok && externalUrl?.length) {
    // Try camelCase path
    if (res.status === 404 || res.status === 405) {
      const camel = `${baseEndpoint}/createCheckoutSession`;
      res = await fetch(camel, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    // Try dashed path
    if (!res.ok) {
      const dashed = `${baseEndpoint}/create-checkout-session`;
      res = await fetch(dashed, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  }

  // Final fallback to local API even if external set
  if (!res.ok) {
    res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create checkout session (${res.status}) ${text}`);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new Error("No checkout URL returned");
  }
  window.location.assign(data.url);
}
