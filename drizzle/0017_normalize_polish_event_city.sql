UPDATE "events"
SET
  "city" = 'Gdańsk',
  "updated_at" = now()
WHERE lower(trim("city")) = 'гданьск';
