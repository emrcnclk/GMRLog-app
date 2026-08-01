-- S1.1 Amendment — Community.visibility (content_visibility, default public).
ALTER TABLE "communities" ADD COLUMN "visibility" "content_visibility" NOT NULL DEFAULT 'public';
