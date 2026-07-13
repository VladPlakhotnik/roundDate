UPDATE "events"
SET
  "description" = CASE "id"
    WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' THEN 'Kameralny wieczór szybkich randek w centrum Gdańska, z krótkimi rundami i jasnym rytmem spotkania.'
    WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' THEN 'Przytulne spotkanie dla osób, które chcą poznać się na żywo bez długich rozmów online.'
    WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' THEN 'Spokojny format dla dojrzałej grupy: mniej hałasu, więcej czasu na rozmowę.'
    WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' THEN 'Lekki format na pierwsze spotkanie z RoundDate i poznanie innych osób na żywo.'
    ELSE "description"
  END,
  "metadata" = jsonb_set(
    COALESCE("metadata", '{}'::jsonb),
    '{highlights}',
    CASE "id"
      WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' THEN '["10-minutowe rundy", "Równowaga uczestników", "Kontakty po wzajemnym polubieniu"]'::jsonb
      WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' THEN '["Welcome drink", "Kameralna grupa", "Moderator na miejscu"]'::jsonb
      WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' THEN '["Przytulne stoliki", "Grupa wiekowa 35-45", "Matche po wydarzeniu"]'::jsonb
      WHEN 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' THEN '["Swobodna atmosfera", "Krótki i jasny format", "Matche po wydarzeniu"]'::jsonb
      ELSE COALESCE("metadata"->'highlights', '[]'::jsonb)
    END,
    true
  ),
  "updated_at" = now()
WHERE "id" IN (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
);
