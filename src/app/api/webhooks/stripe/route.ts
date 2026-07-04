import type Stripe from "stripe";

import { getStripe } from "@/shared/server/payments/stripe";
import {
  markCheckoutSessionExpired,
  markCheckoutSessionPaid,
  markCheckoutSessionPaymentFailed,
} from "@/shared/server/payments/stripe-webhook";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("Missing Stripe signature.", 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return jsonError("STRIPE_WEBHOOK_SECRET is not configured.", 500);
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return jsonError("Invalid Stripe signature.", 400);
  }

  switch (event.type) {
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.completed":
      await markCheckoutSessionPaid(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      await markCheckoutSessionPaymentFailed(event.data.object);
      break;
    case "checkout.session.expired":
      await markCheckoutSessionExpired(event.data.object);
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
