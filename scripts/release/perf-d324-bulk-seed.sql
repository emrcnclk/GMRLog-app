-- D3.24 performance dataset — schema-aligned bulk seed
-- Targets: 100k users, 1M feed entries, 500k reviews, 300k collections, 100k communities, 50k events

BEGIN;

INSERT INTO users (id, handle, display_name, created_at, updated_at)
VALUES ('user_perf324_anchor', 'perf324_anchor', 'Perf Anchor', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO games (id, slug, title, created_at, updated_at)
SELECT
  'game_perf324_' || g::text,
  'perf324-game-' || g::text,
  'Perf Game ' || g::text,
  NOW(),
  NOW()
FROM generate_series(1, 50) AS g
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
DECLARE
  batch INT := 10000;
  start_i INT := 1;
  total INT := 100000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO users (id, handle, display_name, created_at, updated_at)
    SELECT
      'user_perf324_' || i::text,
      'perf324_u' || i::text,
      'Perf User ' || i::text,
      NOW() - ((i % 365) || ' days')::interval,
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;
    start_i := start_i + batch;
    RAISE NOTICE 'users through %', LEAST(start_i - 1, total);
  END LOOP;
END $$;

DO $$
DECLARE
  batch INT := 10000;
  start_i INT := 1;
  total INT := 100000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO communities (id, name, slug, description, visibility, join_type, tags, created_at, updated_at)
    SELECT
      'comm_perf324_' || i::text,
      'Perf Community ' || i::text,
      'perf324-c-' || i::text,
      'bulk community ' || i::text,
      'public'::content_visibility,
      'public'::community_join_type,
      ARRAY[]::text[],
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;
    start_i := start_i + batch;
    RAISE NOTICE 'communities through %', LEAST(start_i - 1, total);
  END LOOP;
END $$;

DO $$
DECLARE
  batch INT := 10000;
  start_i INT := 1;
  total INT := 300000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO collections (id, owner_id, title, description, visibility, type, tags, version, created_at, updated_at)
    SELECT
      'coll_perf324_' || i::text,
      'user_perf324_' || ((i % 100000) + 1)::text,
      'Perf Collection ' || i::text,
      'bulk ' || i::text,
      'public'::content_visibility,
      'manual'::collection_type,
      ARRAY[]::text[],
      0,
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;
    start_i := start_i + batch;
    RAISE NOTICE 'collections through %', LEAST(start_i - 1, total);
  END LOOP;
END $$;

DO $$
DECLARE
  batch INT := 10000;
  start_i INT := 1;
  total INT := 500000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO reviews (id, author_id, game_id, rating, body, contains_spoilers, visibility, version, created_at, updated_at)
    SELECT
      'rev_perf324_' || i::text,
      'user_perf324_' || ((i % 100000) + 1)::text,
      'game_perf324_' || ((i % 50) + 1)::text,
      (i % 10) + 1,
      'Perf review body ' || i::text,
      false,
      'public'::content_visibility,
      0,
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;
    start_i := start_i + batch;
    RAISE NOTICE 'reviews through %', LEAST(start_i - 1, total);
  END LOOP;
END $$;

DO $$
DECLARE
  batch INT := 10000;
  start_i INT := 1;
  total INT := 50000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO events (id, title, kind, description, starts_at, ends_at, game_id, created_at, updated_at)
    SELECT
      'evt_perf324_' || i::text,
      'Perf Event ' || i::text,
      'game'::event_kind,
      'bulk event ' || i::text,
      NOW() + ((i % 30) || ' days')::interval,
      NULL,
      'game_perf324_' || ((i % 50) + 1)::text,
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;
    start_i := start_i + batch;
    RAISE NOTICE 'events through %', LEAST(start_i - 1, total);
  END LOOP;
END $$;

DO $$
DECLARE
  batch INT := 5000;
  start_i INT := 1;
  total INT := 1000000;
BEGIN
  WHILE start_i <= total LOOP
    INSERT INTO activity_items (id, kind, actor_id, object_type, object_id, occurred_at, created_at, updated_at)
    SELECT
      'act_perf324_' || i::text,
      'post'::activity_kind,
      'user_perf324_' || ((i % 100000) + 1)::text,
      'post'::object_type,
      'post_perf324_' || i::text,
      NOW() - ((i % 10000) || ' minutes')::interval,
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO feed_entries (id, user_id, activity_item_id, rank, inserted_at, created_at, updated_at)
    SELECT
      'feed_perf324_' || i::text,
      'user_perf324_' || ((i % 100000) + 1)::text,
      'act_perf324_' || i::text,
      i,
      NOW(),
      NOW(),
      NOW()
    FROM generate_series(start_i, LEAST(start_i + batch - 1, total)) AS i
    ON CONFLICT (id) DO NOTHING;

    start_i := start_i + batch;
    IF (start_i - 1) % 100000 < batch THEN
      RAISE NOTICE 'feed through %', LEAST(start_i - 1, total);
    END IF;
  END LOOP;
END $$;

SELECT 'users' AS kind, COUNT(*)::bigint AS n FROM users WHERE id LIKE 'user_perf324_%'
UNION ALL SELECT 'communities', COUNT(*) FROM communities WHERE id LIKE 'comm_perf324_%'
UNION ALL SELECT 'collections', COUNT(*) FROM collections WHERE id LIKE 'coll_perf324_%'
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews WHERE id LIKE 'rev_perf324_%'
UNION ALL SELECT 'events', COUNT(*) FROM events WHERE id LIKE 'evt_perf324_%'
UNION ALL SELECT 'feed_entries', COUNT(*) FROM feed_entries WHERE id LIKE 'feed_perf324_%';
