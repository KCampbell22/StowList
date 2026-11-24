-- StowList database schema
-- Run once in Supabase → SQL Editor → New query → paste → Run.
--
--   storage_units  a box, bin, shelf... anything you store things in
--   items          what's inside a storage unit
--   labels         a printed QR code. Can exist before it's attached to a
--                  storage unit (print blank labels, assign them when scanned)

-- ---------- tables ----------

create table public.storage_units (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  location    text check (char_length(location) <= 100),
  description text check (char_length(description) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  storage_unit_id uuid not null references public.storage_units on delete cascade,
  name            text not null check (char_length(name) between 1 and 100),
  description     text check (char_length(description) <= 500),
  quantity        integer not null default 1 check (quantity >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.labels (
  code            text primary key check (code ~ '^[a-z0-9]{8}$'),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  -- unique: one label per storage unit. Deleting the unit frees the label for reuse.
  storage_unit_id uuid unique references public.storage_units on delete set null,
  -- The raw text of a QR code / barcode NOT made by StowList, read by the in-app scanner
  external_value  text check (char_length(external_value) between 1 and 500),
  created_at      timestamptz not null default now()
);

create unique index labels_user_external_value_idx on public.labels (user_id, external_value);

create index items_storage_unit_id_idx on public.items (storage_unit_id);
create index items_user_id_idx on public.items (user_id);
create index storage_units_user_id_idx on public.storage_units (user_id);
create index labels_user_id_idx on public.labels (user_id);

-- ---------- keep updated_at current ----------

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger storage_units_updated_at before update on public.storage_units
  for each row execute function public.set_updated_at();
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ---------- row-level security: you only ever see your own data ----------

alter table public.storage_units enable row level security;
alter table public.items enable row level security;
alter table public.labels enable row level security;

create policy "own storage units" on public.storage_units
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Items must also point at one of YOUR storage units
create policy "own items" on public.items
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.storage_units s where s.id = storage_unit_id and s.user_id = auth.uid())
  );

-- Labels can be unassigned, or assigned to one of YOUR storage units
create policy "own labels" on public.labels
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      storage_unit_id is null
      or exists (select 1 from public.storage_units s where s.id = storage_unit_id and s.user_id = auth.uid())
    )
  );

-- ---------- item photos (Supabase Storage) ----------
-- Files live in the private "item-photos" bucket as <user id>/<item id>-<time>.jpg;
-- items.photo_path points at the file. You can only touch files in your own folder.

alter table public.items
  add column if not exists photo_path text check (char_length(photo_path) <= 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "item photos: read own" on storage.objects for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "item photos: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "item photos: update own" on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "item photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
