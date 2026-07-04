# Notification and email flow

## Goal

Make profile notification settings match the current email product surface:

- transactional account email stays mandatory: account verification and password reset;
- user-controlled event messages: event reminders and event results;
- one combined marketing setting for new events, shared by profile settings and the homepage newsletter audience;
- new event emails are sent manually from admin in a later campaign step, not automatically on every event create or publish.

## Stage 1 - Consolidate profile settings

1. Replace the three profile toggles `Marketing emails`, `New dates`, and `New events by criteria` with one `New events` toggle.
2. Keep the existing database columns for now to avoid a migration:
   - `marketingConsent`
   - `newDateNotifications`
   - `eventCriteriaNotifications`
3. Write the single `newEventNotifications` value into all three legacy columns.
4. Store `emailNotifications` as true if any user-controlled email category is enabled.

Verification:

- profile settings UI test sees only `Event reminders`, `Event results`, and `New events`;
- API test confirms `newEventNotifications` is persisted to all legacy marketing/new-event columns.

## Stage 2 - Server email semantics

1. Keep reminder emails gated by `eventReminderNotifications`.
2. Keep result emails gated by `eventResultNotifications`.
3. Collapse new event emails to a single `new-events` template and gate it by `marketingConsent`.
4. Keep site notification mapping for old `new-date` and `new-events-by-criteria` template ids as compatibility aliases.

Verification:

- email notification test confirms disabled `marketingConsent` skips `sendNewEventsNotification`;
- site notification test confirms `new-events` creates the expected in-app notification.

## Stage 3 - Newsletter audience foundation

1. Keep homepage newsletter subscriptions in `newsletterSubscriptions`.
2. Treat active newsletter subscriptions with `marketingConsent=true` and `unsubscribedAt=null` as the unauthenticated audience for future new-event campaigns.
3. Add a small server helper to list that audience.

Verification:

- newsletter subscription tests cover active audience query shape.

## Stage 4 - Admin campaign sender

This should be a separate visible admin feature:

1. Admin selects one or more events and previews the new-events email.
2. Admin explicitly sends a campaign to:
   - opted-in profile users;
   - active newsletter subscribers.
3. Campaign send uses a campaign id/idempotency key so retries do not duplicate messages.
4. Sending is not tied to event publication or creation.

This stage needs admin UI and campaign persistence, so it should be implemented after Stage 1-3 are stable.
