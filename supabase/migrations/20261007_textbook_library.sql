-- Verified official textbook metadata; PDF bytes remain in public/textbooks.
-- Run scripts/import-textbooks.mjs --sync-db after applying this migration.
begin;

create table if not exists public.textbooks (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  title text not null,
  subject text not null,
  medium text not null check (medium in ('Tamil', 'English', 'Common')),
  source_medium text not null check (source_medium in ('Tamil', 'English')),
  category text not null check (category in ('Languages', 'Science', 'Commerce', 'Arts', 'Vocational')),
  class smallint not null default 12 check (class = 12),
  volume text,
  source_title text not null,
  source_file text not null,
  source_url text not null check (source_url like 'https://%'),
  source_page text not null check (source_page like 'https://%'),
  local_path text check (local_path is null or local_path ~ '^/textbooks/[a-z0-9-]+\.pdf$'),
  status text not null default 'unavailable' check (status in ('downloaded', 'unavailable')),
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  pages integer check (pages is null or pages > 0),
  edition text,
  downloaded_at timestamptz,
  download_error text,
  verified_at timestamptz not null default now(),
  check (status <> 'downloaded' or (local_path is not null and size_bytes is not null and sha256 is not null and downloaded_at is not null))
);

create index if not exists textbooks_medium_subject_idx on public.textbooks (medium, subject);
create index if not exists textbooks_category_idx on public.textbooks (category);
alter table public.textbooks enable row level security;
revoke all on public.textbooks from anon, authenticated;
grant select, insert, update, delete on public.textbooks to service_role;

insert into public.avs_schema_versions (version)
values ('20261007_textbook_library')
on conflict (version) do nothing;

commit;
