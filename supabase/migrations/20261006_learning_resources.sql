-- Content is accessed through server routes using the service role.
-- The public bucket is suitable only for AVS material licensed for public URLs.
create table if not exists public.learning_resources (
  id text primary key,
  kind text not null check (kind in ('note', 'video')),
  resource jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.learning_resources enable row level security;
revoke all on public.learning_resources from anon, authenticated;
grant all on public.learning_resources to service_role;
create index if not exists learning_resources_kind_idx on public.learning_resources (kind, created_at desc);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-materials', 'learning-materials', true, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
