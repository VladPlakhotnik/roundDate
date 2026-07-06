#!/usr/bin/env node

import "dotenv/config";

import { Resend } from "resend";

const webhookEvents = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.opened",
  "email.clicked",
  "email.failed",
  "email.suppressed",
];

function usage() {
  console.log(`Usage:
  node scripts/resend-webhooks.mjs list
  node scripts/resend-webhooks.mjs create:prod
  node scripts/resend-webhooks.mjs create:local

Environment:
  RESEND_API_KEY                Full-access Resend API key for webhook management.
  RESEND_WEBHOOK_PROD_URL       Defaults to https://rounddate.pl/api/webhooks/resend.
  RESEND_WEBHOOK_LOCAL_URL      Public HTTPS tunnel URL for local testing.

Notes:
  - The production URL must already be deployed before registering it.
  - Local webhooks require a public tunnel URL, not localhost.
  - Copy the returned signing_secret to RESEND_WEBHOOK_SECRET in the matching environment.`);
}

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required.");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function assertHttpsEndpoint(endpoint) {
  if (!endpoint.startsWith("https://")) {
    throw new Error(`Webhook endpoint must be a public HTTPS URL: ${endpoint}`);
  }

  if (/^https:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(endpoint)) {
    throw new Error(
      "Localhost is not reachable from Resend. Use ngrok, Tailscale Funnel, or VS Code Port Forwarding.",
    );
  }
}

async function assertEndpointReady(endpoint) {
  const response = await fetch(endpoint, {
    body: "{}",
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch((error) => {
    throw new Error(`Could not reach ${endpoint}: ${error.message}`);
  });

  if (response.status === 501) {
    throw new Error(
      `${endpoint} still returns the old scaffold response. Deploy the signed webhook handler first.`,
    );
  }

  if (![400, 401, 403, 500].includes(response.status)) {
    throw new Error(`Unexpected readiness status from ${endpoint}: ${response.status}`);
  }
}

async function listWebhooks() {
  const result = await getResend().webhooks.list();

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log(
    JSON.stringify(
      result.data?.data.map((webhook) => ({
        id: webhook.id,
        endpoint: webhook.endpoint,
        status: webhook.status,
        events: webhook.events,
      })) ?? [],
      null,
      2,
    ),
  );
}

async function createWebhook(endpoint, options = {}) {
  assertHttpsEndpoint(endpoint);

  if (!options.skipReadinessCheck) {
    await assertEndpointReady(endpoint);
  }

  const result = await getResend().webhooks.create({
    endpoint,
    events: webhookEvents,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log(
    JSON.stringify(
      {
        endpoint,
        events: webhookEvents,
        id: result.data?.id,
        signingSecret: result.data?.signing_secret,
      },
      null,
      2,
    ),
  );
}

const command = process.argv[2];

try {
  switch (command) {
    case "list":
      await listWebhooks();
      break;
    case "create:prod":
      await createWebhook(
        process.env.RESEND_WEBHOOK_PROD_URL ?? "https://rounddate.pl/api/webhooks/resend",
      );
      break;
    case "create:local":
      if (!process.env.RESEND_WEBHOOK_LOCAL_URL) {
        throw new Error("RESEND_WEBHOOK_LOCAL_URL is required for local webhooks.");
      }
      await createWebhook(process.env.RESEND_WEBHOOK_LOCAL_URL, { skipReadinessCheck: true });
      break;
    default:
      usage();
      process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
