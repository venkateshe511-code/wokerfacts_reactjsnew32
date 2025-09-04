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
  const externalUrl = (import.meta as any)?.env?.VITE_CHECKOUT_URL as string | undefined;

  const buildUrl = (base: string) => {
    const u = base.replace(/\/$/, "");
    if (/createCheckoutSession|create-checkout-session/.test(u)) return u;
    return `${u}/createCheckoutSession`;
  };

  const primaryEndpoint = externalUrl?.length ? buildUrl(externalUrl) : "/api/stripe/create-checkout-session";

  let res = await fetch(primaryEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Fallbacks: try alt path and finally local api if provided external returned 404
  if (!res.ok && externalUrl?.length && res.status === 404) {
    const alt = buildUrl(externalUrl).replace("createCheckoutSession", "create-checkout-session");
    res = await fetch(alt, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
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
