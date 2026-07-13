UPDATE "events"
SET
  "starts_at" = '2026-06-14 20:00:00+02',
  "status" = 'finished',
  "badge" = 'Zakończone',
  "slug" = 'speed-dating-intro-2026-06-14',
  "updated_at" = now()
WHERE
  "id" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
  AND "starts_at" = '2031-06-14 20:00:00+02';
