import "server-only";

import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  if (stripe) {
    return stripe;
  }

  const secretKey = process.env.STRIPE_API_KEY ?? process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_API_KEY or STRIPE_SECRET_KEY is required to initialize Stripe.");
  }

  stripe = new Stripe(secretKey);

  return stripe;
}
