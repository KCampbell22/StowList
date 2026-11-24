-- Item photos. Run once in Supabase → SQL Editor (already included in schema.sql for new setups).
--
-- The image files live in Supabase Storage (private bucket "item-photos"); items.photo_path
-- says which file belongs to which item. Files are stored as <user id>/<item id>-<time>.jpg,
-- and the policies below only let you touch files inside your own <user id>/ folder.

alter table public.items
  add column if not exists photo_path text check (char_length(photo_path) <= 300);

-- Private bucket: photos are only reachable through short-lived signed URLs.
-- The app shrinks photos to ~1200px JPEGs before upload; 5 MB is just a safety cap.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "item photos: read own" on storage.objects;
drop policy if exists "item photos: upload own" on storage.objects;
drop policy if exists "item photos: update own" on storage.objects;
drop policy if exists "item photos: delete own" on storage.objects;

create policy "item photos: read own" on storage.objects for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "item photos: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "item photos: update own" on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "item photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

notify pgrst, 'reload schema';
