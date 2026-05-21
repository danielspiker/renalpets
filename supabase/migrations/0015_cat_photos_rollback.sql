-- Rollback the cat-photos storage feature (policies only).
-- Bucket + objects must be deleted via the Storage UI (Studio → Storage →
-- cat-photos → delete bucket). Supabase blocks direct deletes from
-- storage.objects / storage.buckets via SQL (storage.protect_delete()).

drop policy if exists "cat_photos_select" on storage.objects;
drop policy if exists "cat_photos_insert" on storage.objects;
drop policy if exists "cat_photos_update" on storage.objects;
drop policy if exists "cat_photos_delete" on storage.objects;
